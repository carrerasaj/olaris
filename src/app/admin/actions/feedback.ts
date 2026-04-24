'use server'

/**
 * Feedback / NPS server actions.
 *
 * - `mintFeedbackTokenForOrder` — called by the NPS cron branch when it's
 *   time to email the customer. Creates (or returns the existing unexpired)
 *   feedback token for this order. Idempotent.
 *
 * - `recordFeedbackSubmissionByToken` — public endpoint at submission time.
 *   Validates the token, stores the feedback row, consumes the token,
 *   auto-creates a detractor follow-up task if score ≤ 6.
 *
 * - `resendNpsRequestAction` — admin-triggered "send feedback request now"
 *   button on the order page. Bypasses the cron's two-day wait.
 */

import { revalidatePath } from 'next/cache'
import { and, eq, isNull, gt } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import {
  db,
  orders,
  customers,
  feedback,
  feedbackTokens,
  activities,
  auditEvents,
} from '@/db/client'
import type { FeedbackCategory } from '@/db/schema'
import { captureForensics } from '@/lib/forensics'
import { requireAdmin } from '@/lib/admin-auth'
import { sendLifecycleEmail } from '@/lib/email-customer'
import { npsRequestEmail } from '@/lib/email-templates'

const tokenAlphabet = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  32,
)

const FEEDBACK_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function mintFeedbackTokenForOrder(orderId: string): Promise<{
  ok: boolean
  token?: string
  error?: string
}> {
  const rows = await db
    .select({ id: orders.id, customerId: orders.customerId, status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Order not found' }
  const order = rows[0]
  if (order.status !== 'delivered') {
    return {
      ok: false,
      error: `Feedback tokens are only minted for delivered orders (status: ${order.status}).`,
    }
  }

  const now = new Date()

  // Reuse an existing unexpired + unconsumed token if one exists — same
  // pattern as quote tokens.
  const existing = await db
    .select()
    .from(feedbackTokens)
    .where(
      and(
        eq(feedbackTokens.orderId, orderId),
        isNull(feedbackTokens.consumedAt),
        gt(feedbackTokens.expiresAt, now),
      ),
    )
    .limit(1)
  if (existing.length > 0) {
    return { ok: true, token: existing[0].token }
  }

  const token = tokenAlphabet()
  await db.insert(feedbackTokens).values({
    orderId,
    customerId: order.customerId,
    token,
    expiresAt: new Date(now.getTime() + FEEDBACK_TOKEN_TTL_MS),
  })
  await db.insert(auditEvents).values({
    orderId,
    customerId: order.customerId,
    actorType: 'system',
    eventType: 'feedback.requested',
    payload: { tokenTruncated: token.slice(0, 6) + '…' },
  })
  return { ok: true, token }
}

function categoryFromScore(score: number): FeedbackCategory {
  if (score >= 9) return 'promoter'
  if (score >= 7) return 'passive'
  return 'detractor'
}

export interface SubmitFeedbackInput {
  score: number
  comment?: string | null
}

export async function recordFeedbackSubmissionByToken(
  token: string,
  input: SubmitFeedbackInput,
): Promise<{
  ok: boolean
  error?: string
  alreadySubmitted?: boolean
}> {
  if (
    typeof input.score !== 'number' ||
    !Number.isInteger(input.score) ||
    input.score < 0 ||
    input.score > 10
  ) {
    return { ok: false, error: 'Score must be an integer from 0 to 10.' }
  }

  const tokenRows = await db
    .select()
    .from(feedbackTokens)
    .where(eq(feedbackTokens.token, token))
    .limit(1)
  if (tokenRows.length === 0) {
    return { ok: false, error: 'Invalid or expired link.' }
  }
  const tokenRow = tokenRows[0]

  if (tokenRow.consumedAt) {
    return {
      ok: false,
      error: 'Feedback already submitted for this order.',
      alreadySubmitted: true,
    }
  }
  if (tokenRow.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: 'This feedback link has expired.' }
  }

  const now = new Date()
  const category = categoryFromScore(input.score)
  const comment = (input.comment ?? '').trim().slice(0, 2000) || null
  const forensics = await captureForensics()

  // Insert feedback row
  const [fb] = await db
    .insert(feedback)
    .values({
      orderId: tokenRow.orderId,
      customerId: tokenRow.customerId,
      score: input.score,
      category,
      comment,
      tokenId: tokenRow.id,
      ip: forensics.ip,
      userAgent: forensics.userAgent,
      geoCity: forensics.geoCity,
      geoCountry: forensics.geoCountry,
    })
    .returning({ id: feedback.id })

  // Consume the token so the same URL can't submit twice.
  await db
    .update(feedbackTokens)
    .set({ consumedAt: now })
    .where(eq(feedbackTokens.id, tokenRow.id))

  await db.insert(auditEvents).values({
    orderId: tokenRow.orderId,
    customerId: tokenRow.customerId,
    actorType: 'customer',
    eventType: 'feedback.submitted',
    payload: {
      feedbackId: fb.id,
      score: input.score,
      category,
      hasComment: !!comment,
    },
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
  })

  // Detractor flag: auto-create a follow-up task + audit event.
  if (category === 'detractor') {
    const orderRefRow = await db
      .select({ ref: orders.ref })
      .from(orders)
      .where(eq(orders.id, tokenRow.orderId))
      .limit(1)
    const orderRef = orderRefRow[0]?.ref ?? tokenRow.orderId

    const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // +3 days
    await db.insert(activities).values({
      customerId: tokenRow.customerId,
      orderId: tokenRow.orderId,
      kind: 'task',
      title: `Follow up: NPS ${input.score} from ${orderRef}`,
      body: comment ?? 'No comment left.',
      dueDate: due,
    })

    await db.insert(auditEvents).values({
      orderId: tokenRow.orderId,
      customerId: tokenRow.customerId,
      actorType: 'system',
      eventType: 'feedback.detractor_flagged',
      payload: {
        feedbackId: fb.id,
        score: input.score,
        commentPreview: comment ? comment.slice(0, 160) : null,
      },
    })
  }

  // Notify caller outside — the customer page revalidates via the
  // submit route handler.
  void customers
  return { ok: true }
}

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://olaris.co.uk'
  )
}

/**
 * Admin button on the order detail: "Send feedback request now".
 *
 * Bypasses the day-2 cron timing. Still respects the customer's
 * marketing opt-out (NPS is non-transactional). If the customer has
 * already submitted feedback, returns an error rather than minting
 * a fresh token — one feedback per order in v1.
 */
export async function resendNpsRequestAction(orderId: string): Promise<{
  ok: boolean
  error?: string
  outcome?: 'sent' | 'suppressed' | 'failed'
  reason?: string
}> {
  await requireAdmin()

  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Order not found' }
  const { order, customer } = rows[0]
  if (order.status !== 'delivered') {
    return {
      ok: false,
      error: `Order must be delivered (status: ${order.status}).`,
    }
  }

  // Don't re-ask once they've submitted.
  const existing = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(eq(feedback.orderId, orderId))
    .limit(1)
  if (existing.length > 0) {
    return { ok: false, error: 'Customer has already submitted feedback.' }
  }

  const mint = await mintFeedbackTokenForOrder(orderId)
  if (!mint.ok || !mint.token) {
    return { ok: false, error: mint.error ?? 'Could not mint feedback token' }
  }

  const feedbackUrl = `${siteUrl()}/feedback/${mint.token}`
  const email = npsRequestEmail({
    customerFirstName: customer.firstName,
    orderRef: order.ref,
    vehicleMake: order.vehicle.make,
    vehicleModel: order.vehicle.model,
    feedbackUrl,
  })

  // Force-resend so the audit row records `isResend: true` if the cron
  // has already sent today.
  const result = await sendLifecycleEmail({
    template: 'nps_request_email',
    orderId,
    customerId: order.customerId,
    to: customer.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    force: { reason: 'Admin manual resend from order page' },
  })

  revalidatePath(`/admin/orders/${orderId}`)
  return {
    ok: result.ok,
    outcome: result.outcome,
    reason: result.reason,
    error: result.error,
  }
}
