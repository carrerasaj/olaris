/**
 * Delivery lifecycle helpers for orders.
 *
 * This module is the single source of truth for:
 *   - Post-sign state-machine validation
 *   - Logistics field-change detection
 *   - Audit payload shape
 *
 * The server actions in `src/app/admin/actions/orders.ts` are thin wrappers
 * that call these helpers, run the DB writes, and invalidate caches. Keeping
 * the logic here means that when delivery eventually graduates into its own
 * `deliveries` entity (v2), only the storage layer moves — the transition
 * rules, validation, and audit shape come along unchanged.
 *
 * Why pure functions rather than methods on an Order class? Drizzle rows are
 * plain objects; wrapping them buys us nothing and makes testing harder.
 */

import type { Order } from '@/db/schema'

// ─── State machine ──────────────────────────────────────────────────────

export const POST_SIGN_STATES = [
  'signed',
  'confirmed',
  'on_order',
  'ready_for_handover',
  'delivered',
  'cancelled_post_sign',
] as const

export type PostSignStatus = (typeof POST_SIGN_STATES)[number]

// Forward-only transitions. Admin override bypasses this — see
// `validateOverride` below.
const FORWARD_TRANSITIONS: Record<PostSignStatus, PostSignStatus[]> = {
  signed: ['confirmed', 'cancelled_post_sign'],
  confirmed: ['on_order', 'cancelled_post_sign'],
  on_order: ['ready_for_handover', 'cancelled_post_sign'],
  ready_for_handover: ['delivered', 'cancelled_post_sign'],
  delivered: [],
  cancelled_post_sign: [],
}

export function isPostSignStatus(status: string): status is PostSignStatus {
  return (POST_SIGN_STATES as readonly string[]).includes(status)
}

export function isForwardTransitionAllowed(
  from: string,
  to: PostSignStatus,
): boolean {
  if (!isPostSignStatus(from)) return false
  return FORWARD_TRANSITIONS[from].includes(to)
}

// Override jumps any number of stages but only lands on a post-sign state.
// Used for backfills / recoveries; requires a mandatory reason upstream.
export function isOverrideTargetAllowed(target: string): target is PostSignStatus {
  if (!isPostSignStatus(target)) return false
  // Can't override to `signed` — that state is only reached via the signing
  // flow and re-labelling it from admin would corrupt the signature record.
  return target !== 'signed'
}

// ─── Audit payload shape ─────────────────────────────────────────────────

export interface DeliveryAuditPayload {
  actorId: string
  actorType: 'rep'
  previousStatus: string
  newStatus: string
  changedFields: Record<string, { from: unknown; to: unknown }>
  note?: string
  reason?: string
  timestamp: string // ISO
}

export function buildAuditPayload(args: {
  actorId: string
  previousStatus: string
  newStatus: string
  changedFields?: Record<string, { from: unknown; to: unknown }>
  note?: string
  reason?: string
  now?: Date
}): DeliveryAuditPayload {
  return {
    actorId: args.actorId,
    actorType: 'rep',
    previousStatus: args.previousStatus,
    newStatus: args.newStatus,
    changedFields: args.changedFields ?? {},
    note: args.note,
    reason: args.reason,
    timestamp: (args.now ?? new Date()).toISOString(),
  }
}

// ─── Logistics field diffing ─────────────────────────────────────────────

// The subset of order columns we treat as "logistics" — edits to any of
// these during a live post-sign stage write audit rows so the timeline
// shows when VIN/PO/reg/etc were captured.
export const LOGISTICS_FIELDS = [
  'supplierPoNumber',
  'supplierOrderRef',
  'chassisNumber',
  'registrationPlate',
  'estimatedDeliveryDate',
  'actualDeliveryDate',
  'handoverLocation',
  'handoverNotes',
] as const

export type LogisticsField = (typeof LOGISTICS_FIELDS)[number]

export type LogisticsPatch = Partial<Pick<Order, LogisticsField>>

/**
 * Returns only the entries where `patch[field]` differs from `current[field]`.
 * Treats null/undefined/empty-string as equivalent absence so toggling an
 * empty input doesn't register as a change.
 */
export function diffLogistics(
  current: Pick<Order, LogisticsField>,
  patch: LogisticsPatch,
): Record<LogisticsField, { from: unknown; to: unknown }> {
  const result: Partial<Record<LogisticsField, { from: unknown; to: unknown }>> =
    {}
  for (const field of LOGISTICS_FIELDS) {
    if (!(field in patch)) continue
    const before = normalise(current[field])
    const after = normalise(patch[field])
    if (before !== after) {
      result[field] = { from: current[field] ?? null, to: patch[field] ?? null }
    }
  }
  return result as Record<LogisticsField, { from: unknown; to: unknown }>
}

function normalise(v: unknown): unknown {
  if (v === null || v === undefined) return null
  if (typeof v === 'string' && v.trim() === '') return null
  return v
}

// ─── Per-field audit event types ────────────────────────────────────────

// When logistics fields change on a transition, we fire per-field audit
// events for the headline fields (so "VIN captured" is findable) and a
// general `order.logistics_updated` for the rest.

export const FIELD_EVENT_TYPE: Partial<
  Record<LogisticsField, 'order.chassis_recorded' | 'order.reg_recorded' | 'order.eta_updated'>
> = {
  chassisNumber: 'order.chassis_recorded',
  registrationPlate: 'order.reg_recorded',
  estimatedDeliveryDate: 'order.eta_updated',
}
