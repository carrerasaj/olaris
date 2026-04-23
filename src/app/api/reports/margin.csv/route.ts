/**
 * CSV export for the margin report. Same filter surface as the page,
 * same service-layer call. Admin-only — we reuse requireAdmin so a
 * leaked URL can't be hit by an unauthenticated caller.
 */

import { requireAdmin } from '@/lib/admin-auth'
import { getMarginReport } from '@/lib/reports/margin'
import { toCsv } from '@/lib/reports/csv'
import { penceToPounds } from '@/lib/format'
import type {
  DateBasis,
  MarginReportFilters,
} from '@/lib/reports/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  await requireAdmin()
  const url = new URL(req.url)
  const sp = url.searchParams

  const basis = (['signed', 'delivered', 'po_acknowledged', 'order_created']
    .includes(sp.get('basis') ?? '')
    ? sp.get('basis')
    : 'signed') as DateBasis

  const fromISO =
    sp.get('from') ??
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
  const toISO = sp.get('to') ?? new Date().toISOString().slice(0, 10)

  const filters: MarginReportFilters = {
    supplierId: sp.get('supplier') || null,
    poStatus: (sp.get('po_status') as MarginReportFilters['poStatus']) || 'any',
    orderStatus:
      (sp.get('order_status') as MarginReportFilters['orderStatus']) || 'any',
    invoiced: (sp.get('invoiced') as MarginReportFilters['invoiced']) || 'any',
    variance:
      (sp.get('variance') as MarginReportFilters['variance']) || 'any',
  }

  const report = await getMarginReport({ basis, fromISO, toISO, filters })

  const headers = [
    'Date',
    'Order ref',
    'Customer',
    'Company',
    'Supplier',
    'Order status',
    'PO ref',
    'PO status',
    'Revenue (£)',
    'Revenue snapshot (£)',
    'COGS (£)',
    'Margin (£, stored)',
    'Revenue minus COGS (£, sanity check)',
    'Margin adjustment (£)',
    'Margin %',
    'Invoice total (£)',
    'Variance (£)',
  ]

  const rows = report.rows.map((r) => {
    const sanity =
      r.revenueSnapshotPence !== null && r.cogsPence !== null
        ? penceToPounds(
            r.revenueSnapshotPence - r.cogsPence + r.marginAdjustmentPence,
          )
        : null
    return [
      r.date ? r.date.toISOString().slice(0, 10) : '',
      r.orderRef,
      `${r.customerFirstName} ${r.customerLastName}`,
      r.customerCompany ?? '',
      r.supplierName ?? '',
      r.orderStatus,
      r.poRef ?? '',
      r.poStatus ?? '',
      penceToPounds(r.revenuePence).toFixed(2),
      r.revenueSnapshotPence !== null
        ? penceToPounds(r.revenueSnapshotPence).toFixed(2)
        : '',
      r.cogsPence !== null ? penceToPounds(r.cogsPence).toFixed(2) : '',
      r.marginPence !== null ? penceToPounds(r.marginPence).toFixed(2) : '',
      sanity !== null ? sanity.toFixed(2) : '',
      penceToPounds(r.marginAdjustmentPence).toFixed(2),
      r.marginBps !== null ? (r.marginBps / 100).toFixed(2) : '',
      r.invoiceTotalPence !== null
        ? penceToPounds(r.invoiceTotalPence).toFixed(2)
        : '',
      r.varianceTotalPence !== null
        ? penceToPounds(r.varianceTotalPence).toFixed(2)
        : '',
    ]
  })

  // Append a totals row in the same shape.
  const totals = [
    '',
    `TOTALS (${report.totals.rows})`,
    '',
    '',
    '',
    '',
    '',
    '',
    penceToPounds(report.totals.revenuePence).toFixed(2),
    '',
    penceToPounds(report.totals.cogsPence).toFixed(2),
    penceToPounds(report.totals.marginPence).toFixed(2),
    '',
    '',
    report.totals.marginBps !== null
      ? (report.totals.marginBps / 100).toFixed(2)
      : '',
    '',
    '',
  ]

  const csv = toCsv(headers, [...rows, totals])
  const filename = `olaris-margin-${basis}-${fromISO}-${toISO}.csv`
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}
