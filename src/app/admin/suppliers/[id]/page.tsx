import Link from 'next/link'
import { notFound } from 'next/navigation'
import { desc, eq, or } from 'drizzle-orm'
import { db, suppliers, orders, customers } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtGBPFromPence, fmtDate, fmtRelative } from '@/lib/format'
import { OrderStatusPill, SupplierKindPill } from '../../components'
import { setSupplierActiveAction } from '../../actions/suppliers'

export const metadata = { title: 'Supplier' }

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const rows = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id))
    .limit(1)
  if (rows.length === 0) notFound()
  const supplier = rows[0]

  // Orders using this supplier in either role
  const linkedOrders = await db
    .select({
      id: orders.id,
      ref: orders.ref,
      status: orders.status,
      totalAmountPence: orders.totalAmountPence,
      vehicle: orders.vehicle,
      createdAt: orders.createdAt,
      vehicleSupplierId: orders.vehicleSupplierId,
      financeProviderId: orders.financeProviderId,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      or(eq(orders.vehicleSupplierId, id), eq(orders.financeProviderId, id)),
    )
    .orderBy(desc(orders.createdAt))
    .limit(100)

  async function toggleActive() {
    'use server'
    await setSupplierActiveAction(id, !supplier.active)
  }

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href="/admin/suppliers"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Suppliers
          </Link>
          <h1 style={{ marginTop: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
            {supplier.tradingName ?? supplier.legalName}
            <SupplierKindPill kind={supplier.kind} />
            {!supplier.active && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  color: '#991b1b',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                }}
              >
                Inactive
              </span>
            )}
          </h1>
          {supplier.tradingName && (
            <div className="sub">{supplier.legalName}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href={`/admin/suppliers/${supplier.id}/edit`}
            className="adm-btn adm-btn-ghost"
          >
            Edit
          </Link>
          <form action={toggleActive}>
            <button
              type="submit"
              className={
                supplier.active ? 'adm-btn adm-btn-danger' : 'adm-btn adm-btn-accent'
              }
            >
              {supplier.active ? 'Deactivate' : 'Reactivate'}
            </button>
          </form>
        </div>
      </div>

      <div className="adm-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">
                Orders ({linkedOrders.length})
              </h2>
            </div>
            {linkedOrders.length === 0 ? (
              <div className="adm-empty">
                <h3>No orders yet</h3>
                <p>Orders you assign to this supplier will appear here.</p>
              </div>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Role</th>
                    <th className="num">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedOrders.map((o) => {
                    const roles: string[] = []
                    if (o.vehicleSupplierId === id) roles.push('Vehicle')
                    if (o.financeProviderId === id) roles.push('Finance')
                    return (
                      <tr key={o.id}>
                        <td className="mono">
                          <Link href={`/admin/orders/${o.id}`}>{o.ref}</Link>
                        </td>
                        <td>
                          {o.customerFirstName} {o.customerLastName}
                        </td>
                        <td>
                          {o.vehicle?.make} {o.vehicle?.model}
                        </td>
                        <td>{roles.join(' · ')}</td>
                        <td className="num mono">{fmtGBPFromPence(o.totalAmountPence)}</td>
                        <td>
                          <OrderStatusPill status={o.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Primary contact</h2>
            </div>
            <div className="adm-card-body">
              <dl className="adm-kv">
                <dt>Name</dt>
                <dd>{supplier.primaryContactName}</dd>
                <dt>Email</dt>
                <dd>
                  <a
                    href={`mailto:${supplier.primaryContactEmail}`}
                    style={{ color: '#1e3a8a', textDecoration: 'none' }}
                  >
                    {supplier.primaryContactEmail}
                  </a>
                </dd>
                <dt>Phone</dt>
                <dd>{supplier.primaryContactPhone ?? '—'}</dd>
                <dt>Website</dt>
                <dd>
                  {supplier.website ? (
                    <a
                      href={
                        supplier.website.startsWith('http')
                          ? supplier.website
                          : `https://${supplier.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1e3a8a', textDecoration: 'none' }}
                    >
                      {supplier.website}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </dl>
            </div>
          </div>

          {(supplier.addressLine1 || supplier.addressCity || supplier.addressPostcode) && (
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">Address</h2>
              </div>
              <div className="adm-card-body" style={{ fontSize: 13, lineHeight: 1.6 }}>
                {[
                  supplier.addressLine1,
                  supplier.addressLine2,
                  supplier.addressCity,
                  supplier.addressPostcode,
                  supplier.addressCountry,
                ]
                  .filter(Boolean)
                  .map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
              </div>
            </div>
          )}

          {supplier.notes && (
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">Internal notes</h2>
              </div>
              <div
                className="adm-card-body"
                style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
              >
                {supplier.notes}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: '#64748b', padding: '0 4px' }}>
            Added {fmtDate(supplier.createdAt)} · updated{' '}
            {fmtRelative(supplier.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  )
}
