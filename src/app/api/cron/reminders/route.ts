/**
 * GET /api/cron/reminders
 *
 * Daily sweep for reminder_schedule rows that are due and not yet sent.
 * Invoked by Vercel Cron (see vercel.json crons entry); gated by
 * `Authorization: Bearer ${CRON_SECRET}` — Vercel injects that header
 * on scheduled invocations, any other caller gets 401.
 *
 * Behaviour per due row:
 *   - Skip if the underlying order isn't still awaiting signature
 *     (status ∉ {sent, partially_signed}). Stamp cancelled_at so we
 *     don't reconsider it tomorrow.
 *   - Fetch the active customer-role signing token for the order. If
 *     none (e.g. all consumed, all expired), mint a fresh 7-day token
 *     so the reminder links to something usable.
 *   - Send the "Ready for your signature" email via Resend.
 *   - Stamp sent_at; audit `reminder.sent` + the email.* event.
 *   - Any per-row failure is recorded as email.failed; we keep going
 *     rather than aborting the sweep (one bad row shouldn't block
 *     the others).
 *
 * Returns JSON { ok, processed, sent, skipped, failed } for observability.
 */

import { and, eq, isNull, lte, desc } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import {
  db,
  reminderSchedule,
  orders,
  customers,
  signingTokens,
  auditEvents,
} from '@/db/client'
import { sendEmail } from '@/lib/email'
import { orderSentEmail } from '@/lib/email-templates'
import { fmtGBPFromPence } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const tokenAlphabet = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  32,
)

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://olaris.co.uk'
  )
}

export async function GET(req: Request) {
  // Vercel Cron passes `Authorization: Bearer <CRON_SECRET>`.
  // Reject anything else outright.
  const auth = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new Response('unauthorized', { status: 401 })
  }

  const now = new Date()

  // Pull everything due in one query. Order matters only for deterministic
  // dev-test output; prod volume is low enough that we don't paginate.
  const due = await db
    .select({
      rid: reminderSchedule.id,
      kind: reminderSchedule.kind,
      scheduledFor: reminderSchedule.scheduledFor,
      orderId: reminderSchedule.orderId,
    })
    .from(reminderSchedule)
    .where(
      and(
        isNull(reminderSchedule.sentAt),
        isNull(reminderSchedule.cancelledAt),
        lte(reminderSchedule.scheduledFor, now),
      ),
    )

  let processed = 0
  let sent = 0
  let skipped = 0
  let failed = 0
  const details: Array<{ reminderId: string; outcome: string; error?: string }> = []

  for (const r of due) {
    processed++

    // Re-fetch each order + customer fresh. Status can change between
    // the sweep query and the send, and we want the most current data.
    const rows = await db
      .select({ order: orders, customer: customers })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, r.orderId))
      .limit(1)

    if (rows.length === 0) {
      await db
        .update(reminderSchedule)
        .set({ cancelledAt: now })
        .where(eq(reminderSchedule.id, r.rid))
      skipped++
      details.push({ reminderId: r.rid, outcome: 'order_missing' })
      continue
    }

    const { order, customer } = rows[0]
    if (order.status !== 'sent' && order.status !== 'partially_signed') {
      // Already signed / delivered / cancelled — suppress the reminder.
      // Stamp cancelled_at so tomorrow's sweep doesn't reconsider it.
      await db
        .update(reminderSchedule)
        .set({ cancelledAt: now })
        .where(eq(reminderSchedule.id, r.rid))
      skipped++
      details.push({ reminderId: r.rid, outcome: `status:${order.status}` })
      continue
    }

    // Find an active customer-role token. If we don't have one, mint one —
    // the original may have been consumed (resent manually) or expired.
    const tokenRows = await db
      .select()
      .from(signingTokens)
      .where(
        and(
          eq(signingTokens.orderId, order.id),
          eq(signingTokens.signerRole, 'customer'),
        ),
      )
      .orderBy(desc(signingTokens.createdAt))
      .limit(1)

    let token = tokenRows[0]
    const needsFreshToken =
      !token ||
      !!token.consumedAt ||
      token.expiresAt.getTime() < now.getTime() + 24 * 60 * 60 * 1000 // <24h left
    if (needsFreshToken) {
      const [inserted] = await db
        .insert(signingTokens)
        .values({
          orderId: order.id,
          token: tokenAlphabet(),
          signerRole: 'customer',
          expiresAt: new Date(now.getTime() + SEVEN_DAYS_MS),
        })
        .returning()
      token = inserted
    }

    // Send
    const signingUrl = `${siteUrl()}/sign/${token.token}`
    const email = orderSentEmail({
      customerFirstName: customer.firstName,
      orderRef: order.ref,
      vehicleMake: order.vehicle.make,
      vehicleModel: order.vehicle.model,
      totalGBP: fmtGBPFromPence(order.totalAmountPence),
      signingUrl,
      expiresAt: token.expiresAt,
    })
    const sendResult = await sendEmail({
      to: customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    if (sendResult.ok) {
      await db
        .update(reminderSchedule)
        .set({ sentAt: now })
        .where(eq(reminderSchedule.id, r.rid))
      await db.insert(auditEvents).values([
        {
          orderId: order.id,
          customerId: order.customerId,
          actorType: 'system',
          eventType: 'reminder.sent',
          payload: { kind: r.kind, to: customer.email, scheduledFor: r.scheduledFor.toISOString() },
        },
        {
          orderId: order.id,
          customerId: order.customerId,
          actorType: 'system',
          eventType: 'email.sent',
          payload: {
            template: 'order.sent',
            reminder: true,
            to: customer.email,
            messageId: sendResult.id,
          },
        },
      ])
      sent++
      details.push({ reminderId: r.rid, outcome: 'sent' })
    } else {
      // Record failure, leave the reminder un-sent so tomorrow's sweep
      // retries. If Resend is down today, we'll catch up tomorrow. If
      // the address is permanently bad, the email will keep failing —
      // we accept that in v1 (no dead-letter queue yet).
      await db.insert(auditEvents).values({
        orderId: order.id,
        customerId: order.customerId,
        actorType: 'system',
        eventType: 'email.failed',
        payload: {
          template: 'order.sent',
          reminder: true,
          to: customer.email,
          error: sendResult.error,
        },
      })
      failed++
      details.push({
        reminderId: r.rid,
        outcome: 'send_failed',
        error: sendResult.error,
      })
    }
  }

  return Response.json({
    ok: true,
    ranAt: now.toISOString(),
    processed,
    sent,
    skipped,
    failed,
    details,
  })
}
