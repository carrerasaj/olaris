-- Backfills the drizzle migration journal for 0007 and 0008, which were
-- applied to prod out-of-band on 2026-04-24 (Tony incident — schema drift
-- between deployed code and prod DB).
--
-- Drizzle's migrator only compares `created_at` (the journal "when" field
-- in milliseconds) to decide whether a migration has been applied; the
-- hash column is recorded but never re-checked. The hashes below are the
-- real sha256 of the SQL files (computed via `shasum -a 256 …`) so future
-- inspections of this table won't show "weird" rows.
--
-- IDEMPOTENT: each insert is gated by NOT EXISTS on its created_at, so
-- running this twice is a no-op.
--
-- WARNING: do NOT run against any DB where 0007/0008 haven't already
-- been applied. This script ONLY records that the schema change happened;
-- it does NOT apply the schema change. If your DB doesn't have the
-- `last_communicated_eta_date` column on `orders`, run `db:migrate` instead.

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT
  '7128bf5efe54692555383e46e758786d12063f208012a604462d3ee70b925f14',
  1776973571998
WHERE NOT EXISTS (
  SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at = 1776973571998
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT
  'b6276e8bee620ff8eb437b11e9f13bf712ac586669ddee2069707b3826fe05df',
  1777021503831
WHERE NOT EXISTS (
  SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at = 1777021503831
);
