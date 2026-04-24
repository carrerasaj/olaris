/**
 * Internal HTML route rendered by Puppeteer → handover-pack PDF.
 *
 * Accepts the admin session OR a valid HMAC render token. This is the
 * "drove away with this" operational summary — separate from the legally-
 * executed signed contract. Contents are deliberately minimal for v1.
 *
 * The pack is generated once and frozen in Blob storage; this template
 * page only runs at generation time, not on every access.
 */

import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db, orders, customers, companies } from '@/db/client'
import { auth } from '@/lib/auth'
import { verifyRenderToken } from '@/lib/pdf/render-token'
import { fmtDate, fmtGBPFromPence, penceToPounds } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}

export default async function HandoverPackTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t } = await searchParams

  let authorised = false
  if (t && verifyRenderToken(t, id)) {
    authorised = true
  } else {
    const session = await auth()
    if (session?.user?.role === 'admin') authorised = true
  }
  if (!authorised) notFound()

  const rows = await db
    .select({ order: orders, customer: customers, company: companies })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(companies, eq(orders.companyId, companies.id))
    .where(eq(orders.id, id))
    .limit(1)
  if (rows.length === 0) notFound()
  const { order, customer, company } = rows[0]

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
          Handover pack · Consulting Ltd · Charlbury OX7 3EG
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
              Order
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
              {order.ref}
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
              Handover pack issued {issueDate}
              {order.actualDeliveryDate
                ? ` · Delivered ${fmtDate(order.actualDeliveryDate)}`
                : order.deliveredAt
                  ? ` · Delivered ${fmtDate(order.deliveredAt)}`
                  : ''}
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
              Customer
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#0f172a',
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {customer.firstName} {customer.lastName}
            </div>
            {company && (
              <div style={{ fontSize: 12, color: '#475569' }}>{company.name}</div>
            )}
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {customer.email}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '28px 48px 0' }}>
        <h2 style={sectionH}>Vehicle</h2>
        <table style={tableStyle}>
          <tbody>
            <Row
              label="Make / model"
              value={`${order.vehicle.make} ${order.vehicle.model}`}
            />
            <Row label="Derivative" value={order.vehicle.derivative || '—'} />
            <Row
              label="Colour / trim"
              value={`${order.vehicle.colour} · ${order.vehicle.trim}`}
            />
            <Row
              label="Fuel / transmission"
              value={`${order.vehicle.fuel} · ${order.vehicle.transmission}`}
            />
            {order.registrationPlate && (
              <Row label="Registration" value={order.registrationPlate} mono />
            )}
            {order.chassisNumber && (
              <Row label="Chassis / VIN" value={order.chassisNumber} mono />
            )}
            {order.vehicle.co2 > 0 && (
              <Row label="CO₂" value={`${order.vehicle.co2} g/km`} />
            )}
          </tbody>
        </table>
      </section>

      <section style={{ padding: '20px 48px 0' }}>
        <h2 style={sectionH}>Delivery</h2>
        <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.55 }}>
          {order.handoverLocation || order.delivery.address}
          {order.delivery.address && order.handoverLocation && (
            <>
              <br />
              <span style={{ color: '#64748b', fontSize: 11 }}>
                (Customer address: {order.delivery.address},{' '}
                {order.delivery.city}, {order.delivery.postcode})
              </span>
            </>
          )}
        </div>
      </section>

      <section style={{ padding: '20px 48px 0' }}>
        <h2 style={sectionH}>Finance</h2>
        <table style={{ ...tableStyle, width: '70%' }}>
          <tbody>
            <Row label="Type" value={order.financeType} />
            {order.finance.term > 0 && (
              <Row label="Term" value={`${order.finance.term} months`} />
            )}
            {order.finance.annualMileage > 0 && (
              <Row
                label="Annual mileage"
                value={`${order.finance.annualMileage.toLocaleString()} miles`}
              />
            )}
            {order.finance.monthlyNetPence > 0 && (
              <Row
                label="Monthly"
                value={fmtGBPFromPence(order.finance.monthlyNetPence)}
                mono
              />
            )}
            {order.finance.initialRental > 0 && (
              <Row
                label="Initial rental"
                value={`${order.finance.initialRental} months`}
              />
            )}
          </tbody>
        </table>
      </section>

      <section style={{ padding: '20px 48px 0' }}>
        <h2 style={sectionH}>Signed order</h2>
        <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
          The legally-executed signed order for this vehicle is available
          for verification at:
          <br />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#0b1e3f',
            }}
          >
            {siteUrl()}/verify/{order.ref}
          </span>
        </div>
      </section>

      <section style={{ padding: '20px 48px 0' }}>
        <h2 style={sectionH}>Your Olaris contact</h2>
        <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.55 }}>
          Alan Carreras —{' '}
          <a href="mailto:alan@olaris.co.uk" style={{ color: '#0b1e3f' }}>
            alan@olaris.co.uk
          </a>
        </div>
      </section>

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
        Olaris Consulting Ltd is authorised and regulated by the Financial
        Conduct Authority. This handover pack is an operational summary;
        the legally-binding contract is the signed order referenced above.
      </footer>
      {false && penceToPounds(0) /* retain the import */}
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
