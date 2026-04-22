# Phase 6 sprint — 2026-04-23

Picking up from 52e9678 (phase-5-pdf-generation-and-verify). This is a
single-day sprint, four tightly-scoped items. Nothing architectural —
each piece closes a known gap from Phases 1–5.

## Current state (end of 2026-04-22)

Working end-to-end, locally:
- Admin sign-in via Resend magic link
- Customer + company CRUD, order CRUD with state machine
- Customer signing flow with OTP, typed/drawn sig, decline, forensic envelope
- Rep countersign with intent click, no-OTP (session is evidence)
- PDF generation via Puppeteer + @sparticuz/chromium, private Vercel Blob
- Public `/verify/[ref]` with client-side hash verification
- Duplicate order action
- Ed25519 document-signing, published pubkey at `/.well-known/...`
- Full audit trail on every order

Not yet:
- Reminder cron (scheduled_for rows in `reminder_schedule` sit un-fired)
- Production deploy on Vercel
- Form-level data validation (zero CO₂ on diesel, zero monthly on HP, etc.)
- Audit-trail pollution by `pdf.downloaded` events

## Tasks

### 1 · Reminder cron dispatcher · ~1.5h

**What it does:** Daily sweep of `reminder_schedule` rows where
`scheduled_for <= now() AND sent_at IS NULL AND cancelled_at IS NULL`.
For each: check the order is still `sent` or `partially_signed` (skip
otherwise), resend the signing-link email via Resend, stamp `sent_at`,
write a `reminder.sent` audit event.

**Where:**
- New route `src/app/api/cron/reminders/route.ts` — runs the sweep
- Gate with `Authorization: Bearer ${process.env.CRON_SECRET}` check
  (Vercel Cron sets this header; any other caller gets 401)
- `vercel.json` cron entry:
  ```json
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 7 * * *" }]
  ```
  07:00 UTC daily = 08:00 local in summer, 07:00 local in winter. Fine.

**Non-goals:**
- Don't try to be clever with backoff / retry if Resend returns a failure
  — just write `email.failed` and carry on. The next day's run picks up
  anything with `sent_at IS NULL` (we don't auto-retry).
- Don't cancel scheduled reminders on order cancellation here — that
  already happens in `cancelOrderAction`.

**Gotchas:**
- `CRON_SECRET` is a new env var. Generate and paste to Vercel env.
- The existing `reminder_schedule` rows from earlier test orders are
  stale. One-off SQL to clear them:
  `DELETE FROM reminder_schedule WHERE sent_at IS NULL AND
   scheduled_for < now() AND cancelled_at IS NULL;`

### 2 · Production deploy checklist · ~2h (PLUS production DB decision)

**⚠ Open decision before deploy — where does the production DB live?**
Dev is Homebrew Postgres 14 on Alan's Mac. That doesn't deploy. Options:

- **Neon** — Vercel-integrated, serverless Postgres, free tier ample for
  v1, `DATABASE_URL_UNPOOLED` needed for migrations. The drizzle config
  already supports Neon's driver via `node-postgres`-or-http; the
  runtime uses `drizzle-orm/node-postgres` which talks to any Postgres.
- **Supabase** — similar tier, has extras (Auth, Storage) we don't need
- **Self-hosted on a small VPS** — cheapest recurring cost, most ops
- **Vercel Postgres (= Neon under the hood now)** — simplest if all-Vercel

**Recommendation: Neon**, EU (London) region. Free tier fits the order
volumes we're talking about, upgrade path exists. Drizzle + migrations
already tested locally and will work the same way against Neon.

**Action before deploy:**

- [ ] Create Neon project, copy `DATABASE_URL` + `DATABASE_URL_UNPOOLED`
- [ ] `npm run db:migrate` against Neon (from local, targeting prod DSN)
- [ ] `npm run db:seed` against Neon
- [ ] Paste `DATABASE_URL` (pooled) into Vercel env, Production scope

**Other prereqs:**

- `RESEND_API_KEY` (prod), `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`,
  `SIGNING_KEY_PRIVATE`, `SIGNING_KEY_PUBLIC`, `CRON_SECRET`, `EMAIL_FROM`
  all pasted into Vercel → Production scope
- `NEXTAUTH_URL=https://olaris.co.uk` in Vercel prod
- `NEXT_PUBLIC_SITE_URL=https://olaris.co.uk` — already set, confirm

**Migration:**
- `npm run db:migrate` against prod Neon (migrates 0000 + 0001)
- `npm run db:seed` — creates alan@ and admin@
  - **Set ADMIN_EMAILS in src/db/scripts/seed-admins.ts before running**
    if the list has changed

**Post-deploy smoke tests:**
- [ ] Sign-in works at https://olaris.co.uk/admin/login
- [ ] Create a real customer, real order, send-for-signature to a
      testable email (alan@olaris.co.uk)
- [ ] Full sign flow works end-to-end
- [ ] PDF generates (first real-world cold-start on Vercel — expect
      5–10s, possibly 60s if Chromium cold-starts badly)
- [ ] `/verify/[ref]` renders
- [ ] `/.well-known/olaris-signing-pubkey.json` is reachable
- [ ] robots.txt still disallows /admin, /sign, /api/sign, /api/admin,
      /internal, /.well-known

**Known risks:**
- Vercel function size: @sparticuz/chromium ~50MB. Pro plan lifts the
  50MB ceiling to 250MB; we're fine, but worth monitoring.
- Puppeteer cold-start on serverless: 3–10s typical, up to 60s rare.
  Current `renderOrderPdf` has 30s timeout — may need lifting to 60s on
  production after first real observation.

### 3 · Form-level data validation · ~1h

Three bugs visible in the test order that the form accepted without
complaint:

- `CO₂ 0 g/km` for a diesel van (almost certainly wrong)
- `Monthly £0.00 + VAT` for HP 48 months with £36,091 drive-away (no
  monthly payment in a hire-purchase order makes no sense)
- `Oxfodshire` typo — no spellcheck, no postcode-lookup validation

**Scope — pick 2 of 3:**
- **CO₂ warning** — if fuel ≠ 'Electric' AND co2 === 0, show a
  non-blocking warning under the field. Don't block; some orders
  legitimately have unknown CO₂ at draft time.
- **Monthly-vs-finance-type check** — if financeType ≠ 'OP' AND
  monthlyNet === 0, show a warning on the Finance section. Non-blocking.
- **Postcode format check** — trivial regex, UK postcodes. Client-side
  only (we have the regex in `src/lib/validation.ts` already — wire it
  into the delivery address input).

These are inline warnings, not gate-to-send. Already have `orderSendSchema`
in `src/lib/validation.ts` for send-time validation; this is about
catching data errors before they're invisible-committed.

### 4 · Audit trail filtering · ~30min

The Certificate of Completion in the PDF currently shows every
`pdf.downloaded` event. On an actively-used order this will grow
unboundedly (test order YJT7 has 15+ already, in half a day).

**Fix:**
- In `src/app/admin/orders/[id]/pdf-template/page.tsx`, filter out
  `pdf.downloaded` from the audit trail for the Certificate page.
- Keep them in the DB for investigatory purposes
- Optional: collapse consecutive downloads into "N PDF downloads
  between X and Y" on admin detail page (not PDF)

Alternative design: split the audit trail into two on the PDF —
"contract lifecycle" (create / sent / signed / delivered / cancelled /
sig-declined) and "access events" (PDF downloads). Show the lifecycle
on the cert page, omit the access events. Matches what DocuSign does.

## Stretch if time left

- **Rotate the Resend API key** — pasted to chat twice during dev, worth
  rotating once we deploy to production.
- **Rotate the Vercel Blob token** — same reason.
- **Delete `/tmp/puppeteer-smoke.ts` output files** — scratch PDFs in `/tmp`
  from debugging.
- **Order form's placeholder "bear close, Woodstock, Oxfodshire"** is
  baked into the test customer. Either fix the test data or leave it
  (will vanish when real customers go in).

## Decisions still to make (flag in morning)

- **Where does Phase 7 go?** Originally "security hardening, rate limits,
  CSP, GDPR". After Phase 6's deploy, the live site will be handling
  real PII and contracts. Some of Phase 7's scope should arguably be
  pulled forward into the deploy checklist (rate limits on /api/sign/*,
  CSP allowlist for Vercel Blob domain).
- **Audit event payload PII** — signed_order_pdf audit events capture
  IP and geo. GDPR request for erasure should redact this where the
  audit is *not* part of the executed contract. Worth writing a runbook.
- **What happens if customer replies to alan@olaris.co.uk?** Currently
  the reply goes to Alan's inbox. Intentional (he needs to see customer
  responses). No action needed, just confirming.

## Known working baseline

Last committed: `52e9678 phase-5-pdf-generation-and-verify`
Branch: `main`, local only (not pushed)
Dev DB: Homebrew postgres `olaris_dev` at `postgres://alancarreras@localhost:5432/olaris_dev`
Test order: `OL-2026-04-YJT7` (fully signed, has a generated PDF)
Test duplicate: `OL-2026-04-UD3R` (draft, cloned from YJT7)
