/**
 * Deal-level P&L card on the customer order detail page.
 *
 * Reads from the active supplier PO (if any). Shows:
 *   - Revenue (snapshot if PO exists, live otherwise)
 *   - COGS from PO
 *   - Margin — primary figure (stored on PO) with adjustment indicator
 *     and sanity-check line (revenue − COGS + adj)
 *   - Margin %
 *   - Supplier invoice capture + variance
 *   - VAT split
 *
 * Positioned alongside DeliveryCard + SupplierPOCard. Hides itself when
 * the order isn't past the signing event, since there's nothing yet to
 * report.
 */

import { fmtGBPFromPence, penceToPounds } from '@/lib/format'
import type { Order, SupplierOrder } from '@/db/schema'
import { varianceTone } from '@/lib/supplier-po'

interface Props {
  order: Order
  activePO: SupplierOrder | null
}

export function DealPLCard({ order, activePO }: Props) {
  const postSign = [
    'signed',
    'confirmed',
    'on_order',
    'ready_for_handover',
    'delivered',
    'cancelled_post_sign',
  ].includes(order.status)
  if (!postSign) return null

  const po = activePO
  const revenuePence =
    po?.customerTotalSnapshotPence ?? order.totalAmountPence
  const revenueLabel = po?.customerTotalSnapshotPence
    ? 'Revenue (snapshot)'
    : 'Revenue (live)'
  const cogsPence = po?.purchaseTotalPence ?? null
  const marginPence = po?.marginPence ?? null
  const marginBps = po?.marginBps ?? null
  const adj = po?.marginAdjustmentPence ?? 0

  // Sanity check: revenue − COGS + adjustment. Should equal marginPence
  // when stored values are consistent; shown as separate line so admin
  // can see the derivation matches.
  const sanityCheck =
    po?.customerTotalSnapshotPence !== undefined &&
    po?.customerTotalSnapshotPence !== null &&
    cogsPence !== null
      ? po.customerTotalSnapshotPence - cogsPence + adj
      : null

  const outputVatPence = Math.round(
    ((order.pricing.vehicleNetPence +
      order.options.reduce((s, o) => s + o.netPence * o.qty, 0) -
      order.pricing.discountPence) *
      order.pricing.vatRate) /
      100,
  )

  const variancePence = po?.supplierInvoiceVarianceTotalPence ?? null
  const vTone = varianceTone(variancePence)

  return (
    <div className="adm-card" style={{ marginTop: 16 }}>
      <div className="adm-card-head">
        <h2 className="adm-card-title">Deal P&amp;L</h2>
      </div>
      <div className="adm-card-body">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
        >
          <Stat label={revenueLabel} value={fmtGBPFromPence(revenuePence)} mono />
          <Stat
            label="COGS (from PO)"
            value={cogsPence !== null ? fmtGBPFromPence(cogsPence) : 'No PO yet'}
            mono
            muted={cogsPence === null}
          />
          <Stat
            label="Margin"
            value={marginPence !== null ? fmtGBPFromPence(marginPence) : '—'}
            mono
            bold
            badColor={marginPence !== null && marginPence < 0}
          />
          <Stat
            label="Margin %"
            value={
              marginBps !== null ? `${(marginBps / 100).toFixed(2)}%` : '—'
            }
            mono
          />
        </div>

        {/* Sanity check row */}
        {po && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: '#f8fafc',
              border: '1px solid #e4e9f1',
              borderRadius: 6,
              fontSize: 12,
              color: '#475569',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              Stored margin:{' '}
              <strong>
                {marginPence !== null ? fmtGBPFromPence(marginPence) : '—'}
              </strong>
            </div>
            <div>
              Revenue − COGS
              {adj !== 0 ? ' + adjustment' : ''}:{' '}
              <strong>
                {sanityCheck !== null ? fmtGBPFromPence(sanityCheck) : '—'}
              </strong>
              {adj !== 0 && (
                <span
                  style={{ color: '#b45309', marginLeft: 8 }}
                  title={po.marginAdjustmentNote ?? ''}
                >
                  (adj: {adj > 0 ? '+' : ''}
                  {fmtGBPFromPence(adj)})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Supplier invoice / variance */}
        {po?.status === 'acknowledged' && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              background: variancePence === null ? '#eff6ff' : varianceBg(vTone),
              border: `1px solid ${varianceBorder(vTone, variancePence === null)}`,
              borderRadius: 6,
              fontSize: 12,
              color: variancePence === null ? '#0b1e3f' : varianceFg(vTone),
            }}
          >
            {po.supplierInvoiceTotalPence !== null ? (
              <>
                Supplier invoice:{' '}
                <strong>
                  {fmtGBPFromPence(po.supplierInvoiceTotalPence)}
                </strong>{' '}
                · Variance vs PO:{' '}
                <strong>
                  {variancePence !== null
                    ? `${variancePence > 0 ? '+' : ''}${fmtGBPFromPence(variancePence)}`
                    : '—'}
                </strong>
              </>
            ) : (
              <>Supplier invoice not yet received.</>
            )}
          </div>
        )}

        {/* VAT split */}
        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          <Stat
            label="Output VAT (customer)"
            value={fmtGBPFromPence(outputVatPence)}
            mono
          />
          <Stat
            label="Input VAT (PO)"
            value={po ? fmtGBPFromPence(po.purchaseVatPence) : '—'}
            mono
            muted={!po}
          />
          <Stat
            label="Input VAT (invoiced)"
            value={
              po?.supplierInvoiceVatPence !== null && po?.supplierInvoiceVatPence !== undefined
                ? fmtGBPFromPence(po.supplierInvoiceVatPence)
                : '—'
            }
            mono
            muted={po?.supplierInvoiceVatPence === null || po?.supplierInvoiceVatPence === undefined}
          />
        </div>
      </div>
      {false && penceToPounds(0) /* keep import compatible */}
    </div>
  )
}

function Stat({
  label,
  value,
  mono,
  bold,
  muted,
  badColor,
}: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
  muted?: boolean
  badColor?: boolean
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          fontWeight: 700,
          color: '#64748b',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: bold ? 15 : 13,
          marginTop: 2,
          color: badColor ? '#b91c1c' : muted ? '#cbd5e1' : '#0f172a',
          fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
          fontWeight: bold ? 700 : 600,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function varianceBg(tone: 'ok' | 'amber' | 'red'): string {
  if (tone === 'red') return '#fee2e2'
  if (tone === 'amber') return '#fef3c7'
  return '#f0fdf4'
}
function varianceBorder(tone: 'ok' | 'amber' | 'red', pending: boolean): string {
  if (pending) return '#bfdbfe'
  if (tone === 'red') return '#fca5a5'
  if (tone === 'amber') return '#fcd34d'
  return '#bbf7d0'
}
function varianceFg(tone: 'ok' | 'amber' | 'red'): string {
  if (tone === 'red') return '#991b1b'
  if (tone === 'amber') return '#78350f'
  return '#065f46'
}
