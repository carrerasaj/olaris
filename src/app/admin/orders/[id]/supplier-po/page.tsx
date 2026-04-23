/**
 * Supplier PO detail + edit page.
 *
 * Lives under the order so the back-breadcrumb leads to the customer order.
 * All actions are server-action binders calling into supplier-po.ts.
 *
 * Editable commercial fields are only shown while the PO is a draft. Once
 * sent, the form becomes read-only and the screen pivots to "capture
 * acknowledgement from the supplier."
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import {
  db,
  orders,
  supplierOrders,
  suppliers,
  customers,
  auditEvents,
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import {
  fmtDate,
  fmtDateTime,
  fmtGBPFromPence,
  penceToPounds,
} from '@/lib/format'
import { SupplierPoStatusPill, auditEventLabel } from '../../../components'
import {
  updateSupplierPOAction,
  sendSupplierPOAction,
  markSupplierPOAcknowledgedAction,
  cancelSupplierPOAction,
  refreshDraftSnapshotAction,
  recordSupplierInvoiceAction,
} from '../../../actions/supplier-po'
import { SupplierInvoiceCard } from './SupplierInvoiceCard'
import {
  diffSnapshots,
  snapshotFromOrder,
  type PurchaseInputs,
} from '@/lib/supplier-po'

export const metadata = { title: 'Supplier PO' }

export default async function SupplierPoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id: orderId } = await params

  const orderRows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (orderRows.length === 0) notFound()
  const { order, customer } = orderRows[0]

  // Find the active PO (non-cancelled). If none, show a redirect-style
  // empty state pointing back at the order.
  const allPos = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.orderId, orderId))
    .orderBy(desc(supplierOrders.createdAt))

  const po = allPos.find((p) => p.status !== 'cancelled') ?? allPos[0]
  if (!po) {
    return (
      <div className="adm-page">
        <div className="adm-pageheader">
          <div>
            <Link
              href={`/admin/orders/${orderId}`}
              style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
            >
              ← Order {order.ref}
            </Link>
            <h1 style={{ marginTop: 4 }}>No supplier PO yet</h1>
            <div className="sub">
              Generate one from the customer order page.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const supplierRows = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, po.supplierId))
    .limit(1)
  const supplier = supplierRows[0]

  const poEvents = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.orderId, orderId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(50)
  const poRelatedEvents = poEvents.filter((e) =>
    e.eventType.startsWith('supplier_po.'),
  )

  const isDraft = po.status === 'draft'
  const isSent = po.status === 'sent'

  const snapshotDrift =
    po.status !== 'draft' && po.status !== 'cancelled'
      ? diffSnapshots(
          { vehicle: po.vehicle, options: po.options, delivery: po.delivery },
          snapshotFromOrder(order),
        )
      : {}

  // ─── binders ───────────────────────────────────────────────────────

  async function save(formData: FormData) {
    'use server'
    const inputs: PurchaseInputs & {
      marginAdjustmentNote?: string
      notesToSupplier?: string
      internalNotes?: string
    } = {
      purchaseNetPence: poundsToPence(formNum(formData, 'purchaseNet')),
      purchaseVatRate: formNum(formData, 'purchaseVatRate') || 20,
      deliveryFeePence: poundsToPence(formNum(formData, 'deliveryFee')),
      onRoadPence: poundsToPence(formNum(formData, 'onRoad')),
      marginAdjustmentPence: poundsToPence(
        formNum(formData, 'marginAdjustment'),
      ),
      marginAdjustmentNote: formStr(formData, 'marginAdjustmentNote'),
      notesToSupplier: formStr(formData, 'notesToSupplier'),
      internalNotes: formStr(formData, 'internalNotes'),
    }
    await updateSupplierPOAction(po.id, inputs)
  }
  async function refreshSnapshot() {
    'use server'
    await refreshDraftSnapshotAction(po.id)
  }
  async function send() {
    'use server'
    await sendSupplierPOAction(po.id)
  }
  async function acknowledge(formData: FormData) {
    'use server'
    await markSupplierPOAcknowledgedAction(po.id, {
      supplierPoRefReceived: formStr(formData, 'supplierPoRefReceived'),
      supplierEtaDate: formStr(formData, 'supplierEtaDate'),
      alsoConfirmCustomerOrder:
        formData.get('alsoConfirmCustomerOrder') === 'on',
    })
  }
  async function cancel(formData: FormData) {
    'use server'
    await cancelSupplierPOAction(po.id, formStr(formData, 'reason') ?? '')
  }
  async function recordInvoice(formData: FormData) {
    'use server'
    const rawVat = formData.get('supplierInvoiceVat')
    const vatProvided = typeof rawVat === 'string' && rawVat.trim() !== ''
    await recordSupplierInvoiceAction(po.id, {
      supplierInvoiceRef: formStr(formData, 'supplierInvoiceRef'),
      supplierInvoiceDate: formStr(formData, 'supplierInvoiceDate'),
      supplierInvoiceNetPence: poundsToPence(formNum(formData, 'supplierInvoiceNet')),
      supplierInvoiceVatPence: vatProvided
        ? poundsToPence(formNum(formData, 'supplierInvoiceVat'))
        : null,
      supplierInvoiceNotes: formStr(formData, 'supplierInvoiceNotes'),
    })
  }

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href={`/admin/orders/${orderId}`}
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Order {order.ref}
          </Link>
          <h1
            style={{
              marginTop: 4,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <span className="mono" style={{ fontSize: 22 }}>
              {po.ref}
            </span>
            <SupplierPoStatusPill status={po.status} />
          </h1>
          <div className="sub">
            To <strong>{supplier?.tradingName ?? supplier?.legalName}</strong>
            {' '}· Customer {customer.firstName} {customer.lastName}
          </div>
        </div>
      </div>

      {Object.keys(snapshotDrift).length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            color: '#78350f',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          ⚠ Customer order has diverged from this PO's snapshot. PO is
          frozen — cancel and regenerate to reflect the new spec.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Snapshot (read-only) */}
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Vehicle + delivery (from customer order)</h2>
              {isDraft && (
                <form action={refreshSnapshot}>
                  <button
                    type="submit"
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                    title="Re-pull the latest vehicle/options/delivery from the customer order"
                  >
                    Refresh snapshot
                  </button>
                </form>
              )}
            </div>
            <div className="adm-card-body">
              <dl className="adm-kv">
                <dt>Vehicle</dt>
                <dd>
                  {po.vehicle.make} {po.vehicle.model}
                  {po.vehicle.derivative ? ` · ${po.vehicle.derivative}` : ''}
                </dd>
                <dt>Colour / trim</dt>
                <dd>
                  {po.vehicle.colour} · {po.vehicle.trim}
                </dd>
                <dt>Fuel / transmission</dt>
                <dd>
                  {po.vehicle.fuel} · {po.vehicle.transmission}
                </dd>
                <dt>Delivery address</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>
                  {po.delivery.address}
                  {'\n'}
                  {po.delivery.city}
                  {'\n'}
                  {po.delivery.postcode}
                </dd>
                {po.delivery.preferredDate && (
                  <>
                    <dt>Preferred delivery</dt>
                    <dd>{po.delivery.preferredDate}</dd>
                  </>
                )}
                {po.options.length > 0 && (
                  <>
                    <dt>Options</dt>
                    <dd>
                      <ul
                        style={{ paddingLeft: 16, margin: 0, fontSize: 13 }}
                      >
                        {po.options.map((o) => (
                          <li key={o.id}>
                            {o.name} <span style={{ color: '#64748b' }}>({o.sku})</span> ×{o.qty}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* Commercials — editable in draft only */}
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Purchase commercials</h2>
            </div>
            <div className="adm-card-body">
              {isDraft ? (
                <form action={save}>
                  <div className="adm-form-grid adm-form-grid-2">
                    <MoneyField
                      name="purchaseNet"
                      label="Net (ex VAT)"
                      defaultPence={po.purchaseNetPence}
                    />
                    <div className="adm-field">
                      <label>VAT rate (%)</label>
                      <input
                        name="purchaseVatRate"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={po.purchaseVatRate}
                      />
                    </div>
                    <MoneyField
                      name="deliveryFee"
                      label="Delivery fee"
                      defaultPence={po.deliveryFeePence}
                    />
                    <MoneyField
                      name="onRoad"
                      label="On-road (VED + first reg + plates)"
                      defaultPence={po.onRoadPence}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      padding: 12,
                      background: '#f8fafc',
                      border: '1px solid #e4e9f1',
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      Margin adjustment (signed, optional)
                    </div>
                    <div
                      className="adm-form-grid adm-form-grid-2"
                      style={{ marginBottom: 0 }}
                    >
                      <MoneyField
                        name="marginAdjustment"
                        label="Adjustment (+/−)"
                        defaultPence={po.marginAdjustmentPence}
                        allowNegative
                      />
                      <div className="adm-field">
                        <label>Reason (required if non-zero)</label>
                        <input
                          name="marginAdjustmentNote"
                          defaultValue={po.marginAdjustmentNote ?? ''}
                          placeholder="e.g. off-PO supplier rebate £200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="adm-field" style={{ marginTop: 14 }}>
                    <label>Notes to supplier (on the PDF)</label>
                    <textarea
                      name="notesToSupplier"
                      rows={2}
                      defaultValue={po.notesToSupplier ?? ''}
                    />
                  </div>
                  <div className="adm-field">
                    <label>Internal notes (never emailed)</label>
                    <textarea
                      name="internalNotes"
                      rows={2}
                      defaultValue={po.internalNotes ?? ''}
                    />
                  </div>

                  <div style={{ textAlign: 'right', marginTop: 14 }}>
                    <button
                      type="submit"
                      className="adm-btn adm-btn-primary adm-btn-sm"
                    >
                      Save draft
                    </button>
                  </div>
                </form>
              ) : (
                <CommercialsReadOnly po={po} />
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Timeline</h2>
            </div>
            <div className="adm-card-body">
              {poRelatedEvents.length === 0 ? (
                <p style={{ color: '#64748b' }}>No PO events yet.</p>
              ) : (
                <ul className="adm-timeline">
                  {poRelatedEvents.map((e) => (
                    <li key={e.id}>
                      <div className="t">
                        {fmtDateTime(e.createdAt)}{' '}
                        <span style={{ color: '#94a3b8' }}>
                          · {e.actorType}
                        </span>
                      </div>
                      <div>{auditEventLabel(e.eventType)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right column — actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isDraft && (
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">Send to supplier</h2>
              </div>
              <div className="adm-card-body">
                <p style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>
                  Emails <strong>{supplier?.primaryContactEmail}</strong> with
                  the PO PDF and the customer's signed contract attached.
                  Customer total is snapshotted at this moment — margin
                  locks against today's price.
                </p>
                <form action={send}>
                  <button
                    type="submit"
                    className="adm-btn adm-btn-primary adm-btn-sm"
                    style={{ width: '100%' }}
                  >
                    Send PO
                  </button>
                </form>
              </div>
            </div>
          )}

          {isSent && (
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">Mark acknowledged</h2>
              </div>
              <div className="adm-card-body">
                <form action={acknowledge}>
                  <div className="adm-field">
                    <label>Their PO reference</label>
                    <input
                      name="supplierPoRefReceived"
                      placeholder="e.g. VC-2026-01234"
                    />
                  </div>
                  <div className="adm-field">
                    <label>Confirmed ETA</label>
                    <input name="supplierEtaDate" type="date" />
                  </div>
                  <label
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      fontSize: 12,
                      color: '#334155',
                      marginTop: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      name="alsoConfirmCustomerOrder"
                      defaultChecked
                    />
                    Also move customer order signed → confirmed
                  </label>
                  <div style={{ textAlign: 'right', marginTop: 10 }}>
                    <button
                      type="submit"
                      className="adm-btn adm-btn-primary adm-btn-sm"
                    >
                      Acknowledge
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <SupplierInvoiceCard po={po} recordInvoice={recordInvoice} />

          {po.status !== 'cancelled' && (
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">Cancel PO</h2>
              </div>
              <div className="adm-card-body">
                <form action={cancel}>
                  <div className="adm-field">
                    <label>Reason (required, min 5 chars)</label>
                    <textarea
                      name="reason"
                      rows={2}
                      required
                      minLength={5}
                      placeholder="Why is this PO being cancelled?"
                    />
                  </div>
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <button
                      type="submit"
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      style={{ color: '#b91c1c' }}
                    >
                      Cancel PO
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Derived snapshot panel */}
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Numbers</h2>
            </div>
            <div className="adm-card-body">
              <dl className="adm-kv">
                <dt>Purchase total</dt>
                <dd
                  className="mono"
                  style={{ fontWeight: 700 }}
                >
                  {fmtGBPFromPence(po.purchaseTotalPence)}
                </dd>
                <dt>Customer total</dt>
                <dd className="mono">
                  {po.customerTotalSnapshotPence !== null
                    ? fmtGBPFromPence(po.customerTotalSnapshotPence)
                    : 'set on send'}
                </dd>
                <dt>Margin</dt>
                <dd
                  className="mono"
                  style={{
                    fontWeight: 700,
                    color:
                      po.marginPence !== null && po.marginPence < 0
                        ? '#b91c1c'
                        : undefined,
                  }}
                >
                  {po.marginPence !== null
                    ? fmtGBPFromPence(po.marginPence)
                    : '—'}
                </dd>
                {po.marginBps !== null && (
                  <>
                    <dt>Margin %</dt>
                    <dd className="mono">{(po.marginBps / 100).toFixed(2)}%</dd>
                  </>
                )}
                {po.sentAt && (
                  <>
                    <dt>Sent</dt>
                    <dd>{fmtDateTime(po.sentAt)}</dd>
                  </>
                )}
                {po.acknowledgedAt && (
                  <>
                    <dt>Acknowledged</dt>
                    <dd>{fmtDateTime(po.acknowledgedAt)}</dd>
                  </>
                )}
                {po.cancelledAt && (
                  <>
                    <dt>Cancelled</dt>
                    <dd>{fmtDate(po.cancelledAt)}</dd>
                  </>
                )}
                {po.supplierPoRefReceived && (
                  <>
                    <dt>Their PO</dt>
                    <dd className="mono">{po.supplierPoRefReceived}</dd>
                  </>
                )}
                {po.supplierEtaDate && (
                  <>
                    <dt>Supplier ETA</dt>
                    <dd>{po.supplierEtaDate}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MoneyField({
  name,
  label,
  defaultPence,
  allowNegative = false,
}: {
  name: string
  label: string
  defaultPence: number
  allowNegative?: boolean
}) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      <input
        name={name}
        type="number"
        step="0.01"
        min={allowNegative ? undefined : 0}
        defaultValue={penceToPounds(defaultPence)}
      />
    </div>
  )
}

function CommercialsReadOnly({
  po,
}: {
  po: {
    purchaseNetPence: number
    purchaseVatRate: number
    purchaseVatPence: number
    deliveryFeePence: number
    onRoadPence: number
    purchaseTotalPence: number
    marginAdjustmentPence: number
    marginAdjustmentNote: string | null
    notesToSupplier: string | null
  }
}) {
  return (
    <div>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        Sent. Values are frozen — cancel and regenerate to change.
      </p>
      <dl className="adm-kv">
        <dt>Net</dt>
        <dd className="mono">{fmtGBPFromPence(po.purchaseNetPence)}</dd>
        <dt>VAT @ {po.purchaseVatRate}%</dt>
        <dd className="mono">{fmtGBPFromPence(po.purchaseVatPence)}</dd>
        <dt>Delivery fee</dt>
        <dd className="mono">{fmtGBPFromPence(po.deliveryFeePence)}</dd>
        <dt>On-road</dt>
        <dd className="mono">{fmtGBPFromPence(po.onRoadPence)}</dd>
        <dt>Total</dt>
        <dd className="mono" style={{ fontWeight: 700 }}>
          {fmtGBPFromPence(po.purchaseTotalPence)}
        </dd>
        {po.marginAdjustmentPence !== 0 && (
          <>
            <dt>Margin adjustment</dt>
            <dd className="mono">
              {fmtGBPFromPence(po.marginAdjustmentPence)}
              {po.marginAdjustmentNote && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {po.marginAdjustmentNote}
                </div>
              )}
            </dd>
          </>
        )}
        {po.notesToSupplier && (
          <>
            <dt>Notes to supplier</dt>
            <dd style={{ whiteSpace: 'pre-wrap' }}>{po.notesToSupplier}</dd>
          </>
        )}
      </dl>
    </div>
  )
}

function formNum(formData: FormData, key: string): number {
  const raw = formData.get(key)
  if (typeof raw !== 'string') return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function formStr(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key)
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed === '' ? undefined : trimmed
}

function poundsToPence(p: number): number {
  return Math.round(p * 100)
}
