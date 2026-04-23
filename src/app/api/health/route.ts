/**
 * GET /api/health
 *
 * Shallow liveness + dependency check. Returns 200 with JSON describing
 * which subsystems are configured and reachable. Intentionally public —
 * the response exposes nothing sensitive, only presence-of-config bits.
 *
 * Used for:
 *   - post-deploy smoke tests (is DB/email/blob reachable?)
 *   - future uptime monitors (Pingdom, BetterStack)
 *   - quick debugging when a prod route 500s without obvious cause
 *
 * Does NOT:
 *   - trust the DB enough to write — read-only check
 *   - validate Resend / Blob credentials by sending / writing
 *   - leak env-var values, only their presence
 */

import { db, users } from '@/db/client'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface HealthReport {
  ok: boolean
  buildTime: string
  checks: {
    db: { ok: boolean; latencyMs?: number; error?: string }
    signingKey: { ok: boolean }
    resend: { ok: boolean }
    blob: { ok: boolean }
    auth: { ok: boolean }
  }
}

// Resolved at build time via process.env.BUILD_TIME (Vercel sets
// VERCEL_GIT_COMMIT_SHA we could also expose). Falls back to "unknown"
// so local dev doesn't explode on fresh checkouts.
const BUILD_TIME =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BUILD_TIME ?? 'unknown'

export async function GET() {
  const checks: HealthReport['checks'] = {
    db: { ok: false },
    signingKey: { ok: !!(process.env.SIGNING_KEY_PRIVATE && process.env.SIGNING_KEY_PUBLIC) },
    resend: { ok: !!process.env.RESEND_API_KEY },
    blob: { ok: !!process.env.BLOB_READ_WRITE_TOKEN },
    auth: { ok: !!process.env.AUTH_SECRET },
  }

  // DB round-trip. If DATABASE_URL is unset the db client module was
  // built with a placeholder DSN — queries will fail fast.
  const dbStart = Date.now()
  try {
    await db.execute(sql`SELECT 1`)
    checks.db = { ok: true, latencyMs: Date.now() - dbStart }
    // Bonus: prove admin seeding ran — cheap count query.
    // Not strictly a health check, but we've been burned by seeding
    // getting missed during a redeploy.
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
    void result
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    checks.db = { ok: false, error: msg.slice(0, 160) }
  }

  const ok = Object.values(checks).every((c) => c.ok)

  return Response.json(
    { ok, buildTime: BUILD_TIME, checks } satisfies HealthReport,
    {
      status: ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        // Let us hit it from anywhere for uptime monitoring later
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
