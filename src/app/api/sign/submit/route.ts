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
} from '@/db/client'
import { lookupSigningToken } from '@/lib/signing-token'
import { captureForensics, canonicalJson } from '@/lib/forensics'
import { signBytes, signingKeyFingerprint } from '@/lib/signing-key'
import { fmtGBPFromPence } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_OTP_ATTEMPTS = 5

const submitSchema = z.object({
  token: z.string().min(16).max(64),
  // OTP is optional. Default flow is single-step SES — link click is the
  // auth factor. When the customer's path included an OTP step (PR2 flag
  // `orders.requires_otp`), the page sends `otp` and we verify it below.
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits').optional(),
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

  // ── Verify OTP (when the order opted in via requires_otp) ─────
  // Server is the source of truth: if `orders.requires_otp = true` and
  // the body has no `otp`, reject. Don't trust the client to decide
  // its own auth strength.
  let otpVerifiedAt: Date | null = null
  if (lookup.order.requiresOtp && !body.otp) {
    return Response.json({ ok: false, error: 'otp_required' }, { status: 400 })
  }
  if (body.otp) {
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
    otpVerifiedAt = new Date()
  }

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
      // OTP-related columns only populated when the OTP path was actually
      // used. Schema already allows both to be null; the Certificate of
      // Completion can show "OTP-verified" or "link-token + IP/UA" based
      // on whether otp_verified_at is set.
      otpMethod: otpVerifiedAt ? 'email' : null,
      otpVerifiedAt,
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
    // Distinguishes OTP-verified SES from link-token SES in the audit
    // payload. The signature row already captures the same fact via
    // otp_verified_at; this duplicates it into the event stream so an
    // audit query doesn't have to join signatures.
    authFactor: otpVerifiedAt ? 'ses-otp-verified' : 'ses-link-token',
    docSha256: docHash,
  })

  // ── If fully signed, render PDF + email both parties with PDF attached ──
  if (bothSigned) {
    // Shared finalisation path (also used from signAsRepAction when rep is
    // the second signer). Generates PDF, uploads to Blob, attaches to both
    // emails, writes audit events. Non-throwing — failures are logged.
    const { finalisePdfAndNotifyPublic } = await import(
      '@/app/admin/actions/orders'
    )
    await finalisePdfAndNotifyPublic({
      orderId: lookup.order.id,
      orderRef: lookup.order.ref,
      customerId: lookup.order.customerId,
      customerEmail: lookup.customer.email,
      customerFirstName: lookup.customer.firstName,
      vehicleMake: lookup.order.vehicle.make,
      vehicleModel: lookup.order.vehicle.model,
      totalGBP: fmtGBPFromPence(lookup.order.totalAmountPence),
      // In this branch the rep is Alan (only admin with visible identity for
      // customer-facing flows). If we later support multi-rep, look up the
      // rep signature and read its signerEmail here.
      repEmail: 'alan@olaris.co.uk',
      repFirstName: 'Alan',
    })
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

