import type { Config } from 'drizzle-kit'
import { config as loadEnv } from 'dotenv'

// Load .env.local first (Next.js's convention, where DATABASE_URL lives in
// development), then fall back to .env if that file doesn't exist.
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

// Drizzle reads the unpooled connection for migrations (Neon's pooler doesn't
// support DDL). Falls back to DATABASE_URL when the unpooled var isn't set —
// useful for local throwaway DBs that don't distinguish the two.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!url) {
  throw new Error(
    'DATABASE_URL (or DATABASE_URL_UNPOOLED) must be set to run drizzle-kit commands.',
  )
}

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
} satisfies Config
