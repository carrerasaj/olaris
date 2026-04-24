# Olaris — Growth Roadmap (SEO × Conversion merged)

**Companion to:** `.claude/Olaris Audit Tasks.md` (SEO brief) and `.claude/Olaris Conversion Addendum.md` (conversion brief).
**Prepared:** 24 Apr 2026
**Owner:** Alan + Claude Code
**Revision cadence:** after each tier closes, before the next starts.

This file is the canonical sequencing of work across both briefs. The original briefs stay authoritative for scope and acceptance criteria per task. This file only controls *order* and *dependencies* — including the cross-brief interdependencies neither source file captures on its own.

---

## How to use this file

- Tasks are grouped into **Foundation → Tier 1 → Tier 2 → Tier 3 → Tier 4 → Deferred**.
- Do not start a tier before the previous tier's **foundation-critical** tasks are merged. Within a tier, parallelism is allowed.
- Each task ID here cross-references the source brief (e.g. `T1-01 ↔ S1-03`). Open the source brief for scope, prompt, and acceptance criteria; tick the checkbox **here** when the work ships.
- When a task ships, update this file in the same commit.

Baseline metrics targets live in `.claude/Olaris Audit Tasks.md` §1 and `.claude/Olaris Conversion Addendum.md` Sprint D. Don't duplicate them here.

---

## Done

- [x] **T2-01 ↔ S1-01** · Meta + H1 rewrites on the four highest-impression pages — *shipped 24 Apr 2026, commit `seo-s1-01-meta-rewrites`*

---

## Foundation (everything else compounds on these)

Ship these first. Each unblocks multiple downstream tasks. Do not parallelise Tier 1 until F-01 and F-03 are live.

### [ ] F-01 · GA4 + conversion events

- Source: `.claude/Olaris Audit Tasks.md` S1-05
- Why first: every capture / tool / CTA task downstream needs `lead_captured`, `tool_calculation_completed`, `demo_requested`, `cta_click` to measure impact. Ship without events and we're flying blind.
- Unblocks: T1-01, T1-02, T1-04, T4-10, D-02, D-03
- Files: `src/lib/analytics.ts` (create if missing); hook into App Router via client component; `README-analytics.md` at repo root documenting events + manual GA4 admin steps.

### [ ] F-02 · Ahrefs technical cleanup (15 issues)

- Source: `.claude/Olaris Audit Tasks.md` S1-02
- Why early: several other tasks touch JSON-LD, sitemap, redirects. Cleaning first means new work doesn't layer onto a broken baseline. Also unblocks SEO authority before content tasks land.
- Unblocks: T3-01 (pillar schema), T3-04 (platform rebuild), T4-06 (new service page)
- Known: `/platform` has **two** `SoftwareApplication` JSON-LD blocks (one in `layout.tsx`, one in `page.tsx`) — fold into this task.

### [ ] F-03 · Email infra + lead-storage primitive

- Source: derived from `Olaris Audit Tasks.md` S1-03 + `Olaris Conversion Addendum.md` A-06
- Why: every capture surface needs a `leads` row, a gated-download flow, and an `enqueueDrip(sequence, leadId)` helper. Without this, A-01, A-03, A-06, B-01 each reinvent storage.
- Scope:
  - `leads` table in `src/db/schema.ts` (email, company?, source, payload jsonb, created_at, marketing_opt_out, double_opt_in_at nullable)
  - `sendGatedResource(leadId, assetId)` — email the PDF/Word/xlsx, record delivery
  - `enqueueDrip(leadId, sequenceId)` — uses existing `reminderSchedule`-style pattern, one cron sweep triggers next step
  - One sequence registry file `src/lib/drip-sequences.ts` so A-06 et al. can declare sequences declaratively
- Unblocks: T1-01, T1-02, T1-03, T2-04, T4-02, C-05

---

## Tier 1 — convert the traffic we already have (week 1–4)

The `/tools/excess-mileage-calculator` page is the #1 traffic leak (313 imp @ pos 4.27, 0 clicks in the last 28 days). Stack conversion surfaces on it first. **Ship sequentially on this page** — do not launch multiple capture surfaces simultaneously per addendum §282 ("they'll fight each other and degrade UX").

### [ ] T1-01 ↔ S1-03 · Post-result PDF report + email capture on `/tools/excess-mileage-calculator`

- Depends on: F-01, F-03
- Scope: below the result card, post-calculation, email-only capture → PDF with BCH comparison + Orbis narrative → CTA to book
- Key plumbing: `src/data/bch-benchmarks.ts` stub table (Alan populates with real figures later), PDF via `@react-pdf/renderer`, drip enrolment call

### [ ] T1-02 ↔ A-01 · Exit-intent modal on `/tools/*`

- Depends on: F-01, F-03
- Scope: one modal, mouse-leave (desktop) or back-button (mobile), only after calc completed, once per session
- Measure first: wait 2 weeks after T1-01 ships before adding this — they're on the same page

### [ ] T1-03 ↔ A-06 · 7-email drip (21 days) for captured calculator leads

- Depends on: F-03, at least one of T1-01/T1-02
- Scope: 7-step sequence per addendum table; pause on any reply; GA4 event per step

### [ ] T1-04 ↔ A-04 · Cal.com embed on `/platform`, `/leasing/*`, post-calculator success

- Depends on: F-01
- Scope: replace static "Contact Us" on high-intent pages with a calendar embed; keep the existing `/contact` form for info-seekers until T4-01

### [ ] T1-05 ↔ C-06 · Thank-you pages that do work

- Depends on: T1-01 (for calculator thanks) and T1-04 (for call-booked thanks)
- Scope: dedicated `/thanks/[source]` routes with what-happens-next + next-step CTA + shareable UTM link. Replace every generic "thanks" redirect.

---

## Tier 2 — authority + middle-funnel (week 3–7, parallel with Tier 1 after T1-01)

### [ ] T2-01 ↔ S1-01 · Meta rewrites *(done — see "Done" section above)*

### [ ] T2-02 ↔ S1-04 · Internal linking audit

- Why early: surfaces the 9 existing blog posts' linking gaps before we add more posts in Tier 3
- Includes: `<RelatedPosts cluster="..." />` component + `src/content/blog/clusters.ts` manifest stub

### [ ] T2-03 ↔ B-04 · Alan as face of the brand

- Why: E-E-A-T signal for SEO *and* trust signal for conversion — the rare task that moves both axes
- Scope: `/about` rebuild, blog post author bylines with photo/bio, optional 90-second founder video on homepage
- Asset dependency: Alan provides headshot + bio copy + optional video (unpolished > polished here)

### [ ] T2-04 ↔ A-03 · Inline lead magnets — start with Grey Fleet Policy Template

- Depends on: F-03
- Scope: single reusable `<LeadMagnetBlock assetId="..." />` component. Ship **one** asset first (Grey Fleet Policy Template) because it pairs with T3-01 pillar. Remaining 5 assets from the addendum table land as-needed in their cluster's tier.

### [ ] T2-05 ↔ A-05 · Newsletter reframe

- Scope: reposition footer CTA as "The Fleet Intelligence Brief" with value prop + recent-issue preview + social proof. Replace existing generic signup.
- ESP dependency: check what's currently wired (MailerLite / Mailchimp / Resend broadcast); match.

### [ ] T2-06 ↔ C-04 · Social proof on every form

- Depends on: T1-01 has been live long enough for real counters (~2 weeks)
- Scope: recent-activity widget above every form — newsletter count, quotes-this-week, "Alan personally replies within 4 business hours"

---

## Tier 3 — pillar + cluster content (week 5–9)

Content-heavy tier. Alan writes long-form copy; Claude Code handles scaffolding, schema, and component integration.

### [ ] T3-01 ↔ S2-01 · `/grey-fleet` pillar page

- Depends on: T2-02 (internal linking infra), T2-04 (lead magnet component so section 7's gated download works)
- Scope: 2,500–3,500 words, sticky ToC, `Article` + `FAQPage` + `HowTo` schema, lead-magnet block

### [ ] T3-02 ↔ S2-02 · Four grey-fleet supporting posts

- Depends on: T3-01 (so internal links resolve)
- Scope: scaffold four MDX posts with H1/H2 structure + `<RelatedPosts cluster="grey-fleet" />` + required internal links; Alan writes body

### [ ] T3-03 ↔ B-03 · Three case studies with real numbers

- Unblock async: chase client permissions in parallel with Tier 1/2 work
- Scope: `/case-studies` route, Situation/Intervention/Outcome/Quote pattern, 3 stories
- Dependency: customer sign-off — start outreach early

### [ ] T3-04 ↔ S2-03 · Rebuild `/platform` as Orbis Platform page

- Note: T2-01 already updated title/description/H1. This task is the full page rebuild (capability blocks, screenshots, integrations strip, FAQ).
- Depends on: F-02 (JSON-LD dedup), ideally T3-03 (case study block can link to real stories)

### [ ] T3-05 ↔ A-02 · Sticky bottom bar on blog posts

- Depends on: T2-04 (magnet infra) and T3-01 (grey-fleet pillar so cluster-specific copy resolves)
- Scope: persistent thin bar, dismissible, cluster-aware copy

---

## Tier 4 — systems + iteration (week 7+)

### [ ] T4-01 ↔ C-01 · Three-column `/contact` redesign

- Separates "ready to talk" / "get a quote" / "ask a question" so the ready-to-talk user doesn't wade through qualification
- Depends on: T1-04 (calendar embed is the "ready to talk" column)

### [ ] T4-02 ↔ B-01 · Fleet Cost Scorecard (interactive)

- New tool at `/tools/fleet-cost-scorecard`, 8 questions → score → email-gated PDF
- Depends on: F-03. Standalone otherwise — highest-leverage new-tool build in the backlog.

### [ ] T4-03 ↔ C-03 · Pricing transparency

- Start with a `/leasing/how-we-price` page (minimum viable). Add vehicle-of-the-month rotating card later.

### [ ] T4-04 ↔ B-02 · Live testimonials / logo strip

- Client-permission dependent. Placeholders accepted for phase 1.

### [ ] T4-05 ↔ B-05 · Live-chat / async message widget

- Gate to high-intent pages only. **Only ship when sales capacity can handle the inbound.** Nothing kills conversion like an unanswered question.

### [ ] T4-06 ↔ S3-01 · `/services/fleet-audit` lead-gen page

- Claims "fleet audit" query (106 imp @ pos 77)
- Depends on: F-02 (new route wants clean JSON-LD)

### [ ] T4-07 ↔ S3-02 · Company car tax cluster

- Rebuild calculator with 2026/27 tabs + presets, plus 3 supporting posts
- Depends on: T2-01's meta rewrite already repositioned the page for the cluster; this is the actual build
- Note: current description (narrow 2026/27 framing) will undersell the tool's 2025–2030 range. Revisit after this ships.

### [ ] T4-08 ↔ S2-04 · Expand `/blog/what-is-grey-fleet`

- Trivial once T3-01 exists; mostly a pillar-link + ToC + length expansion job

### [ ] T4-09 ↔ S2-05 · Mobile nav surfaces `/tools`

- Small, isolated. Can jump ahead if mobile conversion data from F-01 says it's urgent.

### [ ] T4-10 ↔ D-01 · Funnel dashboard

- Only after events have been firing 2–3 weeks post-F-01
- Sheet or Metabase view with the 6 funnel stages from addendum table

---

## Deferred / async / manual

Tasks that belong on the radar but don't fit the tier cadence. Most are waiting on a non-code input.

- **S3-03 · Backlink outreach list** — manual work for Alan; Claude drafts the CSV template when asked
- **S3-04 · Monthly audit script** — builds after first month of post-launch data (week 10+)
- **S3-05 · LinkedIn carousels** — after T3-01 exists
- **B-06 · Interactive platform demo** — paid tool evaluation needed (Storylane / Arcade / Navattic); revisit after T3-04
- **C-02 · Smart form progressive profiling** — cookie infra + lead-merge logic; revisit after T1-03 has a few hundred leads
- **C-05 · Nurture existing contacts** — Alan exports contact list; one-shot Loom-video re-engagement
- **D-02 · A/B testing the top 3 CTAs** — addendum notes day 60+ minimum; needs traffic to justify
- **D-03 · Session replay on `/tools/*`** — adds privacy policy changes; evaluate after F-01 data
- **D-04 · Quarterly voice-of-customer interviews** — Alan books the calls; recurring task, not a ticket

---

## Cross-cutting rules

- **One capture surface at a time per page.** Per addendum §282 — exit-intent + inline magnet + sticky bar fighting on the same page degrades UX. Ship one, measure two weeks, ship the next.
- **Don't launch without events.** Every capture surface ships with its GA4 event wired, or it doesn't ship.
- **Cluster-first content.** Per SEO brief "what NOT to do": no orphan blog posts. Every new post ships with its internal-link plan.
- **Phase 12 is frozen pending smoke tests.** The customer-comms work is committed but unverified in prod. Do not start any task that touches `src/app/admin/` or the email/audit layer until Phase 12 is signed off.

---

## Change log

- **24 Apr 2026** — Initial merge of SEO + Conversion briefs into a single tiered plan. T2-01 marked done (S1-01 meta rewrites shipped).
