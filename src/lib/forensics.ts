/**
 * Forensic envelope helpers for the e-signature audit trail.
 *
 * Every signing-related action (link view, OTP request, signature submit,
 * decline) captures the same fields: IP, user-agent, and geo (city,
 * country). On Vercel these come from request headers the platform injects;
 * locally they're typically null.
 *
 * Reads come from next/headers, which is server-only. Importing this module
 * from a client component will fail at build time — that's intentional.
 */

import { headers } from 'next/headers'
import { createHash } from 'node:crypto'

export interface ForensicEnvelope {
  ip: string | null
  userAgent: string | null
  geoCity: string | null
  geoCountry: string | null
}

export async function captureForensics(): Promise<ForensicEnvelope> {
  const h = await headers()

  // Vercel sets x-forwarded-for (rightmost is the real client per Vercel
  // docs). Locally this is usually the direct client (dev server).
  const xff = h.get('x-forwarded-for') ?? ''
  const ip =
    xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .pop() ??
    h.get('x-real-ip') ??
    null

  const userAgent = h.get('user-agent') ?? null

  // Vercel geo headers: x-vercel-ip-city (URL-encoded), x-vercel-ip-country.
  const rawCity = h.get('x-vercel-ip-city')
  let geoCity: string | null = null
  if (rawCity) {
    try {
      geoCity = decodeURIComponent(rawCity)
    } catch {
      geoCity = rawCity
    }
  }
  const geoCountry = h.get('x-vercel-ip-country') ?? null

  return { ip, userAgent, geoCity, geoCountry }
}

// SHA-256 hex of arbitrary bytes. Used for the document hash captured at
// sign time. For Phase 4 we hash a deterministic JSON snapshot of the order;
// Phase 5 swaps this for the actual PDF bytes.
export function sha256Hex(data: Uint8Array | Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

// Deterministic JSON serialisation of an object. Sorts keys so any two calls
// with equivalent data produce the same hash — critical for signatures.
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (v as Record<string, unknown>)[k]
          return acc
        }, {})
    }
    return v
  })
}
