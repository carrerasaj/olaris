/**
 * Internal HTML route rendered by Puppeteer and converted to the signed-order
 * PDF. Accepts either:
 *   - an authenticated admin session (useful for previewing in a browser), or
 *   - a valid short-lived HMAC render token in ?t= (how Puppeteer accesses it)
 *
 * Everything on this page lives under the `.pdf-template-root` container so
 * the scoped CSS (./pdf-template.css) takes effect. The admin chrome from
 * ancestor layouts is hidden via CSS rather than restructured — the page is
 * functionally single-use and the override is explicit.
 */

import { notFound } from 'next/navigation'
import { asc, eq, inArray } from 'drizzle-orm'
import {
  db,
  orders,
  customers,
  companies,
  signatures,
  auditEvents,
  suppliers,
} from '@/db/client'
import { auth } from '@/lib/auth'
import { verifyRenderToken } from '@/lib/pdf/render-token'
import { fmtGBPFromPence } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}

export default async function PdfTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t } = await searchParams

  // Access: token OR admin session. Either suffices. Checked before anything
  // else so unauthorised callers get a 404, not leaked order data.
  let authorised = false
  if (t && verifyRenderToken(t, id)) {
    authorised = true
  } else {
    const session = await auth()
    if (session?.user?.role === 'admin') authorised = true
  }
  if (!authorised) notFound()

  const rows = await db
    .select({ order: orders, customer: customers, company: companies })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(companies, eq(orders.companyId, companies.id))
    .where(eq(orders.id, id))
    .limit(1)
  if (rows.length === 0) notFound()
  const { order, customer, company } = rows[0]

  const [sigs, audit] = await Promise.all([
    db
      .select()
      .from(signatures)
      .where(eq(signatures.orderId, id))
      .orderBy(asc(signatures.signedAt)),
    db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.orderId, id))
      .orderBy(asc(auditEvents.createdAt)),
  ])

  const customerSig = sigs.find((s) => s.signerRole === 'customer')
  const repSig = sigs.find((s) => s.signerRole === 'rep')

  // Look up supplier + finance provider rows if assigned. Shown on the PDF
  // so the contract artefact names the parties involved (customer gets a
  // permanent record of who supplied the vehicle + who funded it).
  const supplierIds = [order.vehicleSupplierId, order.financeProviderId].filter(
    (x): x is string => !!x,
  )
  const assignedSuppliers =
    supplierIds.length > 0
      ? await db.select().from(suppliers).where(inArray(suppliers.id, supplierIds))
      : []
  const vehicleSupplierRow = order.vehicleSupplierId
    ? assignedSuppliers.find((s) => s.id === order.vehicleSupplierId) ?? null
    : null
  const financeProviderRow = order.financeProviderId
    ? assignedSuppliers.find((s) => s.id === order.financeProviderId) ?? null
    : null

  // The PDF's Certificate of Completion is a contract artefact, not a
  // general-purpose debug log. Only lifecycle events belong on it. PDF
  // generation + download events are system telemetry — kept in the DB
  // for admin investigation but suppressed here. Without this filter an
  // order that gets downloaded a lot ends up with a trail of identical
  // rows and the cert page overflows.
  const PDF_HIDDEN_EVENTS = new Set([
    'pdf.generated',
    'pdf.downloaded',
    // Repeated "email.sent" rows for the signed-copy delivery double up on
    // everything the signature rows already attest to. Keep only the first.
  ])
  const certAudit = audit.filter((e) => !PDF_HIDDEN_EVENTS.has(e.eventType))

  // Hard cap to keep the cert page from ever flowing onto a second audit
  // page. 25 rows is enough for any normal order lifecycle incl. reminders,
  // OTP retries, migration markers, etc. If we ever trip this in practice
  // the "...earlier events" row flags it.
  const CERT_AUDIT_MAX = 25
  const truncatedCount = Math.max(0, certAudit.length - CERT_AUDIT_MAX)
  const visibleAudit = certAudit.slice(-CERT_AUDIT_MAX)

  const optionsNet = order.options.reduce((s, o) => s + o.netPence * o.qty, 0)
  const netBeforeVat =
    order.pricing.vehicleNetPence + optionsNet - order.pricing.discountPence
  const vat = Math.round((netBeforeVat * order.pricing.vatRate) / 100)
  const otr =
    order.pricing.vedPence +
    order.pricing.firstRegFeePence +
    order.pricing.deliveryFeePence +
    order.pricing.numberPlatesPence

  const billingAddr = customer.billingAddress
    ? [
        customer.billingAddress.line1,
        customer.billingAddress.line2,
        customer.billingAddress.city,
        customer.billingAddress.postcode,
        customer.billingAddress.country,
      ]
        .filter(Boolean)
        .join(', ')
    : null

  const verifyUrl = `${siteUrl()}/verify/${order.ref}`
  const pubkeyUrl = `${siteUrl()}/.well-known/olaris-signing-pubkey.json`

  return (
    <div className="pdf-template-root">
      {/* ── Page 1: Order summary ─────────────────────────────── */}
      <section className="pdf-page">
        <Header orderRef={order.ref} docTitle="Executed Vehicle Order" />

        <div className="pdf-hero">
          <div className="ref">{order.ref}</div>
          <h1>
            {order.vehicle.make} {order.vehicle.model}
          </h1>
          <div className="trim">{order.vehicle.derivative}</div>
          <div className="total">
            <div className="lbl">Drive-away total</div>
            <div className="amt">{fmtGBPFromPence(order.totalAmountPence)}</div>
          </div>
        </div>

        <Section title="Customer">
          <dl className="pdf-kv">
            <dt>Name</dt>
            <dd>
              {customer.salutation ? `${customer.salutation} ` : ''}
              {customer.firstName} {customer.lastName}
            </dd>
            <dt>Email</dt>
            <dd>{customer.email}</dd>
            {customer.phone && (
              <>
                <dt>Phone</dt>
                <dd>{customer.phone}</dd>
              </>
            )}
            {company?.name && (
              <>
                <dt>Company</dt>
                <dd>{company.name}</dd>
              </>
            )}
            {billingAddr && (
              <>
                <dt>Billing address</dt>
                <dd>{billingAddr}</dd>
              </>
            )}
          </dl>
        </Section>

        <Section title="Vehicle">
          <dl className="pdf-kv">
            <dt>Make / model</dt>
            <dd>
              {order.vehicle.make} {order.vehicle.model}
            </dd>
            <dt>Derivative</dt>
            <dd>{order.vehicle.derivative}</dd>
            <dt>Category</dt>
            <dd>{order.vehicle.category}</dd>
            <dt>Fuel / gearbox</dt>
            <dd>
              {order.vehicle.fuel} · {order.vehicle.transmission}
            </dd>
            <dt>Colour / trim</dt>
            <dd>
              {order.vehicle.colour} · {order.vehicle.trim}
            </dd>
            <dt>Registration</dt>
            <dd>{order.vehicle.registration}</dd>
            <dt>CO₂</dt>
            <dd>{order.vehicle.co2} g/km</dd>
          </dl>
        </Section>

        {(vehicleSupplierRow || financeProviderRow) && (
          <Section title="Parties">
            <dl className="pdf-kv">
              {vehicleSupplierRow && (
                <>
                  <dt>Vehicle supplier</dt>
                  <dd>
                    {vehicleSupplierRow.tradingName ?? vehicleSupplierRow.legalName}
                    {vehicleSupplierRow.tradingName &&
                      ` (${vehicleSupplierRow.legalName})`}
                  </dd>
                </>
              )}
              {financeProviderRow && (
                <>
                  <dt>Finance provider</dt>
                  <dd>
                    {financeProviderRow.tradingName ?? financeProviderRow.legalName}
                  </dd>
                </>
              )}
              <dt>Broker</dt>
              <dd>Olaris Consulting Ltd</dd>
            </dl>
          </Section>
        )}

        {order.options.length > 0 && (
          <Section title={`Factory options (${order.options.length})`}>
            {order.options.map((o) => (
              <div key={o.id} className="pdf-price-row">
                <span>
                  {o.name || '—'}
                  {o.qty > 1 ? ` × ${o.qty}` : ''}
                </span>
                <span className="v">{fmtGBPFromPence(o.netPence * o.qty)}</span>
              </div>
            ))}
          </Section>
        )}

        <Section title="Pricing">
          <div className="pdf-price-row">
            <span>Vehicle (net, less discount)</span>
            <span className="v">
              {fmtGBPFromPence(
                order.pricing.vehicleNetPence - order.pricing.discountPence,
              )}
            </span>
          </div>
          <div className="pdf-price-row">
            <span>Factory options</span>
            <span className="v">{fmtGBPFromPence(optionsNet)}</span>
          </div>
          <div className="pdf-price-row">
            <span>VAT @ {order.pricing.vatRate}%</span>
            <span className="v">{fmtGBPFromPence(vat)}</span>
          </div>
          <div className="pdf-price-row">
            <span>On-the-road costs</span>
            <span className="v">{fmtGBPFromPence(otr)}</span>
          </div>
          <div className="pdf-price-total">
            <span className="lbl">Drive-away total</span>
            <span className="v">{fmtGBPFromPence(order.totalAmountPence)}</span>
          </div>
        </Section>

        {order.financeType !== 'OP' && (
          <Section title="Finance">
            <dl className="pdf-kv">
              <dt>Product</dt>
              <dd>{order.financeType}</dd>
              <dt>Term</dt>
              <dd>{order.finance.term} months</dd>
              <dt>Annual mileage</dt>
              <dd>{order.finance.annualMileage.toLocaleString('en-GB')} miles</dd>
              <dt>Initial rental</dt>
              <dd>{order.finance.initialRental} × monthly</dd>
              <dt>Monthly</dt>
              <dd>{fmtGBPFromPence(order.monthlyAmountPence)} + VAT</dd>
            </dl>
          </Section>
        )}

        <Section title="Delivery">
          <dl className="pdf-kv">
            <dt>Method</dt>
            <dd>{order.delivery.method}</dd>
            <dt>Address</dt>
            <dd>
              {order.delivery.address}, {order.delivery.city} {order.delivery.postcode}
            </dd>
            <dt>Preferred date</dt>
            <dd>{order.delivery.preferredDate || 'To confirm'}</dd>
          </dl>
        </Section>

        <Footer />
      </section>

      {/* ── Page 2: Signatures ─────────────────────────────────── */}
      <section className="pdf-page">
        <Header orderRef={order.ref} docTitle="Signatures" />
        <p className="pdf-cert-intro">
          Both parties named below have applied their electronic signature under the
          UK Electronic Communications Act 2000. Each signature carries its own
          forensic envelope (IP, user-agent, timestamp, geo-location) and a SHA-256
          hash of the order data as captured at sign time, signed by the Olaris
          document-signing server key.
        </p>

        {customerSig && <SignatureCard role="Customer signature" sig={customerSig} />}
        {repSig && (
          <SignatureCard role="Olaris representative signature" sig={repSig} />
        )}

        <Footer />
      </section>

      {/* ── Page 3: Certificate of Completion ─────────────────── */}
      <section className="pdf-page">
        <Header orderRef={order.ref} docTitle="Certificate of Completion" />

        <div className="pdf-cert-hero">
          <div className="pdf-cert-icon">✓</div>
          <div>
            <div className="pdf-cert-title">Executed &amp; verified</div>
            <div className="pdf-cert-sub">
              Cryptographic attestation · UK eIDAS SES tier
            </div>
          </div>
        </div>

        <p className="pdf-cert-intro">
          {'This certificate attests that order '}
          <span className="mono">{order.ref}</span>
          {
            ' was signed by both parties as recorded below. You can independently verify the signed order at the public URL at the bottom of this page.'
          }
        </p>

        <Section title="Audit trail">
          {truncatedCount > 0 && (
            <div
              className="pdf-audit-row"
              style={{ fontStyle: 'italic', color: '#64748b' }}
            >
              <span className="pdf-audit-time">…</span>
              <span className="pdf-audit-actor">—</span>
              <span>{`${truncatedCount} earlier event${truncatedCount === 1 ? '' : 's'} — full trail in admin`}</span>
            </div>
          )}
          {visibleAudit.map((e) => (
            <div key={e.id} className="pdf-audit-row">
              <span className="pdf-audit-time">{e.createdAt.toISOString()}</span>
              <span className="pdf-audit-actor">{e.actorType}</span>
              <span>{auditLabel(e.eventType)}</span>
            </div>
          ))}
        </Section>

        <div className="pdf-crypto">
          <div className="lbl">Document SHA-256 (canonical order JSON)</div>
          <div className="val">
            {customerSig?.documentSha256 ?? repSig?.documentSha256 ?? '—'}
          </div>

          <div className="lbl">Ed25519 signatures</div>
          {customerSig && (
            <div className="val">customer → {customerSig.serverSignature}</div>
          )}
          {repSig && <div className="val">rep → {repSig.serverSignature}</div>}

          <div className="lbl">Public key fingerprint</div>
          <div className="val">
            {customerSig?.signingKeyFingerprint ?? repSig?.signingKeyFingerprint ?? '—'}
          </div>

          <div className="lbl">Verify at</div>
          <div className="val">
            <a href={verifyUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
              <span className="url">{verifyUrl}</span>
            </a>
          </div>

          <div className="lbl">Public key published at</div>
          <div className="val">
            <a href={pubkeyUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
              <span className="url">{pubkeyUrl}</span>
            </a>
          </div>
        </div>

        <Footer />
      </section>
    </div>
  )
}

// ── Sub-components (all server-rendered) ────────────────────────

function Header({ orderRef, docTitle }: { orderRef: string; docTitle: string }) {
  return (
    <div className="pdf-header">
      <div>
        <div className="pdf-brand">Olaris</div>
        <div className="pdf-tag">Fleet Intelligence</div>
      </div>
      <div className="pdf-doctitle">
        <div className="title">{docTitle}</div>
        <div className="ref">{orderRef}</div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pdf-section">
      <div className="pdf-section-head">{title}</div>
      <div className="pdf-section-body">{children}</div>
    </div>
  )
}

function SignatureCard({
  role,
  sig,
}: {
  role: string
  sig: {
    signerName: string
    signerEmail: string
    signatureType: 'typed' | 'drawn'
    signatureData: string
    signedAt: Date
    ip: string | null
    userAgent: string | null
    geoCity: string | null
    geoCountry: string | null
    otpVerifiedAt: Date | null
    signerRole: 'customer' | 'rep'
  }
}) {
  return (
    <div className="pdf-sig">
      <div className="pdf-sig-head">
        <div className="pdf-sig-role">{role}</div>
        <div className="pdf-sig-stamp">SIGNED · {sig.signedAt.toISOString()}</div>
      </div>
      <div className="pdf-sig-canvas">
        {sig.signatureType === 'drawn' ? (
          // Base64 PNG data URL — safe to inline, renders from <img src="data:...">
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sig.signatureData}
            alt={`${role} signature`}
            className="pdf-sig-drawn"
          />
        ) : (
          <div className="pdf-sig-typed">{sig.signerName}</div>
        )}
      </div>
      <div className="pdf-sig-meta">
        <div>
          <div className="lbl">Name</div>
          <div className="val">{sig.signerName}</div>
        </div>
        <div>
          <div className="lbl">Email</div>
          <div className="val">{sig.signerEmail}</div>
        </div>
        <div>
          <div className="lbl">Method</div>
          <div className="val">
            {sig.signatureType}
            {sig.otpVerifiedAt
              ? ' · OTP-verified'
              : sig.signerRole === 'rep'
                ? ' · session-authenticated'
                : ''}
          </div>
        </div>
        <div>
          <div className="lbl">Signed at (UTC)</div>
          <div className="val">{sig.signedAt.toISOString()}</div>
        </div>
        <div>
          <div className="lbl">IP address</div>
          <div className="val">{sig.ip || '—'}</div>
        </div>
        <div>
          <div className="lbl">Location</div>
          <div className="val">
            {[sig.geoCity, sig.geoCountry].filter(Boolean).join(', ') || '—'}
          </div>
        </div>
        <div className="full">
          <div className="lbl">User agent</div>
          <div className="val">{sig.userAgent ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div className="pdf-footer">
      Olaris Consulting Ltd · Charlbury OX7 3EG · Authorised and regulated by the FCA
    </div>
  )
}

function auditLabel(type: string): string {
  const map: Record<string, string> = {
    'customer.created': 'Customer created',
    'customer.updated': 'Customer updated',
    'order.created': 'Order created',
    'order.updated': 'Order updated',
    'order.sent': 'Order sent for signature',
    'order.cancelled': 'Order cancelled',
    'order.delivered': 'Order marked delivered',
    'link.viewed': 'Signing link viewed',
    'otp.requested': 'OTP requested',
    'otp.verified': 'OTP verified',
    'otp.failed': 'OTP failed',
    signed: 'Signature captured',
    'sign.declined': 'Signature declined',
    'pdf.generated': 'PDF generated',
    'pdf.downloaded': 'PDF downloaded',
    'reminder.sent': 'Reminder sent',
    'email.sent': 'Email sent',
    'email.failed': 'Email failed',
  }
  return map[type] ?? type
}
