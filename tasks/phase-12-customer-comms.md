# Phase 12 — Customer delivery comms + handover pack + NPS

> **Status: shipped.** Closed via commit `05fd80a phase-12-customer-comms`. Unticked checkboxes below are historical — kept for context, not active work. See `tasks/olaris-growth-roadmap.md` for current work.

## Problem

Phase 9 runs the delivery lifecycle internally but the customer learns about progress by email/phone. Today they sign the order, then disappear into a black box — they don't know when the dealer confirmed, when the ETA slipped, or when to expect the handover. On delivery day they get the vehicle but no digital record of what we handed over; no NPS capture either, so we have no structured view of how happy customers are with us.

## Goal (v1 scope)

Close the customer-facing loop on three fronts:

1. **Handover pack PDF** — generated at delivery and stored as a frozen artefact.
2. **Transactional delivery-lifecycle emails** triggered off Phase 9 state transitions.
3. **NPS + feedback capture** — a separate email 1–2 days after delivery, linking to a public feedback page, results surfaced internally with low-score flags.

## Out of scope (deferred)

- SMS (Resend-only in v1)
- Beehiiv / lifecycle marketing automation (v2)
- Public testimonials page / review syndication
- Anniversary email (v2 — needs a cron sweep, not state-triggered)
- Customer self-service portal (view own order status)
- Automatic referral reward tracking / introducer commission
- In-app notifications / push

## 1. Transactional vs marketing classification

**Delivery-lifecycle emails are transactional / service emails.** They are the service we are contracted to provide updates on. They are not marketing and must never be suppressed by a `marketing_opt_out` flag.

Marketing opt-out, which we will introduce on `customers` in this phase, applies only to:

- The NPS follow-up email (post-delivery feedback ask — respects opt-out; we never beg for scores)
- Any referral prompt triggered by a high NPS score
- Future anniversary / retention emails (Phase 13+)

Core operational transactional emails — `order.confirmed_email`, `order.eta_changed_email`, `order.ready_for_handover_email`, `order.delivered_email` — always send regardless of `marketing_opt_out`. This classification is baked into a single `isTransactional(template)` helper so the policy lives in one place.

New column on `customers`:

| column | type | default | purpose |
|---|---|---|---|
| `marketingOptOut` | boolean | false | Suppresses NPS + referral emails only |

UI: a single checkbox on the customer edit form, label "Opt out of optional comms (NPS, referrals). Service emails always send."

## 2. ETA drift threshold — defined against last-communicated ETA

Rule: send an **ETA-changed email** only when the new ETA differs from the **last ETA we communicated to the customer** by more than **7 days** in either direction.

Crucially, the reference point is NOT `orders.estimatedDeliveryDate` as-of-last-edit. Internal ETA edits may happen many times a day as the dealer nudges us. The customer should only hear about it when reality has shifted by a meaningful amount from what they last heard.

Implementation:

- New column `orders.lastCommunicatedEtaDate` (text, nullable, ISO date).
- Populated whenever we *successfully send* a customer email that mentions an ETA — `order.confirmed_email`, `order.eta_changed_email`, `order.ready_for_handover_email`.
- `updateEtaAction` compares `newEta` to `order.lastCommunicatedEtaDate`: if null (never communicated) and we're past `signed`, send. If non-null and `abs(newEta - lastCommunicated) > 7 days`, send. Otherwise: internal-only edit, no email.
- Resending the same ETA is a no-op: the comparison is by date, not by event count.
- Admin can force a send via an "Email customer about this update" checkbox on the logistics edit form, which bypasses the threshold. Audit event captures the force.

The 7-day value lives as a single `ETA_DRIFT_THRESHOLD_DAYS` const in `src/lib/order-delivery.ts` so we can tune it from one place.

## 3. NPS as a separate email, 1–2 days after delivery

**V1 recommendation:** NPS is a **separate email**, scheduled for +2 days after delivery. It is *not* bundled into the `delivered` email.

The `delivered` email is the "welcome to your new van" moment — handover pack link, key contact for questions, what happens next. Asking "rate us 0–10" on day 0 dilutes both messages: customers are driving the van, not reflecting on our service.

Implementation:

- New row in `reminderSchedule` (reuse existing table — same pattern as signing reminders from Phase 4) with `kind = 'nps_day_2'`, scheduled for `deliveredAt + 48h`.
- The existing daily cron at `/api/cron/reminders` sweeps it up; we add an NPS branch alongside the signing-reminder branch.
- The NPS email respects `customers.marketingOptOut`. If opted out, the scheduled row is skipped and stamped with `cancelledAt + payload.reason = 'marketing_opt_out'` so the log is explicit.

If admin wants to retry, there's a "Send feedback request now" button on the order page once delivered.

## 4. Feedback form — minimal shape, one submission per token

Public form at `/feedback/[token]` on the same token pattern as quotes and verify. One record per token.

Fields:

| field | type | required | notes |
|---|---|---|---|
| score | integer 0–10 | yes | Single row of 11 buttons or a segmented slider |
| comment | text ≤ 2000 chars | no | Optional free text |

The token is minted per order at delivery time; one active token per order. Submitting marks it consumed (same pattern as signing tokens). After submission the page shows a thank-you view. Re-hitting the URL after submission shows "already received" — not a form.

No demographic questions, no "would you recommend us" / CSAT add-ons. If we want more later we add structured questions, but v1 is the NPS + one textarea.

New `feedback` table:

| column | type | |
|---|---|---|
| id | text pk | nanoid |
| orderId | text fk → orders | restrict |
| customerId | text fk → customers | restrict |
| score | int 0–10 | |
| category | `promoter` / `passive` / `detractor` | derived on insert from score |
| comment | text nullable | |
| submittedAt | timestamptz | default now |
| tokenId | text fk → feedback_tokens | unique |
| ip / userAgent / geoCity / geoCountry | forensics | same shape as signatures |

And a `feedback_tokens` table mirroring `quote_tokens` — `id / feedbackId (null until consumed) / orderId / token (unique) / expiresAt / consumedAt / createdAt`.

## 5. Low-score handling

Detractor scores (0–6) need visibility even without an automated workflow:

**On insert into `feedback`:**

- If `score <= 6`, create an `activity` row on the customer with `kind = 'task'`, title `Follow up: NPS ${score} from ${ref}`, body = the customer's comment (or "no comment left" if blank), `dueDate = now + 3 business days`. This drops into the existing customer activity timeline and shows in task-like views.
- Write an audit event `feedback.detractor_flagged` with the score + comment preview for the audit trail.

**Dashboard tile:**

- Existing "Attention" area on the admin dashboard (Phase 11 invoice-aging area) gets an adjacent counter: **"Open NPS follow-ups: N"** — count of non-completed detractor activities across all customers. Click-through to a filtered activities view.

**Customer detail page:**

- Feedback panel added below the existing Activities card. Shows the most recent NPS score (colour-pilled: green promoter, grey passive, red detractor), comment if any, and a link to follow up. The pill is visible at the top of the customer record alongside type/status so the admin sees the flag the moment they open the record.

**Order detail page:**

- Feedback card shows score + comment on the specific order once submitted. Same colour treatment.

No automated detractor workflow (escalation emails / manager alerts) in v1 — we want a human to read the comment and decide what to do, not an auto-responder that might make things worse.

## 6. Handover pack — frozen artefact

The handover pack PDF is generated **once**, at the moment admin clicks "Generate handover pack" on a delivered (or ready-for-handover) order. It is stored as a `documents` row with `kind = 'handover_pack'` and the same Vercel-Blob pattern as signed PDFs. SHA-256 recorded.

**The rendered PDF is never rebuilt for access.** When the customer clicks the link in the delivered email, they hit `/api/orders/[id]/handover-pack?t=${token}` which streams from Blob, the same way `/api/orders/[id]/pdf` works for the signed contract. Admin download from the order page uses the same endpoint.

If the underlying order is edited after handover-pack generation (unusual but possible — e.g. VIN correction), the existing pack is NOT regenerated automatically. Admin has to explicitly click "Regenerate handover pack" which replaces the document (new SHA, new Blob path); the old document row is kept with `supersededAt` timestamp + audit event linking old → new, so we can always tell what was actually sent.

**Contents of the pack** (v1):

- Olaris letterhead
- Customer name + company, delivery date, delivery address
- Vehicle block: make/model/derivative, colour/trim, registration, chassis/VIN (from Phase 9 captures)
- Finance summary: type, term, monthly, initial rental (read from `orders.finance`, no live calculations)
- Signed-order reference with link to `/verify/[ref]`
- Key contacts: Alan + (future) other admins
- Footer: FCA disclosure

Deliberately minimal for v1 — the signed contract is still the legal document; this is the operational "drove away with this" summary. No VED breakdown, no part-exchange handover confirmation (separately handled), no insurance placeholder.

New route: `/admin/orders/[id]/handover-pack/pdf-template/page.tsx` — same Puppeteer pattern as the customer-signed and supplier-PO PDFs. HMAC render token, bare layout, scoped CSS reusing `pdf-template.css`.

## 7. Email audit/idempotency metadata

Every lifecycle email write follows **one shared shape** via a new helper `recordEmailSent({ template, orderId, customerId, status, providerMessageId, error })`. The helper inserts into `auditEvents` with `eventType = 'email.sent'` or `'email.failed'` and a consistent payload:

```ts
{
  template: string,           // e.g. 'order.confirmed_email' — matches templates in email-templates.ts
  orderId: string,
  customerId: string,
  to: string,
  subject: string,
  providerMessageId: string | null,  // from Resend response when available
  sentAt: string,             // ISO
  transactional: boolean,     // from isTransactional(template); informs future support / compliance queries
  error: string | null
}
```

Idempotency: before any lifecycle email sends, check for an existing `email.sent` audit row with matching `{ template, orderId }` in the payload. If found, skip and write a no-op `email.suppressed` event with `reason: 'already_sent'`. This prevents duplicates when a transition fires twice (e.g. admin clicks "mark confirmed" while an earlier click is still racing).

**Force-resend semantics.** Admin-triggered "resend" buttons pass `force: true` through `sendLifecycleEmail`, which bypasses the idempotency check. The audit payload must distinguish this from any other bypass — it adds three fields so future reports can cleanly tell an intentional resend apart from anything else:

- `isResend: true` — the email went out while an earlier `email.sent` for this `{template, orderId}` already existed.
- `resendReason: string` — free-text reason captured from the admin UI (e.g. "customer says they didn't receive", "address fixed"). Required when `force: true`; the button's form has a small input.
- `previousSentAt: string` — ISO timestamp of the most recent prior send for this `{template, orderId}`, so the resend row stands on its own without having to re-join the audit log.

First-time sends set `isResend: false` and omit the other two. Automatic (non-force) sends never set `force: true` and never populate these fields. This means "all intentional resends" is a cleanly queryable bucket (`payload.isResend = true`) that never accidentally catches a duplicate-prevention bypass or a retry.

No new `email_log` table — piggy-backing on `auditEvents` means one timeline to query. If in future we need bounce/open tracking we'll add a dedicated table, but everything v1 needs fits in the existing payload shape.

## Wiring — delivery actions trigger customer emails

New file `src/lib/email-customer.ts` with one function per template + the `isTransactional` classifier + the shared `sendLifecycleEmail({ template, order, customer, force })` wrapper.

In `src/app/admin/actions/orders.ts`, the existing transition functions call `sendLifecycleEmail` after their DB writes:

- `markConfirmedAction` → `order.confirmed_email` (always, transactional)
- `updateEtaAction` → `order.eta_changed_email` iff drift vs `lastCommunicatedEtaDate` > 7 days OR `force`; always transactional
- `markReadyForHandoverAction` → `order.ready_for_handover_email` (always, transactional)
- `markDeliveredAction` → `order.delivered_email` (always, transactional) + schedule `nps_day_2` reminder row

If the email fails, the state transition stays committed — email is best-effort. Audit row records the failure; a manual resend button per template is exposed on the order page so admin can retry.

## Files to create

- `src/db/migrations/0007_<generated>.sql`
- `src/lib/email-customer.ts` — `sendLifecycleEmail`, `isTransactional`, `recordEmailSent`, per-template senders
- `src/lib/handover-pack.ts` — `generateHandoverPack(orderId)`, `getHandoverPack(orderId)`
- `src/lib/pdf/render-handover-pack.ts` — Puppeteer helper mirroring `render.ts`
- `src/app/admin/orders/[id]/handover-pack/pdf-template/page.tsx` + `layout.tsx`
- `src/app/api/orders/[id]/handover-pack/route.ts` — auth'd streaming download
- `src/app/admin/orders/[id]/HandoverPackCard.tsx` — generate / regenerate / download
- `src/app/admin/orders/[id]/FeedbackCard.tsx` — shows feedback on the order detail
- `src/app/admin/actions/feedback.ts` — `generateFeedbackTokenAction`, `recordFeedbackSubmission`
- `src/app/feedback/layout.tsx` + `src/app/feedback/[token]/page.tsx` — public form
- `src/app/feedback/[token]/submit/route.ts` — POST handler for the form
- Email templates in `src/lib/email-templates.ts`: `orderConfirmedEmail`, `orderEtaChangedEmail`, `orderReadyForHandoverEmail`, `orderDeliveredEmail`, `npsRequestEmail`

## Files to modify

- `src/db/schema.ts` — `customers.marketingOptOut`, `orders.lastCommunicatedEtaDate`, `feedback` + `feedback_tokens` tables, `reminderSchedule.kind` wording, `documents.kind` add `'handover_pack'`, audit events
- `src/lib/order-delivery.ts` — `ETA_DRIFT_THRESHOLD_DAYS`, ETA-drift comparator
- `src/app/admin/actions/orders.ts` — each transition calls `sendLifecycleEmail`; ETA edit computes drift
- `src/app/admin/CustomerForm.tsx` — marketing opt-out checkbox
- `src/app/admin/customers/[id]/page.tsx` — NPS pill + feedback panel
- `src/app/admin/orders/[id]/page.tsx` — mount `HandoverPackCard` + `FeedbackCard`
- `src/app/admin/orders/[id]/DeliveryCard.tsx` — "Email customer about this update" checkbox on ETA edit
- `src/app/admin/page.tsx` — detractor follow-ups tile
- `src/app/api/cron/reminders/route.ts` — extend to handle `nps_day_2`
- `src/app/admin/components.tsx` — `NpsScorePill`, audit labels for new events

## Acceptance checks

- [ ] Marking an order confirmed sends `order.confirmed_email`; re-marking (via override) doesn't duplicate-send (audit + idempotency check)
- [ ] ETA edit within 7 days of last-communicated value does NOT send email; audit row records the silent edit
- [ ] ETA edit more than 7 days from last-communicated value DOES send; `lastCommunicatedEtaDate` updates on success
- [ ] Admin force-resend via checkbox bypasses threshold, audit reflects `force: true`
- [ ] Marking delivered schedules `nps_day_2` reminder; cron sends it 2 days later, respects `marketingOptOut`
- [ ] Feedback form at `/feedback/[token]` accepts 0–10 + optional comment; submitting a second time shows "already received"
- [ ] Score ≤ 6 auto-creates a customer task + `feedback.detractor_flagged` audit event
- [ ] Handover pack generation creates a `documents` row with sha256; downloading streams from Blob (not re-rendered); regenerate supersedes prior
- [ ] Customer page shows NPS pill + feedback panel; dashboard detractor-follow-up tile counts correctly
- [ ] Email audit rows include template, orderId, customerId, providerMessageId (when Resend provides), transactional flag
- [ ] Marketing opt-out suppresses NPS + (future) referral emails but NOT confirmed/ETA/ready/delivered
- [ ] Typecheck + build clean; migration applied local + Neon; committed + pushed

## Rollout order

1. Schema + migration 0007 (opt-out, lastCommunicatedEta, feedback tables, handover doc kind, audit events)
2. Email-customer service + `isTransactional` + `recordEmailSent` + the four lifecycle templates
3. Hook into Phase 9 transitions in `actions/orders.ts`; ETA drift comparator
4. Handover pack: template, render helper, generate/get service, download route, card + button
5. NPS: reminder-schedule kind, cron branch, NPS email template, feedback tokens + public page + submit
6. Detractor flagging on insert; customer page + dashboard tile
7. Customer form marketing opt-out checkbox
8. Typecheck → build → commit → push

Biggest risk: the Puppeteer pipeline is a known heavy path on Vercel; adding a third PDF template doesn't add new infrastructure, but handover-pack generation is a user-triggered action during the delivery moment, so surface it with a "generating…" state in the UI.
