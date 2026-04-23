/**
 * GET /api/cron/quotes-expire
 *
 * Daily sweep: any sent/viewed quote whose expires_at has passed gets
 * flipped to `expired`. Bearer-gated by CRON_SECRET like the reminders
 * cron. Vercel Cron configured in vercel.json.
 *
 * We do the heavy lifting inside `expireStaleQuotes()` so the same logic
 * can be invoked from a future admin "Run expiry now" button without
 * duplicating SQL.
 */

import { expireStaleQuotes } from '@/app/admin/actions/quotes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new Response('unauthorized', { status: 401 })
  }

  const result = await expireStaleQuotes()
  return Response.json({
    ok: true,
    ranAt: new Date().toISOString(),
    expired: result.count,
  })
}
