# Phase 11 — Accounting / P&L reporting (v1)

> **Status: shipped.** Closed via commit `141eb12 phase-11-accounting`. Unticked checkboxes below are historical — kept for context, not active work. See `tasks/olaris-growth-roadmap.md` for current work.

## Problem

Phase 10 structured every commercial field we'd need to answer "how much did we make on this deal?" — customer total snapshot, purchase total, margin, VAT splits. Nothing reads it back out. Today "what was gross profit last quarter?" means opening every supplier PO individually. This phase turns the data into views admin can actually use when talking to the accountant or deciding which deals are worth chasing.

## Goal (v1 scope)

Read-only reporting layer over the existing `orders` + `supplier_orders` + `audit_events` tables. Five deliverables:

1. **Deal P&L card** on each customer order's detail page.
2. **Margin report** at `/admin/reports/margin` — filterable list with CSV export.
3. **Supplier invoice capture** on the PO page with variance tracking.
4. **Dashboard tile** on `/admin` — rolling 90-day gross profit + operational alerts.
5. **VAT summary** page at `/admin/reports/vat` — management-support numbers only.

No new tables that we need for v1. One schema extension (supplier invoice fields on `supplier_orders`) because invoice capture is a write, and the numbers it produces feed every other deliverable.

## Out of scope (deferred to v2+)

- Xero / Sage / FreeAgent sync or API export
- Journal-line generation (double-entry bookkeeping)
- Payment matching and bank reconciliation
- Multi-currency
- Commission tracking for introducers / referral partners
- Formal customer invoices from Olaris (signed order already serves as the contract)
- Year-end adjustments, deferred revenue, prepayments
- Management-account-style layouts (gross margin, overheads, EBITDA lines)
- Customer-facing invoice portal

## 1. Revenue / date basis for the margin report

**Selectable, default signed date.** The filter exposes four options, keyed off existing columns:

| Filter value | Stored column | Meaning |
|---|---|---|
| `signed` *(default)* | `orders.signedAt` | When both parties signed the customer order. Most "this is the month it happened" reads. |
| `delivered` | `orders.deliveredAt` | When the customer physically got the vehicle. Matches VAT invoice date for most dealers. |
| `po_acknowledged` | `supplier_orders.acknowledgedAt` | When the supplier committed to fulfil. Useful for "what's in the pipeline this quarter?". |
| `order_created` | `orders.createdAt` | Earliest possible; useful only for long-cycle deals where signed is far from created. |

The margin-report page has a select dropdown for "date basis" alongside the from/to date range. Whichever basis is chosen, the report shows that column's value in the **Date** column so the user knows what they're looking at. Rows whose chosen date is null (e.g. an order that hasn't signed yet but a PO was acknowledged) are excluded — we only count events that actually happened.

The **Deal P&L card** on a single order doesn't need a date basis — it's a snapshot for that one deal, showing all four dates where present.

## 2. Margin source of truth

**Primary: `supplier_orders.marginPence`** (stored, set at send time by `deriveTotals` in `src/lib/supplier-po.ts`). This is the canonical figure and what all totals are summed from.

**Sanity-check in the UI only:** alongside the primary margin, the Deal P&L card shows `customerTotalSnapshot - purchaseTotal` as a read-only check. If they differ (they can: `marginAdjustmentPence`), a small `(adj: ±£X)` indicator appears next to the headline margin with the adjustment note on hover. No recomputation, no "corrected" figure — the stored margin is authoritative. The sanity-check is there so the admin can *see* the adjustment at a glance without clicking into the PO, not override it.

The margin-report table uses `supplier_orders.marginPence` directly. The CSV export includes both `marginPence` and the derived `customerTotalSnapshot - purchaseTotal` in separate columns so the accountant can reconcile if they want to.

Orders without an active non-cancelled PO show margin as `—` (not zero — explicitly "no PO, no margin to report"). Those rows are still included in the margin report when the filter is wide, so the admin can see deals that haven't been POed yet.

## 3. Supplier invoice capture + variance

Add to the existing `supplier_orders` table. Migration 0006:

```
supplierInvoiceDate              text nullable   -- yyyy-mm-dd; captured from the invoice
supplierInvoiceNetPence          integer nullable -- what they actually charged, ex VAT
supplierInvoiceVatPence          integer nullable -- VAT on the invoice (nullable; some suppliers don't show it split)
supplierInvoiceTotalPence        integer nullable -- DERIVED server-side: net + vat, or stored raw if vat is null
supplierInvoiceVarianceNetPence  integer nullable -- DERIVED server-side: invoiceNet - purchaseNet
supplierInvoiceVarianceTotalPence integer nullable -- DERIVED server-side: invoiceTotal - purchaseTotal
supplierInvoiceReceivedAt        timestamptz nullable -- when admin entered the invoice
supplierInvoiceNotes             text nullable   -- free-text; useful for "they split the delivery fee out differently"
```

`supplierInvoiceRef` already exists from Phase 10 (we left the column in but never captured). Reuse as-is.

**Derivation rules** (owned by `src/lib/supplier-po.ts` — extend `deriveTotals` or add `deriveInvoice`):
- If `supplierInvoiceVatPence` is null (common: fuel cards, small suppliers) then `supplierInvoiceTotalPence = supplierInvoiceNetPence` and the VAT-level variance is not computed. A banner on the PO page flags this.
- `varianceTotalPence = invoiceTotalPence - purchaseTotalPence` (signed; positive means we got charged more than the PO).
- **Variance thresholds — absolute-value, £-denominated, fixed in v1:** `abs(varianceTotalPence) > £50` → amber pill. `abs(varianceTotalPence) > £250` → red pill. Percentage-based thresholds (e.g. "±2% of PO") are explicitly deferred — we'd add them if experience shows big deals generate amber noise at £50. One threshold pair, applied everywhere variance is shown (PO page, deal P&L card, margin report).

**UI**: a new `SupplierInvoiceCard` on the PO detail page, visible only when PO `status = 'acknowledged'`. Editable fields: `invoiceRef` (if not already set), `invoiceDate`, `invoiceNet`, `invoiceVat` (optional), `invoiceNotes`. Recalculating the variance on save. One audit event: `supplier_po.invoice_received` with the full payload.

This is not a payment-matching system — we're just recording that the invoice arrived and what it said. Actual cash movement is out of scope for v1.

## 4. VAT summary

Page at `/admin/reports/vat`. **Top banner copy, always visible:**

> **This is a management summary to support your accountant. It is not a VAT return, not a filing artefact, and is not suitable for submission to HMRC.** These figures come from our internal order and PO data; your accountant will reconcile against actual issued invoices, supplier invoices and the VAT accounting scheme in use.

Layout:
- Quarter picker (defaults to current UK VAT quarter — Jan/Apr/Jul/Oct starts)
- Two columns side by side: **Output VAT** (customer side) and **Input VAT** (supplier side)
  - Output VAT = sum of VAT component of `orders.pricing.vatRate * orders.pricing.vehicleNetPence` etc. in the quarter (by selected date basis, default `signed`)
  - Input VAT = sum of `supplier_orders.supplierInvoiceVatPence` in the quarter where the invoice was received; where `supplierInvoiceVatPence` is null but `purchaseVatPence` is known, a sub-line "pending invoice capture" shows what the PO *expected* vs what's been captured
- Net position (output − input) — flagged as "indicative; depends on scheme" in muted text
- CSV export for handing to the accountant

No automatic VAT rate assumptions — everything comes from stored rates. No cash-accounting vs accrual toggle in v1 (we note in the banner that the accountant will convert as needed).

## 5. Reporting architecture

**Live queries in v1.** Volumes are tens of POs/month — postgres will handle it fine. We're not snapshotting nightly or running materialised views this phase.

**But structure for future caching.** All reporting queries live in a **dedicated service-layer module** `src/lib/reports/` with the following shape:

- `margin.ts` — `getMarginReport({ basis, from, to, filters })` → `MarginRow[]` + totals
- `vat.ts` — `getVatSummary({ quarterStart, basis })` → `{ outputVatPence, inputVatPence, net, lines }`
- `dashboard.ts` — `getDashboardSummary()` → 90-day GP + open POs + aging
- `types.ts` — shared row + summary types

Pages call these functions and render the result. **Pages never write raw Drizzle queries for reports.** When we later add a materialised view or a nightly snapshot, we change the internals of the service module; the page contract stays identical.

Each service function is pure (no route context, no cookies) so in future we can:
- Cache results via `unstable_cache` keyed by filter params
- Replace a query with a view read without touching pages
- Expose the same function to a future CSV/export cron
- Test in isolation

No abstractions beyond that in v1 — plain async functions, explicit param objects, returning typed plain objects.

## `/admin/reports/margin` — proposed filters and columns

### Filters (querystring-backed so URLs are shareable)

| Filter | Param | Default | Notes |
|---|---|---|---|
| Date basis | `basis` | `signed` | Select: signed / delivered / po_acknowledged / order_created |
| From | `from` | 90 days ago | Date picker |
| To | `to` | today | Date picker |
| Supplier | `supplier` | (any) | Dropdown populated from `suppliers` where kind != 'funder' |
| PO status | `po_status` | (any) | Select: any / none / draft / sent / acknowledged / cancelled |
| Order status | `order_status` | (any) | Select: any / signed / confirmed / on_order / ready_for_handover / delivered |
| Invoice captured | `invoiced` | (any) | Select: any / yes / no |
| Variance | `variance` | (any) | Select: any / within £50 / over £50 / under-invoiced (−) / over-invoiced (+) |

Filters stack (AND). Empty / "any" filters are no-ops.

### Columns

| Column | Source | Notes |
|---|---|---|
| Date | selected basis column | Formatted per basis (e.g. "Signed 2026-03-14") |
| Order ref | `orders.ref` | Links to `/admin/orders/[id]` |
| Customer | `customers.firstName + lastName` + company | Compact two-line cell |
| Supplier | `suppliers.tradingName ?? legalName` | PO's supplier, not order's (they're the same in v1 but logically distinct) |
| Order status | `orders.status` | Pill |
| PO status | `supplier_orders.status` or `—` | Pill, `—` when no PO |
| Revenue (inc VAT) | `orders.totalAmountPence` | Right-aligned, mono |
| COGS (inc VAT) | `supplier_orders.purchaseTotalPence` | Right-aligned, mono |
| Margin | `supplier_orders.marginPence` | Bold, red if negative, `—` if no PO |
| Margin % | `supplier_orders.marginBps / 100` | Two decimal places, grey if very low |
| Invoice total | `supplier_orders.supplierInvoiceTotalPence` | `—` if not captured |
| Variance | `supplier_orders.supplierInvoiceVarianceTotalPence` | Amber pill >£50 in either direction, red pill >£250 |

Sorting: clickable headers on date, margin, margin %, variance. Default sort: date desc (most recent first).

Footer row: totals for revenue, COGS, margin. **Aggregate margin % rule — applies everywhere:** any time margin % appears in a total row, a grouped summary, or a dashboard tile, it is **recomputed from aggregate totals** (`sum(marginPence) / sum(customerTotalSnapshotPence)`), never averaged from row-level percentages. Averaging percentages across deals of different sizes would let one small-revenue deal swing the headline. This rule applies in `src/lib/reports/margin.ts#totalsFromRows`, the dashboard tile, and any CSV summary lines — all go through one helper so we can't accidentally mix approaches. Row-level margin % is still shown per row, just not averaged into aggregates.

**CSV export** button: same columns plus the sanity-check column (`customerTotalSnapshot − purchaseTotal`) and the PO ref + supplier invoice ref. Downloads as `olaris-margin-${basis}-${from}-${to}.csv`.

## Deal P&L card (on `/admin/orders/[id]`)

Small card, only rendered when there's a signed order (data is only meaningful post-sign). Shows:

- Customer total (snapshot if PO exists, live otherwise)
- Purchase total (or "no PO yet")
- Margin — primary figure, bold
- Sanity check: "(matches revenue − COGS)" or "(adj: ±£X: note)" if a `marginAdjustmentPence` is non-zero
- Margin % (from `marginBps`)
- Supplier invoice: captured total + variance pill, or "Not yet received"
- VAT split: output VAT (ours), input VAT from PO, input VAT from invoice if captured

Positioned alongside the DeliveryCard and SupplierPOCard. Reads from the service layer, not direct queries.

## Dashboard tile

On `/admin`, one new tile:

**Last 90 days**
- Gross profit: sum of `marginPence` where PO is acknowledged and falls in window (by signed date)
- Open POs: count where `status IN ('draft', 'sent')`
- **Attention**: count of acknowledged POs where >30 days have passed with no supplier invoice captured (aging alert)

Click-through on each number → the appropriate filter on the margin report.

## Files to create / modify

**Create:**
- `src/db/migrations/0006_<generated>.sql`
- `src/lib/reports/types.ts` — `MarginRow`, `MarginReportParams`, `VatSummary`, `DashboardSummary`
- `src/lib/reports/margin.ts` — `getMarginReport()`, `totalsFromRows()`
- `src/lib/reports/vat.ts` — `getVatSummary()`, quarter helpers
- `src/lib/reports/dashboard.ts` — `getDashboardSummary()`
- `src/lib/reports/csv.ts` — shared CSV serialiser
- `src/app/admin/reports/margin/page.tsx` — filterable report page
- `src/app/admin/reports/vat/page.tsx` — VAT summary page
- `src/app/admin/orders/[id]/DealPLCard.tsx` — deal-level P&L card
- `src/app/admin/orders/[id]/SupplierInvoiceCard.tsx` — invoice-capture form
- `src/app/admin/orders/[id]/supplier-po/actions-invoice.ts` *(or merge into the existing supplier-po.ts)* — `recordSupplierInvoiceAction`

**Modify:**
- `src/db/schema.ts` — invoice columns + audit event `supplier_po.invoice_received`
- `src/lib/supplier-po.ts` — `deriveInvoice()` helper
- `src/app/admin/orders/[id]/page.tsx` — mount `DealPLCard`
- `src/app/admin/orders/[id]/supplier-po/page.tsx` — mount `SupplierInvoiceCard`
- `src/app/admin/AdminNav.tsx` — add **Reports** dropdown / link group
- `src/app/admin/page.tsx` — add the new tile
- `src/app/admin/components.tsx` — `VarianceIndicator` pill helper + audit label

## Acceptance checks

- [ ] Margin report loads with defaults (last 90 days, signed basis); table shows totals footer
- [ ] Switching date basis to `delivered` re-queries and only shows orders with a `deliveredAt`
- [ ] Filtering to a specific supplier narrows the list correctly
- [ ] Filtering to "variance > £50" isolates POs whose invoice differs from the PO by more than £50
- [ ] Capturing a supplier invoice on a PO page: variance columns populate, audit event written, margin report updates
- [ ] Deal P&L card on an order shows primary margin + sanity check; margin adjustment note visible on hover when non-zero
- [ ] Dashboard tile shows correct 90-day gross profit for known test data
- [ ] VAT summary page shows the management-use banner prominently; CSV exports the same numbers
- [ ] CSV export downloads with the right filename and includes both margin + sanity-check columns
- [ ] Typecheck + build clean
- [ ] Migration applied local + Neon; committed; pushed

## Rollout order

1. Schema + migration 0006 (invoice columns)
2. `src/lib/reports/*` service layer with typed params + return types
3. Margin report page reading from service layer
4. VAT summary page
5. Dashboard tile
6. SupplierInvoiceCard + action on PO page
7. DealPLCard on order detail
8. Reports link in AdminNav
9. Typecheck → build → commit → push

Should be one full session, biggest risk is CSV export + date-basis filter SQL branching — if the switch(basis) pattern gets ugly, lift into a small `dateBasisColumn(basis)` helper and have the service function compose `where`/`orderBy` off that.
