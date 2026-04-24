import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import {
  db,
  orders,
  customers,
  companies,
  auditEvents,
  signatures,
  signingTokens,
  suppliers,
  supplierOrders,
  quotes,
  feedback,
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtGBPFromPence, fmtDate, fmtDateTime, fmtRelative } from '@/lib/format'
import { OrderStatusPill, auditEventLabel } from '../../components'
import { redirect } from 'next/navigation'
import {
  sendForSignatureAction,
  cancelOrderAction,
  markDeliveredAction,
  markConfirmedAction,
  markOnOrderAction,
  markReadyForHandoverAction,
  updateLogisticsAction,
  cancelPostSignAction,
  overrideStatusAction,
  resendSigningLinkAction,
  deleteDraftAction,
  signAsRepAction,
  ensureOrderPdfAction,
  duplicateOrderAction,
  type RepSignInput,
} from '../../actions/orders'
import type { LogisticsField, LogisticsPatch } from '@/lib/order-delivery'
import { LOGISTICS_FIELDS } from '@/lib/order-delivery'
import {
  setOrderVehicleSupplierAction,
  setOrderFinanceProviderAction,
} from '../../actions/suppliers'
import { RepSignButton } from './RepSignButton'
import { DownloadPdfButton } from './DownloadPdfButton'
import { SupplierSelectors } from './SupplierSelectors'
import { DeliveryCard } from './DeliveryCard'
import { SupplierPOCard } from './SupplierPOCard'
import { DealPLCard } from './DealPLCard'
import { HandoverPackCard } from './HandoverPackCard'
import { FeedbackCard } from './FeedbackCard'
import { createDraftSupplierPOAction } from '../../actions/supplier-po'
import { generateHandoverPackAction } from '../../actions/handover-pack'
import { resendNpsRequestAction } from '../../actions/feedback'
import { getCurrentHandoverPack } from '@/lib/handover-pack'

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

  const [
    orderEvents,
    orderSigs,
    activeToken,
    activeSuppliers,
    sourceQuoteRows,
    supplierPoRows,
    handoverPack,
    orderFeedback,
    npsSentRows,
  ] = await Promise.all([
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
    // Load all active suppliers once; the component splits them into
    // vehicle-suppliers (non-funder) and finance-providers (funder) locally.
    db
      .select()
      .from(suppliers)
      .where(eq(suppliers.active, true))
      .orderBy(asc(suppliers.legalName)),
    order.sourceQuoteId
      ? db
          .select({ id: quotes.id, ref: quotes.ref })
          .from(quotes)
          .where(eq(quotes.id, order.sourceQuoteId))
          .limit(1)
      : Promise.resolve([] as Array<{ id: string; ref: string }>),
    db
      .select()
      .from(supplierOrders)
      .where(eq(supplierOrders.orderId, id))
      .orderBy(desc(supplierOrders.createdAt))
      .limit(10),
    getCurrentHandoverPack(id),
    db
      .select()
      .from(feedback)
      .where(eq(feedback.orderId, id))
      .orderBy(desc(feedback.submittedAt))
      .limit(1),
    // Has the NPS template been sent (or suppressed by opt-out)? Used to
    // toggle the FeedbackCard label between "will be sent automatically"
    // and "awaiting response / resend".
    db
      .select({ id: auditEvents.id })
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.orderId, id),
          inArray(auditEvents.eventType, [
            'email.sent',
            'email.suppressed',
          ]),
          sql`${auditEvents.payload} ->> 'template' = 'nps_request_email'`,
        ),
      )
      .limit(1),
  ])

  const activePO = supplierPoRows.find((p) => p.status !== 'cancelled') ?? null

  const canEdit = order.status === 'draft'
  const canSend = order.status === 'draft'
  // Pre-sign cancel only — post-sign cancellation goes through
  // cancelPostSignAction with a mandatory reason (handled in DeliveryCard).
  const canCancel = ['draft', 'sent', 'partially_signed'].includes(order.status)
  const canResend = order.status === 'sent' || order.status === 'partially_signed'
  const canDelete = order.status === 'draft'
  const canDownloadPdf = [
    'signed',
    'confirmed',
    'on_order',
    'ready_for_handover',
    'delivered',
  ].includes(order.status)
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
  // ─── delivery lifecycle binders (Phase 9) ──────────────────────────
  // Each takes FormData from the DeliveryCard inline forms. Field pick
  // helpers below keep the parsing compact and typed.

  async function confirmOrder(formData: FormData) {
    'use server'
    await markConfirmedAction(id, {
      note: formValue(formData, 'note'),
      supplierPoNumber: formValue(formData, 'supplierPoNumber'),
      estimatedDeliveryDate: formValue(formData, 'estimatedDeliveryDate'),
    })
  }
  async function onOrder(formData: FormData) {
    'use server'
    await markOnOrderAction(id, {
      note: formValue(formData, 'note'),
      estimatedDeliveryDate: formValue(formData, 'estimatedDeliveryDate'),
    })
  }
  async function readyForHandover(formData: FormData) {
    'use server'
    await markReadyForHandoverAction(id, {
      note: formValue(formData, 'note'),
      chassisNumber: formValue(formData, 'chassisNumber'),
      registrationPlate: formValue(formData, 'registrationPlate'),
      handoverLocation: formValue(formData, 'handoverLocation'),
      handoverNotes: formValue(formData, 'handoverNotes'),
    })
  }
  async function deliver(formData: FormData) {
    'use server'
    await markDeliveredAction(id, {
      note: formValue(formData, 'note'),
      actualDeliveryDate: formValue(formData, 'actualDeliveryDate'),
    })
  }
  async function updateLogistics(formData: FormData) {
    'use server'
    const patch: LogisticsPatch = {}
    for (const f of LOGISTICS_FIELDS as readonly LogisticsField[]) {
      if (formData.has(f)) patch[f] = formValue(formData, f)
    }
    const forceCustomerEmail = formData.get('forceCustomerEmail') === 'on'
    const forceReason = formValue(formData, 'forceCustomerEmailReason')
    await updateLogisticsAction(id, patch, {
      forceCustomerEmail,
      forceReason,
    })
  }
  async function cancelPostSign(formData: FormData) {
    'use server'
    await cancelPostSignAction(id, formValue(formData, 'reason') ?? '')
  }
  async function override(formData: FormData) {
    'use server'
    const target = formValue(formData, 'targetStatus') ?? ''
    const reason = formValue(formData, 'reason') ?? ''
    await overrideStatusAction(id, target, reason)
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
  async function ensurePdf() {
    'use server'
    return ensureOrderPdfAction(id)
  }
  async function duplicate() {
    'use server'
    const result = await duplicateOrderAction(id)
    if (result.ok && result.id) {
      redirect(`/admin/orders/${result.id}/edit`)
    }
  }
  async function createSupplierPoDraft() {
    'use server'
    const result = await createDraftSupplierPOAction(id)
    if (result.ok) {
      redirect(`/admin/orders/${id}/supplier-po`)
    }
  }
  async function generateHandover() {
    'use server'
    await generateHandoverPackAction(id)
  }
  async function resendNps() {
    'use server'
    await resendNpsRequestAction(id)
  }
  async function assignVehicleSupplier(supplierId: string | null) {
    'use server'
    return setOrderVehicleSupplierAction(id, supplierId)
  }
  async function assignFinanceProvider(supplierId: string | null) {
    'use server'
    return setOrderFinanceProviderAction(id, supplierId)
  }

  // Split + map the suppliers into lightweight options for the client. Also
  // look up the two currently-assigned ones (if any) for the summary
  // display under each select.
  const vehicleSupplierOptions = activeSuppliers
    .filter((s) => s.kind !== 'funder')
    .map((s) => ({
      id: s.id,
      kind: s.kind,
      displayName: s.tradingName ?? s.legalName,
      contactName: s.primaryContactName,
    }))
  const financeProviderOptions = activeSuppliers
    .filter((s) => s.kind === 'funder')
    .map((s) => ({
      id: s.id,
      kind: s.kind,
      displayName: s.tradingName ?? s.legalName,
      contactName: s.primaryContactName,
    }))

  // Even if inactive (e.g. supplier deactivated after the assignment), look
  // up by id so the summary panel still renders the historic link.
  const assignedIds = [order.vehicleSupplierId, order.financeProviderId].filter(
    (x): x is string => !!x,
  )
  const assignedSuppliers =
    assignedIds.length > 0
      ? await db
          .select()
          .from(suppliers)
          .where(inArray(suppliers.id, assignedIds))
      : []
  const assignedVehicleDisplay = order.vehicleSupplierId
    ? (() => {
        const s = assignedSuppliers.find((x) => x.id === order.vehicleSupplierId)
        return s
          ? {
              id: s.id,
              name: s.tradingName ?? s.legalName,
              contact: `${s.primaryContactName} · ${s.primaryContactEmail}${s.primaryContactPhone ? ` · ${s.primaryContactPhone}` : ''}`,
            }
          : null
      })()
    : null
  const assignedFinanceDisplay = order.financeProviderId
    ? (() => {
        const s = assignedSuppliers.find((x) => x.id === order.financeProviderId)
        return s
          ? {
              id: s.id,
              name: s.tradingName ?? s.legalName,
              contact: `${s.primaryContactName} · ${s.primaryContactEmail}${s.primaryContactPhone ? ` · ${s.primaryContactPhone}` : ''}`,
            }
          : null
      })()
    : null

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
          {canDownloadPdf && (
            <DownloadPdfButton ensure={ensurePdf} orderRef={order.ref} />
          )}
          {/* Duplicate — available on every status. Copies vehicle / options /
              pricing / finance / delivery / add-ons / customer into a fresh
              draft, then redirects to that draft's edit page so the user can
              tweak before sending. */}
          <form action={duplicate}>
            <button
              type="submit"
              className="adm-btn adm-btn-ghost"
              title="Create a new draft by copying this order's details"
            >
              Duplicate
            </button>
          </form>
          {/* Delivery-lifecycle controls moved to the DeliveryCard below. */}
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

      {sourceQuoteRows[0] && (
        <div
          style={{
            padding: '10px 14px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#0b1e3f',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Created from quote{' '}
          <Link
            href={`/admin/quotes/${sourceQuoteRows[0].id}`}
            className="mono"
            style={{ fontWeight: 700 }}
          >
            {sourceQuoteRows[0].ref}
          </Link>
        </div>
      )}

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

          <SupplierSelectors
            orderId={id}
            vehicleSuppliers={vehicleSupplierOptions}
            financeProviders={financeProviderOptions}
            assignedVehicleId={order.vehicleSupplierId}
            assignedFinanceId={order.financeProviderId}
            assignedVehicleDisplay={assignedVehicleDisplay}
            assignedFinanceDisplay={assignedFinanceDisplay}
            assignVehicle={assignVehicleSupplier}
            assignFinance={assignFinanceProvider}
          />

          <DeliveryCard
            order={order}
            actions={{
              confirm: confirmOrder,
              onOrder: onOrder,
              readyForHandover: readyForHandover,
              deliver: deliver,
              updateLogistics: updateLogistics,
              cancelPostSign: cancelPostSign,
              override: override,
            }}
          />

          <SupplierPOCard
            order={order}
            activePO={activePO}
            createDraftAction={createSupplierPoDraft}
          />

          <DealPLCard order={order} activePO={activePO} />

          <HandoverPackCard
            order={order}
            existing={handoverPack}
            generate={generateHandover}
          />

          <FeedbackCard
            orderStatus={order.status}
            feedback={orderFeedback[0] ?? null}
            resendNps={resendNps}
            npsAlreadySent={npsSentRows.length > 0}
          />

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

// Pull a trimmed string value out of FormData, returning undefined when the
// field is absent or blank. Used by the delivery-lifecycle form binders.
function formValue(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key)
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed === '' ? undefined : trimmed
}
