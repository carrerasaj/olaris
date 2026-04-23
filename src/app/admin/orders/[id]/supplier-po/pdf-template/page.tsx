/**
 * Internal HTML route rendered by Puppeteer → supplier PO PDF.
 *
 * Accepts the admin session OR a valid HMAC render token (minted against
 * the supplier_po.id). The supplier never sees this route — they only
 * receive the rendered PDF as an email attachment.
 *
 * Privacy: this template intentionally does NOT show customer personal
 * details. The dealer sees the customer order reference (opaque to them)
 * and the end-user delivery address (they need it to deliver the van),
 * but no email, phone, DOB, etc.
 */

import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db, orders, supplierOrders, suppliers } from '@/db/client'
import { auth } from '@/lib/auth'
import { verifyRenderToken } from '@/lib/pdf/render-token'
import { fmtGBPFromPence } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function SupplierPoPdfTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string; po?: string }>
}) {
  const { id: orderId } = await params
  const { t, po: poIdParam } = await searchParams

  // The render path is /admin/orders/{orderId}/supplier-po/pdf-template —
  // we need the PO id separately. If absent, fall back to "active PO for
  // this order". Token verification is against the PO id.
  let poId = poIdParam ?? null
  if (!poId) {
    const latest = await db
      .select({ id: supplierOrders.id, status: supplierOrders.status })
      .from(supplierOrders)
      .where(eq(supplierOrders.orderId, orderId))
      .limit(10)
    const active = latest.find((p) => p.status !== 'cancelled')
    poId = active?.id ?? latest[0]?.id ?? null
  }
  if (!poId) notFound()

  let authorised = false
  if (t && verifyRenderToken(t, poId)) {
    authorised = true
  } else {
    const session = await auth()
    if (session?.user?.role === 'admin') authorised = true
  }
  if (!authorised) notFound()

  const poRows = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.id, poId))
    .limit(1)
  if (poRows.length === 0) notFound()
  const po = poRows[0]

  const [orderRows, supplierRows] = await Promise.all([
    db
      .select({ ref: orders.ref, delivery: orders.delivery })
      .from(orders)
      .where(eq(orders.id, po.orderId))
      .limit(1),
    db.select().from(suppliers).where(eq(suppliers.id, po.supplierId)).limit(1),
  ])
  if (orderRows.length === 0 || supplierRows.length === 0) notFound()
  const order = orderRows[0]
  const supplier = supplierRows[0]

  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="pdf-template-root">
      <header
        style={{
          padding: '32px 48px 20px',
          borderBottom: '1px solid #e4e9f1',
        }}
      >
        <div
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: '#0b1e3f',
            letterSpacing: '-0.02em',
          }}
        >
          Olaris
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#64748b',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          Consulting Ltd · Charlbury OX7 3EG · FCA authorised
        </div>
      </header>

      <section style={{ padding: '28px 48px 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 32,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 700,
              }}
            >
              Purchase order
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 22,
                color: '#0b1e3f',
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              {po.ref}
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
              Issued {issueDate}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#64748b',
                marginTop: 2,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              Olaris order ref: {order.ref}
            </div>
          </div>

          <div style={{ textAlign: 'right', maxWidth: 280 }}>
            <div
              style={{
                fontSize: 10,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                fontWeight: 700,
              }}
            >
              To
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#0f172a',
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {supplier.tradingName ?? supplier.legalName}
            </div>
            {supplier.tradingName && (
              <div style={{ fontSize: 11, color: '#64748b' }}>
                ({supplier.legalName})
              </div>
            )}
            <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
              {supplier.primaryContactName}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {supplier.primaryContactEmail}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '28px 48px 0' }}>
        <h2 style={sectionH}>Vehicle</h2>
        <table style={tableStyle}>
          <tbody>
            <Row label="Make / model" value={`${po.vehicle.make} ${po.vehicle.model}`} />
            <Row label="Derivative" value={po.vehicle.derivative || '—'} />
            <Row label="Fuel / transmission" value={`${po.vehicle.fuel} · ${po.vehicle.transmission}`} />
            <Row label="Colour / trim" value={`${po.vehicle.colour} · ${po.vehicle.trim}`} />
            {po.vehicle.co2 > 0 && <Row label="CO₂" value={`${po.vehicle.co2} g/km`} />}
          </tbody>
        </table>
      </section>

      {po.options.length > 0 && (
        <section style={{ padding: '20px 48px 0' }}>
          <h2 style={sectionH}>Factory options</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thL}>SKU</th>
                <th style={thL}>Option</th>
                <th style={thR}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {po.options.map((o) => (
                <tr key={o.id}>
                  <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace' }}>
                    {o.sku}
                  </td>
                  <td style={td}>{o.name}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{o.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section style={{ padding: '20px 48px 0' }}>
        <h2 style={sectionH}>Delivery</h2>
        <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.55 }}>
          {po.delivery.address}
          <br />
          {po.delivery.city}
          <br />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {po.delivery.postcode}
          </span>
        </div>
        {po.delivery.preferredDate && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#334155' }}>
            Preferred delivery: <strong>{po.delivery.preferredDate}</strong>
          </div>
        )}
      </section>

      <section style={{ padding: '20px 48px 0' }}>
        <h2 style={sectionH}>Commercials</h2>
        <table style={{ ...tableStyle, width: '60%' }}>
          <tbody>
            <Row label="Net" value={fmtGBPFromPence(po.purchaseNetPence)} mono />
            <Row
              label={`VAT @ ${po.purchaseVatRate}%`}
              value={fmtGBPFromPence(po.purchaseVatPence)}
              mono
            />
            <Row
              label="Delivery fee"
              value={fmtGBPFromPence(po.deliveryFeePence)}
              mono
            />
            <Row
              label="On-road"
              value={fmtGBPFromPence(po.onRoadPence)}
              mono
            />
            <tr>
              <td
                style={{
                  ...td,
                  fontWeight: 700,
                  color: '#0b1e3f',
                  borderTop: '2px solid #0b1e3f',
                  paddingTop: 10,
                }}
              >
                Total (inc. VAT)
              </td>
              <td
                style={{
                  ...td,
                  textAlign: 'right',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  color: '#0b1e3f',
                  borderTop: '2px solid #0b1e3f',
                  paddingTop: 10,
                  fontSize: 14,
                }}
              >
                {fmtGBPFromPence(po.purchaseTotalPence)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {po.notesToSupplier && (
        <section style={{ padding: '20px 48px 0' }}>
          <h2 style={sectionH}>Notes</h2>
          <div
            style={{
              fontSize: 12,
              color: '#0f172a',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              padding: 14,
              background: '#f8fafc',
              borderLeft: '3px solid #06b6d4',
              borderRadius: 4,
            }}
          >
            {po.notesToSupplier}
          </div>
        </section>
      )}

      <footer
        style={{
          padding: '28px 48px 40px',
          marginTop: 28,
          borderTop: '1px solid #e4e9f1',
          fontSize: 11,
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        Issued electronically by Olaris Consulting Ltd. Please reply to
        <strong style={{ color: '#334155' }}> alan@olaris.co.uk</strong> with
        your PO reference and confirmed ETA to acknowledge this order.
      </footer>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <tr>
      <td style={td}>{label}</td>
      <td
        style={{
          ...td,
          textAlign: 'right',
          fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
        }}
      >
        {value}
      </td>
    </tr>
  )
}

const sectionH = {
  fontSize: 10.5,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  margin: '0 0 10px',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: 12,
  color: '#0f172a',
}

const td = {
  padding: '6px 0',
  borderBottom: '1px solid #edf2f7',
}

const thL = {
  padding: '6px 0',
  textAlign: 'left' as const,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  color: '#64748b',
  letterSpacing: 0.3,
  borderBottom: '1px solid #0b1e3f',
}

const thR = {
  ...thL,
  textAlign: 'right' as const,
}
