# Phase 8 — Quote → Order pipeline

## Problem

Today the funnel starts at "order exists." There is no way to capture a prospect enquiry, send a priced quote, watch who accepted, or see conversion rate. Every deal is typed directly into `/admin/orders/new`, which only scales to ~1/week and loses all pre-order history (what did we quote? who went cold? why did we lose?).

## Goal (v1 scope)

A lightweight quote layer that sits **before** orders with a one-click "convert to order" handoff. Same data shape as an order (vehicle, pricing, finance, customer) but distinguished by status — a quote has not been committed to yet. No prospect/lead table, no marketing automation, no multi-quote comparison. Just: draft a quote → send a link → customer views → they accept or it expires → admin converts accepted quotes to orders.

## Out of scope (deferred to v2+)

- Separate prospects/leads table (v1: use the existing `customers` table; a "prospect" is just a customer with no orders yet)
- Customer self-service quote acceptance — **v1 public quote pages are read-only, no customer accept/decline UI; acceptance is always an admin action based on customer reply (phone/email).** The public page exists solely to display the quote to the customer.
- Quote revisions / multiple quotes per customer compared side-by-side
- Quote-level pricing variance vs a reference price list
- Supplier quote reconciliation
- Win/loss reason codes beyond a free-text note

## Data model

One new table `quotes` + one new enum. No changes to `orders`.

### `quote_status` enum

```
draft | sent | viewed | accepted | declined | expired | converted | cancelled
```

State machine:
- `draft` → `sent` (admin sends quote link)
- `sent` → `viewed` (first time the unique quote link is opened — activity signal only; **not** proof of identity or acceptance, anyone with the link can trip it)
- `sent | viewed` → `accepted | declined` (admin action after customer reply)
- `sent | viewed` → `expired` (past `expires_at`, set by cron or rendered-as-expired on-read)
- `accepted` → `converted` (admin clicks "convert to order")
- any → `cancelled` (admin kills it)

**Immutability after send:** once a quote leaves `draft` (`sent`, `viewed`, `accepted`), its terms are frozen. The edit page is only reachable while `status = 'draft'`. If terms change after sending, the admin cancels the quote and creates a new draft — we never mutate a quote the customer has seen. This keeps "what did we quote?" audit-tight and avoids a revision-tracking layer that v1 doesn't need. Expired and cancelled quotes are terminal and likewise cannot be edited.

**Expiry rules:**

- `expires_at` is set at creation (default +14 days).
- The expire cron flips stale `sent`/`viewed` quotes to `expired`.
- The public `/quote/[token]` page checks `expires_at` on every render: if past, it renders the expired-quote card regardless of the stored status (protects against the gap between cron runs).
- Actions `markQuoteAcceptedAction` and `convertQuoteToOrderAction` reject if `expires_at` is in the past, even if status hasn't been flipped yet. Same for `status = 'expired'`.

### `quotes` table

Mirrors order fields so conversion is a copy. Reusing jsonb blobs means the shape evolves in lockstep with orders and we don't diverge.

| column | type | notes |
|---|---|---|
| id | text pk | nanoid |
| ref | text unique | `OL-Q-YYYY-MM-XXXX` (distinct prefix from orders) |
| customer_id | text fk → customers | restrict on delete |
| company_id | text fk → companies | set null |
| status | quote_status | default `draft` |
| customer_type | customer_type | default `business` |
| finance_type | finance_type | default `BCH` |
| vehicle | jsonb | same shape as orders.vehicle |
| options | jsonb[] | same shape |
| delivery | jsonb | same shape |
| pricing | jsonb | same shape |
| finance | jsonb | same shape |
| addons | jsonb | same shape |
| part_exchange | jsonb nullable | same shape |
| notes | text nullable | internal only |
| customer_notes | text nullable | shown on the public quote view |
| total_amount_pence | int | denormalised |
| monthly_amount_pence | int | denormalised |
| expires_at | timestamptz | default now() + 14 days |
| sent_at / viewed_at / accepted_at / declined_at / converted_at / cancelled_at | timestamptz nullable | audit timestamps |
| converted_order_id | text fk → orders nullable | set when converted, on delete: set null |
| vehicle_supplier_id | text fk → suppliers nullable | carried through on conversion |
| finance_provider_id | text fk → suppliers nullable | carried through on conversion |
| created_by | text fk → users | set null on delete |
| created_at / updated_at | timestamptz | standard |

Indexes: `status`, `customer_id`, `created_at desc`, `ref` unique.

### `quote_tokens` table

Mirrors `signing_tokens` — public view link for the customer.

| column | type | notes |
|---|---|---|
| id | text pk | nanoid |
| quote_id | text fk → quotes | cascade |
| token | text unique | 32-byte base64url |
| expires_at | timestamptz | same as quote's expires_at |
| created_at | timestamptz | |

Note: the token is view-only in v1. Accepting/declining a quote is an admin action based on customer feedback — we do *not* let the public URL flip status. This avoids the complication of proving who clicked (no OTP on quotes). We track "viewed" via the link hit.

**One active token per quote.** `sendQuoteAction` and any "resend" flow both reuse the existing unexpired token for that quote (looked up by `quote_id` + `expires_at > now()` + `consumed_at IS NULL` — though v1 tokens are never "consumed," the column is reserved for symmetry with `signing_tokens`). Only if no valid token exists do we mint a new one. This keeps the customer's original link working across resends and avoids a drawer of stale URLs per quote.

### audit events additions

Add to `auditEventType` enum:
- `quote.created`
- `quote.updated`
- `quote.sent`
- `quote.viewed`
- `quote.accepted`
- `quote.declined`
- `quote.expired`
- `quote.converted`
- `quote.cancelled`

## Ref scheme

Orders use `OL-YYYY-MM-XXXX`. Quotes use `OL-Q-YYYY-MM-XXXX` so they sort together visually but never collide. The "Q" makes it obvious at a glance whether the reference a customer quotes back at us is pre- or post-commit.

## Routes

### Admin

| route | purpose |
|---|---|
| `/admin/quotes` | List with status tabs: **All / Open** (`draft`+`sent`+`viewed`) **/ Ready to convert** (`accepted`) **/ Converted / Lost** (`declined`+`expired`+`cancelled`). Separating "Ready to convert" makes the next-action queue obvious — it's the admin's to-do list for turning yesses into orders. |
| `/admin/quotes/new?customerId=...` | Same customer-picker flow as orders, same long-page form reused |
| `/admin/quotes/[id]` | Detail with status pill, timeline, public link copy-button, Send / Mark accepted / Mark declined / Convert to order / Cancel actions |
| `/admin/quotes/[id]/edit` | Form (same editor as orders) — only allowed while status is draft |

### Public

| route | purpose |
|---|---|
| `/quote/[token]` | Read-only customer-facing view. Shows vehicle, price, finance terms, expiry. Records `quote.viewed` on first hit. No accept/decline buttons — customer replies by email/phone. |

No signing flow. No OTP.

## Actions

`src/app/admin/actions/quotes.ts`:

- `createQuoteAction(input)` — insert draft, audit, return id
- `updateQuoteAction(quoteId, input)` — only in draft; audit
- `sendQuoteAction(quoteId)` — mints a quote_token, flips status to `sent`, emails customer with the `/quote/[token]` link, records `quote.sent`
- `markQuoteViewedAction(quoteId)` — called from the public page loader (not a direct user action); idempotent; only flips `sent` → `viewed`
- `markQuoteAcceptedAction(quoteId, note?)` — admin flips `sent|viewed` → `accepted`
- `markQuoteDeclinedAction(quoteId, reason?)` — admin flips `sent|viewed` → `declined`, stores free-text reason in notes
- `convertQuoteToOrderAction(quoteId)` — only from `accepted`. Copies all jsonb + supplier refs into a new orders row, generates an order ref, sets `quotes.converted_order_id` + `converted_at`, flips status to `converted`. Returns `{ orderId }` so the admin can redirect straight to the new order page.
- `cancelQuoteAction(quoteId, reason?)`

## Email

One transactional template: "Your quote from Olaris Consulting."
- Sent by `sendQuoteAction`
- Contains vehicle line, headline monthly/total, expiry date, quote ref, public link
- No reminder cron in v1 (deferred — Phase 8.5 if we want it)

## Conversion semantics

`convertQuoteToOrderAction` is the bridge. Rules:

1. Only allowed from `status = 'accepted'` **and** `expires_at > now()`. (Matches the real-world process: customer has said yes *and* the quote hasn't timed out.)
2. New order starts in `draft` so admin can tweak anything (final VIN, delivery date, etc.) before hitting "send for signature."
3. Customer, company, supplier, finance provider, all jsonb snapshots are copied as-is. Order ref is freshly generated.
4. Quote is not deleted. `quotes.converted_order_id` points at the new order and status becomes `converted`. The quote remains visible under the customer's timeline as a historical record.
5. **Reverse trace:** the new order gets a `source_quote_id` column (nullable FK → quotes, ON DELETE SET NULL) populated on conversion. Orders created directly via `/admin/orders/new` leave it null. This gives both directions of the relationship: quote → order via `converted_order_id`, order → quote via `source_quote_id`. Order detail page surfaces a "Created from quote OL-Q-…" link when it's set.
6. If the same quote is somehow converted twice, the action rejects (status check + `converted_order_id IS NULL` guard in the WHERE).

## Cron: expire stale quotes

Add `/api/cron/quotes-expire` (matches the reminders pattern). Runs daily. Finds quotes where `expires_at < now()` and `status IN ('sent', 'viewed')`, flips them to `expired`, audit. Add to `vercel.json` crons. Same Bearer-token gate as `/api/cron/reminders`.

## Reuse vs duplicate

The quote editor shares the same React form as orders. I want zero fork: the form takes a `mode: 'quote' | 'order'` prop that only influences labels ("Quote price" vs "Order price") and submit button text. The data-mapping function (`uiOrderToInput`) already exists — we'll add a parallel `uiQuoteToInput` that returns the quote shape (identical jsonb, different table target).

## Public quote view

Styled like `/verify/[ref]` but read-only:

- Header with quote ref + status pill + expiry countdown
- Customer + vehicle summary
- Pricing breakdown + headline monthly
- "This quote expires on …" banner
- Footer with Olaris contact details
- No accept button, no "sign here." Copy reads: *"To accept this quote, reply to our email or call us on …. We'll send you a signed order once you're ready."*

**Expired rendering.** On every request, the public page evaluates `expires_at < now()` OR `status IN ('expired', 'cancelled', 'declined')`. If true, the page renders an "expired/unavailable" card only — no pricing, no vehicle detail, no countdown. Copy: *"This quote is no longer available. Please contact us for an up-to-date quote."* plus Olaris contact details. This closes the gap between cron runs and also hides declined/cancelled quotes from the public URL without needing to rotate tokens.

## Telemetry / activity on the customer page

The existing customer detail page already shows orders. Add a quotes section above it with status pills so the timeline tells the full story: Quote sent 2026-04-01 → Viewed 2026-04-02 → Accepted 2026-04-05 → Converted (→ OL-2026-04-ABCD).

## Migration file

`src/db/migrations/0003_quotes.sql` generated via drizzle-kit. No manual SQL. Applied to local + Neon in lockstep (same pattern as 0002).

## Files to create

- `src/db/migrations/0003_...sql` (generated)
- `src/app/admin/actions/quotes.ts`
- `src/app/admin/quotes/page.tsx`
- `src/app/admin/quotes/new/page.tsx`
- `src/app/admin/quotes/[id]/page.tsx`
- `src/app/admin/quotes/[id]/edit/page.tsx`
- `src/app/admin/quotes/QuoteAdminEditor.tsx` (thin wrapper over OrderAdminEditor in 'quote' mode)
- `src/app/quote/[token]/page.tsx`
- `src/app/api/cron/quotes-expire/route.ts`
- `src/lib/quote-mapping.ts`
- `src/lib/email/quote-sent.ts` (new transactional template)

## Files to modify

- `src/db/schema.ts` — add enum, tables, relations, audit events
- `src/lib/validation.ts` — quote create/update schemas
- `src/app/admin/AdminNav.tsx` — add "Quotes" between Orders and Suppliers
- `src/app/admin/components.tsx` — `QuoteStatusPill`
- `src/app/admin/customers/[id]/page.tsx` — show quotes alongside orders
- `src/app/admin/OrderAdminEditor.tsx` or its caller — accept `mode` prop
- `vercel.json` — add quotes-expire cron (7am daily, same as reminders)

## Acceptance checks

- [ ] Create a quote for Tony → appears in /admin/quotes with status `draft`
- [ ] Send quote → email arrives with /quote/[token] link, status flips to `sent`, `sent_at` set
- [ ] Open the link in an incognito tab → status flips to `viewed` once, `viewed_at` set; reload doesn't re-audit
- [ ] Mark accepted → status `accepted`, `accepted_at` set
- [ ] Convert to order → new order created in `draft` with same vehicle/pricing/supplier, quote now `converted` with `converted_order_id` populated, admin redirected to new order page
- [ ] Expired cron: seed a quote with `expires_at` in the past, hit `/api/cron/quotes-expire` with Bearer, quote flips to `expired`
- [ ] Customer detail page shows the quote row with its status → converted order link
- [ ] `/quote/[token]` is read-only (no buttons), shows expiry, renders correctly on mobile
- [ ] Attempting to convert a non-accepted quote rejects with a clear error
- [ ] Typecheck + build clean
- [ ] Committed + pushed, Vercel green

## Rollout order

1. Schema + migration (local + Neon, same pattern as 0002)
2. Actions + zod validation
3. Admin list / detail / edit / new pages
4. Public `/quote/[token]` page
5. Email template + send action
6. Convert-to-order action + redirect
7. Expire cron + vercel.json entry
8. Customer page integration (quotes alongside orders)
9. Typecheck → build → commit → push

Out of band: none. No deps to add — existing stack covers it.
