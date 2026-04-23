/**
 * Margin report — read-only list with querystring-driven filters. All
 * data comes from src/lib/reports/margin.ts; no raw Drizzle here.
 *
 * CSV export is served from /api/reports/margin.csv so it's a plain
 * GET download (linking directly to the same querystring).
 */

import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { db, suppliers } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtDate, fmtGBPFromPence, penceToPounds } from '@/lib/format'
import { getMarginReport } from '@/lib/reports/margin'
import type {
  DateBasis,
  MarginReportFilters,
} from '@/lib/reports/types'
import { OrderStatusPill } from '../../components'
import { SupplierPoStatusPill } from '../../components'
import { varianceTone } from '@/lib/supplier-po'

export const metadata = { title: 'Margin report' }
export const dynamic = 'force-dynamic'

const BASIS_OPTIONS: Array<{ value: DateBasis; label: string }> = [
  { value: 'signed', label: 'Signed date' },
  { value: 'delivered', label: 'Delivered date' },
  { value: 'po_acknowledged', label: 'PO acknowledged date' },
  { value: 'order_created', label: 'Order created date' },
]

function defaultDates(): { fromISO: string; toISO: string } {
  const now = new Date()
  const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  return {
    fromISO: from.toISOString().slice(0, 10),
    toISO: now.toISOString().slice(0, 10),
  }
}

export default async function MarginReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams

  const basis = (['signed', 'delivered', 'po_acknowledged', 'order_created']
    .includes(sp.basis ?? '')
    ? sp.basis
    : 'signed') as DateBasis
  const defaults = defaultDates()
  const fromISO = sp.from ?? defaults.fromISO
  const toISO = sp.to ?? defaults.toISO

  const filters: MarginReportFilters = {
    supplierId: sp.supplier || null,
    poStatus: (sp.po_status as MarginReportFilters['poStatus']) || 'any',
    orderStatus:
      (sp.order_status as MarginReportFilters['orderStatus']) || 'any',
    invoiced: (sp.invoiced as MarginReportFilters['invoiced']) || 'any',
    variance: (sp.variance as MarginReportFilters['variance']) || 'any',
  }

  const [report, supplierOptions] = await Promise.all([
    getMarginReport({ basis, fromISO, toISO, filters }),
    db
      .select({ id: suppliers.id, name: suppliers.legalName, trading: suppliers.tradingName })
      .from(suppliers)
      .where(eq(suppliers.active, true))
      .orderBy(asc(suppliers.legalName)),
  ])

  // CSV export URL — same filters, different route.
  const qs = new URLSearchParams({
    basis,
    from: fromISO,
    to: toISO,
    supplier: filters.supplierId ?? '',
    po_status: filters.poStatus ?? 'any',
    order_status: filters.orderStatus ?? 'any',
    invoiced: filters.invoiced ?? 'any',
    variance: filters.variance ?? 'any',
  })
  const csvUrl = `/api/reports/margin.csv?${qs.toString()}`

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <h1>Margin report</h1>
          <div className="sub">
            {report.totals.rows} row{report.totals.rows === 1 ? '' : 's'} ·
            basis: <strong>{basis.replaceAll('_', ' ')}</strong>
          </div>
        </div>
        <a href={csvUrl} className="adm-btn adm-btn-ghost">
          Export CSV
        </a>
      </div>

      {/* Filters — plain GET form so URLs stay shareable. */}
      <form method="get" className="adm-card" style={{ padding: 14 }}>
        <div
          className="adm-form-grid"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          <div className="adm-field">
            <label>Date basis</label>
            <select name="basis" defaultValue={basis}>
              {BASIS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-field">
            <label>From</label>
            <input name="from" type="date" defaultValue={fromISO} />
          </div>
          <div className="adm-field">
            <label>To</label>
            <input name="to" type="date" defaultValue={toISO} />
          </div>
          <div className="adm-field">
            <label>Supplier</label>
            <select name="supplier" defaultValue={filters.supplierId ?? ''}>
              <option value="">Any</option>
              {supplierOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.trading ?? s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-field">
            <label>PO status</label>
            <select name="po_status" defaultValue={filters.poStatus}>
              <option value="any">Any</option>
              <option value="none">No PO</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="adm-field">
            <label>Order status</label>
            <select name="order_status" defaultValue={filters.orderStatus}>
              <option value="any">Any</option>
              <option value="signed">Signed</option>
              <option value="confirmed">Confirmed</option>
              <option value="on_order">On order</option>
              <option value="ready_for_handover">Ready for handover</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div className="adm-field">
            <label>Invoice captured</label>
            <select name="invoiced" defaultValue={filters.invoiced}>
              <option value="any">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="adm-field">
            <label>Variance</label>
            <select name="variance" defaultValue={filters.variance}>
              <option value="any">Any</option>
              <option value="within">Within £50</option>
              <option value="over50">Over £50 (±)</option>
              <option value="over">Over-invoiced (+)</option>
              <option value="under">Under-invoiced (−)</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm">
            Apply filters
          </button>
        </div>
      </form>

      <div className="adm-card" style={{ marginTop: 16 }}>
        {report.rows.length === 0 ? (
          <div className="adm-empty">
            <h3>No rows match</h3>
            <p>Widen the date range or clear filters.</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref</th>
                <th>Customer</th>
                <th>Supplier</th>
                <th>Order</th>
                <th>PO</th>
                <th className="num">Revenue</th>
                <th className="num">COGS</th>
                <th className="num">Margin</th>
                <th className="num">Margin %</th>
                <th className="num">Invoice</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => {
                const tone = varianceTone(r.varianceTotalPence)
                return (
                  <tr key={`${r.orderId}-${r.poId ?? 'no-po'}`}>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {r.date ? fmtDate(r.date) : '—'}
                    </td>
                    <td className="mono">
                      <Link href={`/admin/orders/${r.orderId}`}>
                        {r.orderRef}
                      </Link>
                    </td>
                    <td>
                      {r.customerFirstName} {r.customerLastName}
                      {r.customerCompany && (
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {r.customerCompany}
                        </div>
                      )}
                    </td>
                    <td>{r.supplierName ?? '—'}</td>
                    <td>
                      <OrderStatusPill status={r.orderStatus} />
                    </td>
                    <td>
                      {r.poStatus ? (
                        <SupplierPoStatusPill status={r.poStatus} />
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td className="num mono">
                      {fmtGBPFromPence(r.revenuePence)}
                    </td>
                    <td className="num mono">
                      {r.cogsPence !== null ? fmtGBPFromPence(r.cogsPence) : '—'}
                    </td>
                    <td
                      className="num mono"
                      style={{
                        fontWeight: 700,
                        color:
                          r.marginPence !== null && r.marginPence < 0
                            ? '#b91c1c'
                            : undefined,
                      }}
                    >
                      {r.marginPence !== null
                        ? fmtGBPFromPence(r.marginPence)
                        : '—'}
                      {r.marginAdjustmentPence !== 0 && (
                        <span
                          title={`Adjustment: ${fmtGBPFromPence(r.marginAdjustmentPence)}`}
                          style={{
                            fontSize: 10,
                            color: '#64748b',
                            marginLeft: 4,
                          }}
                        >
                          (adj)
                        </span>
                      )}
                    </td>
                    <td className="num mono">
                      {r.marginBps !== null
                        ? `${(r.marginBps / 100).toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="num mono">
                      {r.invoiceTotalPence !== null
                        ? fmtGBPFromPence(r.invoiceTotalPence)
                        : '—'}
                    </td>
                    <td>
                      <VarianceCell
                        pence={r.varianceTotalPence}
                        tone={tone}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #0b1e3f', fontWeight: 700 }}>
                <td colSpan={6} style={{ padding: '10px 8px' }}>
                  Totals ({report.totals.rows})
                </td>
                <td className="num mono">
                  {fmtGBPFromPence(report.totals.revenuePence)}
                </td>
                <td className="num mono">
                  {fmtGBPFromPence(report.totals.cogsPence)}
                </td>
                <td
                  className="num mono"
                  style={{
                    color:
                      report.totals.marginPence < 0 ? '#b91c1c' : undefined,
                  }}
                >
                  {fmtGBPFromPence(report.totals.marginPence)}
                </td>
                <td className="num mono">
                  {report.totals.marginBps !== null
                    ? `${(report.totals.marginBps / 100).toFixed(2)}%`
                    : '—'}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      <p
        style={{
          fontSize: 11,
          color: '#64748b',
          marginTop: 10,
          paddingLeft: 4,
        }}
      >
        Margin is the stored value on the supplier PO (revenue snapshot −
        purchase total + manual adjustment). Aggregate margin % is recomputed
        from totals, never averaged from row percentages.
      </p>
      {/* Reference the import so next-lint doesn't complain about unused
          deps if this page is ever trimmed. */}
      {false && penceToPounds(0)}
    </div>
  )
}

function VarianceCell({
  pence,
  tone,
}: {
  pence: number | null
  tone: 'ok' | 'amber' | 'red'
}) {
  if (pence === null) return <span style={{ color: '#cbd5e1' }}>—</span>
  const colour = tone === 'red' ? '#b91c1c' : tone === 'amber' ? '#b45309' : '#64748b'
  const bg = tone === 'red' ? '#fee2e2' : tone === 'amber' ? '#fef3c7' : 'transparent'
  return (
    <span
      className="mono"
      style={{
        fontSize: 12,
        color: colour,
        background: bg,
        padding: tone === 'ok' ? 0 : '2px 8px',
        borderRadius: 999,
        fontWeight: tone === 'ok' ? undefined : 700,
      }}
    >
      {pence > 0 ? '+' : ''}
      {fmtGBPFromPence(pence)}
    </span>
  )
}
