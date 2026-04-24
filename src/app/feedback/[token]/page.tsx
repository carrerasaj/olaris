/**
 * Public feedback page — 0–10 NPS + optional comment. One submission per
 * token; re-visiting after submission shows a thank-you view.
 *
 * Submission goes through /feedback/[token]/submit as a plain POST so
 * this page is RSC-only with no 'use client'.
 */

import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db, feedbackTokens, orders, customers } from '@/db/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const rows = await db
    .select({
      token: feedbackTokens,
      order: orders,
      customer: customers,
    })
    .from(feedbackTokens)
    .innerJoin(orders, eq(feedbackTokens.orderId, orders.id))
    .innerJoin(customers, eq(feedbackTokens.customerId, customers.id))
    .where(eq(feedbackTokens.token, token))
    .limit(1)

  if (rows.length === 0) return <UnavailableCard />
  const { token: t, order, customer } = rows[0]

  if (t.consumedAt) {
    return (
      <div className="sgn-shell">
        <div className="sgn-page">
          <div className="sgn-header">
            <OlarisLogo />
            <div className="tag">Feedback received</div>
          </div>
          <div className="sgn-card">
            <div className="sgn-card-body" style={{ textAlign: 'center' }}>
              <h2 style={{ marginBottom: 10 }}>Thanks — we've got it.</h2>
              <p style={{ color: '#475569' }}>
                Your feedback on order{' '}
                <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {order.ref}
                </strong>{' '}
                has been recorded. We don't take multiple submissions per link.
              </p>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    )
  }

  if (t.expiresAt.getTime() < Date.now()) return <UnavailableCard />

  return (
    <div className="sgn-shell">
      <div className="sgn-page">
        <div className="sgn-header">
          <OlarisLogo />
          <div className="tag">Quick feedback</div>
        </div>

        <div className="sgn-card">
          <div className="sgn-card-head">
            <h2 className="sgn-card-title">How was your experience?</h2>
          </div>
          <div className="sgn-card-body">
            <p style={{ fontSize: 14, color: '#334155', marginBottom: 14 }}>
              Hi {customer.firstName}, thanks for your order. How likely are
              you to recommend Olaris to a friend or colleague?
            </p>

            <form
              action={`/feedback/${encodeURIComponent(token)}/submit`}
              method="post"
            >
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: '#64748b',
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Score: 0 (not at all) → 10 (extremely)
                </legend>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(11, 1fr)',
                    gap: 6,
                    marginBottom: 16,
                  }}
                >
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <label
                      key={n}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 0',
                        border: '1px solid #e4e9f1',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 14,
                        fontWeight: 700,
                        color: n <= 6 ? '#b91c1c' : n <= 8 ? '#78350f' : '#047857',
                        background: '#fff',
                      }}
                    >
                      <input
                        type="radio"
                        name="score"
                        value={n}
                        required
                        style={{ display: 'none' }}
                      />
                      {n}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div style={{ marginTop: 10 }}>
                <label
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: '#64748b',
                    fontWeight: 700,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Anything we should know? (optional)
                </label>
                <textarea
                  name="comment"
                  rows={3}
                  maxLength={2000}
                  placeholder="Tell us what worked well or what we could have done better."
                  style={{
                    width: '100%',
                    padding: 10,
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginTop: 18, textAlign: 'right' }}>
                <button
                  type="submit"
                  style={{
                    background: '#0b1e3f',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: 6,
                    border: 0,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Submit feedback
                </button>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}

function UnavailableCard() {
  return (
    <div className="sgn-shell">
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
        <h1>This feedback link is no longer active</h1>
        <p>
          It may have expired or already been used. If you'd still like to share
          feedback, please{' '}
          <a href="mailto:alan@olaris.co.uk">contact us directly</a>.
        </p>
      </div>
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
