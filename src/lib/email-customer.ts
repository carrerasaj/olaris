/**
 * Phase 12 — customer lifecycle email service.
 *
 * One entry point (`sendLifecycleEmail`) that every post-sign transition
 * and scheduled job goes through. It handles:
 *
 *   - Transactional vs marketing classification (opt-out only suppresses
 *     marketing/NPS/referral templates — service emails always send).
 *   - Idempotency: before sending, look for a prior email.sent audit row
 *     with the same {template, orderId}. Duplicate attempts become
 *     email.suppressed (reason: already_sent) unless `force: true`.
 *   - Rich audit metadata on every outcome (sent, suppressed, failed).
 *   - Force-resend tracking: when force=true bypasses idempotency, the
 *     audit row records isResend + resendReason + previousSentAt so
 *     intentional resends are cleanly separable from duplicate-prevention
 *     bypasses in later reporting.
 *
 * The templates themselves live in email-templates.ts; this module is the
 * service envelope around them.
 */

import { and, desc, eq, sql } from 'drizzle-orm'
import { db, auditEvents, customers, orders } from '@/db/client'
import { sendEmail, type EmailAttachment } from '@/lib/email'
import type { Order, Customer } from '@/db/schema'

// ─── Template classification ────────────────────────────────────────────

/**
 * All lifecycle templates the service knows about. Every customer-facing
 * template routes through this module so audit events, idempotency, and
 * opt-out policy all use the same contract.
 *
 * Legacy templates (`order.sent`, `order.signed`, `sign.otp`) pre-date
 * Phase 12 but now share the same audit shape via `recordEmailEvent`.
 */
export type LifecycleTemplate =
  | 'order.sent'
  | 'sign.otp'
  | 'order.signed'
  | 'order.confirmed_email'
  | 'order.eta_changed_email'
  | 'order.ready_for_handover_email'
  | 'order.delivered_email'
  | 'nps_request_email'

/**
 * Transactional = service email we're contracted to send. Never
 * suppressed by marketing opt-out. If you add a new template you MUST
 * add it here with the correct classification — no default fall-through,
 * so a missing entry is a TypeScript error at the switch.
 */
export function isTransactional(t: LifecycleTemplate): boolean {
  switch (t) {
    case 'order.sent':
    case 'sign.otp':
    case 'order.signed':
    case 'order.confirmed_email':
    case 'order.eta_changed_email':
    case 'order.ready_for_handover_email':
    case 'order.delivered_email':
      return true
    case 'nps_request_email':
      return false
  }
}

// ─── Shared input envelope ──────────────────────────────────────────────

export interface SendLifecycleEmailInput {
  template: LifecycleTemplate
  orderId: string
  customerId: string
  to: string
  subject: string
  html: string
  text: string
  attachments?: EmailAttachment[]
  /**
   * Admin-triggered resend bypasses the idempotency check. Required when
   * used — the audit row records `isResend: true` + `resendReason` so
   * intentional resends are a cleanly queryable bucket separate from any
   * other bypass.
   */
  force?: { reason: string }
}

export interface SendLifecycleEmailResult {
  ok: boolean
  outcome: 'sent' | 'suppressed' | 'failed'
  reason?: string
  providerMessageId?: string | null
  error?: string
}

// ─── Core send ──────────────────────────────────────────────────────────

export async function sendLifecycleEmail(
  input: SendLifecycleEmailInput,
): Promise<SendLifecycleEmailResult> {
  const transactional = isTransactional(input.template)

  // Marketing opt-out: suppresses non-transactional templates only.
  if (!transactional) {
    const c = await db
      .select({ optOut: customers.marketingOptOut })
      .from(customers)
      .where(eq(customers.id, input.customerId))
      .limit(1)
    if (c[0]?.optOut) {
      await recordSuppressed({
        ...input,
        transactional,
        reason: 'marketing_opt_out',
      })
      return { ok: true, outcome: 'suppressed', reason: 'marketing_opt_out' }
    }
  }

  // Idempotency check: was this exact {template, orderId} already sent?
  const prior = await findPriorSent(input.template, input.orderId)

  if (prior && !input.force) {
    await recordSuppressed({
      ...input,
      transactional,
      reason: 'already_sent',
      previousSentAt: prior.sentAt,
    })
    return { ok: true, outcome: 'suppressed', reason: 'already_sent' }
  }

  const sendResult = await sendEmail({
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments,
  })

  if (sendResult.ok) {
    await recordSent({
      ...input,
      transactional,
      providerMessageId: sendResult.id ?? null,
      isResend: !!prior,
      resendReason: input.force?.reason,
      previousSentAt: prior?.sentAt,
    })
    return {
      ok: true,
      outcome: 'sent',
      providerMessageId: sendResult.id ?? null,
    }
  }

  await recordFailed({
    ...input,
    transactional,
    error: sendResult.error ?? 'unknown',
    isResend: !!prior,
    resendReason: input.force?.reason,
    previousSentAt: prior?.sentAt,
  })
  return { ok: false, outcome: 'failed', error: sendResult.error ?? 'unknown' }
}

// ─── Audit helpers ───────────────────────────────────────────────────────

interface BaseAuditPayload {
  template: LifecycleTemplate
  orderId: string
  customerId: string
  to: string
  subject: string
  transactional: boolean
  sentAt: string
}

async function recordSent(args: {
  template: LifecycleTemplate
  orderId: string
  customerId: string
  to: string
  subject: string
  transactional: boolean
  providerMessageId: string | null
  isResend: boolean
  resendReason?: string
  previousSentAt?: string
}): Promise<void> {
  const payload: BaseAuditPayload & {
    providerMessageId: string | null
    isResend: boolean
    resendReason?: string
    previousSentAt?: string
  } = {
    template: args.template,
    orderId: args.orderId,
    customerId: args.customerId,
    to: args.to,
    subject: args.subject,
    transactional: args.transactional,
    sentAt: new Date().toISOString(),
    providerMessageId: args.providerMessageId,
    isResend: args.isResend,
  }
  if (args.isResend) {
    payload.resendReason = args.resendReason
    payload.previousSentAt = args.previousSentAt
  }

  await db.insert(auditEvents).values({
    orderId: args.orderId,
    customerId: args.customerId,
    actorType: 'system',
    eventType: 'email.sent',
    payload: payload as unknown as Record<string, unknown>,
  })
}

async function recordSuppressed(args: {
  template: LifecycleTemplate
  orderId: string
  customerId: string
  to: string
  subject: string
  transactional: boolean
  reason: 'marketing_opt_out' | 'already_sent'
  previousSentAt?: string
}): Promise<void> {
  await db.insert(auditEvents).values({
    orderId: args.orderId,
    customerId: args.customerId,
    actorType: 'system',
    eventType: 'email.suppressed',
    payload: {
      template: args.template,
      orderId: args.orderId,
      customerId: args.customerId,
      to: args.to,
      subject: args.subject,
      transactional: args.transactional,
      reason: args.reason,
      previousSentAt: args.previousSentAt ?? null,
      at: new Date().toISOString(),
    },
  })
}

async function recordFailed(args: {
  template: LifecycleTemplate
  orderId: string
  customerId: string
  to: string
  subject: string
  transactional: boolean
  error: string
  isResend: boolean
  resendReason?: string
  previousSentAt?: string
}): Promise<void> {
  const payload: Record<string, unknown> = {
    template: args.template,
    orderId: args.orderId,
    customerId: args.customerId,
    to: args.to,
    subject: args.subject,
    transactional: args.transactional,
    error: args.error,
    at: new Date().toISOString(),
    isResend: args.isResend,
  }
  if (args.isResend) {
    payload.resendReason = args.resendReason
    payload.previousSentAt = args.previousSentAt
  }

  await db.insert(auditEvents).values({
    orderId: args.orderId,
    customerId: args.customerId,
    actorType: 'system',
    eventType: 'email.failed',
    payload,
  })
}

/**
 * Finds the most recent `email.sent` audit row for this template+order.
 * Uses JSON path on the payload — stable, indexed by the audit table
 * indexes we already have.
 */
async function findPriorSent(
  template: LifecycleTemplate,
  orderId: string,
): Promise<{ sentAt: string } | null> {
  const rows = await db
    .select({ payload: auditEvents.payload })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.orderId, orderId),
        eq(auditEvents.eventType, 'email.sent'),
        sql`${auditEvents.payload} ->> 'template' = ${template}`,
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(1)
  if (rows.length === 0) return null
  const sentAt = (rows[0].payload as Record<string, unknown> | null)?.[
    'sentAt'
  ] as string | undefined
  return sentAt ? { sentAt } : { sentAt: new Date(0).toISOString() }
}

// ─── Legacy / direct-send audit helper ──────────────────────────────────
//
// Callers that don't want sendLifecycleEmail's idempotency/opt-out behaviour
// (e.g. sendForSignatureAction fires at a state transition — we want the
// email to go out even if one was sent earlier on an unrelated transition)
// should still record their audit row in the same shape as the helper. This
// keeps queries like "payload.template = X" or "payload.isResend = true"
// uniform across the whole app — no more `messageId` vs `providerMessageId`
// vs `customerMessageId`.
//
// The shape is a superset of the lifecycle payload:
//   - Required: template, orderId, customerId, to, subject, transactional,
//     at (ISO), providerMessageId (null if failed or not supplied).
//   - Optional: error, isResend, resendReason, previousSentAt, plus
//     caller-specific `extra` fields that get merged into payload.

export interface RecordEmailEventInput {
  template: LifecycleTemplate
  orderId: string
  customerId: string
  to: string
  subject: string
  outcome: 'sent' | 'failed' | 'suppressed'
  providerMessageId?: string | null
  error?: string | null
  isResend?: boolean
  resendReason?: string
  previousSentAt?: string
  suppressedReason?: 'marketing_opt_out' | 'already_sent'
  /**
   * Caller-specific fields merged into the payload alongside the standard
   * shape — e.g. `{ pdfSha256, downloadUrl }` for order.signed,
   * `{ reminder: true }` for a cron reminder resend. Keys that collide
   * with standard fields are ignored to preserve the contract.
   */
  extra?: Record<string, unknown>
}

const RESERVED_PAYLOAD_KEYS = new Set([
  'template',
  'orderId',
  'customerId',
  'to',
  'subject',
  'transactional',
  'sentAt',
  'at',
  'providerMessageId',
  'error',
  'isResend',
  'resendReason',
  'previousSentAt',
  'reason',
])

export async function recordEmailEvent(input: RecordEmailEventInput): Promise<void> {
  const transactional = isTransactional(input.template)
  const base: Record<string, unknown> = {
    template: input.template,
    orderId: input.orderId,
    customerId: input.customerId,
    to: input.to,
    subject: input.subject,
    transactional,
    sentAt: new Date().toISOString(),
    providerMessageId: input.providerMessageId ?? null,
    isResend: input.isResend ?? false,
  }

  if (input.isResend) {
    base.resendReason = input.resendReason
    base.previousSentAt = input.previousSentAt
  }
  if (input.outcome === 'failed') {
    base.error = input.error ?? 'unknown'
  }
  if (input.outcome === 'suppressed') {
    base.reason = input.suppressedReason ?? 'already_sent'
    base.previousSentAt = input.previousSentAt ?? null
  }

  if (input.extra) {
    for (const [k, v] of Object.entries(input.extra)) {
      if (!RESERVED_PAYLOAD_KEYS.has(k)) base[k] = v
    }
  }

  const eventType =
    input.outcome === 'sent'
      ? 'email.sent'
      : input.outcome === 'suppressed'
        ? 'email.suppressed'
        : 'email.failed'

  await db.insert(auditEvents).values({
    orderId: input.orderId,
    customerId: input.customerId,
    actorType: 'system',
    eventType,
    payload: base,
  })
}

/**
 * Look up the most recent `email.sent` row for a template + order. Used by
 * legacy senders (sendForSignatureAction, resendSigningLinkAction, the
 * reminder cron) so their audit rows can carry `isResend` + `previousSentAt`
 * in the same shape as the Phase 12 helper.
 */
export async function findPriorEmailSent(
  template: LifecycleTemplate,
  orderId: string,
): Promise<{ sentAt: string } | null> {
  return findPriorSent(template, orderId)
}

// ─── Convenience: fetch order + customer for a caller ───────────────────
//
// The transition actions in orders.ts already have the order row loaded.
// This helper is for schedulers (e.g. the NPS reminder cron branch) that
// only have an orderId and need both rows to compose an email.
export async function loadOrderAndCustomer(
  orderId: string,
): Promise<{ order: Order; customer: Customer } | null> {
  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return null
  return { order: rows[0].order, customer: rows[0].customer }
}
