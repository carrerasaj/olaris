import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// node-postgres driver — works with any Postgres (local, Neon direct,
// Supabase, RDS, etc.). Chosen over the Neon HTTP driver so local dev with
// Homebrew Postgres works without swapping drivers per environment.
//
// We initialise Drizzle eagerly so the Auth.js Drizzle adapter can introspect
// the instance at module load (it detects the driver flavour by inspecting
// methods — a lazy Proxy breaks that detection).
//
// To keep the Next.js `build` step working when DATABASE_URL is absent, we
// fall back to a placeholder DSN. Real queries fail only at runtime when a
// valid DATABASE_URL is missing — never at build time.
const url =
  process.env.DATABASE_URL ||
  'postgres://build_placeholder:build_placeholder@localhost:5432/build_placeholder'

// One Pool per server process. Next's dev server hot-reloads modules so we
// cache on globalThis to avoid piling up pools on every reload.
const globalForPool = globalThis as unknown as { __olarisPgPool?: Pool }

const pool =
  globalForPool.__olarisPgPool ??
  new Pool({
    connectionString: url,
    // Conservative defaults for serverless; local dev is well within these.
    max: 10,
    idleTimeoutMillis: 30_000,
    // SSL only when the URL tells us to (remote Postgres like Neon). Local
    // Homebrew Postgres doesn't serve SSL by default and trips on this.
    ssl: /sslmode=require|\.neon\.tech|\.supabase\.co|\.amazonaws\.com/.test(url)
      ? { rejectUnauthorized: false }
      : undefined,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPool.__olarisPgPool = pool
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema })

export type Database = NodePgDatabase<typeof schema>
export * from './schema'
