/**
 * Idempotent seed for the real suppliers we transact with.
 *
 *   npx tsx src/db/scripts/seed-suppliers.ts
 *
 * Runs against whichever DSN env points at (defaults to local dev; set
 * DATABASE_URL + DATABASE_URL_UNPOOLED to target Neon prod).
 *
 * Seeds:
 *   - Auto Choices Ltd (T/A Van Choices) — dealer, vehicle-supplier for UD3R
 *
 * Safe to re-run: an "on legal_name conflict do nothing" is not available
 * (no unique constraint on legal_name), so we check for the specific supplier
 * by legal_name before inserting. If the supplier row already exists, we
 * leave it alone — edits happen via the admin UI.
 */

import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { and, eq } from 'drizzle-orm'
import { suppliers, orders } from '../schema'

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }
  const ssl = /sslmode=require|\.neon\.tech|\.supabase\.co|\.amazonaws\.com/.test(url)
    ? { rejectUnauthorized: false }
    : undefined
  const pool = new Pool({ connectionString: url, ssl })
  const db = drizzle(pool)

  const VAN_CHOICES_LEGAL = 'Auto Choices Limited'

  const existing = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.legalName, VAN_CHOICES_LEGAL))
    .limit(1)

  let vanChoicesId: string
  if (existing.length > 0) {
    vanChoicesId = existing[0].id
    console.log(`✓ supplier already exists: ${VAN_CHOICES_LEGAL} (${vanChoicesId})`)
  } else {
    const [row] = await db
      .insert(suppliers)
      .values({
        kind: 'dealer',
        legalName: VAN_CHOICES_LEGAL,
        tradingName: 'Van Choices',
        primaryContactName: 'Dave',
        primaryContactEmail: 'dave@vanchoices.co.uk',
        primaryContactPhone: '07967 972778',
        website: 'https://www.vanchoices.co.uk',
        addressLine1: '22 The Fielders',
        addressLine2: 'Eversley Cross',
        addressCity: 'Hampshire',
        addressPostcode: 'RG27 0QF',
        addressCountry: 'United Kingdom',
        notes: 'Vehicle supplier for OL-2026-04-UD3R (Tony O\'Connor, Renault Trafic).',
      })
      .returning({ id: suppliers.id })
    vanChoicesId = row.id
    console.log(`✓ supplier created: ${VAN_CHOICES_LEGAL} (${vanChoicesId})`)
  }

  // Link to UD3R if that order exists in this DB and has no vehicle supplier yet.
  const ud3r = await db
    .select({ id: orders.id, vehicleSupplierId: orders.vehicleSupplierId })
    .from(orders)
    .where(eq(orders.ref, 'OL-2026-04-UD3R'))
    .limit(1)

  if (ud3r.length === 0) {
    console.log('– OL-2026-04-UD3R not found in this DB; skipping link')
  } else if (ud3r[0].vehicleSupplierId === vanChoicesId) {
    console.log('✓ UD3R already linked to Van Choices')
  } else if (ud3r[0].vehicleSupplierId) {
    console.log(
      `! UD3R already has a different vehicle supplier (${ud3r[0].vehicleSupplierId}); leaving as-is`,
    )
  } else {
    await db
      .update(orders)
      .set({ vehicleSupplierId: vanChoicesId, updatedAt: new Date() })
      .where(and(eq(orders.id, ud3r[0].id)))
    console.log('✓ UD3R linked to Van Choices')
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
