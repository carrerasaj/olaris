/**
 * F-03 leads service.
 *
 * One entry point for the whole lead lifecycle:
 *
 *   captureLead       — idempotent upsert on (email, source). Returns
 *                       the lead row plus whether it was new. Caller
 *                       enrols into drip sequences and/or sends gated
 *                       resources as separate steps.
 *   enrolLead         — schedules the next-step row in drip_enrolments
 *                       for a sequence. Idempotent per (lead, sequence,
 *                       step) via the unique index in the schema.
 *   unsubscribeByToken — marks a lead as unsubscribed, cancels all
 *                       pending drip rows, audits the event.
 *   recordLeadEvent   — appends to lead_events with the standard
 *                       payload shape.
 *
 * This module is server-only — it touches the DB directly. Call it
 * from server actions or API routes, never from a client component.
 */

import { and, eq, isNull } from 'drizzle-orm'
import {
  db,
  leads,
  leadEvents,
  dripEnrolments,
  type Lead,
  type LeadEventType,
  type LeadSource,
} from '@/db/client'
import { getSequence } from '@/lib/drip-sequences'

// ─── Capture ────────────────────────────────────────────────────────────

export interface CaptureLeadInput {
  email: string
  source: LeadSource
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  sourceContext?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
  geoCity?: string | null
  geoCountry?: string | null
}

export interface CaptureLeadResult {
  lead: Lead
  created: boolean
}

/**
 * Upsert a lead by (email, source). The unique index on that pair means
 * a repeat capture from the same surface returns the existing row; a
 * capture from a *different* surface creates a new row — telling us the
 * same person has engaged with us twice.
 *
 * Returns `created: true` on first insert so callers can conditionally
 * enrol into drips or send a "welcome back" email instead of the
 * first-time asset.
 */
export async function captureLead(
  input: CaptureLeadInput,
): Promise<CaptureLeadResult> {
  const normalised = input.email.trim().toLowerCase()

  const existing = await db
    .select()
    .from(leads)
    .where(and(eq(leads.email, normalised), eq(leads.source, input.source)))
    .limit(1)

  if (existing.length > 0) {
    // Only update fields that the new capture fills in; don't clobber
    // known-good data with nulls from a lighter capture surface.
    const current = existing[0]
    const updates: Partial<typeof leads.$inferInsert> = {}
    if (input.firstName && !current.firstName) updates.firstName = input.firstName
    if (input.lastName && !current.lastName) updates.lastName = input.lastName
    if (input.company && !current.company) updates.company = input.company
    if (input.sourceContext) {
      // Merge new context into existing so repeated captures build up
      // a fuller attribution blob instead of overwriting each other.
      updates.sourceContext = {
        ...(current.sourceContext ?? {}),
        ...input.sourceContext,
      }
    }
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date()
      await db
        .update(leads)
        .set(updates)
        .where(eq(leads.id, current.id))
    }
    return { lead: { ...current, ...updates }, created: false }
  }

  const [inserted] = await db
    .insert(leads)
    .values({
      email: normalised,
      source: input.source,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      company: input.company ?? null,
      sourceContext: input.sourceContext,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      geoCity: input.geoCity ?? null,
      geoCountry: input.geoCountry ?? null,
    })
    .returning()

  await recordLeadEvent({
    leadId: inserted.id,
    eventType: 'lead.created',
    payload: { source: input.source, sourceContext: input.sourceContext ?? null },
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  })

  return { lead: inserted, created: true }
}

// ─── Drip enrolment ─────────────────────────────────────────────────────

/**
 * Enrol a lead in a drip sequence. Schedules the first step's row;
 * subsequent steps are scheduled by the cron when each step fires.
 *
 * Idempotent: if the lead is already enrolled in this sequence (any
 * step exists), this is a no-op. Returns `{ ok, enrolled }` where
 * `enrolled === false` means they were already in it.
 *
 * Respects opt-out: leads with `marketingOptOut = true` or
 * `unsubscribedAt` set are not enrolled. Caller should check the
 * return value if it needs to know.
 */
export async function enrolLead(
  leadId: string,
  sequenceId: string,
): Promise<{ ok: boolean; enrolled: boolean; error?: string }> {
  const sequence = getSequence(sequenceId)
  if (!sequence) return { ok: false, enrolled: false, error: 'unknown_sequence' }

  const leadRows = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1)
  if (leadRows.length === 0) {
    return { ok: false, enrolled: false, error: 'lead_not_found' }
  }
  const lead = leadRows[0]

  if (lead.marketingOptOut || lead.unsubscribedAt) {
    await recordLeadEvent({
      leadId,
      eventType: 'drip.suppressed',
      payload: {
        sequenceId,
        step: 0,
        reason: lead.unsubscribedAt ? 'unsubscribed' : 'marketing_opt_out',
        stage: 'enrolment',
      },
    })
    return { ok: true, enrolled: false }
  }

  // Already enrolled? (Any existing row — sent or pending — counts.)
  const existing = await db
    .select({ id: dripEnrolments.id })
    .from(dripEnrolments)
    .where(
      and(
        eq(dripEnrolments.leadId, leadId),
        eq(dripEnrolments.sequenceId, sequenceId),
      ),
    )
    .limit(1)
  if (existing.length > 0) return { ok: true, enrolled: false }

  const firstStep = sequence.steps[0]
  if (!firstStep) return { ok: false, enrolled: false, error: 'empty_sequence' }

  const scheduledFor = new Date(
    Date.now() + firstStep.delayDays * 24 * 60 * 60 * 1000,
  )
  await db.insert(dripEnrolments).values({
    leadId,
    sequenceId,
    step: 0,
    scheduledFor,
  })

  await recordLeadEvent({
    leadId,
    eventType: 'drip.enrolled',
    payload: { sequenceId, totalSteps: sequence.steps.length },
  })

  return { ok: true, enrolled: true }
}

/**
 * Schedule the next step of a sequence after one has successfully sent.
 * Called by the drips cron; returns `true` if a new row was inserted,
 * `false` if the sequence is complete.
 */
export async function scheduleNextDripStep(
  leadId: string,
  sequenceId: string,
  currentStep: number,
  relativeTo: Date,
): Promise<boolean> {
  const sequence = getSequence(sequenceId)
  if (!sequence) return false
  const next = sequence.steps[currentStep + 1]
  if (!next) return false

  // delayDays on a step is relative to enrolment, not to the previous
  // step. To get the absolute time for step N, we'd need the enrolment
  // time. Simpler: derive the next fire time from the PREVIOUS step's
  // scheduled time, advancing by the delta between delayDays values.
  const prev = sequence.steps[currentStep]
  const deltaDays = next.delayDays - prev.delayDays
  const scheduledFor = new Date(
    relativeTo.getTime() + deltaDays * 24 * 60 * 60 * 1000,
  )

  try {
    await db.insert(dripEnrolments).values({
      leadId,
      sequenceId,
      step: currentStep + 1,
      scheduledFor,
    })
  } catch (e) {
    // Unique-constraint violation on (leadId, sequenceId, step) means
    // this step was already scheduled. Safe to swallow — indicates a
    // retry of the previous step's cron handler.
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[drip] next-step insert failed (likely duplicate):', msg)
    return false
  }
  return true
}

// ─── Unsubscribe ────────────────────────────────────────────────────────

export async function unsubscribeByToken(
  token: string,
  ip?: string | null,
  userAgent?: string | null,
): Promise<{ ok: boolean; leadId?: string; error?: string }> {
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.unsubscribeToken, token))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'token_not_found' }
  const lead = rows[0]

  if (lead.unsubscribedAt) {
    // Already unsubscribed — idempotent success, no audit duplicate.
    return { ok: true, leadId: lead.id }
  }

  const now = new Date()
  await db
    .update(leads)
    .set({
      unsubscribedAt: now,
      marketingOptOut: true,
      updatedAt: now,
    })
    .where(eq(leads.id, lead.id))

  // Cancel every pending drip row for this lead across all sequences.
  await db
    .update(dripEnrolments)
    .set({ cancelledAt: now })
    .where(
      and(
        eq(dripEnrolments.leadId, lead.id),
        isNull(dripEnrolments.sentAt),
        isNull(dripEnrolments.cancelledAt),
      ),
    )

  await recordLeadEvent({
    leadId: lead.id,
    eventType: 'lead.unsubscribed',
    payload: { via: 'unsubscribe_link' },
    ip: ip ?? null,
    userAgent: userAgent ?? null,
  })

  return { ok: true, leadId: lead.id }
}

// ─── Event audit ────────────────────────────────────────────────────────

export interface RecordLeadEventInput {
  leadId: string
  eventType: LeadEventType
  payload?: Record<string, unknown> | null
  ip?: string | null
  userAgent?: string | null
}

export async function recordLeadEvent(input: RecordLeadEventInput): Promise<void> {
  await db.insert(leadEvents).values({
    leadId: input.leadId,
    eventType: input.eventType,
    payload: input.payload ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  })
}

// ─── Unsubscribe URL builder ────────────────────────────────────────────
//
// Single source of truth so drip-sequences.ts, gated-resources.ts, and
// admin UI all build the same link shape.
export function buildUnsubscribeUrl(siteUrl: string, token: string): string {
  return `${siteUrl.replace(/\/$/, '')}/unsubscribe/${encodeURIComponent(token)}`
}
