/**
 * Idempotent admin seed.
 *
 * Run once after initial migration, or any time you need to add an admin.
 * Safe to re-run: uses ON CONFLICT DO NOTHING on email.
 *
 *   npx tsx src/db/scripts/seed-admins.ts
 *
 * To add a third admin: edit ADMIN_EMAILS and re-run.
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import { users } from '../schema'

const ADMIN_EMAILS = ['alan@olaris.co.uk', 'admin@olaris.co.uk'] as const

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: url })
  const db = drizzle(pool)

  for (const email of ADMIN_EMAILS) {
    await db
      .insert(users)
      .values({ email, role: 'admin', name: email.split('@')[0] })
      .onConflictDoNothing({ target: users.email })
    console.log(`✓ admin ensured: ${email}`)
  }

  const count = await db.execute(sql`SELECT count(*) FROM users WHERE role = 'admin'`)
  console.log(`Total admins: ${(count.rows[0] as { count: string }).count}`)

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
