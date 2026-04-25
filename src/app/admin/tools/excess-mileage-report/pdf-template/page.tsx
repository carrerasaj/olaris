/**
 * Internal HTML route rendered by Puppeteer for the excess-mileage
 * report PDF. Accepts either:
 *   - an authenticated admin session (preview in a browser), or
 *   - a valid short-lived HMAC render token in ?t= whose subject is the
 *     sha256 of the base64url-decoded payload in ?d=.
 *
 * Payload travels in the URL: small enough (<1kb) and keeps this route
 * stateless, which matters on serverless cold starts.
 */

import { createHash } from 'node:crypto'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { verifyRenderToken } from '@/lib/pdf/render-token'
import {
  excessMileageInputSchema,
  buildReportPayload,
  type ExcessMileageReportPayload,
} from '@/lib/excess-mileage-report'
import { BCH_REFERENCE_CLASS } from '@/data/bch-benchmarks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

function fmtGBP(n: number) {
  return '£' + Math.round(n).toLocaleString('en-GB')
}

function fmtMiles(n: number) {
  return n.toLocaleString('en-GB') + ' miles'
}

async function resolvePayload(
  searchParams: { d?: string | string[]; t?: string | string[] },
): Promise<ExcessMileageReportPayload | null> {
  const d = Array.isArray(searchParams.d) ? searchParams.d[0] : searchParams.d
  const t = Array.isArray(searchParams.t) ? searchParams.t[0] : searchParams.t
  if (!d) return null

  let json: string
  try {
    json = b64urlDecode(d).toString('utf8')
  } catch {
    return null
  }

  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return null
  }

  // Parse just the input — we re-run maths here so a tampered payload
  // with fake result numbers can't sneak past.
  const parsedInput = excessMileageInputSchema.safeParse(
    (raw as { input?: unknown })?.input,
  )
  if (!parsedInput.success) return null

  const recipient = (raw as { recipient?: { email?: string; company?: string | null } })
    .recipient

  // Session short-circuit: admin previewing in a browser doesn't need a
  // token. Token-based access requires the token match the payload's
  // sha256 subject.
  const session = await auth()
  const isAdmin = !!session?.user
  if (!isAdmin) {
    if (!t) return null
    const subject = createHash('sha256').update(json).digest('hex')
    if (!verifyRenderToken(t, subject)) return null
  }

  return buildReportPayload(parsedInput.data, recipient)
}

export default async function ExcessMileageReportPdfTemplate({
  searchParams,
}: {
  searchParams: Promise<{ d?: string | string[]; t?: string | string[] }>
}) {
  const params = await searchParams
  const payload = await resolvePayload(params)
  if (!payload) notFound()

  const { input, result, bch, generatedAt, recipient } = payload
  const generatedStr = new Date(generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="emr-root">
      <div className="emr-page">
        <div className="emr-header">
          <div>
            <div className="emr-brand">Olaris</div>
            <div className="emr-brand-sub">Fleet leasing · Orbis fleet intelligence</div>
          </div>
          <div className="emr-meta">
            Excess mileage report
            <br />
            {generatedStr}
            {recipient?.company ? (
              <>
                <br />
                Prepared for {recipient.company}
              </>
            ) : null}
          </div>
        </div>

        <h1 className="emr-title">Your fleet&apos;s excess mileage exposure</h1>
        <p className="emr-lede">
          Based on the figures you entered, here&apos;s what your fleet is on track to
          incur in excess mileage charges over the remaining contract term — and how
          a right-sized lease agreement would compare.
        </p>

        <div className={`emr-headline ${result.isOver ? 'is-over' : 'on-track'}`}>
          <div className="emr-headline-label">
            {result.isOver ? 'Projected excess mileage charge' : 'Projected excess'}
          </div>
          <div className="emr-headline-value">{fmtGBP(result.estimatedChargeGBP)}</div>
          <div className="emr-headline-note">
            Over remaining {input.termRemainingMonths} months across {input.vehicles}{' '}
            vehicle{input.vehicles !== 1 ? 's' : ''} · {input.pencePerMile}p per mile
          </div>
        </div>

        <div className="emr-stats">
          <div className="emr-stat">
            <div className="emr-stat-label">Excess / vehicle / yr</div>
            <div className="emr-stat-value">
              {result.isOver ? fmtMiles(result.excessPerVehiclePerYear) : 'On track'}
            </div>
          </div>
          <div className="emr-stat">
            <div className="emr-stat-label">Fleet excess / yr</div>
            <div className="emr-stat-value">
              {result.isOver ? fmtMiles(result.totalFleetExcessPerYear) : 'On track'}
            </div>
          </div>
          <div className="emr-stat">
            <div className="emr-stat-label">Projected at term-end</div>
            <div className="emr-stat-value">{fmtMiles(result.projectedExcessMiles)}</div>
          </div>
          <div className="emr-stat">
            <div className="emr-stat-label">Charge / vehicle</div>
            <div className="emr-stat-value">{fmtGBP(result.chargePerVehicleGBP)}</div>
          </div>
        </div>

        <h2 className="emr-h2">How a right-sized BCH would compare</h2>
        <table className="emr-table">
          <thead>
            <tr>
              <th>Annual mileage allowance</th>
              <th>Monthly per vehicle</th>
              <th>Covers your actual usage</th>
              <th>vs. your contract</th>
            </tr>
          </thead>
          <tbody>
            {bch.map((row) => (
              <tr key={row.annualMiles} className={row.coversActual ? 'is-match' : ''}>
                <td>{row.annualMiles.toLocaleString('en-GB')} miles/yr</td>
                <td>{fmtGBP(row.monthlyPerVehicleGBP)}</td>
                <td>{row.coversActual ? 'Yes' : 'No'}</td>
                <td>
                  {row.monthlyDeltaVsContractedGBP === 0
                    ? '—'
                    : (row.monthlyDeltaVsContractedGBP > 0 ? '+' : '') +
                      fmtGBP(row.monthlyDeltaVsContractedGBP) +
                      '/mo'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="emr-h2">How Orbis prevents this</h2>
        <div className="emr-orbis">
          Orbis tracks contracted vs actual mileage from the day your lease starts.
          Instead of finding out at end-of-term that you&apos;re 4,000 miles over, you
          get an alert the first month the trajectory breaks — typically 4–6 months
          before overshoot becomes unavoidable. That gives you real options:
          rebalance drivers across the fleet, restructure the contract early, or
          price the excess into the next renewal. This calculation would have been a
          line-item forecast, not a surprise invoice.
        </div>

        <div className="emr-cta">
          <div>
            <div className="emr-cta-title">Talk through your numbers with Alan</div>
            <div className="emr-cta-body">
              20-minute call. No pitch — we&apos;ll walk through your fleet and flag
              the three fastest places to cut exposure.
            </div>
          </div>
          <a className="emr-cta-link" href="https://olaris.co.uk/contact">
            Book a call →
          </a>
        </div>

        <div className="emr-disclaimer">
          BCH monthly figures are indicative ({BCH_REFERENCE_CLASS}). Your Olaris
          quote depends on vehicle, term, deposit and funder — talk to us for a
          specific number. Calculation uses the inputs you provided; Olaris has not
          independently verified contract terms or mileage.
        </div>
      </div>
    </div>
  )
}
