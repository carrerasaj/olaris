/**
 * Supplier invoice capture card on the PO detail page.
 *
 * Visible only once the PO is acknowledged. Admin enters the invoice
 * net + optional VAT + ref + date; variance derives server-side. Editable
 * — admin can re-record if the dealer reissues the invoice.
 */

import { fmtGBPFromPence, fmtDate, penceToPounds } from '@/lib/format'
import type { SupplierOrder } from '@/db/schema'
import { varianceTone } from '@/lib/supplier-po'

interface Props {
  po: SupplierOrder
  recordInvoice: (formData: FormData) => Promise<void>
}

export function SupplierInvoiceCard({ po, recordInvoice }: Props) {
  if (po.status !== 'acknowledged') return null

  const captured = po.supplierInvoiceNetPence !== null
  const tone = varianceTone(po.supplierInvoiceVarianceTotalPence)

  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <h2 className="adm-card-title">Supplier invoice</h2>
        {captured && <VariancePill pence={po.supplierInvoiceVarianceTotalPence} tone={tone} />}
      </div>
      <div className="adm-card-body">
        {captured && (
          <div style={{ marginBottom: 14 }}>
            <dl className="adm-kv">
              <dt>Invoice ref</dt>
              <dd className="mono">{po.supplierInvoiceRef ?? '—'}</dd>
              <dt>Invoice date</dt>
              <dd>
                {po.supplierInvoiceDate ? fmtDate(po.supplierInvoiceDate) : '—'}
              </dd>
              <dt>Net</dt>
              <dd className="mono">
                {fmtGBPFromPence(po.supplierInvoiceNetPence!)}
              </dd>
              <dt>VAT</dt>
              <dd className="mono">
                {po.supplierInvoiceVatPence !== null
                  ? fmtGBPFromPence(po.supplierInvoiceVatPence)
                  : '—'}
                {po.supplierInvoiceVatPence === null && (
                  <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>
                    Not split on invoice — no input VAT counted.
                  </div>
                )}
              </dd>
              <dt>Total</dt>
              <dd className="mono" style={{ fontWeight: 700 }}>
                {fmtGBPFromPence(po.supplierInvoiceTotalPence!)}
              </dd>
              <dt>PO total</dt>
              <dd className="mono">{fmtGBPFromPence(po.purchaseTotalPence)}</dd>
              <dt>Variance (total)</dt>
              <dd className="mono">
                <VarianceCell
                  pence={po.supplierInvoiceVarianceTotalPence}
                  tone={tone}
                />
              </dd>
              <dt>Received</dt>
              <dd>
                {po.supplierInvoiceReceivedAt
                  ? fmtDate(po.supplierInvoiceReceivedAt)
                  : '—'}
              </dd>
              {po.supplierInvoiceNotes && (
                <>
                  <dt>Notes</dt>
                  <dd style={{ whiteSpace: 'pre-wrap' }}>
                    {po.supplierInvoiceNotes}
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}

        <form action={recordInvoice}>
          <div className="adm-form-grid adm-form-grid-2">
            <div className="adm-field">
              <label>Invoice ref</label>
              <input
                name="supplierInvoiceRef"
                defaultValue={po.supplierInvoiceRef ?? ''}
                placeholder="e.g. INV-2026-00042"
              />
            </div>
            <div className="adm-field">
              <label>Invoice date</label>
              <input
                name="supplierInvoiceDate"
                type="date"
                defaultValue={po.supplierInvoiceDate ?? ''}
              />
            </div>
            <div className="adm-field">
              <label>Net (£)</label>
              <input
                name="supplierInvoiceNet"
                type="number"
                step="0.01"
                min={0}
                required
                defaultValue={
                  po.supplierInvoiceNetPence !== null
                    ? penceToPounds(po.supplierInvoiceNetPence).toFixed(2)
                    : ''
                }
              />
            </div>
            <div className="adm-field">
              <label>VAT (£, blank if not split)</label>
              <input
                name="supplierInvoiceVat"
                type="number"
                step="0.01"
                min={0}
                defaultValue={
                  po.supplierInvoiceVatPence !== null
                    ? penceToPounds(po.supplierInvoiceVatPence).toFixed(2)
                    : ''
                }
              />
            </div>
          </div>
          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Notes (optional)</label>
            <textarea
              name="supplierInvoiceNotes"
              rows={2}
              defaultValue={po.supplierInvoiceNotes ?? ''}
              placeholder="e.g. supplier split the delivery fee differently"
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <button
              type="submit"
              className="adm-btn adm-btn-primary adm-btn-sm"
            >
              {captured ? 'Update invoice' : 'Record invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VariancePill({
  pence,
  tone,
}: {
  pence: number | null
  tone: 'ok' | 'amber' | 'red'
}) {
  if (pence === null) return null
  const label =
    tone === 'red' ? 'Variance >£250' : tone === 'amber' ? 'Variance >£50' : 'On PO'
  const colour =
    tone === 'red' ? '#b91c1c' : tone === 'amber' ? '#b45309' : '#047857'
  const bg =
    tone === 'red' ? '#fee2e2' : tone === 'amber' ? '#fef3c7' : '#d1fae5'
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        color: colour,
        background: bg,
      }}
    >
      {label}
    </span>
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
  const colour =
    tone === 'red' ? '#b91c1c' : tone === 'amber' ? '#b45309' : '#047857'
  return (
    <span style={{ color: colour, fontWeight: 700 }}>
      {pence > 0 ? '+' : ''}
      {fmtGBPFromPence(pence)}
    </span>
  )
}
