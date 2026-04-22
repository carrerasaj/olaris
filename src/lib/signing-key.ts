/**
 * Server-side Ed25519 document signing.
 *
 * The private key is stored in Vercel env (SIGNING_KEY_PRIVATE, base64).
 * Public key is SIGNING_KEY_PUBLIC — also published at
 * /.well-known/olaris-signing-pubkey.json so anyone (e.g. the /verify page)
 * can independently verify a document's signature.
 *
 * Every signature row captures the fingerprint of the key that signed it,
 * so if we ever rotate, old signatures remain verifiable against the old
 * pubkey which MUST stay published forever (e.g. as -v1.json, -v2.json).
 */

import nacl from 'tweetnacl'
import { createHash } from 'node:crypto'

const SIGNING_KEY_PRIVATE = process.env.SIGNING_KEY_PRIVATE
const SIGNING_KEY_PUBLIC = process.env.SIGNING_KEY_PUBLIC

if (!SIGNING_KEY_PRIVATE || !SIGNING_KEY_PUBLIC) {
  // Don't throw at module load — signing-key.ts is imported by routes that
  // shouldn't need it (e.g. the sitemap). Throw lazily inside the functions.
}

function requireKey(): { priv: Uint8Array; pub: Uint8Array } {
  if (!SIGNING_KEY_PRIVATE || !SIGNING_KEY_PUBLIC) {
    throw new Error(
      'SIGNING_KEY_PRIVATE / SIGNING_KEY_PUBLIC env vars are not set',
    )
  }
  return {
    priv: Uint8Array.from(Buffer.from(SIGNING_KEY_PRIVATE, 'base64')),
    pub: Uint8Array.from(Buffer.from(SIGNING_KEY_PUBLIC, 'base64')),
  }
}

export function signingKeyFingerprint(): string {
  const { pub } = requireKey()
  return createHash('sha256').update(pub).digest('hex').slice(0, 16)
}

export function publicKeyBase64(): string {
  return SIGNING_KEY_PUBLIC ?? ''
}

// Sign arbitrary bytes. Returns base64. The input is usually a SHA-256 hex
// string (the document_sha256) — we sign the hex string, not the raw hash,
// so signatures are easy to verify by hand from the audit trail.
export function signBytes(data: string | Uint8Array): string {
  const { priv } = requireKey()
  const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const sig = nacl.sign.detached(buf, priv)
  return Buffer.from(sig).toString('base64')
}

// Verify a signature produced by signBytes. Public for the /verify page.
export function verifySignature(
  data: string | Uint8Array,
  signatureBase64: string,
  publicKeyBase64Override?: string,
): boolean {
  const pub = publicKeyBase64Override
    ? Uint8Array.from(Buffer.from(publicKeyBase64Override, 'base64'))
    : requireKey().pub
  const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const sig = Uint8Array.from(Buffer.from(signatureBase64, 'base64'))
  try {
    return nacl.sign.detached.verify(buf, sig, pub)
  } catch {
    return false
  }
}

// SHA-256 hex digest helper — used everywhere we need to hash PDF bytes.
export function sha256Hex(data: Uint8Array | Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}
