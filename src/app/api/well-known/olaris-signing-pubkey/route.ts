/**
 * Public endpoint exposing the Olaris document-signing public key.
 *
 * Lets anyone verify a signed PDF's Ed25519 signature independently, without
 * needing to trust our /verify UI. Served at /.well-known/olaris-signing-pubkey
 * via the rewrite in next.config.mjs.
 *
 * If we ever rotate the key, DO NOT remove this endpoint. Add a versioned
 * endpoint for the new key (olaris-signing-pubkey-v2) and keep v1 forever
 * so historic signed PDFs stay verifiable.
 */

import { publicKeyBase64, signingKeyFingerprint } from '@/lib/signing-key'

// Dynamic so the Next build doesn't try to prerender this (would fail before
// env vars are set). Real requests are cache-headered below, so CDN still
// serves it for 24h even though Next flags the route dynamic.
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(
    {
      version: 1,
      algorithm: 'Ed25519',
      public_key_base64: publicKeyBase64(),
      fingerprint_sha256_first16: signingKeyFingerprint(),
      issued_at: new Date().toISOString(),
      verify_at: 'https://olaris.co.uk/verify',
      issuer: 'Olaris Consulting Ltd',
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, immutable',
        'Content-Type': 'application/json',
      },
    },
  )
}
