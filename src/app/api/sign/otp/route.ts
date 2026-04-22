/**
 * POST /api/sign/otp
 * Body: { token: string }
 *
 * Issues a 6-digit OTP tied to a signing token, emails it, writes the
 * audit event. Rate-limited: max 5 outstanding (unconsumed, non-expired)
 * OTPs per signing token in any 1h window. Never leaks whether the token
 * is valid via response body — returns 200 for anything recoverable.
 */

import { createHash, randomInt } from 'node:crypto'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import { db, otpCodes, auditEvents } from '@/db/client'
import { lookupSigningToken } from '@/lib/signing-token'
import { captureForensics } from '@/lib/forensics'
import { sendEmail } from '@/lib/email'
import { otpEmail } from '@/lib/email-templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_OTPS_PER_WINDOW = 5

export async function POST(req: Request) {
  const forensics = await captureForensics()

  let body: { token?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token : ''

  const lookup = await lookupSigningToken(token)
  if (!lookup.ok) {
    // Don't leak which failure mode — just 200 with ok:false so the page can
    // show "couldn't send" without confirming the token's existence.
    return Response.json({ ok: false })
  }

  // Rate limit: count outstanding OTPs for this token in the last hour.
  const since = new Date(Date.now() - RATE_WINDOW_MS)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(otpCodes)
    .where(
      and(eq(otpCodes.signingTokenId, lookup.token.id), gt(otpCodes.createdAt, since)),
    )
  if ((count ?? 0) >= MAX_OTPS_PER_WINDOW) {
    await db.insert(auditEvents).values({
      orderId: lookup.order.id,
      customerId: lookup.order.customerId,
      actorType: 'customer',
      actorId: lookup.token.id,
      eventType: 'otp.failed',
      payload: { reason: 'rate_limited' },
      ip: forensics.ip,
      userAgent: forensics.userAgent,
      geoCity: forensics.geoCity,
      geoCountry: forensics.geoCountry,
    })
    return Response.json({ ok: false, reason: 'rate_limited' }, { status: 429 })
  }

  // Invalidate any previous unconsumed OTPs so the newest one is the only
  // valid code. Prevents attackers reusing an older still-live code.
  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(eq(otpCodes.signingTokenId, lookup.token.id), isNull(otpCodes.consumedAt)),
    )

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const codeHash = createHash('sha256').update(code).digest('hex')

  await db.insert(otpCodes).values({
    signingTokenId: lookup.token.id,
    codeHash,
    sentToEmail: lookup.customer.email,
    method: 'email',
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
  })

  await db.insert(auditEvents).values({
    orderId: lookup.order.id,
    customerId: lookup.order.customerId,
    actorType: 'customer',
    actorId: lookup.token.id,
    eventType: 'otp.requested',
    payload: { to: lookup.customer.email },
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
  })

  const email = otpEmail({
    code,
    customerFirstName: lookup.customer.firstName,
    orderRef: lookup.order.ref,
  })
  const result = await sendEmail({
    to: lookup.customer.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })

  if (!result.ok) {
    await db.insert(auditEvents).values({
      orderId: lookup.order.id,
      customerId: lookup.order.customerId,
      actorType: 'system',
      eventType: 'email.failed',
      payload: { template: 'sign.otp', error: result.error },
    })
    // Still return ok — the code is in the DB; the page UX will tell the
    // user "check your email, if it doesn't arrive try again."
  } else {
    await db.insert(auditEvents).values({
      orderId: lookup.order.id,
      customerId: lookup.order.customerId,
      actorType: 'system',
      eventType: 'email.sent',
      payload: { template: 'sign.otp', messageId: result.id },
    })
  }

  return Response.json({ ok: true })
}
