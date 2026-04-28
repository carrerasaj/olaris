import { db, auditEvents } from '@/db/client'
import { lookupSigningToken, lookupFailureCopy } from '@/lib/signing-token'
import { captureForensics } from '@/lib/forensics'
import { SignClient } from './SignClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const lookup = await lookupSigningToken(token)
  const forensics = await captureForensics()

  if (!lookup.ok) {
    // Best-effort audit of the failed access so Alan sees link probing.
    // We don't have an order reference when the token isn't found, so these
    // events go in without an orderId.
    return (
      <div className="sgn-shell">
        <ErrorCard reason={lookup.reason} />
        <Footer />
      </div>
    )
  }

  // Record the link-view event — useful both as audit trail and as an
  // indicator to Alan that the customer has seen the order.
  await db.insert(auditEvents).values({
    orderId: lookup.order.id,
    customerId: lookup.order.customerId,
    actorType: 'customer',
    actorId: lookup.token.id,
    eventType: 'link.viewed',
    payload: null,
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
  })

  // Snapshot the order down to what the client actually renders. Keep it
  // minimal — raw DB rows include a lot the UI doesn't need, and some
  // fields (internal notes, audit IDs) shouldn't reach the customer.
  const view = {
    token,
    orderRef: lookup.order.ref,
    signerRole: lookup.token.signerRole,
    customer: {
      firstName: lookup.customer.firstName,
      lastName: lookup.customer.lastName,
      email: lookup.customer.email,
      company: lookup.company?.name ?? null,
    },
    vehicle: lookup.order.vehicle,
    options: lookup.order.options,
    pricing: lookup.order.pricing,
    finance: lookup.order.finance,
    addons: lookup.order.addons,
    delivery: lookup.order.delivery,
    partExchange: lookup.order.partExchange,
    financeType: lookup.order.financeType,
    totalAmountPence: lookup.order.totalAmountPence,
    monthlyAmountPence: lookup.order.monthlyAmountPence,
    requiresOtp: lookup.order.requiresOtp,
    expiresAt: lookup.token.expiresAt.toISOString(),
  }

  return (
    <div className="sgn-shell">
      <SignClient view={view} />
      <Footer />
    </div>
  )
}

function ErrorCard({ reason }: { reason: import('@/lib/signing-token').LookupFailure }) {
  const { title, body } = lookupFailureCopy(reason)
  return (
    <div className="sgn-empty">
      <div className="sgn-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1>{title}</h1>
      <p>{body}</p>
    </div>
  )
}

function Footer() {
  return (
    <div className="sgn-footer">
      Olaris Consulting Ltd · Charlbury OX7 3EG
      <br />
      Authorised and regulated by the FCA · <a href="https://olaris.co.uk/privacy-policy" style={{ color: '#64748b' }}>Privacy</a> · <a href="https://olaris.co.uk/terms" style={{ color: '#64748b' }}>Terms</a>
    </div>
  )
}
