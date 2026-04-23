import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import {
  db,
  quotes,
  quoteTokens,
  orders,
  customers,
  companies,
  auditEvents,
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import {
  fmtGBPFromPence,
  fmtDate,
  fmtDateTime,
  fmtRelative,
} from '@/lib/format'
import { QuoteStatusPill, auditEventLabel } from '../../components'
import {
  sendQuoteAction,
  markQuoteAcceptedAction,
  markQuoteDeclinedAction,
  cancelQuoteAction,
  convertQuoteToOrderAction,
} from '../../actions/quotes'

export const metadata = { title: 'Quote' }

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const rows = await db
    .select({ quote: quotes, customer: customers, company: companies })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .leftJoin(companies, eq(quotes.companyId, companies.id))
    .where(eq(quotes.id, id))
    .limit(1)
  if (rows.length === 0) notFound()
  const { quote, customer, company } = rows[0]

  const now = new Date()
  const expiredByDate = quote.expiresAt <= now
  // Effective status for the UI: if the quote says sent/viewed/accepted but
  // has timed out, treat it as expired for action gating.
  const effectiveStatus =
    expiredByDate && ['sent', 'viewed', 'accepted'].includes(quote.status)
      ? 'expired'
      : quote.status

  const [events, activeToken, convertedOrder] = await Promise.all([
    db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.quoteId, id))
      .orderBy(desc(auditEvents.createdAt))
      .limit(50),
    db
      .select()
      .from(quoteTokens)
      .where(eq(quoteTokens.quoteId, id))
      .orderBy(desc(quoteTokens.createdAt))
      .limit(1),
    quote.convertedOrderId
      ? db
          .select({ id: orders.id, ref: orders.ref, status: orders.status })
          .from(orders)
          .where(eq(orders.id, quote.convertedOrderId))
          .limit(1)
      : Promise.resolve([]),
  ])

  const canEdit = quote.status === 'draft'
  const canSend = ['draft', 'sent', 'viewed'].includes(effectiveStatus)
  const canAccept =
    ['sent', 'viewed'].includes(quote.status) && !expiredByDate
  const canDecline = ['sent', 'viewed'].includes(quote.status)
  const canConvert = quote.status === 'accepted' && !expiredByDate
  const canCancel = !['converted', 'cancelled'].includes(quote.status)

  const publicUrl = activeToken[0]
    ? `${siteUrl()}/quote/${activeToken[0].token}`
    : null

  // ─── server-action binders ──────────────────────────────────────────

  async function send() {
    'use server'
    await sendQuoteAction(id)
  }
  async function accept() {
    'use server'
    await markQuoteAcceptedAction(id)
  }
  async function decline() {
    'use server'
    await markQuoteDeclinedAction(id)
  }
  async function cancel() {
    'use server'
    await cancelQuoteAction(id)
  }
  async function convert() {
    'use server'
    const result = await convertQuoteToOrderAction(id)
    if (result.ok && result.orderId) {
      redirect(`/admin/orders/${result.orderId}`)
    }
  }

  const customerName = `${customer.firstName} ${customer.lastName}`

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-pageheader">
        <div>
          <Link
            href="/admin/quotes"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Quotes
          </Link>
          <h1 style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono" style={{ fontSize: 22 }}>{quote.ref}</span>
            <QuoteStatusPill status={effectiveStatus} />
          </h1>
          <div className="sub">
            {customerName}
            {company ? ` · ${company.name}` : ''} · {quote.vehicle.make}{' '}
            {quote.vehicle.model}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canEdit && (
            <Link href={`/admin/quotes/${id}/edit`} className="adm-btn adm-btn-ghost">
              Edit
            </Link>
          )}
          {canSend && (
            <form action={send}>
              <button type="submit" className="adm-btn adm-btn-primary">
                {quote.status === 'draft' ? 'Send quote' : 'Resend'}
              </button>
            </form>
          )}
          {canAccept && (
            <form action={accept}>
              <button
                type="submit"
                className="adm-btn"
                style={{ background: '#047857', color: '#fff' }}
              >
                Mark accepted
              </button>
            </form>
          )}
          {canDecline && (
            <form action={decline}>
              <button type="submit" className="adm-btn adm-btn-ghost">
                Mark declined
              </button>
            </form>
          )}
          {canConvert && (
            <form action={convert}>
              <button type="submit" className="adm-btn adm-btn-primary">
                Convert to order →
              </button>
            </form>
          )}
          {canCancel && (
            <form action={cancel}>
              <button
                type="submit"
                className="adm-btn adm-btn-ghost"
                style={{ color: '#b91c1c' }}
              >
                Cancel quote
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Expired banner — shown when expiry date has passed but status
          hasn't caught up yet (between cron runs). Redundant with the
          effective-status pill above, but reinforces the date. */}
      {expiredByDate && quote.status !== 'expired' && quote.status !== 'converted' && (
        <div
          style={{
            padding: '10px 14px',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            color: '#78350f',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          ⏱ This quote passed its expiry date ({fmtDate(quote.expiresAt)}).
          Accept/convert actions are disabled. It will be auto-expired by the
          next scheduled cron run.
        </div>
      )}

      {/* Converted banner */}
      {convertedOrder[0] && (
        <div
          style={{
            padding: '12px 14px',
            background: '#dbeafe',
            border: '1px solid #93c5fd',
            color: '#0b1e3f',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Converted to order{' '}
          <Link
            href={`/admin/orders/${convertedOrder[0].id}`}
            className="mono"
            style={{ fontWeight: 700 }}
          >
            {convertedOrder[0].ref}
          </Link>{' '}
          (status: <strong>{convertedOrder[0].status}</strong>).
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary */}
          <div className="adm-card">
            <h3>Quote summary</h3>
            <dl className="adm-dl">
              <dt>Customer</dt>
              <dd>
                <Link href={`/admin/customers/${customer.id}`}>{customerName}</Link>{' '}
                <span style={{ color: '#64748b' }}>· {customer.email}</span>
              </dd>
              {company && (
                <>
                  <dt>Company</dt>
                  <dd>{company.name}</dd>
                </>
              )}
              <dt>Vehicle</dt>
              <dd>
                {quote.vehicle.make} {quote.vehicle.model}
                {quote.vehicle.derivative ? ` · ${quote.vehicle.derivative}` : ''}
              </dd>
              <dt>Finance</dt>
              <dd>
                {quote.financeType} · {quote.finance.term}mo ·{' '}
                {quote.finance.annualMileage.toLocaleString()} mi/yr
              </dd>
              <dt>Drive-away total</dt>
              <dd className="mono" style={{ fontWeight: 700 }}>
                {fmtGBPFromPence(quote.totalAmountPence)}
              </dd>
              {quote.monthlyAmountPence > 0 && (
                <>
                  <dt>Monthly</dt>
                  <dd className="mono">{fmtGBPFromPence(quote.monthlyAmountPence)}</dd>
                </>
              )}
              <dt>Valid until</dt>
              <dd
                style={{
                  color: expiredByDate ? '#dc2626' : undefined,
                  fontWeight: expiredByDate ? 700 : undefined,
                }}
              >
                {fmtDate(quote.expiresAt)}
                {!expiredByDate && (
                  <span style={{ color: '#64748b', marginLeft: 6 }}>
                    ({fmtRelative(quote.expiresAt)})
                  </span>
                )}
              </dd>
            </dl>
            {quote.notes && (
              <>
                <h4 style={{ marginTop: 16 }}>Internal notes</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{quote.notes}</p>
              </>
            )}
            {quote.customerNotes && (
              <>
                <h4 style={{ marginTop: 16 }}>Shown to customer</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{quote.customerNotes}</p>
              </>
            )}
          </div>

          {/* Audit trail */}
          <div className="adm-card">
            <h3>Timeline</h3>
            {events.length === 0 ? (
              <p style={{ color: '#64748b' }}>No events yet.</p>
            ) : (
              <ul className="adm-timeline">
                {events.map((e) => (
                  <li key={e.id}>
                    <div className="t">
                      {fmtDateTime(e.createdAt)}{' '}
                      <span style={{ color: '#94a3b8' }}>· {e.actorType}</span>
                    </div>
                    <div>{auditEventLabel(e.eventType)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Public link */}
          <div className="adm-card">
            <h3>Public link</h3>
            {publicUrl ? (
              <>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
                  Send the customer this read-only link. Anyone with the URL can
                  view the quote — there is no customer accept/decline UI, so
                  this only reveals the price and vehicle details.
                </p>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    wordBreak: 'break-all',
                    padding: 8,
                    background: '#f8fafc',
                    border: '1px solid #e4e9f1',
                    borderRadius: 4,
                  }}
                >
                  {publicUrl}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Link
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                  >
                    Open in new tab
                  </Link>
                </div>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: 13 }}>
                No link yet — hit <strong>Send quote</strong> to email the
                customer and mint the public URL.
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="adm-card">
            <h3>Meta</h3>
            <dl className="adm-dl">
              <dt>Created</dt>
              <dd>{fmtDateTime(quote.createdAt)}</dd>
              {quote.sentAt && (
                <>
                  <dt>Sent</dt>
                  <dd>{fmtDateTime(quote.sentAt)}</dd>
                </>
              )}
              {quote.viewedAt && (
                <>
                  <dt>First viewed</dt>
                  <dd>{fmtDateTime(quote.viewedAt)}</dd>
                </>
              )}
              {quote.acceptedAt && (
                <>
                  <dt>Accepted</dt>
                  <dd>{fmtDateTime(quote.acceptedAt)}</dd>
                </>
              )}
              {quote.declinedAt && (
                <>
                  <dt>Declined</dt>
                  <dd>{fmtDateTime(quote.declinedAt)}</dd>
                </>
              )}
              {quote.cancelledAt && (
                <>
                  <dt>Cancelled</dt>
                  <dd>{fmtDateTime(quote.cancelledAt)}</dd>
                </>
              )}
              {quote.convertedAt && (
                <>
                  <dt>Converted</dt>
                  <dd>{fmtDateTime(quote.convertedAt)}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}
