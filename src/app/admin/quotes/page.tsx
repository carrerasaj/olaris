import Link from 'next/link'
import { desc, eq, inArray } from 'drizzle-orm'
import { db, quotes, customers } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtGBPFromPence, fmtRelative } from '@/lib/format'
import { QuoteStatusPill } from '../components'

export const metadata = { title: 'Quotes' }

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'ready', label: 'Ready to convert' },
  { key: 'converted', label: 'Converted' },
  { key: 'lost', label: 'Lost' },
] as const

export default async function QuotesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  const { status: filter } = await searchParams
  const activeTab = STATUS_TABS.find((t) => t.key === filter)?.key ?? 'all'

  type QS =
    | 'draft'
    | 'sent'
    | 'viewed'
    | 'accepted'
    | 'declined'
    | 'expired'
    | 'converted'
    | 'cancelled'
  const statusClause = ((): QS[] | null => {
    switch (activeTab) {
      case 'open':
        return ['draft', 'sent', 'viewed']
      case 'ready':
        return ['accepted']
      case 'converted':
        return ['converted']
      case 'lost':
        return ['declined', 'expired', 'cancelled']
      default:
        return null
    }
  })()

  const baseQuery = db
    .select({
      id: quotes.id,
      ref: quotes.ref,
      status: quotes.status,
      totalAmountPence: quotes.totalAmountPence,
      vehicle: quotes.vehicle,
      createdAt: quotes.createdAt,
      expiresAt: quotes.expiresAt,
      firstName: customers.firstName,
      lastName: customers.lastName,
      customerEmail: customers.email,
    })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .orderBy(desc(quotes.createdAt))
    .limit(200)

  const rows = statusClause
    ? statusClause.length === 1
      ? await baseQuery.where(eq(quotes.status, statusClause[0]))
      : await baseQuery.where(inArray(quotes.status, statusClause))
    : await baseQuery

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <h1>Quotes</h1>
          <div className="sub">
            {rows.length} result{rows.length === 1 ? '' : 's'} · filter: {activeTab}
          </div>
        </div>
        <Link href="/admin/quotes/new" className="adm-btn adm-btn-primary">
          New quote
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
            href={t.key === 'all' ? '/admin/quotes' : `/admin/quotes?status=${t.key}`}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              borderBottom:
                activeTab === t.key ? '2px solid #06b6d4' : '2px solid transparent',
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
            <h3>No quotes match</h3>
            <p>
              {activeTab === 'all' ? 'Create your first quote.' : 'Try a different filter.'}
            </p>
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
                <th>Expires</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => {
                const now = new Date()
                const expired = q.expiresAt <= now
                return (
                  <tr key={q.id}>
                    <td className="mono">
                      <Link href={`/admin/quotes/${q.id}`}>{q.ref}</Link>
                    </td>
                    <td>
                      <Link href={`/admin/quotes/${q.id}`}>
                        {q.firstName} {q.lastName}
                      </Link>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {q.customerEmail}
                      </div>
                    </td>
                    <td>
                      {q.vehicle?.make} {q.vehicle?.model}
                    </td>
                    <td className="num mono">
                      {fmtGBPFromPence(q.totalAmountPence)}
                    </td>
                    <td>
                      <QuoteStatusPill status={q.status} />
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color: expired ? '#dc2626' : '#64748b',
                      }}
                    >
                      {fmtRelative(q.expiresAt)}
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>
                      {fmtRelative(q.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
