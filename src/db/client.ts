import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Neon HTTP driver — serverless-friendly, no connection pool to warm up.
// For long-lived processes (migrations, scripts) drizzle-kit uses node-postgres
// via drizzle.config.ts instead; that's intentional — HTTP mode doesn't run DDL.
//
// We initialise Drizzle eagerly so the Auth.js Drizzle adapter can introspect
// the instance at module load (it detects neon-http vs node-postgres by
// inspecting methods on the object — a lazy Proxy breaks that detection).
//
// To keep the Next.js `build` step working when DATABASE_URL is absent, we
// fall back to a placeholder DSN. Real queries fail only at runtime when a
// valid DATABASE_URL is missing — never at build time.
const url =
  process.env.DATABASE_URL ||
  'postgres://build_placeholder:build_placeholder@localhost:5432/build_placeholder'

export const db: NeonHttpDatabase<typeof schema> = drizzle(neon(url), { schema })

export type Database = NeonHttpDatabase<typeof schema>
export * from './schema'
