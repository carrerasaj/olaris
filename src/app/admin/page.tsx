import Link from 'next/link'
import { desc, eq, gte, sql, and } from 'drizzle-orm'
import { db, orders, customers, activities, auditEvents } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtGBPFromPence, fmtRelative } from '@/lib/format'
import { OrderStatusPill, auditEventLabel } from './components'
import { getDashboardSummary } from '@/lib/reports/dashboard'

export const metadata = { title: 'Dashboard' }

export default async function AdminDashboard() {
  await requireAdmin()

  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  // Parallel reads — each query is short and independent.
  const [
    openOrdersRow,
    awaitingRow,
    signedThisMonthRow,
    totalCustomersRow,
    recentOrders,
    recentActivity,
    dashboardSummary,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`${orders.status} in ('draft','sent','partially_signed')`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`${orders.status} in ('sent','partially_signed')`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.status, 'signed'), gte(orders.signedAt, startOfMonth))),
    db.select({ count: sql<number>`count(*)::int` }).from(customers),
    db
      .select({
        id: orders.id,
        ref: orders.ref,
        status: orders.status,
        totalAmountPence: orders.totalAmountPence,
        vehicle: orders.vehicle,
        createdAt: orders.createdAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.createdAt))
      .limit(5),
    db
      .select({
        id: auditEvents.id,
        eventType: auditEvents.eventType,
        createdAt: auditEvents.createdAt,
        orderRef: orders.ref,
        orderId: orders.id,
      })
      .from(auditEvents)
      .leftJoin(orders, eq(auditEvents.orderId, orders.id))
      .orderBy(desc(auditEvents.createdAt))
      .limit(8),
    getDashboardSummary(),
  ])

  const tiles = [
    {
      label: 'Open orders',
      value: String(openOrdersRow[0]?.count ?? 0),
      sub: 'draft, sent or partially signed',
    },
    {
      label: 'Awaiting signature',
      value: String(awaitingRow[0]?.count ?? 0),
      sub: 'customer action needed',
    },
    {
      label: 'Signed this month',
      value: String(signedThisMonthRow[0]?.count ?? 0),
      sub: 'since ' + startOfMonth.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    },
    {
      label: 'Total customers',
      value: String(totalCustomersRow[0]?.count ?? 0),
      sub: 'across all time',
    },
  ]

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Order execution & fleet desk activity</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/customers/new" className="adm-btn adm-btn-ghost">
            New customer
          </Link>
          <Link href="/admin/orders/new" className="adm-btn adm-btn-primary">
            New order
          </Link>
        </div>
      </div>

      <div className="adm-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="adm-tile">
            <div className="label">{t.label}</div>
            <div className="value">{t.value}</div>
            <div className="sub">{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Phase 11 — P&L summary tile row. Each tile click-throughs to
          the relevant report view so "hmm, is invoice aging spiking?" is
          one click from the dashboard. */}
      <div className="adm-tiles" style={{ marginTop: 16 }}>
        <Link
          href="/admin/reports/margin?basis=signed"
          className="adm-tile"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="label">Gross profit (90d)</div>
          <div
            className="value"
            style={{
              color:
                dashboardSummary.grossProfitPence < 0 ? '#b91c1c' : undefined,
            }}
          >
            {fmtGBPFromPence(dashboardSummary.grossProfitPence)}
          </div>
          <div className="sub">
            {dashboardSummary.dealCount} deal
            {dashboardSummary.dealCount === 1 ? '' : 's'}
            {dashboardSummary.grossProfitMarginBps !== null &&
              ` · ${(dashboardSummary.grossProfitMarginBps / 100).toFixed(1)}% margin`}
          </div>
        </Link>
        <Link
          href="/admin/reports/margin?po_status=draft"
          className="adm-tile"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="label">Open POs</div>
          <div className="value">{dashboardSummary.openPoCount}</div>
          <div className="sub">draft or sent</div>
        </Link>
        <Link
          href="/admin/reports/margin?po_status=acknowledged&invoiced=no"
          className="adm-tile"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            background:
              dashboardSummary.invoiceAgingCount > 0 ? '#fef3c7' : undefined,
          }}
        >
          <div className="label">Invoice aging</div>
          <div
            className="value"
            style={{
              color:
                dashboardSummary.invoiceAgingCount > 0 ? '#b45309' : undefined,
            }}
          >
            {dashboardSummary.invoiceAgingCount}
          </div>
          <div className="sub">ack&apos;d &gt;30 days, no invoice</div>
        </Link>
        <Link
          href="/admin/reports/vat"
          className="adm-tile"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="label">VAT summary</div>
          <div
            className="value"
            style={{ fontSize: 18, fontWeight: 700, color: '#0b1e3f' }}
          >
            Management view →
          </div>
          <div className="sub">for the accountant</div>
        </Link>
      </div>

      <div className="adm-split">
        <div className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Recent orders</h2>
            <Link href="/admin/orders" className="adm-btn adm-btn-ghost adm-btn-sm">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="adm-empty">
              <h3>No orders yet</h3>
              <p>Create your first order to get started.</p>
              <Link
                href="/admin/orders/new"
                className="adm-btn adm-btn-primary"
                style={{ marginTop: 14 }}
              >
                New order
              </Link>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">
                      <Link href={`/admin/orders/${o.id}`}>{o.ref}</Link>
                    </td>
                    <td>
                      <Link href={`/admin/orders/${o.id}`}>
                        {o.customerFirstName} {o.customerLastName}
                      </Link>
                    </td>
                    <td>
                      {o.vehicle?.make} {o.vehicle?.model}
                    </td>
                    <td className="num mono">{fmtGBPFromPence(o.totalAmountPence)}</td>
                    <td>
                      <OrderStatusPill status={o.status} />
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>
                      {fmtRelative(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Recent activity</h2>
          </div>
          <div className="adm-card-body">
            {recentActivity.length === 0 ? (
              <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
                No activity yet.
              </div>
            ) : (
              <div className="adm-timeline">
                {recentActivity.map((a) => (
                  <div key={a.id} className="adm-timeline-item">
                    <div className="adm-timeline-dot" />
                    <div>
                      <div className="adm-timeline-title">{auditEventLabel(a.eventType)}</div>
                      {a.orderRef && (
                        <div className="adm-timeline-sub">
                          <Link href={`/admin/orders/${a.orderId}`}>{a.orderRef}</Link>
                        </div>
                      )}
                      <div className="adm-timeline-time">{fmtRelative(a.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

