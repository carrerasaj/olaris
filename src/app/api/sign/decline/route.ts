/**
 * POST /api/sign/decline
 * Body: { token: string, reason: string }
 *
 * Customer declines to sign. Cancels the order, consumes the token,
 * records the reason in the audit trail, emails Alan.
 */

import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, signingTokens, orders, auditEvents } from '@/db/client'
import { lookupSigningToken } from '@/lib/signing-token'
import { captureForensics } from '@/lib/forensics'
import { sendEmail } from '@/lib/email'
import { signDeclinedEmail } from '@/lib/email-templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  token: z.string().min(16).max(64),
  reason: z.string().max(2000).optional(),
})

export async function POST(req: Request) {
  const forensics = await captureForensics()

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  const { token, reason } = parsed.data

  const lookup = await lookupSigningToken(token)
  if (!lookup.ok) {
    return Response.json({ ok: false, error: lookup.reason }, { status: 400 })
  }

  // Consume token + cancel order (any previous status that's still in-flight).
  await db
    .update(signingTokens)
    .set({ consumedAt: new Date() })
    .where(eq(signingTokens.id, lookup.token.id))

  await db
    .update(orders)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, lookup.order.id))

  await db.insert(auditEvents).values({
    orderId: lookup.order.id,
    customerId: lookup.order.customerId,
    actorType: 'customer',
    actorId: lookup.token.id,
    eventType: 'sign.declined',
    payload: { reason: reason ?? '' },
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
  })

  // Notify the fleet desk
  const adminUrl = `${siteUrl()}/admin/orders/${lookup.order.id}`
  const mail = signDeclinedEmail({
    customerName: `${lookup.customer.firstName} ${lookup.customer.lastName}`,
    orderRef: lookup.order.ref,
    reason: reason ?? '',
    adminUrl,
  })
  await sendEmail({
    to: 'alan@olaris.co.uk',
    ...mail,
  })

  return Response.json({ ok: true })
}

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}
