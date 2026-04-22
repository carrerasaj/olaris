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
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import {
  orderDraftSchema,
  orderSendSchema,
  type OrderDraftInput,
} from '@/lib/validation'
import { generateOrderRef, fmtGBPFromPence } from '@/lib/format'
import { captureForensics, canonicalJson } from '@/lib/forensics'
import { signBytes, signingKeyFingerprint } from '@/lib/signing-key'
import { sendEmail } from '@/lib/email'
import {
  orderSentEmail,
  orderSignedEmail,
} from '@/lib/email-templates'

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

// ─── send for signature ───────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function sendForSignatureAction(
  orderId: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

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
  await db.insert(auditEvents).values({
    orderId: order.id,
    customerId: order.customerId,
    actorType: 'system',
    eventType: sendResult.ok ? 'email.sent' : 'email.failed',
    payload: {
      template: 'order.sent',
      to: customer.email,
      messageId: sendResult.id,
      error: sendResult.error,
    },
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

// ─── mark delivered ────────────────────────────────────────────────────────

export async function markDeliveredAction(
  orderId: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

  const existing = await db
    .select({ status: orders.status, customerId: orders.customerId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Order not found' }
  if (existing[0].status !== 'signed') {
    return { ok: false, error: 'Only signed orders can be marked delivered' }
  }

  await db
    .update(orders)
    .set({ status: 'delivered', deliveredAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await db.insert(auditEvents).values({
    orderId,
    customerId: existing[0].customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'order.delivered',
    payload: null,
  })

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true, id: orderId }
}

// ─── resend signing link ───────────────────────────────────────────────────

export async function resendSigningLinkAction(
  orderId: string,
): Promise<OrderActionResult> {
  const user = await requireAdmin()

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
  await db.insert(auditEvents).values({
    orderId: order.id,
    customerId: order.customerId,
    actorType: 'system',
    eventType: sendResult.ok ? 'email.sent' : 'email.failed',
    payload: {
      template: 'order.sent',
      to: customer.email,
      manual: true,
      messageId: sendResult.id,
      error: sendResult.error,
    },
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
    const verifyUrl = `${siteUrl()}/verify/${order.ref}`
    const totalGBP = fmtGBPFromPence(order.totalAmountPence)
    // Email both parties. Alan gets notified at his email (from session).
    const customerMail = orderSignedEmail({
      recipientFirstName: customer.firstName,
      orderRef: order.ref,
      vehicleMake: order.vehicle.make,
      vehicleModel: order.vehicle.model,
      totalGBP,
      verifyUrl,
    })
    const repMail = orderSignedEmail({
      recipientFirstName: 'Alan', // rep-facing — personalisation minimal
      orderRef: order.ref,
      vehicleMake: order.vehicle.make,
      vehicleModel: order.vehicle.model,
      totalGBP,
      verifyUrl,
    })
    await Promise.all([
      sendEmail({ to: customer.email, ...customerMail }),
      sendEmail({ to: user.email ?? 'alan@olaris.co.uk', ...repMail }),
    ])
    await db.insert(auditEvents).values({
      orderId,
      customerId: order.customerId,
      actorType: 'system',
      eventType: 'email.sent',
      payload: { template: 'order.signed', recipients: 2 },
    })
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { ok: true, id: orderId }
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
