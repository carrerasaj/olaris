/**
 * Margin report — live query over orders + supplier_orders + suppliers +
 * customers. Page routes call getMarginReport(); nothing else runs raw
 * Drizzle for report data.
 *
 * Date-basis filter picks which column's value locates a row in the
 * reporting window. The row's "date" column surfaces that same value so
 * the admin knows what they're looking at.
 */

import { and, desc, eq, gte, lte, SQL } from 'drizzle-orm'
import {
  db,
  orders,
  supplierOrders,
  suppliers,
  customers,
  companies,
} from '@/db/client'
import type {
  MarginReportParams,
  MarginReportResult,
  MarginRow,
  MarginTotals,
  DateBasis,
} from './types'

function basisColumn(basis: DateBasis) {
  switch (basis) {
    case 'signed':
      return orders.signedAt
    case 'delivered':
      return orders.deliveredAt
    case 'po_acknowledged':
      return supplierOrders.acknowledgedAt
    case 'order_created':
      return orders.createdAt
  }
}

export async function getMarginReport(
  params: MarginReportParams,
): Promise<MarginReportResult> {
  const col = basisColumn(params.basis)
  const from = new Date(`${params.fromISO}T00:00:00Z`)
  const to = new Date(`${params.toISO}T23:59:59Z`)

  // Date range — and implicit NOT NULL (rows where basis is null are excluded).
  const whereClauses: SQL[] = [gte(col, from), lte(col, to)]

  const f = params.filters ?? {}
  if (f.supplierId) {
    whereClauses.push(eq(supplierOrders.supplierId, f.supplierId))
  }
  if (f.poStatus && f.poStatus !== 'any') {
    if (f.poStatus === 'none') {
      // Pseudo value: orders with no PO at all. Expressed as
      // "supplierOrders.id is null" — only achievable via left join.
      // Handled below after the join.
    } else {
      whereClauses.push(eq(supplierOrders.status, f.poStatus))
    }
  }
  if (f.orderStatus && f.orderStatus !== 'any') {
    whereClauses.push(eq(orders.status, f.orderStatus))
  }

  const joinSupplierOrders =
    f.poStatus === 'none'
      ? undefined // we want rows WHERE supplier_order does not exist — left join + is null
      : // For basis = po_acknowledged we require the PO row to exist at all;
        // inner-join is correct. For other bases, left-join so no-PO rows still
        // appear (except when a specific poStatus or supplierId filter narrows).
        params.basis === 'po_acknowledged' ||
          f.supplierId ||
          (f.poStatus && f.poStatus !== 'any')
        ? 'inner'
        : 'left'

  // Build query. Drizzle doesn't let us conditionally swap join kinds on the
  // same builder, so we branch here.
  let rowsRaw: Array<{
    orderId: string
    orderRef: string
    basisDate: Date | null
    orderStatus: string
    totalAmountPence: number
    customerFirstName: string
    customerLastName: string
    companyName: string | null
    supplierName: string | null
    poId: string | null
    poRef: string | null
    poStatus: string | null
    customerTotalSnapshotPence: number | null
    purchaseTotalPence: number | null
    marginPence: number | null
    marginBps: number | null
    marginAdjustmentPence: number | null
    supplierInvoiceTotalPence: number | null
    supplierInvoiceVarianceTotalPence: number | null
  }> = []

  if (joinSupplierOrders === 'inner') {
    rowsRaw = await db
      .select({
        orderId: orders.id,
        orderRef: orders.ref,
        basisDate: col,
        orderStatus: orders.status,
        totalAmountPence: orders.totalAmountPence,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        companyName: companies.name,
        supplierName: suppliers.tradingName,
        supplierLegalName: suppliers.legalName,
        poId: supplierOrders.id,
        poRef: supplierOrders.ref,
        poStatus: supplierOrders.status,
        customerTotalSnapshotPence: supplierOrders.customerTotalSnapshotPence,
        purchaseTotalPence: supplierOrders.purchaseTotalPence,
        marginPence: supplierOrders.marginPence,
        marginBps: supplierOrders.marginBps,
        marginAdjustmentPence: supplierOrders.marginAdjustmentPence,
        supplierInvoiceTotalPence: supplierOrders.supplierInvoiceTotalPence,
        supplierInvoiceVarianceTotalPence:
          supplierOrders.supplierInvoiceVarianceTotalPence,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .innerJoin(supplierOrders, eq(supplierOrders.orderId, orders.id))
      .leftJoin(suppliers, eq(supplierOrders.supplierId, suppliers.id))
      .where(and(...whereClauses))
      .orderBy(desc(col))
      .then((rows) =>
        rows.map((r) => ({
          ...r,
          supplierName: r.supplierName ?? r.supplierLegalName ?? null,
        })),
      )
  } else {
    rowsRaw = await db
      .select({
        orderId: orders.id,
        orderRef: orders.ref,
        basisDate: col,
        orderStatus: orders.status,
        totalAmountPence: orders.totalAmountPence,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        companyName: companies.name,
        supplierName: suppliers.tradingName,
        supplierLegalName: suppliers.legalName,
        poId: supplierOrders.id,
        poRef: supplierOrders.ref,
        poStatus: supplierOrders.status,
        customerTotalSnapshotPence: supplierOrders.customerTotalSnapshotPence,
        purchaseTotalPence: supplierOrders.purchaseTotalPence,
        marginPence: supplierOrders.marginPence,
        marginBps: supplierOrders.marginBps,
        marginAdjustmentPence: supplierOrders.marginAdjustmentPence,
        supplierInvoiceTotalPence: supplierOrders.supplierInvoiceTotalPence,
        supplierInvoiceVarianceTotalPence:
          supplierOrders.supplierInvoiceVarianceTotalPence,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(companies, eq(orders.companyId, companies.id))
      .leftJoin(supplierOrders, eq(supplierOrders.orderId, orders.id))
      .leftJoin(suppliers, eq(supplierOrders.supplierId, suppliers.id))
      .where(and(...whereClauses))
      .orderBy(desc(col))
      .then((rows) =>
        rows.map((r) => ({
          ...r,
          supplierName: r.supplierName ?? r.supplierLegalName ?? null,
        })),
      )
  }

  // Post-filter cases we couldn't push down cleanly.
  let rows: MarginRow[] = rowsRaw.map((r) => ({
    orderId: r.orderId,
    orderRef: r.orderRef,
    date: r.basisDate,
    customerFirstName: r.customerFirstName,
    customerLastName: r.customerLastName,
    customerCompany: r.companyName,
    supplierName: r.supplierName,
    orderStatus: r.orderStatus,
    poStatus: r.poStatus,
    poId: r.poId,
    poRef: r.poRef,
    revenuePence: r.totalAmountPence,
    revenueSnapshotPence: r.customerTotalSnapshotPence,
    cogsPence: r.purchaseTotalPence,
    marginPence: r.marginPence,
    marginBps: r.marginBps,
    marginAdjustmentPence: r.marginAdjustmentPence ?? 0,
    invoiceTotalPence: r.supplierInvoiceTotalPence,
    varianceTotalPence: r.supplierInvoiceVarianceTotalPence,
  }))

  // "PO none" — orders with no PO row at all.
  if (f.poStatus === 'none') {
    rows = rows.filter((r) => r.poId === null)
  }

  // Invoice captured filter.
  if (f.invoiced === 'yes') rows = rows.filter((r) => r.invoiceTotalPence !== null)
  if (f.invoiced === 'no') rows = rows.filter((r) => r.invoiceTotalPence === null)

  // Variance filter.
  if (f.variance && f.variance !== 'any') {
    rows = rows.filter((r) => {
      const v = r.varianceTotalPence
      if (v === null) return false
      switch (f.variance) {
        case 'within':
          return Math.abs(v) <= 50_00
        case 'over50':
          return Math.abs(v) > 50_00
        case 'under':
          return v < 0
        case 'over':
          return v > 0
      }
      return true
    })
  }

  return { rows, totals: totalsFromRows(rows) }
}

/**
 * Aggregate row totals.
 *
 * Margin % is **recomputed from totals**, never averaged from row-level
 * percentages. One small-revenue deal mustn't swing the headline. This is
 * the canonical helper — the dashboard tile and CSV summary also call it.
 */
export function totalsFromRows(rows: MarginRow[]): MarginTotals {
  let revenuePence = 0
  let cogsPence = 0
  let marginPence = 0
  let marginBase = 0
  for (const r of rows) {
    revenuePence += r.revenuePence
    if (r.cogsPence !== null) cogsPence += r.cogsPence
    if (r.marginPence !== null) marginPence += r.marginPence
    // The base for margin % aggregation is the customer total snapshot at
    // send time — the same number used to derive each stored marginPence.
    // Using snapshot (not live revenue) keeps the aggregate internally
    // consistent with the per-deal stored margin figures.
    if (r.revenueSnapshotPence !== null) marginBase += r.revenueSnapshotPence
  }
  const marginBps =
    marginBase > 0 ? Math.round((marginPence / marginBase) * 10000) : null
  return {
    rows: rows.length,
    revenuePence,
    cogsPence,
    marginPence,
    marginBps,
  }
}
