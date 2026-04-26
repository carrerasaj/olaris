# Phase 10 — Supplier purchase order (Olaris → supplier)

> **Status: shipped.** Closed via commit `816cc24 phase-10-supplier-po`. Unticked checkboxes below are historical — kept for context, not active work. See `tasks/olaris-growth-roadmap.md` for current work.

## Problem

Today a signed customer order is just a tag pointing at a supplier row — nothing actually travels from us to the dealer. In practice we read the signed order, retype the key bits into an email, attach the signed PDF, and hope the dealer replies with a PO acknowledgement we then hand-enter against the order. Three things are wrong with that:

1. **Drift risk.** Retyping means typos; a wrong derivative or colour on the supplier side means the wrong van shows up.
2. **No audit trail.** We can't show "what did Olaris ask the supplier for on this deal?" without digging through Alan's outbox.
3. **No margin visibility.** The customer sees one price, the supplier invoices us another, and the gap (our profit) never lands in a structured field. When we want P&L reports in v2 we'll have nothing to aggregate.

## Goal (v1 scope)

A **Supplier PO** built server-side from the signed customer order — reconciled against it, rendered as an Olaris-branded PDF, delivered to the supplier by email, and stored with its own status machine. Margin is a first-class field on the PO (manual entry; v1 does no automatic calculation, just captures the number). Every field that will matter for future accounting lives in a normalised `supplier_orders` row from day one — so when Phase 11+ builds the accounts module, we aggregate existing data instead of retro-fitting.

## Out of scope (deferred)

- Automated P&L reports / journals / Xero-Sage sync (Phase 11+)
- Supplier-facing portal with Accept/Query/Reject buttons (v2 — stretches this out into a two-way flow)
- Multi-supplier split on one customer order (not a real-world case for us in v1)
- Credit notes, supplier invoices, payment matching (accounting)
- Automatic VAT splitting per line (v1: single VAT rate, captured manually)
- Inventory / stock tracking
- Trade-in valuations flowing through to supplier PO (we'll handle PX under finance settlement as today)

## Terminology

- **Customer order** — the thing the customer signs. Table: `orders` (existing). Contains the sell-to prices.
- **Supplier PO** — a new record per customer order, representing what we're asking the supplier to fulfil. Table: `supplier_orders` (new). Contains the buy-from prices and references the customer order and the supplier.
- **Reconciliation** — the act of building the supplier PO from the customer order's vehicle / options / delivery fields. Deterministic in v1; if spec changes, admin cancels the PO and regenerates.

## Data model

### New table: `supplier_orders`

One row per outgoing PO. Lifetime is tied to its `orderId` (ON DELETE CASCADE).

```
id              text pk (nanoid)
ref             text unique (OL-PO-YYYY-MM-XXXX — distinct prefix from quotes/orders)
orderId         text fk → orders (cascade)
supplierId      text fk → suppliers (restrict)
status          supplier_po_status enum (see below)

-- Snapshot of the customer order at PO creation time. Jsonb of the exact
-- vehicle / options / delivery blobs from `orders`. Frozen at send time so
-- the supplier sees what we asked for, even if the customer order later
-- gets tweaked (shouldn't, but if it does, the PO is the source of truth
-- for what the dealer agreed to supply).
vehicle         jsonb (VehicleJson)
options         jsonb (OrderOptionJson[])
delivery        jsonb (DeliveryJson)

-- Commercials — all in pence. These are "buy from supplier", not the
-- customer-sell numbers on `orders`. Manual entry, no auto-calc in v1.
purchaseNetPence        integer not null default 0      -- vehicle + options net
purchaseVatRate         integer not null default 20     -- stored as percent
purchaseVatPence        integer not null default 0      -- derived at save, stored
purchaseGrossPence      integer not null default 0      -- derived at save
deliveryFeePence        integer not null default 0
onRoadPence             integer not null default 0      -- ved + first reg + plates if we pay them
purchaseTotalPence      integer not null default 0      -- one total we owe the supplier

-- Margin snapshot. Stored (not computed at read time) so future accounting
-- reports join on stable historical values even if customer prices change
-- later.
--
-- MARGIN RULE (unambiguous, applies everywhere):
--   marginPence = customerTotalSnapshotPence
--                 - purchaseTotalPence
--                 + marginAdjustmentPence
--
-- There is no admin "override" of the margin field itself. If admin needs
-- to correct for an off-PO rebate, kickback, or cost not captured above,
-- they enter `marginAdjustmentPence` (positive to increase margin, negative
-- to decrease) along with a note explaining why. The stored `marginPence`
-- is then derived server-side from the three inputs every time the PO is
-- saved or sent. Never stored straight from user input.
customerTotalSnapshotPence   integer  -- set at send; null while draft
purchaseTotalPence           integer not null default 0  -- sum of purchase-side fields above
marginAdjustmentPence        integer not null default 0  -- signed; explicit + audited
marginAdjustmentNote         text  -- required whenever marginAdjustmentPence != 0
marginPence                  integer  -- DERIVED server-side, stored for reporting stability
marginPercent                integer  -- DERIVED (marginPence / customerTotalSnapshot) × 10000 bps

-- Supplier-side refs, captured when they reply
supplierPoRefReceived   text nullable   -- their PO number / our reference on their side
supplierEtaDate         text nullable   -- yyyy-mm-dd
supplierInvoiceRef      text nullable   -- populated later when we're invoiced; informs Phase 11 accounting

-- Delivery coordinates the supplier needs that aren't on the customer order
notesToSupplier         text nullable   -- free-text in the PO body
internalNotes           text nullable   -- our eyes only, never emailed

-- Lifecycle stamps
sentAt                  timestamptz nullable
acknowledgedAt          timestamptz nullable
cancelledAt             timestamptz nullable
createdBy               text fk → users (set null)
createdAt               timestamptz default now()
updatedAt               timestamptz default now()

indexes:
  (order_id)
  (supplier_id)
  (status)
  unique(ref)
  unique(order_id)   -- one active PO per customer order. See Constraints below.
```

### Unique-per-order constraint

`unique(order_id)` — v1 is strict one-PO-per-order. If the spec changes or the supplier rejects, you `cancel` the PO (status → cancelled) then can generate a new one. Enforced at the DB level so a race can't produce two.

The cancelled row sticks around for the audit trail; the constraint is actually `unique(order_id) where status != 'cancelled'` — a **partial unique index**. Drizzle supports this via `.where(...)` on the index.

### New enum: `supplier_po_status`

```
draft           -- built, not yet sent
sent            -- email dispatched to supplier
acknowledged    -- supplier replied (captured via "mark acknowledged" admin action with their ref/ETA)
cancelled       -- superseded, supplier rejected, or deal collapsed
```

No `delivered` on the PO — that lives on the customer order's delivery lifecycle (Phase 9). A PO's job is done at `acknowledged`; everything downstream is tracked against the customer order.

### Audit events to add

- `supplier_po.created`
- `supplier_po.updated`
- `supplier_po.sent`
- `supplier_po.acknowledged`
- `supplier_po.cancelled`

Payloads follow the Phase 9 shape: `{ actorId, previousStatus, newStatus, changedFields, note?, reason?, timestamp }`.

## Reconciliation (customer order → draft PO)

`buildDraftPOFromOrder(orderId)` is a pure helper in `src/lib/supplier-po.ts`. Given an `orders` row it returns a `NewSupplierOrder` ready to insert. Rules:

- **Vehicle spec** copied verbatim from `orders.vehicle` → `supplierOrders.vehicle`.
- **Options** copied verbatim from `orders.options` → `supplierOrders.options`. Same items, same quantities. Net prices preserved *for reference only* — they're sell prices, admin sees them alongside the buy-price fields they'll enter.
- **Delivery** copied verbatim from `orders.delivery`.
- **Purchase-side commercials** (net / VAT rate / delivery / on-road) start at 0 and are **admin-entered** on the draft. This is the manual capture point — admin types what the supplier is charging us.
- **All derived totals and the margin** are computed and written by the server. The user enters only:
  1. `purchaseNetPence`, `purchaseVatRate`, `deliveryFeePence`, `onRoadPence` (purchase inputs)
  2. `marginAdjustmentPence` + `marginAdjustmentNote` (optional; explicit adjustment, not an override of the final margin)
- The server then derives, on every save: `purchaseVatPence`, `purchaseGrossPence`, `purchaseTotalPence`, `marginPence`, `marginPercent`. These are **stored**, not computed at read time — for reporting stability.
- `purchaseVatRate` defaults to 20.
- Ref generated via `generateSupplierPoRef()` (same crypto-quality pattern as quotes/orders).

### Draft refresh vs send immutability

While the PO is in `draft`, the snapshot fields (`vehicle`, `options`, `delivery`) **may be refreshed** from the current customer order at any time via a `refreshDraftSnapshotAction`. If the admin knows the customer order spec just changed and wants the draft to reflect it, they can pull the latest without regenerating from scratch. This re-runs the reconcile helper, overwriting only the snapshot jsonb and leaving the admin-entered purchase fields untouched. An audit event `supplier_po.snapshot_refreshed` is written each time, with the old vs new snapshot diffed in the payload.

At send time, the PO's snapshot is **frozen**:

1. `customerTotalSnapshotPence` is populated from `orders.totalAmountPence` at that instant.
2. The jsonb snapshot fields (`vehicle`, `options`, `delivery`) become the definitive record of what Olaris asked of the supplier.
3. The PO row is locked to edits for everything except acknowledgement-side fields (`supplierPoRefReceived`, `supplierEtaDate`, `supplierInvoiceRef`) and cancellation. A `updateSupplierPOAction` call on a non-draft PO returns `{ ok: false, error: 'PO is ${status} — terms are immutable after send. Cancel and regenerate to change.' }`.
4. `customerTotalSnapshotPence` never updates after send, even if the customer order is later tweaked. Phase 11+ accounting reports off this snapshot, not live customer prices.

### Spec-change handling after send

If someone edits the customer order (vehicle, options, delivery) while a *sent* or *acknowledged* PO exists, the PO does **not** change. Admin gets a banner on the customer order detail saying "PO ${ref} exists and is ${status} — cancel and regenerate to reflect your changes." The PO remains the source of truth for what the supplier was asked to supply, even if the customer-facing order diverges on paper. The regenerate flow explicitly requires a cancel first (see Actions below).

## UI

### On `/admin/orders/[id]`

Add a **Supplier PO** card, mounted below `SupplierSelectors`. Three states:

1. **No vehicle supplier assigned** — empty-state card: "Assign a vehicle supplier above to build a purchase order."
2. **Vehicle supplier assigned, no PO yet** — "Generate draft PO" button. Clicking it calls `createDraftSupplierPOAction(orderId)` and redirects to the new PO's detail page.
3. **PO exists** — compact summary: PO ref + status pill + purchase total + margin + link "Open PO →". Also shows the cancel-and-regenerate banner if the customer order has been edited since the PO was created.

### New routes

| route | purpose |
|---|---|
| `/admin/orders/[id]/supplier-po` | Detail / edit page for the PO |

Not a separate top-level nav section — POs are owned by their order. This keeps the mental model simple: "orders have POs", not "POs are a thing."

### PO detail page layout

- Header: PO ref + status pill, order ref back-link, supplier name
- Two-column:
  - **Left**: the editable PO form (only editable while `status = 'draft'`)
    - Vehicle spec (read-only, carried from order)
    - Options (read-only)
    - Delivery address (read-only)
    - **Purchase commercials** (editable, pence fields): net, VAT rate, delivery fee, on-road, computed total (recalculated on save)
    - **Margin block**: `customerTotalSnapshot` shown as read-only reference (null until send), `marginPence` (auto-derived + admin override), `marginNote`
    - Notes to supplier, internal notes
  - **Right**: preview of the supplier-facing PDF + send/ack/cancel action buttons

### Actions on the PO page

- **Save draft** — `updateSupplierPOAction`; recomputes totals server-side
- **Send to supplier** — `sendSupplierPOAction`: renders the PDF, emails the supplier's primary contact, attaches the signed customer PDF, flips to `sent`, stamps `sentAt`, snapshots `customerTotalSnapshotPence` and recomputes margin
- **Mark acknowledged** — `markSupplierPOAcknowledgedAction({ supplierPoRefReceived?, supplierEtaDate? })`: flips to `acknowledged`, captures their reference + ETA; if ETA provided, also writes the ETA back to the customer order (`estimatedDeliveryDate`) + audit event on both rows — so the Phase 9 delivery card sees it too.

  **Does it also move the customer order signed → confirmed?** Yes, but only if the customer order is currently `signed` *and* the admin ticks a "mark customer order as confirmed" checkbox on the acknowledge form (default: on). This keeps the two lifecycles formally separate — the PO's acknowledgement is one input into the customer-order state machine, not an automatic coupling. If the checkbox is off, only the PO flips; the customer order stays at whatever status it was on. The customer-order transition, when triggered, goes through the existing `markConfirmedAction` so the Phase 9 audit/stamp machinery runs unchanged and `supplierPoRefReceived` is stored on the customer order as the `supplierPoNumber` too. Rule of thumb: the PO and delivery lifecycles are independently valid state machines; this is a convenience bridge, not a coupling.

- **Cancel** — `cancelSupplierPOAction({ reason })`: any non-terminal state → `cancelled`, reason required (same 5-char minimum as Phase 9). Allowed from `draft`, `sent`, or `acknowledged`. Cancelling an `acknowledged` PO is not unusual — supplier pulls the allocation, we need a different dealer — but it's a serious action so the reason is required and the audit event payload records the previous status explicitly.

- **Regenerate** — **only** allowed when the current PO is `cancelled`. Never a one-click "supersede" on a live PO. If you want to replace a `sent` or `acknowledged` PO you must first `cancel` it (with a reason), then `regenerate`. The fresh draft carries a `payload.previousSupplierPoId` and `payload.previousSupplierPoRef` in its `supplier_po.created` audit event, plus a matching entry on the cancelled PO's trail (`supplier_po.superseded_by`) so the chain is traversable in both directions. Regeneration copies the current customer order snapshot (not the cancelled PO's snapshot) — by definition the reason we regenerated is that something changed.

## The supplier-facing PDF

Reuses the existing Puppeteer pipeline (`src/lib/pdf/`). Template under `src/app/admin/orders/[id]/supplier-po/pdf-template/page.tsx`. Contents:

- Olaris letterhead (same as signed contract)
- "Purchase order" title, PO ref, issue date
- Supplier block (legal name + primary contact + address from `suppliers`)
- Customer reference (customer order ref, **not** customer personal details — supplier sees "OL-2026-04-UD3R", not Tony's email)
- End-user delivery address (they need this to deliver the van)
- Vehicle spec
- Options list with SKUs
- Purchase-side commercials (this is what we owe the supplier)
- Notes to supplier
- Footer: "Issued electronically by Olaris Consulting Ltd — reply to alan@olaris.co.uk to acknowledge"

Storage: saved to Vercel Blob at send time, same pattern as signed customer PDFs. SHA-256 stored on the `supplier_orders` row in a new `pdfSha256` column (append-only; re-sending uses the same PDF unless regenerated).

**Email attachment rule — exact signed PDF, not the latest.** The supplier email attaches:

1. The supplier PO PDF (this PO's own `pdfSha256`-pinned blob) — built server-side at send time.
2. The **exact `documents` row for this customer order where `kind = 'signed_order_pdf'`**, looked up by `orderId` at send time. Not "the latest PDF on the order"; not a regenerated one. The row's `blobUrl` is fetched and streamed as an attachment. If multiple `signed_order_pdf` documents exist for the order (re-seal after a rare edge case), we take the earliest one — the one that matches the signatures in the `signatures` table by `documentSha256` — and we verify that SHA match before sending. If no matching signed PDF exists, the send aborts with `error: 'No signed customer PDF on file for this order — send aborted.'`

The supplier sees both attachments: **the PO to match against their own system**, and **the customer-signed contract** that Olaris relies on. That signed contract is the legally meaningful artefact; attaching the wrong version would break the chain of custody.

## Accounting hooks (for Phase 11+ — scoped now, not built)

Everything the future accounting module will need is already in the data model. Listing it here so we know what **not** to change without thinking.

The P&L module will aggregate on:

- `supplier_orders.purchaseTotalPence` (COGS)
- `supplier_orders.customerTotalSnapshotPence` (revenue)
- `supplier_orders.marginPence` (gross profit per deal)
- `supplier_orders.purchaseVatPence` (input VAT — for reclaim)
- `orders.totalAmountPence` joined via `supplier_orders.orderId` — same revenue figure, but on the customer side; used for sanity checks against the snapshot
- `supplier_orders.supplierInvoiceRef` populated later (Phase 11+) when matching supplier invoices — timing difference between PO acknowledge and actual invoice is the cash-flow view
- `supplier_orders.createdAt` / `sentAt` / `acknowledgedAt` — for "when did this deal become commitment, revenue, cash?" aging
- `orders.signedAt` / `orders.deliveredAt` — joins for revenue recognition timing

**What this means for Phase 10:**

- Do not store derived totals in the customer-order row (we already don't — pricing jsonb is the source).
- Every money field on `supplier_orders` is pence-integer, never float. No "big numbers" library.
- VAT rate is captured as an integer percent (`20`), not a decimal (`0.2`) — avoids floating-point rounding on reversal.
- Margin is stored, not derived at read time. Accounting reports run off historical snapshots, not recomputed from current customer prices.
- All money movements write their own audit events so a future journal-generator can replay them chronologically.

## Files to create / modify

**Create:**
- `src/db/migrations/0005_<generated>.sql`
- `src/db/schema.ts` additions (already imports what we need)
- `src/lib/supplier-po.ts` — reconciliation helpers, total/margin derivation, ref generator
- `src/app/admin/actions/supplier-po.ts` — all server actions
- `src/app/admin/orders/[id]/SupplierPOCard.tsx` — the compact card on the order detail page
- `src/app/admin/orders/[id]/supplier-po/page.tsx` — PO detail/edit page
- `src/app/admin/orders/[id]/supplier-po/pdf-template/page.tsx` — print stylesheet
- `src/lib/email-templates.ts` additions: `supplierPoEmail({...})`
- `src/app/admin/components.tsx` — `SupplierPOStatusPill`

**Modify:**
- `src/db/schema.ts` — add `supplierOrders` table + relations + enum + audit events
- `src/app/admin/orders/[id]/page.tsx` — mount `SupplierPOCard` + "PO exists, spec changed" banner
- `src/app/admin/components.tsx` — audit labels for the new events
- `src/lib/format.ts` — `generateSupplierPoRef()`

## Acceptance checks

- [ ] Signed customer order without a PO shows "Generate draft PO" card once a vehicle supplier is assigned
- [ ] Generate draft creates the row, redirects to the PO page, vehicle/options/delivery pre-filled and read-only
- [ ] Enter purchase net + VAT + delivery; save → stored totals match the form values (server-side recompute)
- [ ] Margin field updates automatically (customer total snapshot shown once the PO is sent — before, it's null + labelled "set on send")
- [ ] Send PO → supplier PDF renders, lands in their inbox with customer-signed PDF attached, PO status flips to `sent`, audit row with payload
- [ ] Mark acknowledged with their ref + ETA → ETA back-writes to the customer order's `estimatedDeliveryDate`, both rows get audit events
- [ ] Cancel PO with reason (min 5 chars) → status `cancelled`, partial unique index lets a new draft be created
- [ ] Edit customer order fields (e.g. colour) while a live PO exists → order page shows the "PO exists, spec changed" banner
- [ ] Supplier PDF shows customer order ref but no customer PII
- [ ] Customer-signed contract is attached to the supplier email
- [ ] Typecheck + build clean
- [ ] Migration applied to local + Neon; commit + push

## Rollout order

1. Schema + migration 0005 (local → Neon)
2. Reconciliation helpers + server actions
3. PO detail page + server-side totals recompute
4. Supplier PDF template + email template + blob storage
5. SupplierPOCard on customer order page + edit-warns-about-existing-PO banner
6. Acknowledgement + cancel + regenerate actions, ETA back-write
7. Typecheck → build → commit → push

Should be a full session. Biggest unknown: whether the Puppeteer PDF pipeline handles dual attachments cleanly (signed + PO). If it doesn't, fall back to sending as two separate PDFs in one email — same outcome, minor visual difference.
