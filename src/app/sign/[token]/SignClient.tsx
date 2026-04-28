'use client'

/**
 * Customer-facing signing client. Renders the order summary + signing
 * widgets. Talks to /api/sign/submit, /api/sign/decline.
 *
 * UX states:
 *   - 'review'   : customer reading the order, signing in one step
 *   - 'success'  : signed, thank-you screen
 *   - 'declined' : customer declined, confirmation screen
 *
 * Default flow is single-step SES per UK eIDAS: link click is the auth
 * factor (proves the customer received the email at their verified
 * address); the page captures consent, intent, signature, IP/UA/geo,
 * and a doc hash + Ed25519 signature. The OTP path is preserved at
 * /api/sign/otp for orders that opt in via `orders.requires_otp`
 * (PR2 introduces that flag and the conditional UI branch).
 */

import { useMemo, useState, type FormEvent } from 'react'
import { SignatureCapture, type SignaturePayload } from '../SignatureCapture'

interface ViewOrder {
  token: string
  orderRef: string
  signerRole: 'customer' | 'rep'
  customer: {
    firstName: string
    lastName: string
    email: string
    company: string | null
  }
  vehicle: {
    category: string
    make: string
    model: string
    derivative: string
    fuel: string
    transmission: string
    colour: string
    trim: string
    registration: string
    co2: number
  }
  options: Array<{ id: string; name: string; sku: string; qty: number; netPence: number; vatRate: number }>
  pricing: {
    vehicleNetPence: number
    discountPence: number
    vatRate: number
    vedPence: number
    firstRegFeePence: number
    deliveryFeePence: number
    numberPlatesPence: number
  }
  finance: {
    term: number
    annualMileage: number
    initialRental: number
    monthlyNetPence: number
    balloonPence: number
  }
  addons: {
    maintenance: boolean
    maintenanceMonthlyPence: number
    gap: boolean
    tyreCover: boolean
    tyreMonthlyPence: number
    breakdown: boolean
    breakdownMonthlyPence: number
  }
  delivery: {
    method: string
    address: string
    city: string
    postcode: string
    preferredDate: string
  }
  partExchange: {
    enabled: boolean
    reg: string
    make: string
    model: string
  } | null
  financeType: string
  totalAmountPence: number
  monthlyAmountPence: number
  /**
   * When true, the customer's signing flow includes an email-OTP step
   * before submission. Set per-order from the admin UI; default false
   * (single-step SES). Server enforces — sending an `otp`-less submit
   * for an `requires_otp = true` order will be rejected.
   */
  requiresOtp: boolean
  expiresAt: string
}

type Stage = 'review' | 'awaiting' | 'success' | 'declined'

export function SignClient({ view }: { view: ViewOrder }) {
  const [stage, setStage] = useState<Stage>('review')
  const [consents, setConsents] = useState({
    terms: false,
    fcaDisclosure: false,
    gdpr: false,
  })
  const [intent, setIntent] = useState(false)
  const [signature, setSignature] = useState<SignaturePayload | null>(null)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [alert, setAlert] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(
    null,
  )
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const allConsented = consents.terms && consents.fcaDisclosure && consents.gdpr
  const readyToSign = allConsented && intent && !!signature
  const canSubmitOtp = otp.length === 6 && /^\d{6}$/.test(otp)

  // The submit button shows what's blocking the customer. Order matters:
  // signature → consents → intent. Same order the form is laid out in.
  const blockerText = !signature
    ? 'Add a signature to continue'
    : !allConsented
      ? 'Tick all consent boxes to continue'
      : !intent
        ? 'Confirm intent to sign to continue'
        : null

  const expiryText = useMemo(
    () =>
      new Date(view.expiresAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [view.expiresAt],
  )

  // ─── OTP request (only when view.requiresOtp) ────────────────
  async function requestOtp() {
    setRequestingOtp(true)
    setAlert(null)
    setOtpError(null)
    try {
      const r = await fetch('/api/sign/otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: view.token }),
      })
      const data = await r.json()
      if (!r.ok || !data.ok) {
        if (data.reason === 'rate_limited') {
          setAlert({
            kind: 'error',
            text: 'Too many codes requested. Please wait a few minutes and try again.',
          })
          return
        }
        setAlert({
          kind: 'error',
          text: 'Could not send a verification code. Please try again in a moment.',
        })
        return
      }
      setStage('awaiting')
      setAlert({
        kind: 'info',
        text: `A 6-digit code has been emailed to ${view.customer.email}. It expires in 10 minutes.`,
      })
    } finally {
      setRequestingOtp(false)
    }
  }

  // ─── Submit ─────────────────────────────────────────────────
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!readyToSign) return
    if (view.requiresOtp && !canSubmitOtp) return
    setSubmitting(true)
    setAlert(null)
    setOtpError(null)
    try {
      const r = await fetch('/api/sign/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: view.token,
          // Only include `otp` when this order required it. Server
          // enforces — sending one without `requires_otp = true` is
          // ignored, omitting one for `requires_otp = true` is rejected.
          ...(view.requiresOtp ? { otp } : {}),
          intent: true,
          consents,
          signature,
        }),
      })
      const data = await r.json()
      if (!r.ok || !data.ok) {
        if (data.error === 'bad_otp') {
          setOtpError(
            data.remaining > 0
              ? `Incorrect code. ${data.remaining} attempts remaining.`
              : 'Too many incorrect attempts. Please request a new code.',
          )
        } else if (data.error === 'otp_locked') {
          setOtpError('Too many attempts. Please request a new code.')
        } else if (data.error === 'no_active_otp' || data.error === 'otp_required') {
          setOtpError('Your code has expired or wasn’t sent. Please request a new one.')
        } else if (data.error === 'already_signed') {
          setAlert({ kind: 'info', text: 'This order has already been signed.' })
        } else if (data.error === 'expired' || data.error === 'consumed' || data.error === 'cancelled') {
          setAlert({
            kind: 'error',
            text: 'This signing link is no longer valid. Please contact your Olaris representative.',
          })
        } else {
          setAlert({
            kind: 'error',
            text: 'Could not submit your signature. Please try again, or contact your Olaris representative.',
          })
        }
        return
      }
      setStage('success')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Decline ────────────────────────────────────────────────
  async function decline() {
    setSubmitting(true)
    try {
      const r = await fetch('/api/sign/decline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: view.token, reason: declineReason }),
      })
      if (r.ok) {
        setStage('declined')
      } else {
        setAlert({ kind: 'error', text: 'Could not record your decline. Please try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────
  if (stage === 'success') {
    return <SuccessScreen view={view} />
  }
  if (stage === 'declined') {
    return <DeclinedScreen />
  }

  return (
    <div className="sgn-page">
      <div className="sgn-header">
        <OlarisLogo />
        <div className="tag">E-signature</div>
      </div>

      {alert && <div className={`sgn-alert sgn-alert-${alert.kind}`}>{alert.text}</div>}

      <div className="sgn-hero">
        <span className="ref">{view.orderRef}</span>
        <h1>{view.vehicle.make} {view.vehicle.model}</h1>
        <div className="trim">{view.vehicle.derivative}</div>
        <div className="total">
          <div>
            <div className="lbl">Drive-away total</div>
            {view.financeType !== 'OP' && (
              <div style={{ fontSize: 12, color: '#7dd3fc', marginTop: 10 }}>
                Or <strong style={{ color: '#fff' }}>{pence(view.monthlyAmountPence)}/mo</strong> + VAT over {view.finance.term} months
              </div>
            )}
          </div>
          <div className="amt">{pence(view.totalAmountPence)}</div>
        </div>
      </div>

      {/* Single-glance guidance so the customer doesn't need any
          off-page instructions (a phone call, a separate email, etc.).
          Three steps, in the order the page is laid out. */}
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          padding: '14px 16px',
          fontSize: 13,
          color: '#1e3a8a',
          lineHeight: 1.55,
          margin: '4px 0 18px',
        }}
      >
        <strong style={{ fontWeight: 700 }}>How to sign:</strong>{' '}
        review the order below, sign in the signature box, tick the four boxes,
        then click <strong>Sign &amp; accept order</strong>. Takes about a minute.
      </div>

      <div className="sgn-card">
        <div className="sgn-card-head">
          <h2 className="sgn-card-title">Vehicle specification</h2>
        </div>
        <div className="sgn-card-body">
          <dl className="sgn-kv">
            <dt>Model</dt><dd>{view.vehicle.make} {view.vehicle.model}</dd>
            <dt>Derivative</dt><dd>{view.vehicle.derivative}</dd>
            <dt>Fuel / gearbox</dt><dd>{view.vehicle.fuel} · {view.vehicle.transmission}</dd>
            <dt>Colour / trim</dt><dd>{view.vehicle.colour} · {view.vehicle.trim}</dd>
            <dt>Registration</dt><dd>{view.vehicle.registration}</dd>
            <dt>CO₂</dt><dd>{view.vehicle.co2} g/km</dd>
          </dl>
        </div>
      </div>

      {view.options.length > 0 && (
        <div className="sgn-card">
          <div className="sgn-card-head">
            <h2 className="sgn-card-title">Factory options ({view.options.length})</h2>
          </div>
          <div className="sgn-card-body">
            {view.options.map((o) => (
              <div key={o.id} className="sgn-price-row">
                <span>
                  {o.name || '—'}
                  {o.qty > 1 && <span style={{ color: '#64748b' }}> × {o.qty}</span>}
                </span>
                <span className="v">{pence(o.netPence * o.qty)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sgn-card">
        <div className="sgn-card-head">
          <h2 className="sgn-card-title">Pricing</h2>
        </div>
        <div className="sgn-card-body">
          <div className="sgn-price-row">
            <span>Vehicle (net, less discount)</span>
            <span className="v">{pence(view.pricing.vehicleNetPence - view.pricing.discountPence)}</span>
          </div>
          <div className="sgn-price-row">
            <span>Factory options</span>
            <span className="v">{pence(view.options.reduce((s, o) => s + o.netPence * o.qty, 0))}</span>
          </div>
          <div className="sgn-price-row">
            <span>VAT @ {view.pricing.vatRate}%</span>
            <span className="v">{pence(vatPence(view))}</span>
          </div>
          <div className="sgn-price-row">
            <span>On-the-road costs</span>
            <span className="v">
              {pence(view.pricing.vedPence + view.pricing.firstRegFeePence + view.pricing.deliveryFeePence + view.pricing.numberPlatesPence)}
            </span>
          </div>
          <div className="sgn-price-row total">
            <span className="lbl">Drive-away total</span>
            <span className="v">{pence(view.totalAmountPence)}</span>
          </div>
        </div>
      </div>

      {view.financeType !== 'OP' && (
        <div className="sgn-card">
          <div className="sgn-card-head">
            <h2 className="sgn-card-title">Finance</h2>
          </div>
          <div className="sgn-card-body">
            <dl className="sgn-kv">
              <dt>Product</dt><dd>{view.financeType}</dd>
              <dt>Term</dt><dd>{view.finance.term} months</dd>
              <dt>Annual mileage</dt><dd>{view.finance.annualMileage.toLocaleString()} miles</dd>
              <dt>Initial rental</dt><dd>{view.finance.initialRental} × monthly</dd>
              <dt>Monthly</dt><dd>{pence(view.monthlyAmountPence)} + VAT</dd>
            </dl>
          </div>
        </div>
      )}

      <div className="sgn-card">
        <div className="sgn-card-head">
          <h2 className="sgn-card-title">Delivery</h2>
        </div>
        <div className="sgn-card-body">
          <dl className="sgn-kv">
            <dt>Method</dt><dd>{view.delivery.method}</dd>
            <dt>Address</dt><dd>{view.delivery.address}, {view.delivery.city} {view.delivery.postcode}</dd>
            <dt>Preferred date</dt><dd>{view.delivery.preferredDate || 'To confirm'}</dd>
          </dl>
        </div>
      </div>

      {/* ─── Signing widget ─────────────────────────────────── */}
      <div className="sgn-card">
        <div className="sgn-card-head">
          <h2 className="sgn-card-title">Sign & accept</h2>
        </div>
        <div className="sgn-card-body">
          <SignatureCapture
            defaultName={`${view.customer.firstName} ${view.customer.lastName}`}
            onChange={setSignature}
          />

          <div style={{ marginTop: 20 }}>
            <label className={`sgn-consent ${consents.terms ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={consents.terms}
                onChange={(e) => setConsents((c) => ({ ...c, terms: e.target.checked }))}
              />
              <div>
                <strong>I agree to the Olaris Terms of Business</strong>
                <span>Including the 14-day right to cancel under the Consumer Rights Act.</span>
              </div>
            </label>
            <label className={`sgn-consent ${consents.fcaDisclosure ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={consents.fcaDisclosure}
                onChange={(e) => setConsents((c) => ({ ...c, fcaDisclosure: e.target.checked }))}
              />
              <div>
                <strong>I acknowledge the FCA commission disclosure</strong>
                <span>Olaris Consulting Ltd is an Appointed Representative authorised and regulated by the FCA.</span>
              </div>
            </label>
            <label className={`sgn-consent ${consents.gdpr ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={consents.gdpr}
                onChange={(e) => setConsents((c) => ({ ...c, gdpr: e.target.checked }))}
              />
              <div>
                <strong>I consent to my personal data being processed for this order</strong>
                <span>Required to fulfil this contract. See our privacy policy for retention details.</span>
              </div>
            </label>
            <label
              className={`sgn-consent ${intent ? 'checked' : ''}`}
              style={{ borderColor: intent ? '#0b1e3f' : undefined, background: intent ? '#eff3fb' : undefined }}
            >
              <input
                type="checkbox"
                checked={intent}
                onChange={(e) => setIntent(e.target.checked)}
              />
              <div>
                <strong>I intend to sign this order electronically</strong>
                <span>My electronic signature is legally binding under the UK Electronic Communications Act 2000.</span>
              </div>
            </label>
          </div>

          {/* Default flow: single-step SES. One button. */}
          {!view.requiresOtp && (
            <form onSubmit={submit} style={{ marginTop: 22 }}>
              <button
                type="submit"
                className="sgn-btn sgn-btn-accent sgn-btn-lg"
                disabled={!readyToSign || submitting}
              >
                {submitting ? 'Signing…' : blockerText ?? 'Sign & accept order'}
              </button>
            </form>
          )}

          {/* OTP-required flow (per-order opt-in). Two-step:
              1) request a code (gates on the same readyToSign predicate),
              2) enter code + submit. */}
          {view.requiresOtp && stage === 'review' && (
            <div style={{ marginTop: 22 }}>
              <button
                type="button"
                className="sgn-btn sgn-btn-primary sgn-btn-lg"
                disabled={!readyToSign || requestingOtp}
                onClick={requestOtp}
              >
                {requestingOtp
                  ? 'Sending code…'
                  : blockerText ?? 'Email me a verification code to finish'}
              </button>
            </div>
          )}

          {view.requiresOtp && stage === 'awaiting' && (
            <form onSubmit={submit} style={{ marginTop: 22 }}>
              <div style={{ fontSize: 13, color: '#334155', marginBottom: 10, textAlign: 'center' }}>
                Enter the 6-digit code we emailed to <strong>{view.customer.email}</strong>:
              </div>
              <div className="sgn-otp-row">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setOtpError(null)
                  }}
                  placeholder="000000"
                  autoFocus
                />
              </div>
              {otpError && (
                <div className="sgn-alert sgn-alert-error" style={{ marginTop: 6 }}>
                  {otpError}
                </div>
              )}
              <button
                type="submit"
                className="sgn-btn sgn-btn-accent sgn-btn-lg"
                disabled={!canSubmitOtp || submitting}
                style={{ marginTop: 12 }}
              >
                {submitting ? 'Signing…' : 'Confirm signature'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={requestingOtp}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  {requestingOtp ? 'Sending…' : "Didn't get a code? Send again"}
                </button>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 18, borderTop: '1px dashed #e4e9f1' }}>
            {!showDecline ? (
              <button
                type="button"
                onClick={() => setShowDecline(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                I don't want to sign this order
              </button>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0b1e3f', marginBottom: 8 }}>
                  Tell Olaris why you're declining (optional)
                </div>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Timing has changed, price needs revisiting, etc."
                  style={{
                    width: '100%',
                    padding: 10,
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="sgn-btn sgn-btn-ghost"
                    onClick={() => setShowDecline(false)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="sgn-btn sgn-btn-danger"
                    onClick={decline}
                    disabled={submitting}
                  >
                    Decline & cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: '#64748b', textAlign: 'center', marginTop: 18, lineHeight: 1.55 }}>
        This signing link expires on <strong>{expiryText}</strong>.<br />
        Every action is audit-logged. Your IP, user-agent, timestamp and a SHA-256 hash of this order
        are recorded alongside your signature.
      </p>
    </div>
  )
}

function SuccessScreen({ view }: { view: ViewOrder }) {
  return (
    <div className="sgn-page">
      <div className="sgn-header">
        <OlarisLogo />
      </div>
      <div className="sgn-card" style={{ textAlign: 'center' }}>
        <div className="sgn-card-body" style={{ padding: '40px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: '#d1fae5', color: '#059669', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 style={{ fontFamily: 'Manrope,sans-serif', fontSize: 22, color: '#0b1e3f', margin: '0 0 8px' }}>
            Signature captured
          </h1>
          <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
            Thank you, <strong>{view.customer.firstName}</strong>. Your signature for order{' '}
            <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{view.orderRef}</strong> has been recorded.
            A fully executed copy will be emailed to you once our representative countersigns.
          </p>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 20 }}>
            You can safely close this page.
          </p>
        </div>
      </div>
    </div>
  )
}

function DeclinedScreen() {
  return (
    <div className="sgn-page">
      <div className="sgn-header">
        <OlarisLogo />
      </div>
      <div className="sgn-card" style={{ textAlign: 'center' }}>
        <div className="sgn-card-body" style={{ padding: '40px 24px' }}>
          <h1 style={{ fontFamily: 'Manrope,sans-serif', fontSize: 22, color: '#0b1e3f', margin: '0 0 8px' }}>
            Order declined
          </h1>
          <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
            Thank you — we've recorded your decision and notified Olaris. Someone will be in touch shortly.
          </p>
        </div>
      </div>
    </div>
  )
}

function OlarisLogo() {
  return (
    <svg viewBox="0 0 300 60" width="132" height="26">
      <defs>
        <linearGradient id="sgn-arcL" x1="0" y1="10" x2="40" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" /><stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id="sgn-arcR" x1="40" y1="10" x2="0" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" /><stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M22 6 A20 20 0 0 0 22 50" stroke="url(#sgn-arcL)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M22 6 A20 20 0 0 1 22 50" stroke="url(#sgn-arcR)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="28" r="2" fill="#06B6D4" />
      <text x="54" y="38" fontFamily="Manrope, sans-serif" fontSize="30" fontWeight="700" letterSpacing="-0.5" fill="#0b1e3f">Olaris</text>
    </svg>
  )
}

// ─── helpers ────────────────────────────────────────────────

function pence(p: number): string {
  return '£' + (p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function vatPence(view: ViewOrder): number {
  const optionsNet = view.options.reduce((s, o) => s + o.netPence * o.qty, 0)
  const net = view.pricing.vehicleNetPence + optionsNet - view.pricing.discountPence
  return Math.round((net * view.pricing.vatRate) / 100)
}
