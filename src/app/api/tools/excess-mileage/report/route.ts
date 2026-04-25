/**
 * POST /api/tools/excess-mileage/report
 *
 * Body: { email, company?, calcInputs: {...} }
 *
 * Captures the lead, stores the calculator inputs + server-computed
 * result on sourceContext (for the PDF renderer to pull back), sends
 * the gated report, enrols into the post-excess-mileage drip.
 *
 * Send + enrol are fire-and-forget from the client's perspective — a
 * flaky provider doesn't block the capture. Failures are audited in
 * lead_events regardless.
 */

import { headers } from 'next/headers'
import { z } from 'zod'
import { captureLead, enrolLead } from '@/lib/leads'
import { sendGatedResource } from '@/lib/gated-resources'
import {
  excessMileageInputSchema,
  buildReportPayload,
} from '@/lib/excess-mileage-report'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  email: z.string().email().max(254),
  company: z.string().trim().max(200).optional().nullable(),
  calcInputs: excessMileageInputSchema,
})

async function forensicsFromHeaders() {
  const h = await headers()
  const xff = h.get('x-forwarded-for') ?? ''
  const ip =
    xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .pop() ??
    h.get('x-real-ip') ??
    null
  return {
    ip,
    userAgent: h.get('user-agent') ?? null,
    geoCity: h.get('x-vercel-ip-city')
      ? decodeURIComponent(h.get('x-vercel-ip-city')!)
      : null,
    geoCountry: h.get('x-vercel-ip-country') ?? null,
  }
}

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: 'invalid_body',
        issues: parsed.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 },
    )
  }

  const { email, company, calcInputs } = parsed.data
  const forensics = await forensicsFromHeaders()

  // Server-authoritative: re-run maths from validated inputs. The PDF
  // renderer reads this back out of sourceContext.
  const reportPayload = buildReportPayload(calcInputs, {
    email,
    company: company ?? null,
  })

  const { lead } = await captureLead({
    email,
    source: 'excess-mileage',
    company: company ?? null,
    sourceContext: {
      excessMileageReport: reportPayload,
    },
    ...forensics,
  })

  // Send + drip are fire-and-forget — the user has already captured.
  // Run them in parallel but don't await the full chain before responding;
  // either log and move on, or surface a "we'll retry" state. Pragmatic:
  // await them with a short timeout so a transient Resend error shows up
  // in the response, but never propagate the throw to the client.
  const sendPromise = sendGatedResource(lead.id, 'excess-mileage-report').catch(
    (e) => {
      console.error('[excess-mileage.report] sendGatedResource threw', e)
      return { ok: false, outcome: 'failed' as const }
    },
  )
  const enrolPromise = enrolLead(lead.id, 'post-excess-mileage-calc').catch(
    (e) => {
      console.error('[excess-mileage.report] enrolLead threw', e)
      return { ok: false, enrolled: false }
    },
  )

  const [sendResult] = await Promise.all([sendPromise, enrolPromise])

  return Response.json({
    ok: true,
    sent: sendResult.ok,
  })
}
