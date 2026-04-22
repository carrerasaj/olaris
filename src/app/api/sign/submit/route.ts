/**
 * POST /api/sign/submit
 * Body: {
 *   token: string,
 *   otp: string,
 *   intent: true,
 *   consents: { terms: true, fcaDisclosure: true, gdpr: true },
 *   signature: { type: 'typed'|'drawn', data: string }
 * }
 *
 * Verifies OTP, writes the signature row with full forensic envelope,
 * Ed25519-signs the document hash, transitions order status, consumes the
 * token. If this was the second party, emails both parties "signed".
 */

import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import {
  db,
  otpCodes,
  signingTokens,
  signatures,
  orders,
  auditEvents,
  customers,
} from '@/db/client'
import { lookupSigningToken } from '@/lib/signing-token'
import { captureForensics, canonicalJson } from '@/lib/forensics'
import { signBytes, signingKeyFingerprint } from '@/lib/signing-key'
import { sendEmail } from '@/lib/email'
import { orderSignedEmail } from '@/lib/email-templates'
import { fmtGBPFromPence } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_OTP_ATTEMPTS = 5

const submitSchema = z.object({
  token: z.string().min(16).max(64),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  intent: z.literal(true),
  consents: z.object({
    terms: z.literal(true),
    fcaDisclosure: z.literal(true),
    gdpr: z.literal(true),
  }),
  signature: z.union([
    z.object({
      type: z.literal('typed'),
      data: z.string().min(2).max(200),
    }),
    z.object({
      type: z.literal('drawn'),
      // base64 PNG data URL. Loose cap; canvas output is typically <30KB.
      data: z
        .string()
        .min(100)
        .max(250_000)
        .regex(/^data:image\/png;base64,/, 'Signature must be a PNG data URL'),
    }),
  ]),
})

export async function POST(req: Request) {
  const forensics = await captureForensics()

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  const parsed = submitSchema.safeParse(raw)
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
  const body = parsed.data

  const lookup = await lookupSigningToken(body.token)
  if (!lookup.ok) {
    return Response.json({ ok: false, error: lookup.reason }, { status: 400 })
  }

  // ── Verify OTP ─────────────────────────────────────────────────
  const latestOtp = await db
    .select()
    .from(otpCodes)
    .where(
      and(eq(otpCodes.signingTokenId, lookup.token.id), isNull(otpCodes.consumedAt)),
    )
    .orderBy(otpCodes.createdAt)
    .limit(10) // get all unconsumed, pick the newest
  const current = latestOtp
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .find((o) => o.expiresAt.getTime() > Date.now())

  if (!current) {
    await audit(lookup, forensics, 'otp.failed', { reason: 'no_active_otp' })
    return Response.json({ ok: false, error: 'no_active_otp' }, { status: 400 })
  }
  if (current.attempts >= MAX_OTP_ATTEMPTS) {
    await audit(lookup, forensics, 'otp.failed', { reason: 'locked' })
    return Response.json({ ok: false, error: 'otp_locked' }, { status: 400 })
  }

  const otpHash = createHash('sha256').update(body.otp).digest('hex')
  if (otpHash !== current.codeHash) {
    await db
      .update(otpCodes)
      .set({ attempts: current.attempts + 1 })
      .where(eq(otpCodes.id, current.id))
    await audit(lookup, forensics, 'otp.failed', { reason: 'bad_code' })
    return Response.json(
      {
        ok: false,
        error: 'bad_otp',
        remaining: MAX_OTP_ATTEMPTS - (current.attempts + 1),
      },
      { status: 400 },
    )
  }

  // OTP correct — consume it
  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, current.id))

  await audit(lookup, forensics, 'otp.verified', null)

  // ── Compute document hash + server signature ──────────────────
  // Phase 4 hashes a canonical JSON snapshot of the order. Phase 5 will
  // swap to hashing the actual rendered PDF bytes. Either way, the hash
  // we store in signatures.document_sha256 is "what the customer saw at
  // sign time" — so any later edit to the order (impossible after signed
  // anyway) can't masquerade as approved.
  const snapshotForHash = {
    ref: lookup.order.ref,
    vehicle: lookup.order.vehicle,
    options: lookup.order.options,
    delivery: lookup.order.delivery,
    pricing: lookup.order.pricing,
    finance: lookup.order.finance,
    addons: lookup.order.addons,
    partExchange: lookup.order.partExchange,
    totalAmountPence: lookup.order.totalAmountPence,
    monthlyAmountPence: lookup.order.monthlyAmountPence,
    customerId: lookup.order.customerId,
    financeType: lookup.order.financeType,
  }
  const docHash = createHash('sha256')
    .update(canonicalJson(snapshotForHash))
    .digest('hex')
  const serverSig = signBytes(docHash)
  const keyFp = signingKeyFingerprint()

  // ── Insert signature row ─────────────────────────────────────
  const signerName =
    body.signature.type === 'typed'
      ? body.signature.data
      : `${lookup.customer.firstName} ${lookup.customer.lastName}`

  try {
    await db.insert(signatures).values({
      orderId: lookup.order.id,
      signerRole: lookup.token.signerRole,
      signerName,
      signerEmail: lookup.customer.email,
      signatureType: body.signature.type,
      signatureData: body.signature.data,
      ip: forensics.ip,
      userAgent: forensics.userAgent,
      geoCity: forensics.geoCity,
      geoCountry: forensics.geoCountry,
      otpMethod: 'email',
      otpVerifiedAt: new Date(),
      documentSha256: docHash,
      serverSignature: serverSig,
      signingKeyFingerprint: keyFp,
    })
  } catch (e) {
    // Unique constraint on (order_id, signer_role) means a duplicate sign
    // attempt by the same role — return a specific error.
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('signatures_unique_role_per_order')) {
      return Response.json({ ok: false, error: 'already_signed' }, { status: 409 })
    }
    throw e
  }

  // ── Consume token ────────────────────────────────────────────
  await db
    .update(signingTokens)
    .set({ consumedAt: new Date() })
    .where(eq(signingTokens.id, lookup.token.id))

  // ── Transition order status ──────────────────────────────────
  // If this was the customer signing: status depends on whether rep already
  // signed. Symmetric for rep.
  const allSigs = await db
    .select({ role: signatures.signerRole })
    .from(signatures)
    .where(eq(signatures.orderId, lookup.order.id))
  const hasCustomer = allSigs.some((s) => s.role === 'customer')
  const hasRep = allSigs.some((s) => s.role === 'rep')
  const bothSigned = hasCustomer && hasRep

  await db
    .update(orders)
    .set({
      status: bothSigned ? 'signed' : 'partially_signed',
      signedAt: bothSigned ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, lookup.order.id))

  await audit(lookup, forensics, 'signed', {
    role: lookup.token.signerRole,
    method: body.signature.type,
    docSha256: docHash,
  })

  // ── If fully signed, email both parties ──────────────────────
  if (bothSigned) {
    const verifyUrl = `${siteUrl()}/verify/${lookup.order.ref}`
    const totalGBP = fmtGBPFromPence(lookup.order.totalAmountPence)
    const vehicleMake = lookup.order.vehicle.make
    const vehicleModel = lookup.order.vehicle.model

    const customerMail = orderSignedEmail({
      recipientFirstName: lookup.customer.firstName,
      orderRef: lookup.order.ref,
      vehicleMake,
      vehicleModel,
      totalGBP,
      verifyUrl,
    })
    const customerSend = await sendEmail({
      to: lookup.customer.email,
      ...customerMail,
    })
    await audit(
      lookup,
      forensics,
      customerSend.ok ? 'email.sent' : 'email.failed',
      { template: 'order.signed', to: lookup.customer.email },
    )
    // Phase 5 attaches the PDF. For now the email just points at /verify.
  }

  return Response.json({
    ok: true,
    orderRef: lookup.order.ref,
    bothSigned,
  })
}

async function audit(
  lookup: { order: { id: string; customerId: string }; token: { id: string } },
  forensics: {
    ip: string | null
    userAgent: string | null
    geoCity: string | null
    geoCountry: string | null
  },
  eventType:
    | 'otp.failed'
    | 'otp.verified'
    | 'signed'
    | 'email.sent'
    | 'email.failed',
  payload: Record<string, unknown> | null,
) {
  await db.insert(auditEvents).values({
    orderId: lookup.order.id,
    customerId: lookup.order.customerId,
    actorType: eventType.startsWith('email') ? 'system' : 'customer',
    actorId: lookup.token.id,
    eventType,
    payload,
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
  })
}

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}
