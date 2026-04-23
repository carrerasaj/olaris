/**
 * Export a single order + all related rows from local dev Postgres to a
 * SQL file ready for import into Neon prod.
 *
 * Usage:
 *   npx tsx scripts/data-port/export-yjt7.ts [ORDER_ID] [--skip-customer-company]
 *
 * Default ORDER_ID is the original YJT7 test. Pass another to port it.
 *
 * `--skip-customer-company` omits the customers + companies INSERTs
 * (useful when they're already present in the destination from a prior
 * port). Related tables (signatures, audit, etc.) are always included.
 *
 * Remaps `created_by` / `actor_id` references from LOCAL_ALAN to NEON_ALAN
 * (same email, different nanoid in each DB).
 *
 * Output is a BEGIN/COMMIT-wrapped INSERT block to stdout — pipe to a file.
 * Always review before applying.
 */

import { Pool } from 'pg'

const LOCAL_ALAN = 'nt4WMY35MB2ThJ3t63NcW'
const NEON_ALAN = '0aRomlJtwd-gJw2sMB6Ap'
const LOCAL_DSN = 'postgres://alancarreras@localhost:5432/olaris_dev'

const ORDER_ID = process.argv[2] ?? 'Y7z6fDhPkn73jUP6-A37S'
const SKIP_CUSTOMER_COMPANY = process.argv.includes('--skip-customer-company')

function escapeLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') return String(v)
  if (v instanceof Date) return `'${v.toISOString()}'::timestamptz`
  if (Buffer.isBuffer(v)) return `'\\x${v.toString('hex')}'::bytea`
  if (typeof v === 'object') {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
  }
  return `'${String(v).replace(/'/g, "''")}'`
}

function remap(v: unknown): unknown {
  if (v === LOCAL_ALAN) return NEON_ALAN
  return v
}

async function insertsFor(
  pool: Pool,
  table: string,
  sql: string,
  params: unknown[] = [],
  remapCols: string[] = [],
): Promise<string[]> {
  const { rows, fields } = await pool.query(sql, params)
  if (rows.length === 0) return [`-- (no rows in ${table})`]
  const cols = fields.map((f) => f.name)
  return rows.map((row: Record<string, unknown>) => {
    const values = cols.map((c) =>
      escapeLiteral(remapCols.includes(c) ? remap(row[c]) : row[c]),
    )
    return `INSERT INTO public.${table} (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`
  })
}

async function main() {
  const pool = new Pool({ connectionString: LOCAL_DSN })

  // Resolve the order's customer_id + company_id dynamically
  const orderMeta = await pool.query<{
    id: string
    ref: string
    customer_id: string
    company_id: string | null
  }>(`SELECT id, ref, customer_id, company_id FROM orders WHERE id = $1`, [ORDER_ID])
  if (orderMeta.rows.length === 0) {
    console.error(`Order id ${ORDER_ID} not found locally`)
    process.exit(1)
  }
  const { ref, customer_id, company_id } = orderMeta.rows[0]

  const lines: string[] = [
    `-- Selective port of order ${ref} (id=${ORDER_ID}) from local dev → Neon prod.`,
    `-- Generated ${new Date().toISOString()}`,
    `--`,
    `-- User ID remap applied (local → neon):`,
    `--   ${LOCAL_ALAN} (alan@olaris.co.uk) → ${NEON_ALAN}`,
    `--`,
    SKIP_CUSTOMER_COMPANY
      ? `-- NOTE: customer + company rows OMITTED (--skip-customer-company flag).`
      : `-- Customer + company rows included.`,
    `--`,
    `-- Run inside a transaction; any error rolls the whole thing back.`,
    ``,
    `BEGIN;`,
    ``,
  ]

  const steps: Array<{
    label: string
    table: string
    sql: string
    params?: unknown[]
    remapCols?: string[]
    skip?: boolean
  }> = [
    {
      label: 'companies',
      table: 'companies',
      sql: `SELECT * FROM companies WHERE id = $1`,
      params: [company_id ?? ''],
      remapCols: ['created_by'],
      skip: SKIP_CUSTOMER_COMPANY || !company_id,
    },
    {
      label: 'customers',
      table: 'customers',
      sql: `SELECT * FROM customers WHERE id = $1`,
      params: [customer_id],
      remapCols: ['created_by'],
      skip: SKIP_CUSTOMER_COMPANY,
    },
    {
      label: 'orders',
      table: 'orders',
      sql: `SELECT * FROM orders WHERE id = $1`,
      params: [ORDER_ID],
      remapCols: ['created_by'],
    },
    {
      label: 'signing_tokens',
      table: 'signing_tokens',
      sql: `SELECT * FROM signing_tokens WHERE order_id = $1`,
      params: [ORDER_ID],
    },
    {
      label: 'otp_codes',
      table: 'otp_codes',
      sql: `SELECT * FROM otp_codes WHERE signing_token_id IN (SELECT id FROM signing_tokens WHERE order_id = $1)`,
      params: [ORDER_ID],
    },
    {
      label: 'signatures',
      table: 'signatures',
      sql: `SELECT * FROM signatures WHERE order_id = $1`,
      params: [ORDER_ID],
    },
    {
      label: 'documents',
      table: 'documents',
      sql: `SELECT * FROM documents WHERE order_id = $1`,
      params: [ORDER_ID],
      remapCols: ['uploaded_by'],
    },
    {
      label: 'audit_events',
      table: 'audit_events',
      sql: `SELECT * FROM audit_events WHERE order_id = $1`,
      params: [ORDER_ID],
      remapCols: ['actor_id'],
    },
    {
      label: 'reminder_schedule',
      table: 'reminder_schedule',
      sql: `SELECT * FROM reminder_schedule WHERE order_id = $1`,
      params: [ORDER_ID],
    },
  ]

  for (const step of steps) {
    if (step.skip) {
      lines.push(`-- ═══ ${step.label} (SKIPPED) ═══`, '')
      continue
    }
    lines.push(`-- ═══ ${step.label} ═══`)
    const rows = await insertsFor(
      pool,
      step.table,
      step.sql,
      step.params,
      step.remapCols ?? [],
    )
    lines.push(...rows)
    lines.push('')
  }

  lines.push(`COMMIT;`)
  lines.push('')

  await pool.end()
  console.log(lines.join('\n'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
