'use server'

/**
 * Admin server actions for quotes.
 *
 * State machine:
 *   draft        ─ send           ──▶  sent
 *   sent         ─ viewed link    ──▶  viewed      (one-shot, activity signal)
 *   sent|viewed  ─ markAccepted   ──▶  accepted
 *   sent|viewed  ─ markDeclined   ──▶  declined
 *   accepted     ─ convertToOrder ──▶  converted
 *   sent|viewed  ─ cron expires   ──▶  expired
 *   any          ─ cancel         ──▶  cancelled
 *
 * Terms are frozen once a quote leaves `draft`. Edits require cancel + new
 * draft — we never mutate a quote the customer has seen.
 *
 * Accepted + convert actions also guard `expires_at > now()` independently
 * of the stored status, in case the expiry cron hasn't swept yet.
 */

import { revalidatePath } from 'next/cache'
import { and, eq, inArray, isNull, lte } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import {
  db,
  orders,
  quotes,
  quoteTokens,
  customers,
  auditEvents,
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import {
  quoteDraftSchema,
  quoteSendSchema,
  type QuoteDraftInput,
} from '@/lib/validation'
import {
  generateQuoteRef,
  generateOrderRef,
  fmtGBPFromPence,
} from '@/lib/format'
import { sendEmail } from '@/lib/email'
import { quoteSentEmail } from '@/lib/email-templates'

export interface QuoteActionResult {
  ok: boolean
  error?: string
  issues?: { path: string; message: string }[]
  id?: string
  ref?: string
  orderId?: string
  orderRef?: string
}

const tokenAlphabet = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  32,
)

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

function deriveTotals(input: QuoteDraftInput) {
  const p = input.pricing
  const optionsNet = input.options.reduce(
    (s, o) => s + o.netPence * o.qty,
    0,
  )
  const netBeforeVat = p.vehicleNetPence + optionsNet - p.discountPence
  const vat = Math.round((netBeforeVat * p.vatRate) / 100)
  const onRoad =
    p.vedPence + p.firstRegFeePence + p.deliveryFeePence + p.numberPlatesPence
  const total = netBeforeVat + vat + onRoad

  const a = input.addons
  const monthlyAddons =
    (a.maintenance ? a.maintenanceMonthlyPence : 0) +
    (a.tyreCover ? a.tyreMonthlyPence : 0) +
    (a.breakdown ? a.breakdownMonthlyPence : 0)
  const monthlyTotal = (input.finance.monthlyNetPence || 0) + monthlyAddons

  return { totalAmountPence: total, monthlyAmountPence: monthlyTotal }
}

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}

function publicUrlLooksReachable(): string | null {
  if (process.env.ALLOW_LOCALHOST_CUSTOMER_EMAIL === '1') return null
  const url = siteUrl()
  if (/localhost|127\.0\.0\.1|\[::1\]|::1/.test(url)) {
    return (
      `Refusing to email a quote link that points at ${url}. ` +
      `Set NEXTAUTH_URL to a public HTTPS URL, or ` +
      `ALLOW_LOCALHOST_CUSTOMER_EMAIL=1 to override for testing.`
    )
  }
  return null
}

// ─── create ────────────────────────────────────────────────────────────────

export async function createQuoteAction(
  input: QuoteDraftInput,
): Promise<QuoteActionResult> {
  const user = await requireAdmin()
  const parsed = quoteDraftSchema.safeParse(input)
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

  const cust = await db
    .select({ id: customers.id, companyId: customers.companyId })
    .from(customers)
    .where(eq(customers.id, data.customerId))
    .limit(1)
  if (cust.length === 0) return { ok: false, error: 'Customer not found' }

  let ref = generateQuoteRef()
  for (let attempt = 0; attempt < 3; attempt++) {
    const dupe = await db
      .select({ id: quotes.id })
      .from(quotes)
      .where(eq(quotes.ref, ref))
      .limit(1)
    if (dupe.length === 0) break
    ref = generateQuoteRef()
  }

  const [quote] = await db
    .insert(quotes)
    .values({
      ref,
      customerId: data.customerId,
      companyId: data.companyId ?? cust[0].companyId ?? null,
      vehicleSupplierId: data.vehicleSupplierId ?? null,
      financeProviderId: data.financeProviderId ?? null,
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
      notes: data.notes,
      customerNotes: data.customerNotes ?? null,
      totalAmountPence,
      monthlyAmountPence,
      expiresAt: new Date(Date.now() + FOURTEEN_DAYS_MS),
      createdBy: user.id,
    })
    .returning({ id: quotes.id, ref: quotes.ref })

  await db.insert(auditEvents).values({
    quoteId: quote.id,
    customerId: data.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'quote.created',
    payload: { ref: quote.ref },
  })

  revalidatePath('/admin/quotes')
  revalidatePath('/admin')
  revalidatePath(`/admin/customers/${data.customerId}`)
  return { ok: true, id: quote.id, ref: quote.ref }
}

// ─── update draft ─────────────────────────────────────────────────────────

export async function updateQuoteAction(
  quoteId: string,
  input: QuoteDraftInput,
): Promise<QuoteActionResult> {
  const user = await requireAdmin()
  const parsed = quoteDraftSchema.safeParse(input)
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
    .select({ status: quotes.status })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Quote not found' }
  if (existing[0].status !== 'draft') {
    return {
      ok: false,
      error:
        'Only draft quotes can be edited. Cancel and create a new draft to change terms after sending.',
    }
  }

  const { totalAmountPence, monthlyAmountPence } = deriveTotals(data)

  await db
    .update(quotes)
    .set({
      customerId: data.customerId,
      companyId: data.companyId ?? null,
      vehicleSupplierId: data.vehicleSupplierId ?? null,
      financeProviderId: data.financeProviderId ?? null,
      customerType: data.customerType,
      financeType: data.financeType,
      vehicle: data.vehicle,
      options: data.options,
      delivery: data.delivery,
      pricing: data.pricing,
      finance: data.finance,
      addons: data.addons,
      partExchange: data.partExchange ?? null,
      notes: data.notes,
      customerNotes: data.customerNotes ?? null,
      totalAmountPence,
      monthlyAmountPence,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId))

  await db.insert(auditEvents).values({
    quoteId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'quote.updated',
    payload: null,
  })

  revalidatePath(`/admin/quotes/${quoteId}`)
  revalidatePath('/admin/quotes')
  return { ok: true, id: quoteId }
}

// ─── send ──────────────────────────────────────────────────────────────────

export async function sendQuoteAction(
  quoteId: string,
): Promise<QuoteActionResult> {
  const user = await requireAdmin()

  const reachability = publicUrlLooksReachable()
  if (reachability) return { ok: false, error: reachability }

  const rows = await db
    .select({ quote: quotes, customer: customers })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .where(eq(quotes.id, quoteId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Quote not found' }
  const { quote, customer } = rows[0]

  // Allowed from draft (first send) and sent/viewed (resend).
  if (!['draft', 'sent', 'viewed'].includes(quote.status)) {
    return { ok: false, error: `Cannot send quote from status "${quote.status}"` }
  }

  // Stricter validation than draft — we need enough to make the email useful.
  const toValidate: QuoteDraftInput = {
    customerId: quote.customerId,
    companyId: quote.companyId,
    vehicleSupplierId: quote.vehicleSupplierId,
    financeProviderId: quote.financeProviderId,
    customerType: quote.customerType,
    financeType: quote.financeType,
    vehicle: quote.vehicle,
    options: quote.options,
    delivery: quote.delivery,
    pricing: quote.pricing,
    finance: quote.finance,
    addons: quote.addons,
    partExchange: quote.partExchange ?? undefined,
    notes: quote.notes ?? undefined,
    customerNotes: quote.customerNotes ?? undefined,
  }
  const parsed = quoteSendSchema.safeParse(toValidate)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Quote is incomplete',
      issues: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }

  // One active token per quote. Reuse the existing unexpired token on resend
  // so the customer's original link keeps working. Only mint a new one if
  // there isn't a usable one.
  const now = new Date()
  const existingTokens = await db
    .select({ token: quoteTokens.token, expiresAt: quoteTokens.expiresAt })
    .from(quoteTokens)
    .where(
      and(eq(quoteTokens.quoteId, quote.id), isNull(quoteTokens.consumedAt)),
    )

  let token = existingTokens.find((t) => t.expiresAt > now)?.token
  if (!token) {
    token = tokenAlphabet()
    await db.insert(quoteTokens).values({
      quoteId: quote.id,
      token,
      expiresAt: quote.expiresAt,
    })
  }

  // Only flip status if still in draft. Resends don't revert viewed → sent.
  if (quote.status === 'draft') {
    await db
      .update(quotes)
      .set({ status: 'sent', sentAt: now, updatedAt: now })
      .where(eq(quotes.id, quote.id))
  }

  await db.insert(auditEvents).values({
    quoteId: quote.id,
    customerId: quote.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'quote.sent',
    payload: {
      to: customer.email,
      resend: quote.status !== 'draft',
      tokenExpiresAt: quote.expiresAt.toISOString(),
    },
  })

  const viewUrl = `${siteUrl()}/quote/${token}`
  const email = quoteSentEmail({
    customerFirstName: customer.firstName,
    quoteRef: quote.ref,
    vehicleMake: quote.vehicle.make,
    vehicleModel: quote.vehicle.model,
    totalGBP: fmtGBPFromPence(quote.totalAmountPence),
    monthlyGBP:
      quote.monthlyAmountPence > 0
        ? fmtGBPFromPence(quote.monthlyAmountPence)
        : null,
    viewUrl,
    expiresAt: quote.expiresAt,
  })
  const sendResult = await sendEmail({
    to: customer.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
  await db.insert(auditEvents).values({
    quoteId: quote.id,
    customerId: quote.customerId,
    actorType: 'system',
    eventType: sendResult.ok ? 'email.sent' : 'email.failed',
    payload: {
      template: 'quote.sent',
      to: customer.email,
      messageId: sendResult.id,
      error: sendResult.error,
    },
  })

  revalidatePath(`/admin/quotes/${quote.id}`)
  revalidatePath('/admin/quotes')
  return { ok: true, id: quote.id, ref: quote.ref }
}

// ─── mark viewed ──────────────────────────────────────────────────────────
//
// Called from the public /quote/[token] page on first load. Idempotent: only
// flips sent → viewed. Does not touch already-viewed/accepted/etc. Takes a
// token rather than quoteId because the caller is unauthenticated.

export async function markQuoteViewedByToken(token: string): Promise<void> {
  const rows = await db
    .select({ quoteId: quoteTokens.quoteId })
    .from(quoteTokens)
    .where(eq(quoteTokens.token, token))
    .limit(1)
  if (rows.length === 0) return
  const quoteId = rows[0].quoteId

  const result = await db
    .update(quotes)
    .set({ status: 'viewed', viewedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(quotes.id, quoteId), eq(quotes.status, 'sent')))
    .returning({ id: quotes.id, customerId: quotes.customerId })

  if (result.length > 0) {
    await db.insert(auditEvents).values({
      quoteId,
      customerId: result[0].customerId,
      actorType: 'customer',
      eventType: 'quote.viewed',
      payload: null,
    })
  }
}

// ─── mark accepted ─────────────────────────────────────────────────────────

export async function markQuoteAcceptedAction(
  quoteId: string,
  note?: string,
): Promise<QuoteActionResult> {
  const user = await requireAdmin()

  const existing = await db
    .select({
      status: quotes.status,
      expiresAt: quotes.expiresAt,
      customerId: quotes.customerId,
    })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Quote not found' }
  const { status, expiresAt, customerId } = existing[0]
  if (!['sent', 'viewed'].includes(status)) {
    return {
      ok: false,
      error: `Cannot accept a quote in status "${status}". Only sent or viewed quotes can be marked accepted.`,
    }
  }
  if (expiresAt <= new Date()) {
    return {
      ok: false,
      error: 'This quote has expired. Create a new quote to re-offer these terms.',
    }
  }

  await db
    .update(quotes)
    .set({ status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(quotes.id, quoteId))

  await db.insert(auditEvents).values({
    quoteId,
    customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'quote.accepted',
    payload: note ? { note } : null,
  })

  revalidatePath(`/admin/quotes/${quoteId}`)
  revalidatePath('/admin/quotes')
  return { ok: true, id: quoteId }
}

// ─── mark declined ────────────────────────────────────────────────────────

export async function markQuoteDeclinedAction(
  quoteId: string,
  reason?: string,
): Promise<QuoteActionResult> {
  const user = await requireAdmin()

  const existing = await db
    .select({ status: quotes.status, customerId: quotes.customerId })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Quote not found' }
  const { status, customerId } = existing[0]
  if (!['sent', 'viewed'].includes(status)) {
    return {
      ok: false,
      error: `Cannot decline a quote in status "${status}".`,
    }
  }

  await db
    .update(quotes)
    .set({ status: 'declined', declinedAt: new Date(), updatedAt: new Date() })
    .where(eq(quotes.id, quoteId))

  await db.insert(auditEvents).values({
    quoteId,
    customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'quote.declined',
    payload: reason ? { reason } : null,
  })

  revalidatePath(`/admin/quotes/${quoteId}`)
  revalidatePath('/admin/quotes')
  return { ok: true, id: quoteId }
}

// ─── cancel ────────────────────────────────────────────────────────────────

export async function cancelQuoteAction(
  quoteId: string,
  reason?: string,
): Promise<QuoteActionResult> {
  const user = await requireAdmin()

  const existing = await db
    .select({ status: quotes.status, customerId: quotes.customerId })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Quote not found' }
  const { status, customerId } = existing[0]
  if (['converted', 'cancelled'].includes(status)) {
    return { ok: true, id: quoteId }
  }

  await db
    .update(quotes)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(quotes.id, quoteId))

  await db.insert(auditEvents).values({
    quoteId,
    customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'quote.cancelled',
    payload: { previousStatus: status, reason: reason ?? null },
  })

  revalidatePath(`/admin/quotes/${quoteId}`)
  revalidatePath('/admin/quotes')
  return { ok: true, id: quoteId }
}

// ─── convert to order ─────────────────────────────────────────────────────

export async function convertQuoteToOrderAction(
  quoteId: string,
): Promise<QuoteActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Quote not found' }
  const quote = rows[0]

  if (quote.status !== 'accepted') {
    return {
      ok: false,
      error: `Only accepted quotes can be converted. This quote is "${quote.status}".`,
    }
  }
  if (quote.expiresAt <= new Date()) {
    return {
      ok: false,
      error: 'This quote has expired and can no longer be converted.',
    }
  }
  if (quote.convertedOrderId) {
    return {
      ok: false,
      error: `Already converted to order ${quote.convertedOrderId}.`,
    }
  }

  // Mint the new order ref, retrying on the vanishing-probability collision.
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

  const [newOrder] = await db
    .insert(orders)
    .values({
      ref,
      customerId: quote.customerId,
      companyId: quote.companyId,
      vehicleSupplierId: quote.vehicleSupplierId,
      financeProviderId: quote.financeProviderId,
      sourceQuoteId: quote.id,
      status: 'draft',
      customerType: quote.customerType,
      financeType: quote.financeType,
      vehicle: quote.vehicle,
      options: quote.options,
      delivery: quote.delivery,
      pricing: quote.pricing,
      finance: quote.finance,
      addons: quote.addons,
      partExchange: quote.partExchange,
      // Consent is captured from the customer at sign-time, not inherited.
      consent: null,
      notes: quote.notes,
      totalAmountPence: quote.totalAmountPence,
      monthlyAmountPence: quote.monthlyAmountPence,
      createdBy: user.id,
    })
    .returning({ id: orders.id, ref: orders.ref })

  // Link the quote back to the order and close its status. Guard with the
  // "still accepted + no convertedOrderId yet" WHERE so two concurrent
  // conversion clicks can't create two orders.
  const flipped = await db
    .update(quotes)
    .set({
      status: 'converted',
      convertedAt: new Date(),
      convertedOrderId: newOrder.id,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(quotes.id, quote.id),
        eq(quotes.status, 'accepted'),
        isNull(quotes.convertedOrderId),
      ),
    )
    .returning({ id: quotes.id })

  if (flipped.length === 0) {
    // Lost the race. Roll back the order we just created — otherwise we'd
    // have an orphan order with no matching quote backlink.
    await db.delete(orders).where(eq(orders.id, newOrder.id))
    return {
      ok: false,
      error: 'Quote was converted by another action. Please refresh.',
    }
  }

  await db.insert(auditEvents).values([
    {
      quoteId: quote.id,
      orderId: newOrder.id,
      customerId: quote.customerId,
      actorType: 'rep',
      actorId: user.id,
      eventType: 'quote.converted',
      payload: { newOrderId: newOrder.id, newOrderRef: newOrder.ref },
    },
    {
      orderId: newOrder.id,
      quoteId: quote.id,
      customerId: quote.customerId,
      actorType: 'rep',
      actorId: user.id,
      eventType: 'order.created',
      payload: {
        ref: newOrder.ref,
        convertedFromQuote: { id: quote.id, ref: quote.ref },
      },
    },
  ])

  revalidatePath(`/admin/quotes/${quote.id}`)
  revalidatePath('/admin/quotes')
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/customers/${quote.customerId}`)
  revalidatePath('/admin')
  return {
    ok: true,
    id: quote.id,
    ref: quote.ref,
    orderId: newOrder.id,
    orderRef: newOrder.ref,
  }
}

// ─── expire stale quotes (called by cron) ─────────────────────────────────

export async function expireStaleQuotes(): Promise<{ count: number }> {
  const now = new Date()
  const expiredIds = await db
    .select({ id: quotes.id, customerId: quotes.customerId })
    .from(quotes)
    .where(
      and(
        inArray(quotes.status, ['sent', 'viewed']),
        lte(quotes.expiresAt, now),
      ),
    )

  if (expiredIds.length === 0) return { count: 0 }

  await db
    .update(quotes)
    .set({ status: 'expired', updatedAt: now })
    .where(
      inArray(
        quotes.id,
        expiredIds.map((q) => q.id),
      ),
    )

  await db.insert(auditEvents).values(
    expiredIds.map((q) => ({
      quoteId: q.id,
      customerId: q.customerId,
      actorType: 'system' as const,
      eventType: 'quote.expired' as const,
      payload: null,
    })),
  )

  revalidatePath('/admin/quotes')
  return { count: expiredIds.length }
}
