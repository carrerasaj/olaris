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

export function mintRenderToken(orderId: string): string {
  const payload = { orderId, exp: Date.now() + TTL_MS }
  const body = b64url(JSON.stringify(payload))
  const mac = b64url(createHmac('sha256', secret()).update(body).digest())
  return `${body}.${mac}`
}

export function verifyRenderToken(token: string, orderId: string): boolean {
  const [body, mac] = token.split('.')
  if (!body || !mac) return false

  let payload: { orderId?: string; exp?: number }
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8'))
  } catch {
    return false
  }
  if (!payload.orderId || !payload.exp) return false
  if (payload.orderId !== orderId) return false
  if (Date.now() > payload.exp) return false

  const expected = createHmac('sha256', secret()).update(body).digest()
  const provided = b64urlDecode(mac)
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}
