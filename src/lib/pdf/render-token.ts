/**
 * Short-lived HMAC token used only by the server → Puppeteer → template
 * route. Lets the template route accept a request that carries no admin
 * session — Puppeteer is a raw HTTP client.
 *
 * Token format: base64url(JSON{orderId, exp}) + '.' + base64url(hmac)
 * Expiry: 60 seconds (issued immediately before Puppeteer.navigate()).
 * Keys: reuses AUTH_SECRET — rotating that invalidates all live tokens.
 *
 * NOT a general-purpose auth primitive. Only scoped to "allow Puppeteer
 * to render this specific order's HTML template right now". The admin
 * session is still accepted by the route as the normal access path.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const TTL_MS = 60_000 // 60s — Puppeteer launches + navigates well inside this

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET is not set')
  return s
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

// Subject is whatever identifier the template route expects in its URL — an
// order id for signed-order / supplier-po / handover-pack templates, or a
// short-lived payload id for ad-hoc reports (e.g. excess-mileage). Verifier
// re-checks equality, so a token minted for one subject can't be replayed
// against another.
export function mintRenderToken(subject: string): string {
  const payload = { subject, exp: Date.now() + TTL_MS }
  const body = b64url(JSON.stringify(payload))
  const mac = b64url(createHmac('sha256', secret()).update(body).digest())
  return `${body}.${mac}`
}

export function verifyRenderToken(token: string, subject: string): boolean {
  const [body, mac] = token.split('.')
  if (!body || !mac) return false

  // Accept legacy `orderId` payloads minted before the field rename, so an
  // in-flight render at deploy time doesn't fail verification.
  let payload: { subject?: string; orderId?: string; exp?: number }
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8'))
  } catch {
    return false
  }
  const payloadSubject = payload.subject ?? payload.orderId
  if (!payloadSubject || !payload.exp) return false
  if (payloadSubject !== subject) return false
  if (Date.now() > payload.exp) return false

  const expected = createHmac('sha256', secret()).update(body).digest()
  const provided = b64urlDecode(mac)
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}
