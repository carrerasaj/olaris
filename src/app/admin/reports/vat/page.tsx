/**
 * VAT summary — management-support numbers only. Not a VAT return.
 *
 * The page carries a persistent banner saying so — read it before doing
 * anything else with these figures.
 */

import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtGBPFromPence, fmtDate } from '@/lib/format'
import { getVatSummary, currentQuarterStartISO } from '@/lib/reports/vat'
import type { VatSummaryParams } from '@/lib/reports/types'

export const metadata = { title: 'VAT summary' }
export const dynamic = 'force-dynamic'

// Generate a sensible list of recent quarter starts for the picker.
function recentQuarterStarts(count: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(currentQuarterStartISO(now))
    d.setUTCMonth(d.getUTCMonth() - i * 3)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export default async function VatSummaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams

  const quarterStartISO = sp.q ?? currentQuarterStartISO()
  const basis = (sp.basis === 'delivered' ? 'delivered' : 'signed') as VatSummaryParams['basis']

  const summary = await getVatSummary({ quarterStartISO, basis })
  const quarters = recentQuarterStarts(8)

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <h1>VAT summary</h1>
          <div className="sub">
            {fmtDate(summary.quarterStartISO)} → {fmtDate(summary.quarterEndISO)}
            {' '}· basis: <strong>{basis}</strong>
          </div>
        </div>
      </div>

      {/* Management-only banner — always visible. */}
      <div
        style={{
          padding: '14px 18px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          color: '#78350f',
          borderRadius: 6,
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        <strong>This is a management summary to support your accountant.</strong>
        {' '}It is not a VAT return, not a filing artefact, and is not
        suitable for submission to HMRC. Figures come from Olaris internal
        order + PO data; your accountant will reconcile against issued
        invoices, supplier invoices, and the VAT accounting scheme in use.
      </div>

      <form method="get" className="adm-card" style={{ padding: 14 }}>
        <div
          className="adm-form-grid"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          <div className="adm-field">
            <label>Quarter</label>
            <select name="q" defaultValue={quarterStartISO}>
              {quarters.map((q) => (
                <option key={q} value={q}>
                  {fmtDate(q)}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-field">
            <label>Basis</label>
            <select name="basis" defaultValue={basis}>
              <option value="signed">Signed date</option>
              <option value="delivered">Delivered date</option>
            </select>
          </div>
          <div className="adm-field" style={{ alignSelf: 'end' }}>
            <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm">
              Apply
            </button>
          </div>
        </div>
      </form>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginTop: 16,
        }}
      >
        <div className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Output VAT (customer side)</h2>
          </div>
          <div className="adm-card-body">
            <dl className="adm-kv">
              <dt>Net revenue (ex VAT)</dt>
              <dd className="mono">
                {fmtGBPFromPence(summary.outputRevenueNetPence)}
              </dd>
              <dt>VAT collected</dt>
              <dd className="mono" style={{ fontWeight: 700 }}>
                {fmtGBPFromPence(summary.outputVatPence)}
              </dd>
            </dl>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
              Derived from each order's pricing at VAT rate stored on the order.
            </p>
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Input VAT (supplier side)</h2>
          </div>
          <div className="adm-card-body">
            <dl className="adm-kv">
              <dt>Purchase net (ex VAT)</dt>
              <dd className="mono">
                {fmtGBPFromPence(summary.inputPurchaseNetPence)}
              </dd>
              <dt>VAT captured on invoices</dt>
              <dd className="mono" style={{ fontWeight: 700 }}>
                {fmtGBPFromPence(summary.inputVatCapturedPence)}
              </dd>
              <dt>VAT pending capture</dt>
              <dd
                className="mono"
                style={{
                  color: summary.pendingCaptureCount > 0 ? '#b45309' : undefined,
                }}
              >
                {fmtGBPFromPence(summary.inputVatExpectedPence)}
                {summary.pendingCaptureCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: '#b45309',
                      marginLeft: 8,
                    }}
                  >
                    ({summary.pendingCaptureCount} PO
                    {summary.pendingCaptureCount === 1 ? '' : 's'})
                  </span>
                )}
              </dd>
            </dl>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
              Captured numbers come from supplier invoices recorded against
              acknowledged POs. Pending = POs sent in window with no invoice
              yet recorded — PO-side VAT shown as a placeholder.
            </p>
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ marginTop: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Indicative net position</h2>
        </div>
        <div className="adm-card-body">
          <div
            className="mono"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color:
                summary.netPositionPence > 0 ? '#0b1e3f' : '#047857',
            }}
          >
            {fmtGBPFromPence(summary.netPositionPence)}
          </div>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
            Output VAT − (captured input + expected pending). Indicative only
            — depends on the VAT accounting scheme your accountant uses
            (cash vs accrual, Margin Scheme, etc.).
          </p>
          <p style={{ fontSize: 12, marginTop: 10 }}>
            See the{' '}
            <Link href="/admin/reports/margin">margin report</Link> for
            deal-level detail.
          </p>
        </div>
      </div>
    </div>
  )
}
