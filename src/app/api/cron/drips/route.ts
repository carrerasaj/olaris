/**
 * GET /api/cron/drips
 *
 * Daily sweep for drip_enrolments rows that are due + unsent +
 * uncancelled. For each row:
 *
 *   1. Re-check the lead is still subscribable. If unsubscribed or
 *      marketingOptOut, stamp cancelledAt and move on (audit event
 *      recorded too).
 *   2. Render the step's subject/html/text via the drip-sequences
 *      registry.
 *   3. Send via Resend.
 *   4. Stamp sentAt. On success, schedule the NEXT step's row (via
 *      scheduleNextDripStep). On failure, stamp sentAt anyway — v1
 *      doesn't retry; a failed step breaks the chain.
 *   5. Audit drip.sent or drip.failed in lead_events.
 *
 * Invoked by Vercel Cron. Gated by Authorization: Bearer ${CRON_SECRET}
 * header that Vercel injects. Any other caller → 401.
 *
 * Returns a JSON body { ok, ranAt, processed, sent, skipped, failed, details }
 * matching the shape used by /api/cron/reminders.
 */

import { and, eq, isNull, lte } from 'drizzle-orm'
import { db, leads, dripEnrolments } from '@/db/client'
import { sendEmail } from '@/lib/email'
import { getSequence, type DripStepContext } from '@/lib/drip-sequences'
import { recordLeadEvent, scheduleNextDripStep, buildUnsubscribeUrl } from '@/lib/leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://olaris.co.uk'
  )
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new Response('unauthorized', { status: 401 })
  }

  const now = new Date()

  const due = await db
    .select({
      rid: dripEnrolments.id,
      leadId: dripEnrolments.leadId,
      sequenceId: dripEnrolments.sequenceId,
      step: dripEnrolments.step,
      scheduledFor: dripEnrolments.scheduledFor,
    })
    .from(dripEnrolments)
    .where(
      and(
        isNull(dripEnrolments.sentAt),
        isNull(dripEnrolments.cancelledAt),
        lte(dripEnrolments.scheduledFor, now),
      ),
    )

  let processed = 0
  let sent = 0
  let skipped = 0
  let failed = 0
  const details: Array<{
    rid: string
    outcome: string
    error?: string
  }> = []

  for (const row of due) {
    processed++

    const sequence = getSequence(row.sequenceId)
    if (!sequence) {
      // Sequence removed from code — cancel stale rows.
      await db
        .update(dripEnrolments)
        .set({ cancelledAt: now })
        .where(eq(dripEnrolments.id, row.rid))
      skipped++
      details.push({ rid: row.rid, outcome: `unknown_sequence:${row.sequenceId}` })
      continue
    }

    const step = sequence.steps[row.step]
    if (!step) {
      await db
        .update(dripEnrolments)
        .set({ cancelledAt: now })
        .where(eq(dripEnrolments.id, row.rid))
      skipped++
      details.push({ rid: row.rid, outcome: `step_removed:${row.sequenceId}:${row.step}` })
      continue
    }

    const leadRows = await db
      .select()
      .from(leads)
      .where(eq(leads.id, row.leadId))
      .limit(1)
    if (leadRows.length === 0) {
      await db
        .update(dripEnrolments)
        .set({ cancelledAt: now })
        .where(eq(dripEnrolments.id, row.rid))
      skipped++
      details.push({ rid: row.rid, outcome: 'lead_missing' })
      continue
    }
    const lead = leadRows[0]

    if (lead.marketingOptOut || lead.unsubscribedAt) {
      await db
        .update(dripEnrolments)
        .set({ cancelledAt: now })
        .where(eq(dripEnrolments.id, row.rid))
      await recordLeadEvent({
        leadId: lead.id,
        eventType: 'drip.suppressed',
        payload: {
          sequenceId: row.sequenceId,
          step: row.step,
          stepKey: step.key,
          reason: lead.unsubscribedAt ? 'unsubscribed' : 'marketing_opt_out',
        },
      })
      skipped++
      details.push({
        rid: row.rid,
        outcome: `suppressed:${lead.unsubscribedAt ? 'unsubscribed' : 'opt_out'}`,
      })
      continue
    }

    const ctx: DripStepContext = {
      lead,
      siteUrl: siteUrl(),
      unsubscribeUrl: buildUnsubscribeUrl(siteUrl(), lead.unsubscribeToken),
    }

    const result = await sendEmail({
      to: lead.email,
      subject: step.subject,
      html: step.html(ctx),
      text: step.text(ctx),
    })

    if (result.ok) {
      await db
        .update(dripEnrolments)
        .set({ sentAt: now })
        .where(eq(dripEnrolments.id, row.rid))
      await recordLeadEvent({
        leadId: lead.id,
        eventType: 'drip.sent',
        payload: {
          sequenceId: row.sequenceId,
          step: row.step,
          stepKey: step.key,
          providerMessageId: result.id ?? null,
        },
      })
      // Queue the next step. scheduleNextDripStep uses the insert
      // unique-constraint to stay idempotent on retries.
      await scheduleNextDripStep(lead.id, row.sequenceId, row.step, now)
      sent++
      details.push({ rid: row.rid, outcome: 'sent' })
    } else {
      // v1 doesn't retry — stamp sentAt so this row doesn't re-fire
      // tomorrow. The chain breaks here; if we want retry semantics
      // later, we'll add an attempts column + a ceiling.
      await db
        .update(dripEnrolments)
        .set({ sentAt: now })
        .where(eq(dripEnrolments.id, row.rid))
      await recordLeadEvent({
        leadId: lead.id,
        eventType: 'drip.failed',
        payload: {
          sequenceId: row.sequenceId,
          step: row.step,
          stepKey: step.key,
          error: result.error ?? 'unknown',
        },
      })
      failed++
      details.push({ rid: row.rid, outcome: 'send_failed', error: result.error })
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
