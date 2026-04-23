import Link from 'next/link'
import { desc, eq, or, ilike, and, ne } from 'drizzle-orm'
import { db, suppliers } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtRelative } from '@/lib/format'
import { SupplierKindPill } from '../components'

export const metadata = { title: 'Suppliers' }

export default async function SuppliersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; inactive?: string }>
}) {
  await requireAdmin()
  const { q, kind, inactive } = await searchParams
  const query = (q ?? '').trim()
  const showInactive = inactive === '1'

  const conditions = [
    query
      ? or(
          ilike(suppliers.legalName, `%${query}%`),
          ilike(suppliers.tradingName, `%${query}%`),
          ilike(suppliers.primaryContactEmail, `%${query}%`),
        )
      : undefined,
    kind
      ? eq(
          suppliers.kind,
          kind as 'dealer' | 'broker' | 'oem_partner' | 'importer' | 'funder',
        )
      : undefined,
    showInactive ? undefined : eq(suppliers.active, true),
  ].filter(Boolean)

  const rows = await db
    .select()
    .from(suppliers)
    .where(conditions.length > 0 ? and(...(conditions as Parameters<typeof and>)) : undefined)
    .orderBy(desc(suppliers.createdAt))
    .limit(200)

  // Used to keep non-exhaustive eslint rule quiet on `ne`
  void ne

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <h1>Suppliers</h1>
          <div className="sub">
            {rows.length} result{rows.length === 1 ? '' : 's'}
            {kind ? ` · kind: ${kind}` : ''}
            {showInactive ? ' · including inactive' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <form action="/admin/suppliers" method="get" style={{ display: 'flex', gap: 8 }}>
            <input
              name="q"
              placeholder="Search name or email…"
              defaultValue={query}
              style={{
                padding: '9px 12px',
                border: '1px solid #d5dbe6',
                borderRadius: 6,
                fontSize: 13,
                minWidth: 240,
                fontFamily: 'inherit',
              }}
            />
            {kind && <input type="hidden" name="kind" value={kind} />}
            {showInactive && <input type="hidden" name="inactive" value="1" />}
          </form>
          <Link href="/admin/suppliers/new" className="adm-btn adm-btn-primary">
            New supplier
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          borderBottom: '1px solid var(--adm-line)',
        }}
      >
        {[
          { key: '', label: 'All' },
          { key: 'dealer', label: 'Dealer' },
          { key: 'broker', label: 'Broker' },
          { key: 'oem_partner', label: 'OEM partner' },
          { key: 'importer', label: 'Importer' },
          { key: 'funder', label: 'Funder' },
        ].map((t) => {
          const params = new URLSearchParams()
          if (t.key) params.set('kind', t.key)
          if (query) params.set('q', query)
          if (showInactive) params.set('inactive', '1')
          const activeTab = (t.key || '') === (kind || '')
          return (
            <Link
              key={t.key || 'all'}
              href={`/admin/suppliers${params.toString() ? `?${params}` : ''}`}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                borderBottom: activeTab ? '2px solid #06b6d4' : '2px solid transparent',
                marginBottom: -1,
                color: activeTab ? '#0b1e3f' : '#64748b',
                textDecoration: 'none',
              }}
            >
              {t.label}
            </Link>
          )
        })}
        <div style={{ flex: 1 }} />
        <Link
          href={`/admin/suppliers?${new URLSearchParams({
            ...(query ? { q: query } : {}),
            ...(kind ? { kind } : {}),
            ...(showInactive ? {} : { inactive: '1' }),
          }).toString()}`}
          style={{
            fontSize: 12,
            color: showInactive ? '#0b1e3f' : '#64748b',
            textDecoration: 'none',
            padding: '8px 12px',
            fontWeight: 600,
          }}
        >
          {showInactive ? '✓ inactive' : 'inactive'}
        </Link>
      </div>

      <div className="adm-card">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <h3>No suppliers</h3>
            {!query && !kind && (
              <p style={{ marginTop: 6 }}>Add your first supplier to start assigning orders.</p>
            )}
            <div style={{ marginTop: 14 }}>
              <Link href="/admin/suppliers/new" className="adm-btn adm-btn-primary">
                New supplier
              </Link>
            </div>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} style={s.active ? undefined : { opacity: 0.55 }}>
                  <td>
                    <Link href={`/admin/suppliers/${s.id}`}>
                      <strong>{s.tradingName ?? s.legalName}</strong>
                    </Link>
                    {s.tradingName && (
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.legalName}</div>
                    )}
                  </td>
                  <td>
                    <SupplierKindPill kind={s.kind} />
                  </td>
                  <td>
                    {s.primaryContactName}
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {s.primaryContactEmail}
                    </div>
                  </td>
                  <td className="mono">{s.primaryContactPhone || '—'}</td>
                  <td>{s.active ? 'Active' : 'Inactive'}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {fmtRelative(s.createdAt)}
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
