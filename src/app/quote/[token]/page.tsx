/**
 * Public customer-facing quote view. Read-only in v1 — no accept button,
 * no signature capture. Customer replies by email/phone; admin flips status.
 *
 * Expired rule: if `expires_at < now()` OR status is terminal non-converted
 * (expired, cancelled, declined), render the unavailable card regardless of
 * what the DB status currently says. Closes the gap between cron runs and
 * hides cancelled/declined quotes without needing to rotate tokens.
 */

import Link from 'next/link'
import { eq, inArray } from 'drizzle-orm'
import {
  db,
  quotes,
  quoteTokens,
  customers,
  suppliers,
} from '@/db/client'
import { fmtDate, fmtGBPFromPence } from '@/lib/format'
import { markQuoteViewedByToken } from '@/app/admin/actions/quotes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function QuoteViewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const tokenRows = await db
    .select()
    .from(quoteTokens)
    .where(eq(quoteTokens.token, token))
    .limit(1)

  if (tokenRows.length === 0) {
    return (
      <div className="sgn-shell">
        <UnavailableCard />
        <Footer />
      </div>
    )
  }

  const quoteRows = await db
    .select({ quote: quotes, customer: customers })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .where(eq(quotes.id, tokenRows[0].quoteId))
    .limit(1)

  if (quoteRows.length === 0) {
    return (
      <div className="sgn-shell">
        <UnavailableCard />
        <Footer />
      </div>
    )
  }

  const { quote, customer } = quoteRows[0]
  const now = new Date()
  const isUnavailable =
    quote.expiresAt <= now ||
    ['expired', 'cancelled', 'declined'].includes(quote.status)

  if (isUnavailable) {
    return (
      <div className="sgn-shell">
        <UnavailableCard />
        <Footer />
      </div>
    )
  }

  // Fire-and-forget view audit. Action is idempotent (only flips sent →
  // viewed) so repeated hits are safe.
  await markQuoteViewedByToken(token)

  // Resolve supplier names (trading / legal fallback) for display.
  const supplierIds = [quote.vehicleSupplierId, quote.financeProviderId].filter(
    (x): x is string => !!x,
  )
  const supplierRows =
    supplierIds.length > 0
      ? await db.select().from(suppliers).where(inArray(suppliers.id, supplierIds))
      : []
  const vehicleSupplierName = quote.vehicleSupplierId
    ? supplierRows.find((s) => s.id === quote.vehicleSupplierId)?.tradingName ??
      supplierRows.find((s) => s.id === quote.vehicleSupplierId)?.legalName ??
      null
    : null

  return (
    <div className="sgn-shell">
      <div className="sgn-page">
        <div className="sgn-header">
          <OlarisLogo />
          <div className="tag">Your quote</div>
        </div>

        <div className="sgn-card">
          <div className="sgn-card-head">
            <h2 className="sgn-card-title">Quote {quote.ref}</h2>
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Valid until {fmtDate(quote.expiresAt)}
            </span>
          </div>
          <div className="sgn-card-body">
            <dl className="sgn-kv">
              <dt>Prepared for</dt>
              <dd>
                {customer.firstName} {customer.lastName}
              </dd>
              <dt>Vehicle</dt>
              <dd>
                {quote.vehicle.make} {quote.vehicle.model}
                {quote.vehicle.derivative ? ` · ${quote.vehicle.derivative}` : ''}
              </dd>
              {vehicleSupplierName && (
                <>
                  <dt>Vehicle supplier</dt>
                  <dd>{vehicleSupplierName}</dd>
                </>
              )}
              <dt>Drive-away total</dt>
              <dd
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {fmtGBPFromPence(quote.totalAmountPence)}
              </dd>
              {quote.monthlyAmountPence > 0 && (
                <>
                  <dt>Monthly</dt>
                  <dd
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                    }}
                  >
                    {fmtGBPFromPence(quote.monthlyAmountPence)}
                  </dd>
                </>
              )}
              {quote.finance.term > 0 && (
                <>
                  <dt>Term</dt>
                  <dd>
                    {quote.finance.term} months ·{' '}
                    {quote.finance.annualMileage.toLocaleString()} miles/year
                  </dd>
                </>
              )}
            </dl>

            {quote.customerNotes && (
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  background: '#f8fafc',
                  borderRadius: 6,
                  borderLeft: '3px solid #06b6d4',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    marginBottom: 6,
                  }}
                >
                  Notes from Olaris
                </div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: '#0f172a' }}>
                  {quote.customerNotes}
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 22,
                padding: 16,
                background: '#fefce8',
                border: '1px solid #fde68a',
                borderRadius: 6,
                fontSize: 13,
                lineHeight: 1.55,
                color: '#78350f',
              }}
            >
              <strong>To accept this quote</strong>, reply to our email or call{' '}
              <a
                href="mailto:alan@olaris.co.uk"
                style={{ color: '#78350f', fontWeight: 600 }}
              >
                alan@olaris.co.uk
              </a>
              . We'll prepare the order for electronic signing as soon as you're
              ready.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function UnavailableCard() {
  return (
    <div className="sgn-empty">
      <div
        className="sgn-empty-icon"
        style={{ background: '#fef3c7', color: '#b45309' }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1>This quote is no longer available</h1>
      <p>
        It may have expired or been withdrawn. Please{' '}
        <a href="mailto:alan@olaris.co.uk">contact us</a> for an up-to-date quote.
      </p>
    </div>
  )
}

function Footer() {
  return (
    <div className="sgn-footer">
      Olaris Consulting Ltd · Charlbury OX7 3EG
      <br />
      Authorised and regulated by the FCA ·{' '}
      <Link href="/privacy-policy" style={{ color: '#64748b' }}>
        Privacy
      </Link>{' '}
      ·{' '}
      <Link href="/terms" style={{ color: '#64748b' }}>
        Terms
      </Link>
    </div>
  )
}

function OlarisLogo() {
  return (
    <div
      style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: 22,
        fontWeight: 700,
        color: '#0b1e3f',
        letterSpacing: '-0.02em',
      }}
    >
      Olaris
    </div>
  )
}
