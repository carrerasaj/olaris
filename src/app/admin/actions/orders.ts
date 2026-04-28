'use server'

/**
 * Admin server actions for orders.
 *
 * State machine (all transitions written through these actions, never direct
 * status updates):
 *
 *   draft  ─ sendForSignature ──▶  sent
 *   draft  ─ cancelOrder      ──▶  cancelled
 *   sent   ─ cancelOrder      ──▶  cancelled  (also cancels pending reminders)
 *   sent   ─ signingEvent     ──▶  partially_signed / signed  (Phase 4)
 *   signed ─ markDelivered    ──▶  delivered
 *
 * Email sends for order.sent / reminders are wired in Phase 4 — this file
 * records the DB state, writes the audit row, and generates the signing
 * token, but leaves the actual email dispatch as a logged no-op for now.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createHash } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import {
  db,
  orders,
  customers,
  auditEvents,
  signingTokens,
  signatures,
  reminderSchedule,
  documents,
} from '@/db/client'
import type { Customer, Order } from '@/db/schema'
import { requireAdmin } from '@/lib/admin-auth'
import {
  orderDraftSchema,
  orderSendSchema,
  type OrderDraftInput,
} from '@/lib/validation'
import { generateOrderRef, fmtGBPFromPence, fmtDate } from '@/lib/format'
import { captureForensics, canonicalJson } from '@/lib/forensics'
import { signBytes, signingKeyFingerprint } from '@/lib/signing-key'
import { sendEmail } from '@/lib/email'
import {
  orderSentEmail,
  orderSignedEmail,
  orderConfirmedEmail,
  orderEtaChangedEmail,
  orderReadyForHandoverEmail,
  orderDeliveredEmail,
} from '@/lib/email-templates'
import {
  sendLifecycleEmail,
  recordEmailEvent,
  findPriorEmailSent,
  type LifecycleTemplate,
} from '@/lib/email-customer'
import {
  buildAuditPayload,
  diffLogistics,
  FIELD_EVENT_TYPE,
  isForwardTransitionAllowed,
  isOverrideTargetAllowed,
  isPostSignStatus,
  LOGISTICS_FIELDS,
  shouldSendEtaChangeEmail,
  type LogisticsField,
  type LogisticsPatch,
  type PostSignStatus,
} from '@/lib/order-delivery'

export interface OrderActionResult {
  ok: boolean
  error?: string
  issues?: { path: string; message: string }[]
  id?: string
  ref?: string
}

const tokenAlphabet = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  32,
)

// Derived totals for list-view denormalisation — keep in sync with the UI's
// useCalc. Returns pence integers.
function deriveTotals(input: OrderDraftInput) {
  const p = input.pricing
  const optionsNet = input.options.reduce(
    (s, o) => s + (o.netPence * o.qty),
    0,
  )
  const netBeforeVat = p.vehicleNetPence + optionsNet - p.discountPence
  const vat = Math.round((netBeforeVat * p.vatRate) / 100)
  const onRoad = p.vedPence + p.firstRegFeePence + p.deliveryFeePence + p.numberPlatesPence
  const total = netBeforeVat + vat + onRoad

  const a = input.addons
  const monthlyAddons =
    (a.maintenance ? a.maintenanceMonthlyPence : 0) +
    (a.tyreCover ? a.tyreMonthlyPence : 0) +
    (a.breakdown ? a.breakdownMonthlyPence : 0)
  const monthlyTotal = (input.finance.monthlyNetPence || 0) + monthlyAddons

  return { totalAmountPence: total, monthlyAmountPence: monthlyTotal }
}

// ─── create ────────────────────────────────────────────────────────────────

export async function createOrderAction(
  input: OrderDraftInput,
): Promise<OrderActionResult> {
  const user = await requireAdmin()
  const parsed = orderDraftSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }
  const data = parsed.data
  const { totalAmountPence, monthlyAmountPence } = deriveTotals(data)

  // Customer must exist. We'd use an FK anyway but fail softer here.
  const cust = await db
    .select({ id: customers.id, companyId: customers.companyId })
    .from(customers)
    .where(eq(customers.id, data.customerId))
    .limit(1)
  if (cust.length === 0) return { ok: false, error: 'Customer not found' }

  // Generate unique ref. Retry once on the vanishingly small collision chance.
  let ref = generateOrderRef()
  for (let attempt = 0; attempt < 3; attempt++) {
    const dupe = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.ref, ref))
      .limit(1)
    if (dupe.length === 0) break
    ref = generateOrderRef()
  }

  const [order] = await db
    .insert(orders)
    .values({
      ref,
      customerId: data.customerId,
      companyId: data.companyId ?? cust[0].companyId ?? null,
      status: 'draft',
      customerType: data.customerType,
      financeType: data.financeType,
      vehicle: data.vehicle,
      options: data.options,
      delivery: data.delivery,
      pricing: data.pricing,
      finance: data.finance,
      addons: data.addons,
      partExchange: data.partExchange ?? null,
      consent: data.consent ?? null,
      notes: data.notes,
      totalAmountPence,
      monthlyAmountPence,
      createdBy: user.id,
    })
    .returning({ id: orders.id, ref: orders.ref })

  await db.insert(auditEvents).values({
    orderId: order.id,
    customerId: data.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.created',
    payload: { ref: order.ref },
  })

  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  revalidatePath(`/admin/customers/${data.customerId}`)
  return { ok: true, id: order.id, ref: order.ref }
}

// ─── update draft ─────────────────────────────────────────────────────────

export async function updateOrderAction(
  orderId: string,
  input: OrderDraftInput,
): Promise<OrderActionResult> {
  const user = await requireAdmin()
  const parsed = orderDraftSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }
  const data = parsed.data

  const existing = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Order not found' }
  if (existing[0].status !== 'draft') {
    return { ok: false, error: 'Only draft orders can be edited' }
  }

  const { totalAmountPence, monthlyAmountPence } = deriveTotals(data)

  await db
    .update(orders)
    .set({
      customerId: data.customerId,
      companyId: data.companyId ?? null,
      customerType: data.customerType,
      financeType: data.financeType,
      vehicle: data.vehicle,
      options: data.options,
      delivery: data.delivery,
      pricing: data.pricing,
      finance: data.finance,
      addons: data.addons,
      partExchange: data.partExchange ?? null,
      consent: data.consent ?? null,
      notes: data.notes,
      totalAmountPence,
      monthlyAmountPence,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  await db.insert(auditEvents).values({
    orderId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.updated',
    payload: null,
  })

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  return { ok: true, id: orderId }
}

// ─── duplicate ─────────────────────────────────────────────────────────────
//
// Copies every order attribute — vehicle, options, pricing, finance, addons,
// part-exchange, delivery, notes, customer/company — into a new DRAFT. Does
// NOT copy signing state (signatures, tokens, documents, audit trail, status
// dates). New draft gets its own fresh ref.
//
// Use case: re-quote the same spec to another customer, or refresh an order
// after a pricing change without re-keying every field.
//
// Works on any source order regardless of status (a signed or cancelled
// order is just as valid a template as a draft).

export async function duplicateOrderAction(
  sourceOrderId: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, sourceOrderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Source order not found' }
  const source = rows[0]

  // New ref, fresh. Retry on vanishing-probability ref collisions.
  let ref = generateOrderRef()
  for (let attempt = 0; attempt < 3; attempt++) {
    const dupe = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.ref, ref))
      .limit(1)
    if (dupe.length === 0) break
    ref = generateOrderRef()
  }

  // Explicit field copy. Safer than spreading `...source` because that would
  // also copy id/ref/status/timestamps/createdBy — all of which must be
  // reset or regenerated for the new draft.
  const [newOrder] = await db
    .insert(orders)
    .values({
      ref,
      customerId: source.customerId,
      companyId: source.companyId,
      status: 'draft',
      customerType: source.customerType,
      financeType: source.financeType,
      vehicle: source.vehicle,
      options: source.options,
      delivery: source.delivery,
      pricing: source.pricing,
      finance: source.finance,
      addons: source.addons,
      partExchange: source.partExchange,
      // Consents are re-captured from the new customer at sign time — drop
      // the source's consents rather than carrying stale ticks over.
      consent: null,
      notes: source.notes,
      totalAmountPence: source.totalAmountPence,
      monthlyAmountPence: source.monthlyAmountPence,
      createdBy: user.id,
    })
    .returning({ id: orders.id, ref: orders.ref })

  // Audit event on both orders: new order gets a "created (duplicated)"
  // marker, source order gets a "duplicated from here" breadcrumb.
  await db.insert(auditEvents).values([
    {
      orderId: newOrder.id,
      customerId: source.customerId,
      actorType: 'rep',
      actorId: user.id,
      eventType: 'order.created',
      payload: {
        ref: newOrder.ref,
        duplicatedFrom: { id: source.id, ref: source.ref },
      },
    },
    {
      orderId: source.id,
      customerId: source.customerId,
      actorType: 'rep',
      actorId: user.id,
      eventType: 'order.updated',
      payload: {
        kind: 'duplicated_to',
        newOrderId: newOrder.id,
        newOrderRef: newOrder.ref,
      },
    },
  ])

  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  revalidatePath(`/admin/customers/${source.customerId}`)
  return { ok: true, id: newOrder.id, ref: newOrder.ref }
}

// ─── per-order OTP requirement toggle ────────────────────────────────────

/**
 * Set whether the customer's signing flow for this order requires an
 * email OTP step. Default for new orders is false (single-step SES).
 * Only meaningful while `status = 'draft'` — once sent, the customer
 * may have already opened the link and seen the corresponding UI; we
 * don't change the flow under their feet. This is enforced here, and
 * the order detail page only renders the toggle for draft orders.
 */
export async function setOrderRequiresOtpAction(
  orderId: string,
  requiresOtp: boolean,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select({ id: orders.id, status: orders.status, customerId: orders.customerId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Order not found' }
  const order = rows[0]
  if (order.status !== 'draft') {
    return { ok: false, error: 'OTP requirement can only be changed on draft orders' }
  }

  await db
    .update(orders)
    .set({ requiresOtp, updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await db.insert(auditEvents).values({
    orderId,
    customerId: order.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.updated',
    payload: { field: 'requires_otp', value: requiresOtp },
  })

  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true, id: orderId }
}

// ─── send for signature ───────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function sendForSignatureAction(
  orderId: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const reachability = signingUrlLooksReachable()
  if (reachability) return { ok: false, error: reachability }

  const rows = await db
    .select({
      order: orders,
      customer: customers,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Order not found' }
  const { order, customer } = rows[0]

  if (order.status !== 'draft') {
    return { ok: false, error: `Cannot send order from status "${order.status}"` }
  }

  // Full-shape validation — stricter than the draft schema.
  const toValidate: OrderDraftInput = {
    customerId: order.customerId,
    companyId: order.companyId,
    customerType: order.customerType,
    financeType: order.financeType,
    vehicle: order.vehicle,
    options: order.options,
    delivery: order.delivery,
    pricing: order.pricing,
    finance: order.finance,
    addons: order.addons,
    partExchange: order.partExchange ?? undefined,
    consent: order.consent ?? undefined,
    notes: order.notes ?? undefined,
  }
  const parsed = orderSendSchema.safeParse(toValidate)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Order is incomplete',
      issues: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }

  const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS)
  const token = tokenAlphabet()

  // Transactional-in-spirit: insert token, update order, schedule reminders,
  // write audit — any failure short-circuits, no orphan rows. Neon HTTP
  // driver doesn't support BEGIN/COMMIT so we rely on FK constraints + the
  // fact that a failed update reverts nothing of material consequence if
  // the only thing that ran was the token insert (we'd just have an orphan
  // signing_token pointing at a still-draft order — no harm, expires).
  await db.insert(signingTokens).values({
    orderId: order.id,
    token,
    signerRole: 'customer',
    expiresAt,
  })

  await db
    .update(orders)
    .set({ status: 'sent', sentAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, order.id))

  // Schedule 3-day and 6-day reminders
  const day3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const day6 = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
  await db.insert(reminderSchedule).values([
    { orderId: order.id, scheduledFor: day3, kind: 'day_3' },
    { orderId: order.id, scheduledFor: day6, kind: 'day_6' },
  ])

  await db.insert(auditEvents).values({
    orderId: order.id,
    customerId: order.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.sent',
    payload: { to: customer.email, tokenExpiresAt: expiresAt.toISOString() },
  })

  // Send the signing-link email
  const signingUrl = `${siteUrl()}/sign/${token}`
  const email = orderSentEmail({
    customerFirstName: customer.firstName,
    orderRef: order.ref,
    vehicleMake: order.vehicle.make,
    vehicleModel: order.vehicle.model,
    totalGBP: fmtGBPFromPence(order.totalAmountPence),
    signingUrl,
    expiresAt,
  })
  const sendResult = await sendEmail({
    to: customer.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
  await recordEmailEvent({
    template: 'order.sent',
    orderId: order.id,
    customerId: order.customerId,
    to: customer.email,
    subject: email.subject,
    outcome: sendResult.ok ? 'sent' : 'failed',
    providerMessageId: sendResult.id ?? null,
    error: sendResult.error ?? null,
    extra: { tokenExpiresAt: expiresAt.toISOString() },
  })

  revalidatePath(`/admin/orders/${order.id}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true, id: order.id, ref: order.ref }
}

// ─── cancel ────────────────────────────────────────────────────────────────

export async function cancelOrderAction(
  orderId: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const existing = await db
    .select({ status: orders.status, customerId: orders.customerId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Order not found' }
  const { status, customerId } = existing[0]
  if (status === 'signed' || status === 'delivered') {
    return { ok: false, error: 'Signed and delivered orders cannot be cancelled' }
  }
  if (status === 'cancelled') return { ok: true, id: orderId }

  await db
    .update(orders)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  // Cancel any scheduled reminders that haven't fired yet
  await db
    .update(reminderSchedule)
    .set({ cancelledAt: new Date() })
    .where(
      and(
        eq(reminderSchedule.orderId, orderId),
        // sentAt IS NULL AND cancelledAt IS NULL
      ),
    )

  await db.insert(auditEvents).values({
    orderId,
    customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.cancelled',
    payload: { previousStatus: status },
  })

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true, id: orderId }
}

// ─── delivery lifecycle (Phase 9) ──────────────────────────────────────────
//
// The previous single-click `signed → delivered` flow is replaced with a
// small state machine:
//
//   signed → confirmed → on_order → ready_for_handover → delivered
//
// Each transition captures operational fields at the right moment and
// writes a rich audit row via buildAuditPayload. Logic lives in
// src/lib/order-delivery.ts so it can move to a dedicated entity later.

interface TransitionInput {
  note?: string
}

interface ConfirmedInput extends TransitionInput {
  supplierPoNumber?: string | null
  estimatedDeliveryDate?: string | null
}

interface OnOrderInput extends TransitionInput {
  estimatedDeliveryDate?: string | null
}

interface ReadyInput extends TransitionInput {
  chassisNumber?: string | null
  registrationPlate?: string | null
  handoverLocation?: string | null
  handoverNotes?: string | null
}

interface DeliveredInput extends TransitionInput {
  actualDeliveryDate?: string | null
}

export async function markConfirmedAction(
  orderId: string,
  input: ConfirmedInput = {},
): Promise<OrderActionResult> {
  return transition(orderId, 'confirmed', {
    ...input,
    patch: {
      supplierPoNumber: input.supplierPoNumber,
      estimatedDeliveryDate: input.estimatedDeliveryDate,
    },
  })
}

export async function markOnOrderAction(
  orderId: string,
  input: OnOrderInput = {},
): Promise<OrderActionResult> {
  return transition(orderId, 'on_order', {
    ...input,
    patch: { estimatedDeliveryDate: input.estimatedDeliveryDate },
  })
}

export async function markReadyForHandoverAction(
  orderId: string,
  input: ReadyInput = {},
): Promise<OrderActionResult> {
  return transition(orderId, 'ready_for_handover', {
    ...input,
    patch: {
      chassisNumber: input.chassisNumber,
      registrationPlate: input.registrationPlate,
      handoverLocation: input.handoverLocation,
      handoverNotes: input.handoverNotes,
    },
  })
}

export async function markDeliveredAction(
  orderId: string,
  input: DeliveredInput = {},
): Promise<OrderActionResult> {
  return transition(orderId, 'delivered', {
    ...input,
    patch: { actualDeliveryDate: input.actualDeliveryDate },
  })
}

/**
 * Shared forward-transition core. Validates the step, computes the logistics
 * diff, builds the audit payload, stamps the appropriate *_at timestamp,
 * and writes the main status-change audit row plus per-field events
 * (chassis/reg/ETA) if those fields moved in this step.
 */
async function transition(
  orderId: string,
  target: PostSignStatus,
  opts: {
    note?: string
    patch?: LogisticsPatch
  },
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const existing = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Order not found' }
  const current = existing[0].order
  const customer = existing[0].customer

  if (!isForwardTransitionAllowed(current.status, target)) {
    return {
      ok: false,
      error: `Cannot transition from ${current.status} to ${target}. Use admin override if this is a backfill.`,
    }
  }

  const now = new Date()
  const patch = opts.patch ?? {}
  // Only include fields actually supplied (defined in the patch).
  const cleanedPatch: LogisticsPatch = {}
  for (const f of LOGISTICS_FIELDS) {
    if (f in patch) cleanedPatch[f] = patch[f]
  }
  const changedFields = diffLogistics(current, cleanedPatch)

  const stampField = stampFieldForStatus(target)
  const updatePayload: Partial<typeof orders.$inferInsert> = {
    status: target,
    updatedAt: now,
    ...cleanedPatch,
  }
  if (stampField) updatePayload[stampField] = now

  await db.update(orders).set(updatePayload).where(eq(orders.id, orderId))

  const audit = buildAuditPayload({
    actorId: user.id,
    previousStatus: current.status,
    newStatus: target,
    changedFields,
    note: opts.note,
    now,
  })

  await db.insert(auditEvents).values({
    orderId,
    customerId: current.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: eventTypeForStatus(target),
    payload: audit as unknown as Record<string, unknown>,
  })

  // Per-field convenience events for the headline fields so later readers
  // can find "when was the VIN captured?" without parsing payloads.
  await emitFieldEvents(orderId, current.customerId, user.id, changedFields, now)

  // Merge patch + current so the email composer reads the post-update row.
  const after = { ...current, ...cleanedPatch, status: target }
  await fireTransitionEmail(target, after, customer)

  // Schedule the NPS ask two days after delivery (Phase 12). Respects
  // marketing opt-out at send time via the cron branch, not here.
  if (target === 'delivered') {
    const scheduled = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    await db.insert(reminderSchedule).values({
      orderId,
      scheduledFor: scheduled,
      kind: 'nps_day_2',
    })
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true, id: orderId }
}

/**
 * Fire the appropriate lifecycle email for a forward transition. Best-
 * effort: failure logs into audit via sendLifecycleEmail but never
 * blocks the state change.
 */
async function fireTransitionEmail(
  target: PostSignStatus,
  order: Order,
  customer: Customer,
): Promise<void> {
  if (target === 'cancelled_post_sign') return

  const vehicle = order.vehicle
  const commonBase = {
    customerFirstName: customer.firstName,
    orderRef: order.ref,
    vehicleMake: vehicle.make,
    vehicleModel: vehicle.model,
  }

  if (target === 'confirmed') {
    const etaLabel = order.estimatedDeliveryDate
      ? fmtDate(order.estimatedDeliveryDate)
      : null
    const email = orderConfirmedEmail({ ...commonBase, etaLabel })
    await sendLifecycleEmail({
      template: 'order.confirmed_email',
      orderId: order.id,
      customerId: order.customerId,
      to: customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
    // Remember this ETA as the one the customer now knows about.
    if (order.estimatedDeliveryDate) {
      await db
        .update(orders)
        .set({ lastCommunicatedEtaDate: order.estimatedDeliveryDate })
        .where(eq(orders.id, order.id))
    }
    return
  }

  if (target === 'ready_for_handover') {
    const etaLabel = order.estimatedDeliveryDate
      ? fmtDate(order.estimatedDeliveryDate)
      : null
    const email = orderReadyForHandoverEmail({
      ...commonBase,
      handoverLocation: order.handoverLocation ?? null,
      etaLabel,
    })
    await sendLifecycleEmail({
      template: 'order.ready_for_handover_email',
      orderId: order.id,
      customerId: order.customerId,
      to: customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
    if (order.estimatedDeliveryDate) {
      await db
        .update(orders)
        .set({ lastCommunicatedEtaDate: order.estimatedDeliveryDate })
        .where(eq(orders.id, order.id))
    }
    return
  }

  if (target === 'delivered') {
    const email = orderDeliveredEmail({
      ...commonBase,
      registrationPlate: order.registrationPlate ?? null,
      // Handover pack URL is added by the handover-pack generation path;
      // it's a separate admin action and may not have run yet. Email
      // survives without it — the signed-order verify link still shows.
      handoverPackUrl: null,
      verifyUrl: `${siteUrl()}/verify/${order.ref}`,
    })
    await sendLifecycleEmail({
      template: 'order.delivered_email',
      orderId: order.id,
      customerId: order.customerId,
      to: customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
    return
  }

  // on_order isn't a customer-facing email in v1 — they get the ETA-
  // changed email instead when the ETA actually moves meaningfully.
}

function stampFieldForStatus(
  s: PostSignStatus,
):
  | 'confirmedAt'
  | 'onOrderAt'
  | 'readyForHandoverAt'
  | 'deliveredAt'
  | 'cancelledPostSignAt'
  | null {
  switch (s) {
    case 'confirmed':
      return 'confirmedAt'
    case 'on_order':
      return 'onOrderAt'
    case 'ready_for_handover':
      return 'readyForHandoverAt'
    case 'delivered':
      return 'deliveredAt'
    case 'cancelled_post_sign':
      return 'cancelledPostSignAt'
    default:
      return null
  }
}

function eventTypeForStatus(
  s: PostSignStatus,
):
  | 'order.confirmed'
  | 'order.on_order'
  | 'order.ready_for_handover'
  | 'order.delivered'
  | 'order.cancelled_post_sign' {
  switch (s) {
    case 'confirmed':
      return 'order.confirmed'
    case 'on_order':
      return 'order.on_order'
    case 'ready_for_handover':
      return 'order.ready_for_handover'
    case 'delivered':
      return 'order.delivered'
    case 'cancelled_post_sign':
      return 'order.cancelled_post_sign'
    default:
      // `signed` is already set by the signing flow; we never transition to it here.
      throw new Error(`Unexpected post-sign status: ${s}`)
  }
}

async function emitFieldEvents(
  orderId: string,
  customerId: string,
  actorId: string,
  changedFields: Record<LogisticsField, { from: unknown; to: unknown }>,
  now: Date,
) {
  const perField = Object.entries(changedFields)
    .map(([field, delta]) => ({
      field: field as LogisticsField,
      delta,
      eventType: FIELD_EVENT_TYPE[field as LogisticsField],
    }))
    .filter((x) => !!x.eventType)

  if (perField.length === 0) return

  await db.insert(auditEvents).values(
    perField.map((x) => ({
      orderId,
      customerId,
      actorType: 'rep' as const,
      actorId,
      eventType: x.eventType!,
      payload: { field: x.field, ...x.delta, at: now.toISOString() } as Record<
        string,
        unknown
      >,
    })),
  )
}

// ─── update logistics (any live post-sign stage) ───────────────────────────

export async function updateLogisticsAction(
  orderId: string,
  patch: LogisticsPatch,
  opts?: { forceCustomerEmail?: boolean; forceReason?: string },
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const existing = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Order not found' }
  const current = existing[0].order
  const customer = existing[0].customer

  // Only editable while the order is in a live post-sign stage — not after
  // delivered/cancelled, not before signed.
  if (
    !isPostSignStatus(current.status) ||
    current.status === 'delivered' ||
    current.status === 'cancelled_post_sign' ||
    current.status === 'signed' // pre-confirmation edits discouraged in v1
  ) {
    return {
      ok: false,
      error: `Logistics cannot be edited in status "${current.status}". Move the order to confirmed first.`,
    }
  }

  const cleanedPatch: LogisticsPatch = {}
  for (const f of LOGISTICS_FIELDS) {
    if (f in patch) cleanedPatch[f] = patch[f]
  }
  const changedFields = diffLogistics(current, cleanedPatch)
  if (Object.keys(changedFields).length === 0) return { ok: true, id: orderId }

  const now = new Date()
  await db
    .update(orders)
    .set({ ...cleanedPatch, updatedAt: now })
    .where(eq(orders.id, orderId))

  const audit = buildAuditPayload({
    actorId: user.id,
    previousStatus: current.status,
    newStatus: current.status,
    changedFields,
    now,
  })

  await db.insert(auditEvents).values({
    orderId,
    customerId: current.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.logistics_updated',
    payload: audit as unknown as Record<string, unknown>,
  })

  await emitFieldEvents(
    orderId,
    current.customerId,
    user.id,
    changedFields,
    now,
  )

  // ETA-change customer email (Phase 12). Fires when the ETA moved vs the
  // last value we actually told the customer — not vs whatever it was
  // before this edit. Internal churn stays silent; meaningful drift or
  // admin-forced resend reaches the inbox.
  const etaChanged = 'estimatedDeliveryDate' in cleanedPatch
  if (etaChanged) {
    const newEta = cleanedPatch.estimatedDeliveryDate ?? null
    const lastComm = current.lastCommunicatedEtaDate
    const shouldAutoSend = shouldSendEtaChangeEmail({
      newEta,
      lastCommunicated: lastComm,
      orderStatusPastSigned: ['confirmed', 'on_order', 'ready_for_handover'].includes(
        current.status,
      ),
    })
    const shouldSend = shouldAutoSend || !!opts?.forceCustomerEmail

    if (shouldSend && newEta) {
      const email = orderEtaChangedEmail({
        customerFirstName: customer.firstName,
        orderRef: current.ref,
        vehicleMake: current.vehicle.make,
        vehicleModel: current.vehicle.model,
        previousEtaLabel: lastComm ? fmtDate(lastComm) : null,
        newEtaLabel: fmtDate(newEta),
      })
      const result = await sendLifecycleEmail({
        template: 'order.eta_changed_email',
        orderId: current.id,
        customerId: current.customerId,
        to: customer.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        force: opts?.forceCustomerEmail
          ? {
              reason:
                opts.forceReason?.trim() ||
                'Admin forced ETA email via logistics edit',
            }
          : undefined,
      })
      if (result.outcome === 'sent') {
        await db
          .update(orders)
          .set({ lastCommunicatedEtaDate: newEta })
          .where(eq(orders.id, orderId))
      }
    }
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  return { ok: true, id: orderId }
}

// ─── post-sign cancel ──────────────────────────────────────────────────────

export async function cancelPostSignAction(
  orderId: string,
  reason: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const trimmed = reason?.trim() ?? ''
  if (trimmed.length < 5) {
    return { ok: false, error: 'A reason (min 5 chars) is required to cancel after signing.' }
  }

  const existing = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Order not found' }
  const current = existing[0]

  if (!isForwardTransitionAllowed(current.status, 'cancelled_post_sign')) {
    return {
      ok: false,
      error: `Cannot post-sign cancel from status "${current.status}".`,
    }
  }

  const now = new Date()
  await db
    .update(orders)
    .set({
      status: 'cancelled_post_sign',
      cancelledPostSignAt: now,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId))

  const audit = buildAuditPayload({
    actorId: user.id,
    previousStatus: current.status,
    newStatus: 'cancelled_post_sign',
    reason: trimmed,
    now,
  })

  await db.insert(auditEvents).values({
    orderId,
    customerId: current.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.cancelled_post_sign',
    payload: audit as unknown as Record<string, unknown>,
  })

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true, id: orderId }
}

// ─── admin override ────────────────────────────────────────────────────────
//
// Escape hatch for backfills and operational recoveries. Jumps any number
// of stages forward, bypassing the one-step-at-a-time rule. Mandatory
// reason; fills any skipped *_at stamps to "now" so the timeline isn't
// hollow.

export async function overrideStatusAction(
  orderId: string,
  targetStatus: string,
  reason: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const trimmed = reason?.trim() ?? ''
  if (trimmed.length < 5) {
    return {
      ok: false,
      error: 'A reason (min 5 chars) is required to override status.',
    }
  }

  if (!isOverrideTargetAllowed(targetStatus)) {
    return {
      ok: false,
      error: `"${targetStatus}" is not a valid override target.`,
    }
  }

  const existing = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Order not found' }
  const current = existing[0]

  if (!isPostSignStatus(current.status)) {
    return {
      ok: false,
      error: `Override only applies to post-sign orders; current status is "${current.status}".`,
    }
  }
  if (current.status === targetStatus) {
    return { ok: false, error: 'Order is already at that status.' }
  }

  const now = new Date()
  const stamps: Partial<typeof orders.$inferInsert> = {}
  // Fill any missing forward stamps up to and including the target.
  if (targetStatus === 'confirmed' || forwardChain('confirmed', targetStatus)) {
    if (!current.confirmedAt) stamps.confirmedAt = now
  }
  if (targetStatus === 'on_order' || forwardChain('on_order', targetStatus)) {
    if (!current.onOrderAt) stamps.onOrderAt = now
  }
  if (
    targetStatus === 'ready_for_handover' ||
    forwardChain('ready_for_handover', targetStatus)
  ) {
    if (!current.readyForHandoverAt) stamps.readyForHandoverAt = now
  }
  if (targetStatus === 'delivered') {
    if (!current.deliveredAt) stamps.deliveredAt = now
  }
  if (targetStatus === 'cancelled_post_sign') {
    if (!current.cancelledPostSignAt) stamps.cancelledPostSignAt = now
  }

  await db
    .update(orders)
    .set({
      status: targetStatus as typeof current.status,
      updatedAt: now,
      ...stamps,
    })
    .where(eq(orders.id, orderId))

  const audit = buildAuditPayload({
    actorId: user.id,
    previousStatus: current.status,
    newStatus: targetStatus,
    reason: trimmed,
    now,
  })

  await db.insert(auditEvents).values({
    orderId,
    customerId: current.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.status_override',
    payload: audit as unknown as Record<string, unknown>,
  })

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true, id: orderId }
}

// Does `from` come before (or equal to) `target` in the forward chain?
// Used by override to decide which intermediate stamps to fill.
function forwardChain(from: PostSignStatus, target: string): boolean {
  const order: PostSignStatus[] = [
    'signed',
    'confirmed',
    'on_order',
    'ready_for_handover',
    'delivered',
  ]
  const fromIdx = order.indexOf(from)
  const targetIdx = order.indexOf(target as PostSignStatus)
  if (fromIdx === -1 || targetIdx === -1) return false
  return fromIdx < targetIdx
}

// ─── resend signing link ───────────────────────────────────────────────────

export async function resendSigningLinkAction(
  orderId: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const reachability = signingUrlLooksReachable()
  if (reachability) return { ok: false, error: reachability }

  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Order not found' }
  const { order, customer } = rows[0]

  if (order.status !== 'sent' && order.status !== 'partially_signed') {
    return { ok: false, error: 'No active signing link for this order' }
  }

  // Invalidate previous tokens for this customer role
  await db
    .update(signingTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(signingTokens.orderId, order.id),
        eq(signingTokens.signerRole, 'customer'),
      ),
    )

  const token = tokenAlphabet()
  const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS)
  await db.insert(signingTokens).values({
    orderId: order.id,
    token,
    signerRole: 'customer',
    expiresAt,
  })

  await db.insert(auditEvents).values({
    orderId: order.id,
    customerId: order.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'reminder.sent',
    payload: { manual: true, to: customer.email },
  })

  const signingUrl = `${siteUrl()}/sign/${token}`
  const email = orderSentEmail({
    customerFirstName: customer.firstName,
    orderRef: order.ref,
    vehicleMake: order.vehicle.make,
    vehicleModel: order.vehicle.model,
    totalGBP: fmtGBPFromPence(order.totalAmountPence),
    signingUrl,
    expiresAt,
  })
  const sendResult = await sendEmail({
    to: customer.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
  // Manual resend always counts as a resend in the audit log; capture the
  // prior send so admins can see the gap between the two.
  const prior = await findPriorEmailSent('order.sent', order.id)
  await recordEmailEvent({
    template: 'order.sent',
    orderId: order.id,
    customerId: order.customerId,
    to: customer.email,
    subject: email.subject,
    outcome: sendResult.ok ? 'sent' : 'failed',
    providerMessageId: sendResult.id ?? null,
    error: sendResult.error ?? null,
    isResend: !!prior,
    resendReason: 'Admin manual resend from order page',
    previousSentAt: prior?.sentAt,
    extra: { manual: true, tokenExpiresAt: expiresAt.toISOString() },
  })

  revalidatePath(`/admin/orders/${order.id}`)
  return { ok: true, id: order.id }
}

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}

/**
 * Called before send-to-customer-email actions. Refuses to send if the
 * signing URL would point at localhost — that would deliver an unclickable
 * link to a real customer inbox (we learned this from UD3R's localhost
 * email to Tony, which he couldn't use).
 *
 * Returns null when it's safe to send, or an error message when it isn't.
 *
 * Escape hatch: set ALLOW_LOCALHOST_CUSTOMER_EMAIL=1 to bypass. Useful
 * when deliberately testing against a tunnel (ngrok) where the env var
 * still contains "localhost" via mapping.
 */
function signingUrlLooksReachable(): string | null {
  if (process.env.ALLOW_LOCALHOST_CUSTOMER_EMAIL === '1') return null
  const url = siteUrl()
  if (/localhost|127\.0\.0\.1|\[::1\]|::1/.test(url)) {
    return (
      `Refusing to email a signing link that points at ${url}. ` +
      `Customer-facing actions require NEXTAUTH_URL to be a public HTTPS URL. ` +
      `If you're testing intentionally, set ALLOW_LOCALHOST_CUSTOMER_EMAIL=1.`
    )
  }
  return null
}

// ─── rep signature ────────────────────────────────────────────────────────

export interface RepSignInput {
  signature: { type: 'typed' | 'drawn'; data: string }
  intent: true
}

export async function signAsRepAction(
  orderId: string,
  input: RepSignInput,
): Promise<OrderActionResult> {
  const user = await requireAdmin()
  if (!input.intent) {
    return { ok: false, error: 'Intent to sign must be confirmed' }
  }
  if (input.signature.type === 'typed') {
    if (!input.signature.data || input.signature.data.trim().length < 2) {
      return { ok: false, error: 'Typed signature required' }
    }
  } else if (input.signature.type === 'drawn') {
    if (!input.signature.data?.startsWith('data:image/png;base64,')) {
      return { ok: false, error: 'Drawn signature invalid' }
    }
  } else {
    return { ok: false, error: 'Invalid signature payload' }
  }

  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Order not found' }
  const { order, customer } = rows[0]

  if (!['sent', 'partially_signed'].includes(order.status)) {
    return {
      ok: false,
      error: `Cannot sign from status "${order.status}"`,
    }
  }

  // Has this order already got a rep signature?
  const existingSigs = await db
    .select({ role: signatures.signerRole })
    .from(signatures)
    .where(eq(signatures.orderId, orderId))
  if (existingSigs.some((s) => s.role === 'rep')) {
    return { ok: false, error: 'This order already has a representative signature' }
  }

  const forensics = await captureForensics()

  const snapshotForHash = {
    ref: order.ref,
    vehicle: order.vehicle,
    options: order.options,
    delivery: order.delivery,
    pricing: order.pricing,
    finance: order.finance,
    addons: order.addons,
    partExchange: order.partExchange,
    totalAmountPence: order.totalAmountPence,
    monthlyAmountPence: order.monthlyAmountPence,
    customerId: order.customerId,
    financeType: order.financeType,
  }
  const docHash = createHash('sha256')
    .update(canonicalJson(snapshotForHash))
    .digest('hex')
  const serverSig = signBytes(docHash)
  const keyFp = signingKeyFingerprint()

  await db.insert(signatures).values({
    orderId,
    signerRole: 'rep',
    signerName:
      input.signature.type === 'typed'
        ? input.signature.data.trim()
        : user.name ?? user.email ?? 'Olaris representative',
    signerEmail: user.email ?? 'alan@olaris.co.uk',
    signatureType: input.signature.type,
    signatureData: input.signature.data,
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
    // Rep signing is auth'd via session, not OTP
    otpMethod: null,
    otpVerifiedAt: null,
    documentSha256: docHash,
    serverSignature: serverSig,
    signingKeyFingerprint: keyFp,
  })

  const bothSigned = existingSigs.some((s) => s.role === 'customer')

  await db
    .update(orders)
    .set({
      status: bothSigned ? 'signed' : 'partially_signed',
      signedAt: bothSigned ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  await db.insert(auditEvents).values({
    orderId,
    customerId: order.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'signed',
    payload: { role: 'rep', method: input.signature.type, docSha256: docHash },
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
  })

  if (bothSigned) {
    await finalisePdfAndNotify({
      orderId,
      orderRef: order.ref,
      customerId: order.customerId,
      customerEmail: customer.email,
      customerFirstName: customer.firstName,
      vehicleMake: order.vehicle.make,
      vehicleModel: order.vehicle.model,
      totalGBP: fmtGBPFromPence(order.totalAmountPence),
      repEmail: user.email ?? 'alan@olaris.co.uk',
      repFirstName: user.name?.split(' ')[0] ?? 'Alan',
    })
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true, id: orderId }
}

// ─── Shared: render PDF + email both parties with the PDF attached ─────
//
// Called from two signing completion paths:
//   - signAsRepAction (when rep signs second)
//   - /api/sign/submit (when customer signs second — see route handler)
//
// Wrapped in try/catch so failure here doesn't roll back the already-recorded
// signatures. If PDF gen or email fails we record audit events and the admin
// can manually "Regenerate PDF" / "Resend signed copy" later (Phase 7 UI).

interface FinaliseInput {
  orderId: string
  orderRef: string
  customerId: string
  customerEmail: string
  customerFirstName: string
  vehicleMake: string
  vehicleModel: string
  totalGBP: string
  repEmail: string
  repFirstName: string
}

async function finalisePdfAndNotify(input: FinaliseInput): Promise<void> {
  // Deferred imports — puppeteer-core + @vercel/blob + @sparticuz/chromium
  // are heavy. Pay the cost only when we actually finalise.
  const { generateOrderPdf } = await import('@/lib/pdf/generate')
  const { mintDownloadToken } = await import('@/lib/pdf/download-token')
  const { get: blobGet } = await import('@vercel/blob')

  const verifyUrl = `${siteUrl()}/verify/${input.orderRef}`
  const downloadToken = mintDownloadToken(input.orderId)
  const downloadUrl = `${siteUrl()}/api/orders/${input.orderId}/pdf?t=${encodeURIComponent(downloadToken)}`

  let pdfBuffer: Buffer | undefined
  let pdfSha: string | undefined
  const pdfResult = await generateOrderPdf(input.orderId)
  if (pdfResult.ok) {
    pdfSha = pdfResult.pdfSha256
    // Fresh render returns the buffer directly; idempotent cache-hit path
    // doesn't, so fall back to fetching from Blob by pathname.
    if (pdfResult.buffer) {
      pdfBuffer = pdfResult.buffer
    } else if (pdfResult.documentId) {
      try {
        const docRow = await db
          .select({ filename: documents.filename })
          .from(documents)
          .where(eq(documents.id, pdfResult.documentId))
          .limit(1)
        if (docRow[0]) {
          const blobResult = await blobGet(docRow[0].filename, { access: 'private' })
          if (blobResult && blobResult.statusCode === 200) {
            const reader = blobResult.stream.getReader()
            const chunks: Uint8Array[] = []
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              if (value) chunks.push(value)
            }
            pdfBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)))
          }
        }
      } catch {
        // non-fatal — link-based email still goes out below
      }
    }
  } else {
    await recordEmailEvent({
      template: 'order.signed',
      orderId: input.orderId,
      customerId: input.customerId,
      to: input.customerEmail,
      subject: `Order ${input.orderRef} fully executed`,
      outcome: 'failed',
      providerMessageId: null,
      error: pdfResult.error ?? 'pdf_generate_failed',
      extra: { stage: 'pdf_generate' },
    })
  }

  const attachments = pdfBuffer
    ? [{ filename: `${input.orderRef}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    : undefined

  const customerMail = orderSignedEmail({
    recipientFirstName: input.customerFirstName,
    orderRef: input.orderRef,
    vehicleMake: input.vehicleMake,
    vehicleModel: input.vehicleModel,
    totalGBP: input.totalGBP,
    verifyUrl,
  })
  const repMail = orderSignedEmail({
    recipientFirstName: input.repFirstName,
    orderRef: input.orderRef,
    vehicleMake: input.vehicleMake,
    vehicleModel: input.vehicleModel,
    totalGBP: input.totalGBP,
    verifyUrl,
  })

  const [custSend, repSend] = await Promise.all([
    sendEmail({ to: input.customerEmail, ...customerMail, attachments }),
    sendEmail({ to: input.repEmail, ...repMail, attachments }),
  ])

  // One audit row per recipient — keeps the {to, providerMessageId, error}
  // contract one-to-one, so a query like "all emails to customers" doesn't
  // have to know about a `customerMessageId` shape variant.
  const sharedExtra = {
    pdfAttached: !!pdfBuffer,
    pdfSha256: pdfSha,
    downloadUrl,
  }
  await Promise.all([
    recordEmailEvent({
      template: 'order.signed',
      orderId: input.orderId,
      customerId: input.customerId,
      to: input.customerEmail,
      subject: customerMail.subject,
      outcome: custSend.ok ? 'sent' : 'failed',
      providerMessageId: custSend.id ?? null,
      error: custSend.error ?? null,
      extra: { ...sharedExtra, recipient: 'customer' },
    }),
    recordEmailEvent({
      template: 'order.signed',
      orderId: input.orderId,
      customerId: input.customerId,
      to: input.repEmail,
      subject: repMail.subject,
      outcome: repSend.ok ? 'sent' : 'failed',
      providerMessageId: repSend.id ?? null,
      error: repSend.error ?? null,
      extra: { ...sharedExtra, recipient: 'rep' },
    }),
  ])
}

// Exported for the /api/sign/submit route to call when the customer signs
// as the second party.
export async function finalisePdfAndNotifyPublic(input: FinaliseInput): Promise<void> {
  return finalisePdfAndNotify(input)
}

// ─── ensure PDF exists (on-demand generation for admin download) ──────────
// Returns the redirector URL (not the raw Blob URL), since the store is
// private — the Blob URL can't be dereferenced directly. The redirector
// authenticates by admin session.

export async function ensureOrderPdfAction(
  orderId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  await requireAdmin()
  const { generateOrderPdf } = await import('@/lib/pdf/generate')
  const result = await generateOrderPdf(orderId)
  if (!result.ok) {
    return { ok: false, error: result.error }
  }
  return { ok: true, url: `${siteUrl()}/api/orders/${orderId}/pdf` }
}

// ─── delete draft (distinct from cancel — draft→gone, no audit trail needed) ─

export async function deleteDraftAction(
  orderId: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const existing = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Order not found' }
  if (existing[0].status !== 'draft') {
    return { ok: false, error: 'Only drafts can be deleted. Cancel non-draft orders instead.' }
  }

  await db.delete(orders).where(eq(orders.id, orderId))

  // Orphaned audit events stay via ON DELETE cascade — we don't keep them.
  // If you want to keep audit history for deleted drafts, change schema FK.
  void user
  redirect('/admin/orders')
}
