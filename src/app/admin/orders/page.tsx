import Link from 'next/link'
import { desc, eq, inArray } from 'drizzle-orm'
import { db, orders, customers } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtGBPFromPence, fmtRelative } from '@/lib/format'
import { OrderStatusPill } from '../components'

export const metadata = { title: 'Orders' }

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Awaiting signature' },
  { key: 'signed', label: 'Signed' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
] as const

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  const { status: filter } = await searchParams
  const activeTab = STATUS_TABS.find((t) => t.key === filter)?.key ?? 'all'

  type OrderStatus =
    | 'draft'
    | 'sent'
    | 'partially_signed'
    | 'signed'
    | 'delivered'
    | 'cancelled'
  const statusClause = ((): OrderStatus[] | null => {
    switch (activeTab) {
      case 'open':
        return ['draft', 'sent', 'partially_signed']
      case 'draft':
        return ['draft']
      case 'sent':
        return ['sent', 'partially_signed']
      case 'signed':
        return ['signed']
      case 'delivered':
        return ['delivered']
      case 'cancelled':
        return ['cancelled']
      default:
        return null
    }
  })()

  const baseQuery = db
    .select({
      id: orders.id,
      ref: orders.ref,
      status: orders.status,
      totalAmountPence: orders.totalAmountPence,
      vehicle: orders.vehicle,
      createdAt: orders.createdAt,
      firstName: customers.firstName,
      lastName: customers.lastName,
      customerEmail: customers.email,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt))
    .limit(200)

  const rows = statusClause
    ? statusClause.length === 1
      ? await baseQuery.where(eq(orders.status, statusClause[0]))
      : await baseQuery.where(inArray(orders.status, statusClause))
    : await baseQuery

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <h1>Orders</h1>
          <div className="sub">
            {rows.length} result{rows.length === 1 ? '' : 's'} · filter: {activeTab}
          </div>
        </div>
        <Link href="/admin/orders/new" className="adm-btn adm-btn-primary">
          New order
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          borderBottom: '1px solid var(--adm-line)',
          paddingBottom: 0,
        }}
      >
        {STATUS_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'all' ? '/admin/orders' : `/admin/orders?status=${t.key}`}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              borderBottom: activeTab === t.key ? '2px solid #06b6d4' : '2px solid transparent',
              marginBottom: -1,
              color: activeTab === t.key ? '#0b1e3f' : '#64748b',
              textDecoration: 'none',
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="adm-card">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <h3>No orders match</h3>
            <p>{activeTab === 'all' ? 'Create your first order.' : 'Try a different filter.'}</p>
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
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="mono">
                    <Link href={`/admin/orders/${o.id}`}>{o.ref}</Link>
                  </td>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>
                      {o.firstName} {o.lastName}
                    </Link>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{o.customerEmail}</div>
                  </td>
                  <td>
                    {o.vehicle?.make} {o.vehicle?.model}
                  </td>
                  <td className="num mono">{fmtGBPFromPence(o.totalAmountPence)}</td>
                  <td>
                    <OrderStatusPill status={o.status} />
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{fmtRelative(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
