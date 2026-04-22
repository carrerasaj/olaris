/**
 * Long-lived signed token for a specific order's PDF download URL.
 *
 * This is what we embed in the "Order signed and complete" email. The
 * customer needs it to pass through /api/orders/[id]/pdf without logging
 * in (they have no account; we only know them by their order).
 *
 * Expiry: 90 days (long enough for a customer to refer back to their order,
 * short enough that a leaked email from years ago is useless).
 *
 * Keys: reuses AUTH_SECRET. Rotating that invalidates all live tokens —
 * acceptable trade (regenerating fresh links is one email resend).
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const TTL_MS = 90 * 24 * 60 * 60 * 1000

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
  const padded =
    s.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (s.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

export function mintDownloadToken(orderId: string): string {
  const payload = { orderId, exp: Date.now() + TTL_MS }
  const body = b64url(JSON.stringify(payload))
  const mac = b64url(createHmac('sha256', secret()).update(body).digest())
  return `${body}.${mac}`
}

export function verifyDownloadToken(token: string, orderId: string): boolean {
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
