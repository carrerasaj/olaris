import Link from 'next/link'
import { notFound } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import {
  db,
  customers,
  companies,
  orders,
  quotes,
  activities,
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtGBPFromPence, fmtDate, fmtRelative } from '@/lib/format'
import { OrderStatusPill, QuoteStatusPill } from '../../components'
import { addActivityAction, completeActivityAction } from '../../actions/customers'

export const metadata = { title: 'Customer' }

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const row = await db
    .select({
      customer: customers,
      company: companies,
    })
    .from(customers)
    .leftJoin(companies, eq(customers.companyId, companies.id))
    .where(eq(customers.id, id))
    .limit(1)

  if (row.length === 0) notFound()
  const { customer, company } = row[0]

  const [customerOrders, customerQuotes, customerActivities] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(50),
    db
      .select()
      .from(quotes)
      .where(eq(quotes.customerId, id))
      .orderBy(desc(quotes.createdAt))
      .limit(50),
    db
      .select()
      .from(activities)
      .where(eq(activities.customerId, id))
      .orderBy(desc(activities.createdAt))
      .limit(50),
  ])

  async function addActivity(formData: FormData) {
    'use server'
    await addActivityAction(id, formData)
  }

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href="/admin/customers"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Customers
          </Link>
          <h1 style={{ marginTop: 4 }}>
            {customer.firstName} {customer.lastName}
          </h1>
          <div className="sub">
            {customer.type === 'business' && company
              ? `${company.name} · ${customer.email}`
              : customer.email}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className="adm-btn adm-btn-ghost"
          >
            Edit
          </Link>
          <Link
            href={`/admin/quotes/new?customerId=${customer.id}`}
            className="adm-btn adm-btn-ghost"
          >
            New quote
          </Link>
          <Link
            href={`/admin/orders/new?customerId=${customer.id}`}
            className="adm-btn adm-btn-primary"
          >
            New order
          </Link>
        </div>
      </div>

      <div className="adm-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {customerQuotes.length > 0 && (
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">
                  Quotes ({customerQuotes.length})
                </h2>
              </div>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Vehicle</th>
                    <th className="num">Total</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {customerQuotes.map((q) => (
                    <tr key={q.id}>
                      <td className="mono">
                        <Link href={`/admin/quotes/${q.id}`}>{q.ref}</Link>
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
                      <td style={{ color: '#64748b', fontSize: 12 }}>
                        {fmtRelative(q.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Orders ({customerOrders.length})</h2>
            </div>
            {customerOrders.length === 0 ? (
              <div className="adm-empty">
                <h3>No orders yet</h3>
                <p>Create the first order for this customer.</p>
                <Link
                  href={`/admin/orders/new?customerId=${customer.id}`}
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
                    <th>Vehicle</th>
                    <th className="num">Total</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="mono">
                        <Link href={`/admin/orders/${o.id}`}>{o.ref}</Link>
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
              <h2 className="adm-card-title">Activity & notes</h2>
            </div>
            <div className="adm-card-body">
              <form action={addActivity} style={{ marginBottom: 20 }}>
                <div className="adm-form-grid adm-form-grid-3" style={{ marginBottom: 10 }}>
                  <div className="adm-field">
                    <label>Kind</label>
                    <select name="kind" defaultValue="note">
                      <option value="note">Note</option>
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="task">Task</option>
                    </select>
                  </div>
                  <div className="adm-field" style={{ gridColumn: 'span 2' }}>
                    <label>Title</label>
                    <input name="title" placeholder="Short summary" required />
                  </div>
                </div>
                <div className="adm-field">
                  <label>Body (optional)</label>
                  <textarea name="body" rows={2} />
                </div>
                <div className="adm-field" style={{ marginTop: 10 }}>
                  <label>Due date (tasks only)</label>
                  <input name="dueDate" type="date" />
                </div>
                <div style={{ marginTop: 12, textAlign: 'right' }}>
                  <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm">
                    Add activity
                  </button>
                </div>
              </form>

              {customerActivities.length === 0 ? (
                <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: 12 }}>
                  Nothing logged yet.
                </div>
              ) : (
                <div className="adm-timeline">
                  {customerActivities.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      customerId={customer.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Contact</h2>
            </div>
            <div className="adm-card-body">
              <dl className="adm-kv">
                <dt>Name</dt>
                <dd>
                  {customer.salutation} {customer.firstName} {customer.lastName}
                </dd>
                <dt>Email</dt>
                <dd>
                  <a
                    href={`mailto:${customer.email}`}
                    style={{ color: '#1e3a8a', textDecoration: 'none' }}
                  >
                    {customer.email}
                  </a>
                </dd>
                <dt>Phone</dt>
                <dd>{customer.phone || '—'}</dd>
                <dt>Type</dt>
                <dd style={{ textTransform: 'capitalize' }}>{customer.type}</dd>
                <dt>DOB</dt>
                <dd>{customer.dob || '—'}</dd>
                {customer.type === 'business' && (
                  <>
                    <dt>Position</dt>
                    <dd>{customer.position || '—'}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          {company && (
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">Company</h2>
              </div>
              <div className="adm-card-body">
                <dl className="adm-kv">
                  <dt>Name</dt>
                  <dd>{company.name}</dd>
                  <dt>Companies House #</dt>
                  <dd className="mono">{company.companiesHouseNumber || '—'}</dd>
                  <dt>VAT number</dt>
                  <dd className="mono">{company.vatNumber || '—'}</dd>
                </dl>
              </div>
            </div>
          )}

          <div className="adm-card">
            <div className="adm-card-head">
              <h2 className="adm-card-title">Billing address</h2>
            </div>
            <div className="adm-card-body" style={{ fontSize: 13, lineHeight: 1.6 }}>
              {customer.billingAddress ? (
                <>
                  {customer.billingAddress.line1}
                  <br />
                  {customer.billingAddress.line2 && (
                    <>
                      {customer.billingAddress.line2}
                      <br />
                    </>
                  )}
                  {customer.billingAddress.city}
                  <br />
                  <span className="mono">{customer.billingAddress.postcode}</span>
                  <br />
                  {customer.billingAddress.country}
                </>
              ) : (
                <span style={{ color: '#64748b' }}>Not recorded</span>
              )}
            </div>
          </div>

          {customer.notes && (
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">Internal notes</h2>
              </div>
              <div
                className="adm-card-body"
                style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
              >
                {customer.notes}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: '#64748b', padding: '0 4px' }}>
            Customer since {fmtDate(customer.createdAt)} · last updated{' '}
            {fmtRelative(customer.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityRow({
  activity,
  customerId,
}: {
  activity: {
    id: string
    kind: string
    title: string
    body: string | null
    dueDate: Date | null
    completedAt: Date | null
    createdAt: Date
  }
  customerId: string
}) {
  async function complete() {
    'use server'
    await completeActivityAction(activity.id, customerId)
  }

  return (
    <div className="adm-timeline-item">
      <div className="adm-timeline-dot" />
      <div>
        <div className="adm-timeline-title">
          [{activity.kind}] {activity.title}
        </div>
        {activity.body && (
          <div className="adm-timeline-sub" style={{ whiteSpace: 'pre-wrap' }}>
            {activity.body}
          </div>
        )}
        {activity.dueDate && (
          <div className="adm-timeline-sub">
            Due {fmtDate(activity.dueDate)}
            {activity.completedAt && ' · ✓ done'}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 4,
            alignItems: 'center',
          }}
        >
          <div className="adm-timeline-time">{fmtRelative(activity.createdAt)}</div>
          {activity.kind === 'task' && !activity.completedAt && (
            <form action={complete}>
              <button
                type="submit"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#059669',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark done
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
