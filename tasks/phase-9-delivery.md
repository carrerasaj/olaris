# Phase 9 — Delivery lifecycle

## Problem

Today's order state machine collapses the entire post-signing phase into one button: `signed → delivered`. In reality a signed deal goes through several distinct operational stages — supplier confirmation, build, handover paperwork, physical delivery, post-delivery follow-up — each with different information, different stakeholders, different dates, and different risks if something goes wrong. Losing that visibility means we can't answer "where is Tony's van?" without pinging the supplier every time.

## Goal (v1 scope)

Replace the single `delivered` terminus with a small, readable state machine that covers the real journey, captures the key dates and identifiers (chassis/VIN, reg plate, PO number, ETA), and writes the same audit events we already use for pre-signing transitions. Each stage is a button in the admin UI; there's no customer-facing portal in v1.

## Out of scope (deferred)

- Customer-facing delivery-status page (v1: updates relayed by email/phone)
- SMS updates
- Supplier-facing view / portal (supplier still replies by email)
- Integration with V5C/DVLA, Experian, or insurance provider APIs
- Automated handover-pack PDF generation (v1: we capture the dates, the pack is prepared outside the system)
- NPS / feedback capture (deferred to Phase 10)
- Anniversary / referral triggers (Phase 10)

## State machine

Extend `order_status` enum with four new states between `signed` and `delivered`:

```
signed → confirmed → on_order → ready_for_handover → delivered
          ↑ also: cancelled_post_sign (terminal, separate from pre-sign cancelled)
```

- **signed** *(existing)*: both parties signed, nothing else moved.
- **confirmed**: supplier-confirmed / PO accepted / ETA known. This is a supplier-side gate — finance approval is tracked separately (on the quote / finance provider) and is **not** part of this state definition.
- **on_order**: vehicle is in build / transit / awaiting stock. ETA visible.
- **ready_for_handover**: vehicle has arrived at the delivery point; logistics booked, handover pack ready.
- **delivered** *(existing)*: keys handed to the customer, paperwork complete.

Normal transitions are strictly forward, one step at a time. If a deal collapses after signing we enter `cancelled_post_sign`, distinct from pre-sign `cancelled` because the commercial consequences differ (commission clawback, customer refund handling).

**Admin override path (exceptional).** For backfilling historical orders or recovering from a missed stage, we expose a single `overrideStatusAction(orderId, { targetStatus, reason })` that can jump any number of stages forward, bypassing the per-step actions. Constraints:

- `reason` is **mandatory** (non-empty string, min 5 chars).
- Target must still be a valid post-sign state — you can't override back to `draft`/`sent`/`signed` (those are pre-sign and protected separately).
- Override writes a single `order.status_override` audit event with full payload (previous status, target status, reason, actor) plus stamps all skipped `*_at` timestamps to `NOW()` so the timeline isn't hollow.
- UI for this lives behind a collapsible "Admin override" disclosure on the delivery card — not a prominent button, to discourage use as a shortcut.

Backfill: all existing `delivered` orders stay `delivered`. Existing `signed` orders stay `signed` — the admin moves them forward when there's something to report.

## Data model

No new tables. Every stage adds a nullable `*_at` timestamp + the operational fields captured at that stage, plus audit rows. Keeping it in `orders` means list views stay fast and no joins are required for "what's the state of each live deal?"

**Architected for future extraction.** All delivery-specific server-side logic lives in a single file (`src/lib/order-delivery.ts`) that takes an order row and returns validated inputs / audit payloads / updated fields. The actions in `src/app/admin/actions/orders.ts` become thin wrappers around those helpers. When/if we promote delivery to its own `deliveries` entity in v2, the helpers move as-is — only the storage layer changes, not the transition logic, validation, or audit shape. Keeps the v1 `orders`-table approach without architecturally trapping us there.

### Columns to add on `orders`

| column | type | purpose |
|---|---|---|
| confirmed_at | timestamptz nullable | when supplier confirmed |
| on_order_at | timestamptz nullable | when build/transit kicked off |
| ready_for_handover_at | timestamptz nullable | when vehicle arrived at handover point |
| cancelled_post_sign_at | timestamptz nullable | post-sign cancellation stamp |
| supplier_po_number | text nullable | dealer/broker's PO ref |
| supplier_order_ref | text nullable | their internal ref |
| chassis_number | text nullable | VIN |
| registration_plate | text nullable | actual reg (overrides vehicle.registration once known) |
| estimated_delivery_date | date nullable | supplier's ETA; updates when revised |
| actual_delivery_date | date nullable | physical handover date (may differ from `delivered_at` which is when we flipped status) |
| handover_location | text nullable | "customer address" / "collection from dealer" / specific postcode |
| handover_notes | text nullable | operational notes for the handover day |

ETA is a `date` not a `timestamptz` — we care about the day, not the minute.

### Enum additions

`order_status`:

- add `confirmed`, `on_order`, `ready_for_handover`, `cancelled_post_sign`

`audit_event_type`:

- `order.confirmed`
- `order.on_order`
- `order.ready_for_handover`
- `order.cancelled_post_sign`
- `order.eta_updated` (capture ETA slips — separate event so we can count them)
- `order.chassis_recorded`
- `order.reg_recorded`
- `order.status_override` (for the admin-override path)

No new relations. **Every delivery action writes a rich audit payload** with the full shape:

```ts
{
  actorId: string,              // from requireAdmin()
  actorType: 'rep',
  previousStatus: string,       // order.status at read time
  newStatus: string,            // order.status after flip (same as previous for field-only edits)
  changedFields: Record<string, { from: unknown; to: unknown }>,
  note?: string,
  reason?: string,              // required for cancel_post_sign + override; optional otherwise
  timestamp: string,            // ISO; canonical event time (audit_events.created_at is the DB write time)
}
```

Same shape for every transition — makes downstream reporting / timeline rendering uniform and means the helper in `order-delivery.ts` can build the payload in one place.

## Actions

New in `src/app/admin/actions/orders.ts`:

- `markConfirmedAction(orderId, { supplierPoNumber?, estimatedDeliveryDate?, note? })` — `signed → confirmed`
- `markOnOrderAction(orderId, { estimatedDeliveryDate?, note? })` — `confirmed → on_order`
- `markReadyForHandoverAction(orderId, { chassisNumber?, registrationPlate?, handoverLocation?, handoverNotes?, note? })` — `on_order → ready_for_handover`
- Replace existing `markDeliveredAction` behaviour: accept `{ actualDeliveryDate?, note? }`, require `ready_for_handover` as input state
- `updateEtaAction(orderId, { estimatedDeliveryDate, note? })` — writable at any post-sign non-terminal state; each change writes a `order.eta_updated` audit row with the old + new dates
- `updateLogisticsAction(orderId, { chassisNumber?, registrationPlate?, supplierPoNumber?, supplierOrderRef? })` — editable at any post-sign non-terminal state; writes one audit event per field changed (so "VIN captured 3 days after confirmation" is visible in the trail)
- `cancelPostSignAction(orderId, { reason })` — any post-sign non-terminal → `cancelled_post_sign`; requires a reason (commission/refund paperwork)

All actions reuse `requireAdmin()`, write the audit row, revalidate the order page + list. No separate Zod schema file — input is small and well-typed; inline Zod at the action entry.

## UI

Single page: `/admin/orders/[id]`. No new routes.

### New "Delivery" card on the order detail page

Visible once `order.status !== 'draft' && order.status !== 'sent' && order.status !== 'cancelled' && order.status !== 'partially_signed'` (i.e. signed or later). Contains, in order:

1. **Status pill** at the top — extended `OrderStatusPill` colours for the four new states.
2. **Logistics summary block** (compact, always visible once past `signed`): PO number, supplier order ref, ETA, chassis/VIN, registration, handover location. Each field shows "—" when empty. This is the "at a glance" block for operations — no need to scroll the audit trail to answer "what PO is this on?"
3. **Forward-transition button(s)** — only the next valid step is active, others are hidden:
   - **at `signed`**: "Mark confirmed" opens a small form for PO + ETA
   - **at `confirmed`**: "Mark on order" with optional ETA update
   - **at `on_order`**: "Mark ready for handover" with VIN/reg/location
   - **at `ready_for_handover`**: "Mark delivered" with actual handover date
4. **ETA banner**: if `estimated_delivery_date` is set, show it; if past + not yet delivered, flag red.
5. **Logistics inline edit**: small form to update VIN, reg, PO, supplier ref, handover location/notes at any live stage.
6. **Post-sign cancel**: separate destructive button, prompts for reason (textarea required, min 5 chars).
7. **Admin override** (collapsible disclosure, closed by default): dropdown for target state + required reason textarea. Deliberately de-emphasised so it doesn't become the default path.

### List view

`/admin/orders` already shows status pills — the four new pill colours carry through automatically. Add an optional "ETA" column that's populated for orders past `signed`.

### Pill colours

Extending the existing `.adm-status-*` classes:

- `confirmed` — indigo (order is real, not yet moving)
- `on_order` — amber (in motion, not here yet)
- `ready_for_handover` — teal (we have it, customer doesn't)
- `delivered` — green (existing)
- `cancelled_post_sign` — deep red (distinct from the paler `cancelled` pre-sign colour)

## What stays the same

- `delivered_at` keeps its current meaning (status-flip timestamp). `actual_delivery_date` is the separate operational date — the two will usually match but can diverge if we stamp the status a day late.
- Phase 10 anniversary/referral triggers will key off `delivered_at` unchanged.
- `/verify/[ref]` is unaffected; it only surfaces signature state, not delivery state.
- The signed-PDF remains the legal artefact; the handover pack is operational paperwork that lives outside the signing crypto chain.

## Conversion semantics for existing rows

The migration is additive — all columns are nullable, enum values are added not replaced. No data migration needed. Existing rows keep working: an existing `signed` order simply has the new transition buttons available on its detail page; an existing `delivered` order shows the (null) new fields as "—".

## Files to create / modify

Create:
- `src/db/migrations/0004_<name>.sql` (generated by drizzle-kit)
- `src/app/admin/orders/[id]/DeliveryCard.tsx` (new component — forms + transitions)

Modify:
- `src/db/schema.ts` — columns + enum additions + audit events
- `src/app/admin/actions/orders.ts` — new actions, revise `markDeliveredAction`
- `src/app/admin/components.tsx` — extend `OrderStatusPill`, add audit labels
- `src/app/admin/orders/[id]/page.tsx` — mount `DeliveryCard`, thread server-action binders
- `src/app/admin/orders/page.tsx` — optional ETA column
- `src/app/admin/admin.css` — four new `.adm-status-*` colour classes

No new deps. No new routes. No new crons.

## Acceptance checks

- [ ] Existing UD3R (still `sent`) unaffected — can still sign the normal way
- [ ] Sign a fresh test order; it lands in `signed` with the new delivery card available
- [ ] Mark confirmed with PO + ETA; status flips, audit row records both
- [ ] Update ETA twice; each update writes a `order.eta_updated` row with previous + new
- [ ] Record VIN + reg at ready_for_handover stage; audit rows record each field
- [ ] Mark delivered with an actual handover date one day earlier than today; `actual_delivery_date` ≠ `delivered_at`
- [ ] Attempt to skip a stage (e.g. `signed → on_order`) — rejected with a clear error
- [ ] Post-sign cancel with a reason; order terminates with `cancelled_post_sign`, reason visible in audit
- [ ] List view shows the right pill colour + ETA column for each state
- [ ] Typecheck + build clean
- [ ] Commit + push, Vercel green, migration applied to Neon first

## Rollout order

1. Schema + migration 0004 (local first, then Neon)
2. Actions — new + revised `markDeliveredAction`
3. Audit labels + pill colours
4. DeliveryCard component + mount on order detail page
5. Optional ETA column on list
6. Typecheck → build → commit → push

Should take about a session.
