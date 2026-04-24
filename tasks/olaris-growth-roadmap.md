# Olaris — Growth Roadmap (SEO × Conversion × Content merged)

**Companion to:** `.claude/Olaris Audit Tasks.md` (SEO brief), `.claude/Olaris Conversion Addendum.md` (conversion brief), `.claude/Olaris Content Addendum.md` (content brief).
**Prepared:** 24 Apr 2026 · **Content addendum merged:** 24 Apr 2026
**Owner:** Alan + Claude Code
**Revision cadence:** after each tier closes, before the next starts.

This file is the canonical sequencing of work across all three briefs. The original briefs stay authoritative for scope and acceptance criteria per task. This file only controls *order* and *dependencies* — including the cross-brief interdependencies none of the source files captures on its own.

**Task ID prefixes:**

- `F-*` Foundation
- `T1..T4-*` Tier 1–4 delivery
- `VC-*` Visual credibility (Content Addendum sprint E)
- `CT-*` Content tools (Content Addendum sprint F — renamed from F-* to avoid collision with Foundation)
- `CF-*` Content formats (Content Addendum sprint G)
- `CO-*` Content ops (Content Addendum sprint H)

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
- [x] **F-01** · GA4 + conversion events (typed wrapper, EventMap, calculators + contact form + primary CTAs instrumented, README-analytics.md with admin steps) — *shipped 24 Apr 2026, commit `growth-F-01-ga4-events`*
- [x] **F-02** · Ahrefs technical cleanup (sitemap gaps fixed, /platform JSON-LD duplicate removed, external links verified, thin-linking deferred to T2-02) — *shipped 24 Apr 2026, commit `growth-F-02-ahrefs-technical-cleanup`*
- [x] **T2-02** · Internal linking audit (cluster manifest + `<RelatedPostsBlock>` component, 2 missing BCH/platform links added in blog bodies, thin-linking re-audit showed F-02's tsx-only grep over-reported — markdown link count is healthy everywhere) — *shipped 24 Apr 2026, commit TBD*

---

## Foundation (everything else compounds on these)

Ship these first. Each unblocks multiple downstream tasks. Do not parallelise Tier 1 until F-01 and F-03 are live.

### [x] F-01 · GA4 + conversion events — *done*

See Done section above.

### [x] F-02 · Ahrefs technical cleanup — *done*

See Done section above.

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

### [x] T2-01 ↔ S1-01 · Meta rewrites — *done (see "Done" section)*

### [x] T2-02 ↔ S1-04 · Internal linking audit — *done*

See Done section above.

### [ ] T2-03 ↔ B-04 + VC-02 · Alan as face of the brand (includes founder video)

- Why: E-E-A-T signal for SEO *and* trust signal for conversion — the rare task that moves both axes. Content addendum elevates the founder video to its own priority (VC-02, #1 of their top-5). Folded in here so `/about` rebuild + author bylines + video ship as a single trust-layer.
- Scope: `/about` rebuild, blog post author bylines with photo/bio, 60-second founder video on homepage (VC-02 spec: iPhone, no polish, Alan-to-camera with 3 × 8s Orbis screen cuts, ending with book-a-call CTA).
- Asset dependency: Alan provides headshot + bio copy + video recording (unpolished > polished here). Video requires VC-01 screenshots/mockups to exist for the screen-cut inserts.

### [ ] VC-01 ↔ Content E-01 · Eight Orbis product screenshots (1600×1000)

- Why early: content addendum's diagnosis names this as the single highest-ROI content fix — "/platform is the worst-performing conversion page *because* there's nothing to see". Unblocks T3-04 (platform rebuild) and T2-03 (founder video screen cuts).
- Scope: 8 annotated screenshots per content addendum table — fleet dashboard, single-vehicle detail, driver scorecard, DVLA panel, cost-per-mile view, EV charging reconciliation, excess mileage forecast, carbon/scope report.
- Where real product isn't shipped: high-fidelity Figma mockups, labelled *"Preview · shipping Q3 2026"*.
- Asset dependency: Alan (or Orbis team) produces the images. Claude Code handles the annotation component + placement once assets exist.

### [ ] VC-04 ↔ Content E-04 · One visual mid-article per existing blog post

- Why: cluster-wide skim-scan fix. Every existing post that currently ends in a text CTA gets one visual insertion.
- Scope: chart/table/diagram per content addendum matrix (grey-fleet → cost-per-mile chart, BIK → rates table, mileage → contract-vs-actual visual, fleet-intelligence → simplified dashboard).
- Tactical: build as reusable React components so T3-02 supporting posts + T4-08 expansion inherit them.
- Depends on: CO-05 visual asset system (if we ship it first) — otherwise build components ad-hoc and generalise later.

### [ ] T2-04 ↔ A-03 · Inline lead magnets — start with Grey Fleet Policy Template

- Depends on: F-03
- Scope: single reusable `<LeadMagnetBlock assetId="..." />` component. Ship **one** asset first (Grey Fleet Policy Template) because it pairs with T3-01 pillar. Remaining 5 assets from the addendum table land as-needed in their cluster's tier.

### [ ] T2-05 ↔ A-05 · Newsletter reframe

- Scope: reposition footer CTA as "The Fleet Intelligence Brief" with value prop + recent-issue preview + social proof. Replace existing generic signup.
- ESP dependency: check what's currently wired (MailerLite / Mailchimp / Resend broadcast); match.

### [ ] T2-06 ↔ C-04 · Social proof on every form

- Depends on: T1-01 has been live long enough for real counters (~2 weeks)
- Scope: recent-activity widget above every form — newsletter count, quotes-this-week, "Alan personally replies within 4 business hours"

### [ ] CO-04 ↔ Content H-04 · Style + voice guide

- Why now: small one-pager that every Tier 3 content task wants to follow. Ship before long-form pillar writing starts.
- Scope: `docs/style-guide.md` — tone (direct, first-hand, no consulting-speak), reading level (Y9), length rules (≥1,200 words or don't publish), required per-post elements (ToC, 1 visual, 2 internal links, related-reading block, schema, CTA), author byline pattern. One page. Pin in repo for Alan + contractors + Claude Code.

---

## Tier 3 — pillar + cluster content (week 5–9)

Content-heavy tier. Alan writes long-form copy; Claude Code handles scaffolding, schema, and component integration.

### [ ] T3-01 ↔ S2-01 · `/grey-fleet` pillar page

- Depends on: T2-02 (internal linking infra), T2-04 (lead magnet component so section 7's gated download works)
- Scope: 2,500–3,500 words, sticky ToC, `Article` + `FAQPage` + `HowTo` schema, lead-magnet block

### [ ] T3-02 ↔ S2-02 · Four grey-fleet supporting posts

- Depends on: T3-01 (so internal links resolve)
- Scope: scaffold four MDX posts with H1/H2 structure + `<RelatedPosts cluster="grey-fleet" />` + required internal links; Alan writes body

### [ ] CT-03 ↔ Content F-03 · Grey Fleet Risk Calculator

- Why here: content addendum names this as priority #4 of top-5 — *"pairs perfectly with the /grey-fleet pillar and the Policy Template lead magnet"*. Traffic pool overlap means pillar + tool + magnet reinforce each other.
- Depends on: T3-01 (pillar), T2-04 (policy template magnet), F-03 (lead capture infra)
- Scope: new tool at `/tools/grey-fleet-risk-calculator`. Inputs: grey fleet driver count, miles/year per driver, company size. Outputs: estimated annual legal liability exposure + insurance premium differential + suggested conversion plan. Email-gated detailed PDF on completion.
- Targets: "grey fleet" cluster (18 tracked queries, 220+ imp).
- Wire `tool_calculation_completed` with `tool: 'grey-fleet-risk'` — requires adding that enum value to `EventMap` in `src/lib/analytics.ts`.

### [ ] T3-03 ↔ B-03 + CF-06 · Three case studies (written + video versions)

- Unblock async: chase client permissions in parallel with Tier 1/2 work. Ask for logo rights (T4-04/VC-05) in the same outreach.
- Scope: `/case-studies` route, Situation/Intervention/Outcome/Quote pattern, 3 stories written. For each client who agrees, record a 2-minute on-camera testimonial (CF-06 from content addendum). Even 1 of 3 video testimonials is worth 100× a written quote — aim for at least one.
- Dependency: customer sign-off — start outreach early. Video versions are stretch scope; written case studies are required.

### [ ] T3-04 ↔ S2-03 · Rebuild `/platform` as Orbis Platform page

- Note: T2-01 already updated title/description/H1. This task is the full page rebuild (capability blocks, screenshots, integrations strip, FAQ).
- Depends on: F-02 (JSON-LD dedup), **VC-01 screenshots** (the capability blocks are placeholders without them — content addendum's diagnosis names this page's missing visuals as the single worst-performing conversion surface), ideally T3-03 (case study block can link to real stories)

### [ ] T3-05 ↔ A-02 · Sticky bottom bar on blog posts

- Depends on: T2-04 (magnet infra) and T3-01 (grey-fleet pillar so cluster-specific copy resolves)
- Scope: persistent thin bar, dismissible, cluster-aware copy

---

## Tier 4 — systems + iteration (week 7+)

### [ ] T4-01 ↔ C-01 · Three-column `/contact` redesign

- Separates "ready to talk" / "get a quote" / "ask a question" so the ready-to-talk user doesn't wade through qualification
- Depends on: T1-04 (calendar embed is the "ready to talk" column)

### [ ] T4-02 ↔ B-01 + CT-01 · Fleet Cost Scorecard (interactive) — *promotion candidate*

- New tool at `/tools/fleet-cost-scorecard`, 8 questions → score → email-gated PDF
- Depends on: F-03. Standalone otherwise — highest-leverage new-tool build in the backlog.
- **Promotion note:** content addendum lists this as priority #3 of top-5 for the quarter. If Tier 3 content ships faster than expected, consider pulling T4-02 up to Tier 3 adjacent to T3-01 (the grey-fleet pillar traffic overlaps with "how to audit my fleet" scorecard target queries).

### [ ] T4-03 ↔ C-03 · Pricing transparency

- Start with a `/leasing/how-we-price` page (minimum viable). Add vehicle-of-the-month rotating card later.

### [ ] T4-04 ↔ B-02 + VC-05 · Live testimonials / logo strip

- Client-permission dependent. Placeholders accepted for phase 1.
- Kick off client permissions ASAP (content addendum VC-05: contact 5 existing clients this week, ask to use logo or anonymised descriptor). Component supports real logos and anonymised cards interchangeably.
- Pairs with T3-03 case study outreach — bundle the ask.

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

### [ ] CT-02 ↔ Content F-02 · BCH vs PCH vs Sal-Sac comparison tool

- New tool. Input: fleet size, driver profile, annual mileage, appetite for admin. Output: ranked recommendation per option with monthly cost range + next-step CTA.
- Targets: the entire leasing cluster — "business contract hire", "salary sacrifice", "personal contract hire" — queries we don't rank on today.
- Depends on: F-03, `src/data/bch-benchmarks.ts` (Alan populates with real numbers; stub OK initially).

### [ ] CT-04 ↔ Content F-04 · Fleet Carbon Calculator

- Input: fleet composition (ICE/hybrid/EV counts + avg mileage). Output: tonnes CO₂e/year + scope 1/2/3 breakdown + "what EV swap would save" slider.
- Targets: ESG / sustainability audience — "fleet carbon footprint", "scope 123 fleet".
- Depends on: F-03.

### [ ] CT-05 ↔ Content F-05 · Vehicle TCO comparator

- Pick 2 vehicles from a dropdown of 50 popular models → side-by-side 4-year TCO (lease, fuel/energy, tax, insurance, excess mileage likelihood, residual).
- Highest-shareability tool of the set — fleet managers send TCO comparisons to their FD. Build a share URL that encodes the comparison.
- Depends on: F-03, vehicle data file.

### [ ] CT-06 ↔ Content F-06 · Driver Licence Check Simulator

- 30-second lightweight interactive: "Enter DOB + licence details — we'll show what DVLA compliance actually checks." No real API call, educational + lead capture at the end.
- Pairs with `/features/driver-behaviour`.
- Depends on: F-03.

### [ ] CT-07 ↔ Content F-07 · EV Transition Planner v2

- Upgrade `/tools/ev-transition-planner` (currently content-only, 40 imp @ pos 40). Inputs: current fleet → phased 3-year transition plan, depot + charging modelling, BIK/VAT savings projection, PDF roadmap output.
- Not new — 10× what's there.
- Depends on: F-03. When this ships, `tool: 'ev-transition'` event starts firing (currently inert — `EventMap` already includes it).

### [ ] CT-08 ↔ Content F-08 · Fleet Compliance Quick-Check v2

- Upgrade `/tools/fleet-compliance-checker` (113 imp @ pos 76). Enter fleet size → 10-item checklist with green/amber/red + timeline implications.
- Currently already fires `tool_calculation_completed` — this is a scope expansion, not a rebuild.

### [ ] CF-02 ↔ Content G-02 · LinkedIn carousel series (3/week)

- Existing `S3-05` was a one-off. Content addendum expands to a structured cadence: Mon educational / Wed contrarian take / Fri tool spotlight or case study.
- Scope: document the cadence + a template carousel structure in `marketing/linkedin/`. Alan drafts copy; Claude Code handles carousel markdown templates. First three carousels ship from the `/grey-fleet` pillar (T3-01) once it exists.

### [ ] CF-04 ↔ Content G-04 · Interactive comparison pages

- Hybrid between a long-form post and a tool: long, data-dense, embeddable charts. Candidates: BCH vs Sal-Sac vs Personal Lease, UK company car tax 2026/27, fleet electrification readiness.
- Value: these earn backlinks because they become the canonical reference. Pairs with CT-02 (BCH vs Sal-Sac tool) — the page embeds the tool.
- Depends on: CT-02 (for the BCH page), general data work.

### [ ] CO-02 ↔ Content H-02 · Repurposing pipeline (documented)

- Document the 1-pillar → 4-posts → 1-asset → 1-video → 3-carousels → 1-webinar fan-out in `docs/content-repurposing.md`. Makes every new pillar produce 10 pieces of content rather than 1.
- Not a code task — process doc + a checklist template. Enforces CO-01 editorial calendar discipline.

---

## Deferred / async / manual

Tasks that belong on the radar but don't fit the tier cadence. Most are waiting on a non-code input.

**SEO / Conversion briefs:**

- **S3-03 · Backlink outreach list** — manual work for Alan; Claude drafts the CSV template when asked
- **S3-04 · Monthly audit script** — builds after first month of post-launch data (week 10+)
- **S3-05 · LinkedIn (one-off)** — superseded by CF-02 in Tier 4 (structured cadence); retain ID for cross-reference only.
- **B-06 ↔ VC-03 · Interactive platform demo (Storylane/Arcade/Navattic)** — paid tool evaluation needed; revisit after T3-04. Content addendum (E-03) offers a cheaper fallback: a 90-second narrated screen recording, embedded on `/platform` + homepage + BCH pages. Ship the recording first; the interactive version is a Tier 4+ upgrade.
- **C-02 · Smart form progressive profiling** — cookie infra + lead-merge logic; revisit after T1-03 has a few hundred leads
- **C-05 · Nurture existing contacts** — Alan exports contact list; one-shot Loom-video re-engagement
- **D-02 · A/B testing the top 3 CTAs** — addendum notes day 60+ minimum; needs traffic to justify
- **D-03 · Session replay on `/tools/*`** — adds privacy policy changes; evaluate after F-01 data
- **D-04 · Quarterly voice-of-customer interviews** — Alan books the calls; recurring task, not a ticket

**Content addendum:**

- **CF-01 ↔ Content G-01 · YouTube channel "The Fleet Fix"** — biweekly 3–5 min videos. High potential, high discipline requirement. Revisit when T2-03 founder video has shipped + been watched — confidence signal that the video format works.
- **CF-03 ↔ Content G-03 · Monthly webinar + on-demand library** — 45-min live, Alan + guest, replay gated behind email. Content addendum's priority #5 of top-5. Force-multiplies into 1 recording + 4 clips + 1 blog post + 1 LinkedIn carousel. Needs Alan's calendar commitment — deferred until Tier 3 pillar shipped and we know what's working.
- **CF-05 ↔ Content G-05 · Email course "7-day fleet cost teardown"** — opt-in via homepage banner, 7 daily emails. Depends on F-03 drip infra being battle-tested via T1-03 first.
- **CF-07 ↔ Content G-07 · Quarterly industry report "State of UK Fleet"** — 20-page PDF, original data. 3–5 days once per quarter. Defer until there's client base / list size to justify the survey.
- **CO-01 ↔ Content H-01 · Editorial calendar driven by GSC data** — monthly process, not a one-off ticket. Start after first full month of GA4 + GSC data post-F-01 / F-02.
- **CO-03 ↔ Content H-03 · Content audit of existing 15+ blog posts** — keep/merge/delete triage with 301s. Depends on F-02 (redirect infrastructure). Revisit after F-02 ships.
- **CO-05 ↔ Content H-05 · Visual asset system** — three recurring visual formats as Figma + React components (Fleet Snapshot / Before-After / Timeline strip). Build ad-hoc in VC-04 first, generalise once we see which formats recur.

---

## Next 5 to ship (rolling — update as tasks close)

Alan paused the video-dependent branch (VC-02 + T2-03 finish) until recording can happen, so the working plan is "ship everything that doesn't need Alan's camera time." Order:

1. **CO-04 · Style + voice guide** — one-pager, ~30 min. Pins tone + required elements for all downstream content work. Cheap.
2. **F-03 · Email infra + lead-storage primitive** — pure backend. Unblocks entire Tier 1 + every new CT-* tool.
3. **T2-03 (partial) · /about + author bylines + `<FounderVideoSlot />` stub** — build the scaffolding now with a headshot + bio copy from Alan. Video slot stays stubbed until VC-02 recording happens; drops in without a second PR.
4. **VC-01 · Orbis screenshots (component scaffolding + placement pattern)** — Claude Code builds the annotation component + `/platform` placement slots against placeholder images; real images slot in when Alan/Orbis ship them. Unblocks T3-04 platform rebuild pre-emptively.
5. *(T2-02 Internal linking audit — shipped 24 Apr 2026)*

Deferred until Alan is ready to record:

- **VC-02** · Founder video recording (paused pending Alan's time)
- **T2-03 finish** · completes when VC-02 lands
- **T4-04/VC-05** · client logo outreach (Alan-initiated)
- **T3-03** · case study outreach (Alan-initiated)

Why this order:

- Tier 1 capture surfaces (T1-01 through T1-05) need F-03. Getting F-03 done first means Tier 1 unblocks *and* CT-* tools in Tier 3/4 have lead storage already wired.
- T2-02 is cheap, high-value, and surfaces the cluster manifest T3-01/02 pillar work depends on — doing it before any long-form content means no orphan posts land.
- Stubbing T2-03 now with assets Alan can send async (headshot, 300-word bio) means when VC-02 video lands, it's a single small drop-in commit, not a page rebuild.

## Cross-cutting rules

- **One capture surface at a time per page.** Per conversion addendum §282 — exit-intent + inline magnet + sticky bar fighting on the same page degrades UX. Ship one, measure two weeks, ship the next.
- **Don't launch without events.** Every capture surface ships with its GA4 event wired, or it doesn't ship. Every new tool adds its enum value to `EventMap` in `src/lib/analytics.ts`.
- **Cluster-first content.** Per SEO brief "what NOT to do": no orphan blog posts. Every new post ships with its internal-link plan.
- **Proof media before polish.** Per content addendum: iPhone + natural light + Alan talking straight beats slick AI avatar + polished script. Don't ship anything that looks AI-generated.
- **Don't build 5 tools before any convert.** Per content addendum caveats: ship one tool (T1-01 calc capture, then CT-01 scorecard), measure 3 weeks, then the next. One great tool beats 5 forgotten ones.
- **Phase 12 is frozen pending smoke tests.** The customer-comms work is committed but unverified in prod. Do not start any task that touches `src/app/admin/` or the email/audit layer until Phase 12 is signed off.

---

## Change log

- **24 Apr 2026** — Initial merge of SEO + Conversion briefs into a single tiered plan. T2-01 marked done (S1-01 meta rewrites shipped).
- **24 Apr 2026** — T2-02 shipped (internal linking audit). Built `<RelatedPostsBlock>` + `src/content/blog/clusters.ts` manifest covering all 16 posts across 7 clusters; migrated the hardcoded per-post map from the blog slug page. Added BCH links in grey-fleet + lease-company-mileage posts, company-car-tax link from `/leasing/salary-sacrifice`, and ev-transition feature link from the planner tool. F-02's "thin linking" flag was partly over-reported — the agent only grepped .tsx, missing markdown link density; re-audit shows only `/tools/company-car-tax-calculator` was genuinely thin (1 inbound).
- **24 Apr 2026** — F-02 shipped (Ahrefs technical cleanup). Discovery pass found fewer real issues than the stale Ahrefs report suggested — only sitemap gaps + /platform JSON-LD dup were actionable. Internal thin-linking deferred to T2-02. "Next 5 to ship" reshuffled around the video-dependency pause: T2-02 → CO-04 → F-03 → T2-03 partial → VC-01 scaffolding, with VC-02 + logo/case-study outreach explicitly parked.
- **24 Apr 2026** — F-01 shipped (GA4 events). Content addendum merged:
  - Renamed content-brief `F-*` tool tasks to `CT-*` to avoid collision with Foundation.
  - Added VC-01, VC-04 (visual credibility) to Tier 2; VC-02 folded into T2-03; VC-03 deferred alongside B-06; VC-05 folded into T4-04.
  - Added CT-03 to Tier 3 next to grey-fleet pillar; CT-02/04/05/06/07/08 to Tier 4.
  - Added CO-04 (style guide) to Tier 2; CO-01/03/05 deferred.
  - Added CF-02 (LinkedIn cadence), CF-04 (interactive comparison pages) to Tier 4; CF-01/03/05/06/07 deferred.
  - T3-04 now depends on VC-01; T2-03 now owns VC-02 video scope; T3-03 case studies now optionally include video versions (CF-06); T4-04 bundled with VC-05 logo outreach.
  - Added "Next 5 to ship" rolling priorities section reflecting cross-brief reconciliation. Expanded cross-cutting rules with proof-media and one-tool-at-a-time principles from the content addendum.
