/**
 * Shared types for the Phase 11 reporting service layer.
 *
 * Pages import from here; raw Drizzle types stay inside the service funcs.
 * When we later swap live queries for cached/materialised views, these
 * contracts do not change.
 */

export type DateBasis =
  | 'signed' // orders.signed_at
  | 'delivered' // orders.delivered_at
  | 'po_acknowledged' // supplier_orders.acknowledged_at
  | 'order_created' // orders.created_at

export interface MarginReportFilters {
  supplierId?: string | null
  poStatus?:
    | 'any'
    | 'none'
    | 'draft'
    | 'sent'
    | 'acknowledged'
    | 'cancelled'
  orderStatus?:
    | 'any'
    | 'signed'
    | 'confirmed'
    | 'on_order'
    | 'ready_for_handover'
    | 'delivered'
  invoiced?: 'any' | 'yes' | 'no'
  variance?: 'any' | 'within' | 'over50' | 'under' | 'over'
}

export interface MarginReportParams {
  basis: DateBasis
  fromISO: string // yyyy-mm-dd inclusive
  toISO: string // yyyy-mm-dd inclusive
  filters?: MarginReportFilters
}

export interface MarginRow {
  orderId: string
  orderRef: string
  date: Date | null // the selected basis's value for this row
  customerFirstName: string
  customerLastName: string
  customerCompany: string | null
  supplierName: string | null // null when no PO
  orderStatus: string
  poStatus: string | null // null when no PO
  poId: string | null
  poRef: string | null
  revenuePence: number // orders.total_amount_pence (live)
  revenueSnapshotPence: number | null // supplier_orders.customer_total_snapshot_pence (frozen)
  cogsPence: number | null // supplier_orders.purchase_total_pence
  marginPence: number | null // supplier_orders.margin_pence (stored, canonical)
  marginBps: number | null // supplier_orders.margin_bps (stored)
  marginAdjustmentPence: number // 0 if no adjustment
  invoiceTotalPence: number | null
  varianceTotalPence: number | null
}

export interface MarginTotals {
  rows: number
  revenuePence: number
  cogsPence: number
  marginPence: number
  // Aggregate margin % — ALWAYS recomputed from totals, never averaged
  // from row-level percentages. See totalsFromRows in margin.ts.
  marginBps: number | null
}

export interface MarginReportResult {
  rows: MarginRow[]
  totals: MarginTotals
}

// ─── VAT summary ────────────────────────────────────────────────────────

export interface VatSummaryParams {
  // Quarter start (first day) in ISO date. e.g. '2026-01-01' for Q1 2026.
  quarterStartISO: string
  basis: Extract<DateBasis, 'signed' | 'delivered'>
}

export interface VatSummary {
  quarterStartISO: string
  quarterEndISO: string
  basis: VatSummaryParams['basis']
  outputVatPence: number // from customer orders in the window
  outputRevenueNetPence: number
  inputVatCapturedPence: number // from captured supplier invoices
  inputVatExpectedPence: number // from PO rows where invoice NOT yet captured — "pending capture"
  inputPurchaseNetPence: number
  pendingCaptureCount: number // POs in window with no invoice captured yet
  netPositionPence: number // outputVat - (capturedInput + expectedInput)
}

// ─── Dashboard ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  windowDays: number
  grossProfitPence: number
  grossProfitMarginBps: number | null // recomputed from totals
  dealCount: number
  openPoCount: number
  invoiceAgingCount: number // acknowledged POs > 30 days with no invoice captured
}
