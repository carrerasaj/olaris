/**
 * Dashboard summary — 90-day gross profit + operational alerts.
 *
 * Gross profit aggregates via getMarginReport + totalsFromRows, so the
 * aggregate margin % rule stays centralised: always recomputed from
 * totals, never averaged from rows.
 */

import { and, eq, inArray, isNull, lte } from 'drizzle-orm'
import { db, supplierOrders } from '@/db/client'
import type { DashboardSummary } from './types'
import { getMarginReport } from './margin'

const WINDOW_DAYS = 90
const INVOICE_AGING_DAYS = 30

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date()
  const from = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const report = await getMarginReport({
    basis: 'signed',
    fromISO: from.toISOString().slice(0, 10),
    toISO: now.toISOString().slice(0, 10),
  })

  const openPoRows = await db
    .select({ id: supplierOrders.id })
    .from(supplierOrders)
    .where(inArray(supplierOrders.status, ['draft', 'sent']))

  // Invoice aging: acknowledged POs where acknowledgedAt is older than
  // now - INVOICE_AGING_DAYS and no invoice has been received yet.
  const agingCutoff = new Date(
    now.getTime() - INVOICE_AGING_DAYS * 24 * 60 * 60 * 1000,
  )
  const agingRows = await db
    .select({ id: supplierOrders.id })
    .from(supplierOrders)
    .where(
      and(
        eq(supplierOrders.status, 'acknowledged'),
        lte(supplierOrders.acknowledgedAt, agingCutoff),
        isNull(supplierOrders.supplierInvoiceReceivedAt),
      ),
    )

  return {
    windowDays: WINDOW_DAYS,
    grossProfitPence: report.totals.marginPence,
    grossProfitMarginBps: report.totals.marginBps,
    dealCount: report.totals.rows,
    openPoCount: openPoRows.length,
    invoiceAgingCount: agingRows.length,
  }
}
