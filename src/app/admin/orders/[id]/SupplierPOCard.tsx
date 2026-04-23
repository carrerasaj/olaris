/**
 * Supplier PO summary card on the order detail page.
 *
 * Renders one of three states:
 *   1. No vehicle supplier assigned — empty state nudging to pick one
 *   2. Vehicle supplier assigned, no active PO — "Generate draft PO" button
 *   3. Active PO exists — compact summary + "Open PO" link + drift banner
 *      if the customer order has been edited since the PO was sent
 */

import Link from 'next/link'
import { fmtDate, fmtGBPFromPence } from '@/lib/format'
import { SupplierPoStatusPill } from '../../components'
import type { Order, SupplierOrder } from '@/db/schema'
import { diffSnapshots, snapshotFromOrder } from '@/lib/supplier-po'

interface SupplierPOCardProps {
  order: Order
  activePO: SupplierOrder | null
  createDraftAction: () => Promise<void>
}

export function SupplierPOCard({
  order,
  activePO,
  createDraftAction,
}: SupplierPOCardProps) {
  const hasVehicleSupplier = !!order.vehicleSupplierId

  return (
    <div className="adm-card" style={{ marginTop: 16 }}>
      <div className="adm-card-head">
        <h2 className="adm-card-title">Supplier PO</h2>
        {activePO && <SupplierPoStatusPill status={activePO.status} />}
      </div>
      <div className="adm-card-body">
        {!hasVehicleSupplier && (
          <div className="adm-empty">
            <p>
              Assign a vehicle supplier above to build a purchase order.
            </p>
          </div>
        )}

        {hasVehicleSupplier && !activePO && (
          <div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
              Generate a draft PO to send the dealer — it copies the vehicle,
              options and delivery from this order. You'll enter the
              purchase-side commercials on the next screen.
            </p>
            <form action={createDraftAction}>
              <button
                type="submit"
                className="adm-btn adm-btn-primary adm-btn-sm"
              >
                Generate draft PO
              </button>
            </form>
          </div>
        )}

        {activePO && (
          <ActivePoSummary order={order} po={activePO} />
        )}
      </div>
    </div>
  )
}

function ActivePoSummary({
  order,
  po,
}: {
  order: Order
  po: SupplierOrder
}) {
  // Detect drift: PO is post-draft but the customer order snapshot has
  // diverged from what's on the PO. Drafts can refresh freely, so no
  // banner needed there.
  const showDriftBanner =
    po.status !== 'draft' &&
    po.status !== 'cancelled' &&
    Object.keys(
      diffSnapshots(
        { vehicle: po.vehicle, options: po.options, delivery: po.delivery },
        snapshotFromOrder(order),
      ),
    ).length > 0

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Stat label="PO ref" value={po.ref} mono />
        <Stat
          label="Purchase total"
          value={fmtGBPFromPence(po.purchaseTotalPence)}
          mono
        />
        <Stat
          label="Margin"
          value={
            po.marginPence !== null
              ? fmtGBPFromPence(po.marginPence)
              : 'set on send'
          }
          mono
          highlight={po.marginPence !== null && po.marginPence < 0}
        />
        <Stat
          label="Supplier ETA"
          value={po.supplierEtaDate ? fmtDate(po.supplierEtaDate) : '—'}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link
          href={`/admin/orders/${po.orderId}/supplier-po`}
          className="adm-btn adm-btn-ghost adm-btn-sm"
        >
          Open PO →
        </Link>
      </div>

      {showDriftBanner && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            color: '#78350f',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          ⚠ Customer order has changed since PO {po.ref} was {po.status}. The
          PO is frozen — cancel and regenerate to reflect the new spec.
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  mono,
  highlight,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
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
          fontSize: 13,
          marginTop: 2,
          color: highlight ? '#b91c1c' : '#0f172a',
          fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  )
}
