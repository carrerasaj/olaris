# Lessons

Per CLAUDE.md §3 — patterns to apply / mistakes to avoid in future sessions.
Append to the bottom; don't rewrite history.

---

## L-001 · Schema drift caused by deploy without migrate

**Date:** 2026-04-24 (Tony signing incident)
**Symptom:** Production `/sign/[token]` returned a server-side exception with digest. Root cause was `column orders.last_communicated_eta_date does not exist` — code deployed to Vercel was selecting a column that hadn't been added to the prod DB. Migrations 0007 and 0008 were never applied to production.

**Why it happened:** No automation links code deploys to migration application. Dev DB had migrations applied locally, prod DB did not, and the gap was invisible until the new code path tried to read a missing column.

**How to apply:**

- For any PR that adds a `src/db/migrations/00XX_*.sql` file, run `DATABASE_URL=<prod-url> npm run db:migrate` BEFORE merging — or before the resulting Vercel deploy goes live.
- Two attempted automations failed: (a) wrapping `npm run build` with `drizzle-kit migrate && next build` — Vercel's build env didn't surface `DATABASE_URL` to the migrate step, even though the var was configured. (b) the durable fix is a GitHub Action with the var set in Action secrets, gating merges on a successful migrate. Not yet built.
- Until that's built, treat schema deploys as a two-step ritual: `npm run db:migrate` against prod, then merge.
- The `src/db/scripts/sync-journal-0007-0008.sql` pattern (idempotent backfill of drizzle's journal) is the recovery move when migrations were applied out-of-band — use it as a template for any future "the column exists in prod but drizzle's journal doesn't know" case.

---

## L-002 · Provider-first credential rotation breaks live functions

**Date:** 2026-04-26
**Symptom:** Admin login returned 500 (`AdapterError` wrapping Postgres `28P01 invalid_password`). Cause: Neon DB password rotated without first updating Vercel's `DATABASE_URL` / `DATABASE_URL_UNPOOLED` env vars. Every Vercel function that opened a DB connection failed authentication for the entire window between "Neon password reset" and "Vercel env updated + redeployed."

**Why it happened:** "Rotate later" instinct after a leaked credential. Reasonable by itself; dangerous when the credential is the live runtime auth for production functions.

**How to apply:**

- Rotation order for any credential used by Vercel functions:
  1. Generate the new credential at the provider WITHOUT revoking the old one.
  2. Update the corresponding env vars in Vercel — for DB: BOTH `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
  3. Redeploy (env changes don't auto-trigger).
  4. Verify the deploy is green and the affected feature works.
  5. ONLY THEN revoke the old credential at the provider.
- The same pattern applies to Resend, Cal.com, Vercel Blob, and any other server-side credential. Public envs (`NEXT_PUBLIC_*`) are exempt — they're inlined at build time, not runtime.
- If the user pastes a credential in chat, the urge to rotate fast is correct but the order matters. Don't accept "rotate later" as automatic — coach the order.

---

## L-003 · `drizzle-kit migrate` silently ignores CLI env, prefers `.env.local`

**Date:** 2026-04-24
**Symptom:** `DATABASE_URL=$PROD_URL npm run db:migrate` ran against localhost instead of prod, because `drizzle.config.ts` calls `loadEnv({ path: '.env.local' })` which auto-loads dev DATABASE_URL and overrides the CLI env.

**Why it happened:** Default dotenv behaviour + drizzle-kit's auto-loading of `.env.local`.

**How to apply:**

- Don't trust `DATABASE_URL=...` prefixes when running `drizzle-kit` commands. Either: (a) temporarily comment out the `loadEnv()` calls in `drizzle.config.ts`, (b) point `.env.local` at prod for the duration of the command (and back afterwards), or (c) bypass drizzle-kit entirely and run the SQL files directly with `psql -f`.
- The PR that added a build-step migrate (reverted in `78519ca`) hit a related issue: Vercel's build env didn't surface `DATABASE_URL` to the spawned drizzle-kit child despite the var being configured. Root cause unclear — could be Vercel build-vs-runtime scope quirk, or drizzle-kit's child-process env inheritance. Re-attempt via GitHub Action would sidestep it entirely.

---

## L-004 · Multi-line paste into shell prompts vs psql sessions

**Date:** 2026-04-26
**Symptom:** Repeated `SQLSTATE 42601 syntax error at or near "psql"` while running migration commands. The user was inside a stuck interactive `psql` REPL (left open after a `psql "$URL"` with no `-c`/`-f`), and pasting shell commands was being interpreted as SQL.

**Why it happened:** `psql "$URL"` with no flags drops into interactive mode. Easy to miss if the prompt change is subtle.

**How to apply:**

- Always include `-c "..."` or `-f file.sql` when invoking psql from a shell session — never bare `psql "$URL"` unless the goal is interactive.
- If the user reports `SQLSTATE 42601 syntax error at "..."` with a recognisable shell-command token, that's the diagnostic signature: they're in a stuck REPL. Tell them to type `\q` first.
- Leading-space env-var assignments (`  PROD_URL='...'`) only apply to the next command in zsh; for env vars that need to persist across multiple commands (like the `PG*` env for psql), use plain `export`.
