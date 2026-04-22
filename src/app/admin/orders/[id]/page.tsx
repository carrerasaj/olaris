import Link from 'next/link'
import { notFound } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import {
  db,
  orders,
  customers,
  companies,
  auditEvents,
  signatures,
  signingTokens,
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtGBPFromPence, fmtDate, fmtDateTime, fmtRelative } from '@/lib/format'
import { OrderStatusPill, auditEventLabel } from '../../components'
import {
  sendForSignatureAction,
  cancelOrderAction,
  markDeliveredAction,
  resendSigningLinkAction,
  deleteDraftAction,
  signAsRepAction,
  type RepSignInput,
} from '../../actions/orders'
import { RepSignButton } from './RepSignButton'

export const metadata = { title: 'Order' }

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const rows = await db
    .select({
      order: orders,
      customer: customers,
      company: companies,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(companies, eq(orders.companyId, companies.id))
    .where(eq(orders.id, id))
    .limit(1)
  if (rows.length === 0) notFound()
  const { order, customer, company } = rows[0]

  const [orderEvents, orderSigs, activeToken] = await Promise.all([
    db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.orderId, id))
      .orderBy(desc(auditEvents.createdAt))
      .limit(50),
    db.select().from(signatures).where(eq(signatures.orderId, id)),
    db
      .select()
      .from(signingTokens)
      .where(eq(signingTokens.orderId, id))
      .orderBy(desc(signingTokens.createdAt))
      .limit(1),
  ])

  const canEdit = order.status === 'draft'
  const canSend = order.status === 'draft'
  const canCancel = !['signed', 'delivered', 'cancelled'].includes(order.status)
  const canDeliver = order.status === 'signed'
  const canResend = order.status === 'sent' || order.status === 'partially_signed'
  const canDelete = order.status === 'draft'
  const repHasSigned = orderSigs.some((s) => s.signerRole === 'rep')
  const canRepSign =
    (order.status === 'sent' || order.status === 'partially_signed') && !repHasSigned
  const user = await requireAdmin()
  const repName = user.name ?? user.email ?? 'Olaris representative'

  // Server-action binders
  async function send() {
    'use server'
    await sendForSignatureAction(id)
  }
  async function cancel() {
    'use server'
    await cancelOrderAction(id)
  }
  async function deliver() {
    'use server'
    await markDeliveredAction(id)
  }
  async function resend() {
    'use server'
    await resendSigningLinkAction(id)
  }
  async function del() {
    'use server'
    await deleteDraftAction(id)
  }
  async function repSign(orderId: string, input: RepSignInput) {
    'use server'
    return signAsRepAction(orderId, input)
  }

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href="/admin/orders"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Orders
          </Link>
          <h1 style={{ marginTop: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="mono" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {order.ref}
            </span>
            <OrderStatusPill status={order.status} />
          </h1>
          <div className="sub">
            <Link
              href={`/admin/customers/${customer.id}`}
              style={{ color: '#1e3a8a', textDecoration: 'none' }}
            >
              {customer.firstName} {customer.lastName}
            </Link>
            {company && ` · ${company.name}`} ·{' '}
            <span className="mono" style={{ color: '#64748b' }}>
              {customer.email}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {canEdit && (
            <Link href={`/admin/orders/${id}/edit`} className="adm-btn adm-btn-ghost">
              Edit
            </Link>
          )}
          {canSend && (
            <form action={send}>
              <button type="submit" className="adm-btn adm-btn-primary">
                Send for signature
              </button>
            </form>
          )}
          {canRepSign && (
            <RepSignButton orderId={id} repName={repName} onSign={repSign} />
          )}
          {canResend && (
            <form action={resend}>
              <button type="submit" className="adm-btn adm-btn-ghost">
                Resend link
              </button>
            </form>
          )}
          {canDeliver && (
            <form action={deliver}>
              <button type="submit" className="adm-btn adm-btn-accent">
                Mark delivered
              </button>
            </form>
          )}
          {canDelete && (
            <form action={del}>
              <button type="submit" className="adm-btn adm-btn-danger">
                Delete draft
              </button>
            </form>
          )}
          {!canDelete && canCancel && (
            <form action={cancel}>
              <button type="submit" className="adm-btn adm-btn-danger">
                Cancel order
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="adm-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Vehicle</h2>
            </div>
            <div className="adm-card-body">
              <dl className="adm-kv">
                <dt>Make / model</dt>
                <dd>
                  {order.vehicle.make} {order.vehicle.model}
                </dd>
                <dt>Derivative</dt>
                <dd>{order.vehicle.derivative}</dd>
                <dt>Category</dt>
                <dd>{order.vehicle.category}</dd>
                <dt>Fuel / gearbox</dt>
                <dd>
                  {order.vehicle.fuel} · {order.vehicle.transmission}
                </dd>
                <dt>Colour / trim</dt>
                <dd>
                  {order.vehicle.colour} · {order.vehicle.trim}
                </dd>
                <dt>Registration</dt>
                <dd>{order.vehicle.registration}</dd>
                <dt>CO₂</dt>
                <dd>{order.vehicle.co2} g/km</dd>
              </dl>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">
                Options ({order.options.length})
              </h2>
            </div>
            {order.options.length === 0 ? (
              <div style={{ padding: '20px', fontSize: 13, color: '#64748b' }}>
                No factory options added.
              </div>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th className="num">Qty</th>
                    <th className="num">Net</th>
                    <th className="num">VAT</th>
                    <th className="num">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.options.map((o) => (
                    <tr key={o.id}>
                      <td>{o.name || '—'}</td>
                      <td className="mono">{o.sku || '—'}</td>
                      <td className="num mono">{o.qty}</td>
                      <td className="num mono">{fmtGBPFromPence(o.netPence)}</td>
                      <td className="num mono">{o.vatRate}%</td>
                      <td className="num mono">
                        {fmtGBPFromPence(o.netPence * o.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Audit trail</h2>
            </div>
            <div className="adm-card-body">
              <div className="adm-timeline">
                {orderEvents.map((e) => (
                  <div key={e.id} className="adm-timeline-item">
                    <div className="adm-timeline-dot" />
                    <div>
                      <div className="adm-timeline-title">
                        {auditEventLabel(e.eventType)}
                      </div>
                      {e.payload && Object.keys(e.payload).length > 0 && (
                        <div className="adm-timeline-sub mono" style={{ fontSize: 11 }}>
                          {JSON.stringify(e.payload)}
                        </div>
                      )}
                      <div className="adm-timeline-time">
                        {fmtDateTime(e.createdAt)}
                        {e.actorType && ` · ${e.actorType}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Totals</h2>
            </div>
            <div className="adm-card-body">
              <dl className="adm-kv">
                <dt>Finance type</dt>
                <dd>{order.financeType}</dd>
                <dt>Vehicle net</dt>
                <dd className="mono">
                  {fmtGBPFromPence(
                    order.pricing.vehicleNetPence - order.pricing.discountPence,
                  )}
                </dd>
                <dt>VAT @ {order.pricing.vatRate}%</dt>
                <dd className="mono">
                  {fmtGBPFromPence(
                    Math.round(
                      ((order.pricing.vehicleNetPence -
                        order.pricing.discountPence +
                        order.options.reduce((s, o) => s + o.netPence * o.qty, 0)) *
                        order.pricing.vatRate) /
                        100,
                    ),
                  )}
                </dd>
                <dt>OTR</dt>
                <dd className="mono">
                  {fmtGBPFromPence(
                    order.pricing.vedPence +
                      order.pricing.firstRegFeePence +
                      order.pricing.deliveryFeePence +
                      order.pricing.numberPlatesPence,
                  )}
                </dd>
                <dt style={{ borderTop: '1px solid #e4e9f1', paddingTop: 10 }}>Drive-away</dt>
                <dd
                  className="mono"
                  style={{
                    borderTop: '1px solid #e4e9f1',
                    paddingTop: 10,
                    fontWeight: 700,
                  }}
                >
                  {fmtGBPFromPence(order.totalAmountPence)}
                </dd>
                {order.financeType !== 'OP' && (
                  <>
                    <dt>Monthly (incl. add-ons)</dt>
                    <dd className="mono" style={{ color: '#0891b2', fontWeight: 700 }}>
                      {fmtGBPFromPence(order.monthlyAmountPence)} + VAT
                    </dd>
                    <dt>Term</dt>
                    <dd>{order.finance.term} months</dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Signatures</h2>
            </div>
            <div className="adm-card-body" style={{ fontSize: 13 }}>
              {orderSigs.length === 0 ? (
                <div style={{ color: '#64748b' }}>No signatures yet.</div>
              ) : (
                orderSigs.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '10px 0',
                      borderBottom: '1px dashed #e4e9f1',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {s.signerRole === 'customer' ? 'Customer' : 'Olaris rep'} · {s.signerName}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                      {fmtDateTime(s.signedAt)}
                      {s.ip && ` · ${s.ip}`}
                      {s.geoCity && `, ${s.geoCity}`}
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}
                    >
                      doc {s.documentSha256.slice(0, 16)}…
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {activeToken.length > 0 &&
            (order.status === 'sent' || order.status === 'partially_signed') && (
              <div className="adm-card">
                <div className="adm-card-head">
                  <h2 className="adm-card-title">Signing link</h2>
                </div>
                <div className="adm-card-body" style={{ fontSize: 12 }}>
                  <div style={{ color: '#64748b' }}>
                    Expires{' '}
                    <strong style={{ color: '#0f172a' }}>
                      {fmtDateTime(activeToken[0].expiresAt)}
                    </strong>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <code
                      style={{
                        fontSize: 11,
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: 4,
                        display: 'block',
                        wordBreak: 'break-all',
                      }}
                    >
                      {`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://olaris.co.uk'}/sign/${activeToken[0].token}`}
                    </code>
                  </div>
                </div>
              </div>
            )}

          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Timeline</h2>
            </div>
            <div className="adm-card-body" style={{ fontSize: 12.5 }}>
              <dl className="adm-kv">
                <dt>Created</dt>
                <dd>{fmtDateTime(order.createdAt)}</dd>
                {order.sentAt && (
                  <>
                    <dt>Sent</dt>
                    <dd>{fmtDateTime(order.sentAt)}</dd>
                  </>
                )}
                {order.signedAt && (
                  <>
                    <dt>Signed</dt>
                    <dd>{fmtDateTime(order.signedAt)}</dd>
                  </>
                )}
                {order.deliveredAt && (
                  <>
                    <dt>Delivered</dt>
                    <dd>{fmtDate(order.deliveredAt)}</dd>
                  </>
                )}
                {order.cancelledAt && (
                  <>
                    <dt>Cancelled</dt>
                    <dd>{fmtDateTime(order.cancelledAt)}</dd>
                  </>
                )}
                <dt>Last updated</dt>
                <dd>{fmtRelative(order.updatedAt)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
