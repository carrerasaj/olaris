import Link from 'next/link'
import { desc, eq, or, ilike } from 'drizzle-orm'
import { db, customers, companies } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtRelative } from '@/lib/format'

export const metadata = { title: 'Customers' }

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireAdmin()
  const { q } = await searchParams
  const query = (q ?? '').trim()

  const rows = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      type: customers.type,
      createdAt: customers.createdAt,
      companyName: companies.name,
    })
    .from(customers)
    .leftJoin(companies, eq(customers.companyId, companies.id))
    .where(
      query
        ? or(
            ilike(customers.firstName, `%${query}%`),
            ilike(customers.lastName, `%${query}%`),
            ilike(customers.email, `%${query}%`),
            ilike(companies.name, `%${query}%`),
          )
        : undefined,
    )
    .orderBy(desc(customers.createdAt))
    .limit(200)

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <h1>Customers</h1>
          <div className="sub">{rows.length} result{rows.length === 1 ? '' : 's'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <form action="/admin/customers" method="get" style={{ display: 'flex' }}>
            <input
              name="q"
              placeholder="Search name, email, company…"
              defaultValue={query}
              style={{
                padding: '9px 12px',
                border: '1px solid #d5dbe6',
                borderRadius: 6,
                fontSize: 13,
                minWidth: 280,
                fontFamily: 'inherit',
              }}
            />
          </form>
          <Link href="/admin/customers/new" className="adm-btn adm-btn-primary">
            New customer
          </Link>
        </div>
      </div>

      <div className="adm-card">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <h3>{query ? 'No customers match your search' : 'No customers yet'}</h3>
            {!query && (
              <p style={{ marginTop: 6 }}>Add your first customer to start creating orders.</p>
            )}
            <div style={{ marginTop: 14 }}>
              <Link href="/admin/customers/new" className="adm-btn adm-btn-primary">
                New customer
              </Link>
            </div>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Type</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/customers/${r.id}`}>
                      {r.firstName} {r.lastName}
                    </Link>
                  </td>
                  <td style={{ color: '#64748b' }}>{r.email}</td>
                  <td>{r.companyName ?? '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.type}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {fmtRelative(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
