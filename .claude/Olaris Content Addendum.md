# Olaris — Content & Media Addendum

**Companion to:** `Olaris Audit Tasks.md` + `Olaris Conversion Addendum.md`
**Focus:** why impressions aren't engaging — and what to ship
**Prepared:** 24 Apr 2026

The SEO brief gets people to the page. The conversion brief catches them. This brief makes them **actually read and believe** what's on the page — so the capture surfaces have something warm to catch.

---

## 0 · Diagnosis — why impressions aren't converting to clicks

Three specific content failures, ranked by how much they're costing you:

| # | Failure | Evidence | Cost |
|---|---|---|---|
| 1 | Pages are **wall-of-text** — no visual anchors, no skim-scan affordances | Live crawl of `/platform`, `/leasing/*`, top blog posts | Bounce rate + low CTR on rankings |
| 2 | Tool outputs are **terminal** — one number, no context, no story | `/tools/excess-mileage-calculator` returns a figure and ends | 736 imp, 11 clicks, 0 leads |
| 3 | Zero **proof media** — no screenshots of Orbis, no client video, no charts | Every page is text + generic CTAs | "Looks like consulting, not like a platform" |

Your site reads as a consultancy's website. But the commercial pitch is **"we have a platform"**. Buyers need to *see* the platform or they won't believe it exists.

---

## SPRINT E — Visual credibility (week 1–4)

Highest ROI. Buyers decide in 5 seconds whether Olaris is real or vapour.

### [ ] E-01 · Orbis product screenshots (8 hero shots)

**Why first:** `/platform` is the single worst-performing conversion page *because* there's nothing to see. One annotated screenshot beats 800 words.

Ship 8 annotated screenshots, each 1600×1000px:

1. **Fleet dashboard** — map + vehicle list + live status
2. **Single vehicle detail** — health, mileage vs contract, excess alert
3. **Driver scorecard** — 5 drivers ranked, one flagged
4. **DVLA compliance panel** — green/amber/red licence status
5. **Cost-per-mile view** — side-by-side 3 vehicles
6. **EV charging reconciliation** — tagged personal vs business charges
7. **Excess mileage forecast** — "6 months out, 3 vehicles projected overshoot"
8. **Carbon/scope report** — tonnes CO₂e by vehicle, trend line

If the real product isn't shipped for some of these, **build high-fidelity mockups in Figma**. Better to show the intended product than nothing. Label clearly: *"Preview · shipping Q3 2026"* on any unreleased views.

### [ ] E-02 · 60-second founder video on homepage

Alan on camera, iPhone, no polish:

> *"I'm Alan Carreras. I spent 40 years managing fleets — every excess mileage charge, every DVLA disaster, every spreadsheet that took a week and still lied. Olaris is the platform I wish I'd had. Here's what it actually does..."*

Cut to 3 × 8-second screen recordings of Orbis doing a specific thing. Back to Alan: *"If that sounds useful, book a 20 minute call — I'll show you the rest."*

**Why this works:** your unique edge is first-hand experience. Nobody else selling fleet software has it. Put it front and centre.

### [ ] E-03 · 90-second product tour video

Screen recording + voiceover, narrated by Alan or a product lead:

- 0:00 Hero problem — "30 vehicles, 12 drivers, a week of spreadsheets"
- 0:15 Dashboard reveal
- 0:30 Click into one vehicle → cost overshoot alert
- 0:45 Driver scorecard → DVLA flag
- 1:00 One-click fleet audit export
- 1:15 "Every feature. Included with every lease. Book a call."

Embed on `/platform`, `/leasing/business-contract-hire`, homepage. Use a Storylane / Arcade / Navattic *interactive* version for `/platform` so prospects can click through at their own pace.

### [ ] E-04 · Before/after visual for every blog post

Every blog post that currently ends in a text CTA gets one visual mid-article:

- Grey fleet posts → a chart: "Grey fleet cost per mile vs. managed fleet" (simulate with SVG)
- BIK posts → a rates comparison table with ICE vs EV highlighted
- Excess mileage posts → a visual: contract line vs actual usage vs Orbis alert
- Fleet intelligence posts → a simplified dashboard screenshot

These are **not decorative**. They're reasons to stay on the page and reasons to share.

### [ ] E-05 · Logo strip — get permission now

Contact 5 existing clients this week. Ask: *"Can we use your logo (or an anonymised descriptor like 'UK-based logistics fleet, 180 vehicles') on our site?"* Even 3 yeses transforms credibility.

Design the strip so it handles both real logos and anonymised cards interchangeably.

---

## SPRINT F — Tool expansion (week 2–8)

You have 3 tools. You should have 8. Each new tool = new keywords + new capture surface + new shareable asset.

Ranked by effort-to-value:

### [ ] F-01 · Fleet Cost Scorecard *(highest priority)*

8-question self-assessment → 1–100 score + benchmark vs peers → email-gated PDF with tailored recommendations. Already proposed in conversion addendum — elevated here because it's your highest-converting content pattern.

**Keywords it targets:** "how to audit my fleet" (2 imp), "fleet assessment" (1), "fleet auditor" (1), plus brand-new demand Google doesn't even see you for yet.

### [ ] F-02 · BCH vs PCH vs Sal-Sac Comparison Tool

Input: fleet size, driver profile, annual mileage, appetite for admin.
Output: ranked recommendation with reasoning + monthly cost range + next step CTA per option.

**Keywords:** the entire leasing cluster — "business contract hire", "salary sacrifice", "personal contract hire" — none of which you rank on.

### [ ] F-03 · Grey Fleet Risk Calculator

Input: number of grey fleet drivers, miles/year each, company size.
Output: estimated annual legal liability exposure + insurance premium differential + suggested conversion plan.

**Keywords:** grey fleet cluster (18 tracked queries, 220+ imp).

Pairs perfectly with the `/grey-fleet` pillar and the Policy Template lead magnet — all three reinforce each other.

### [ ] F-04 · Fleet Carbon Calculator

Input: fleet composition (ICE/hybrid/EV counts + avg mileage).
Output: tonnes CO₂e/year + scope 1/2/3 breakdown + "what EV swap would save" slider.

**Keywords:** "fleet carbon footprint", "scope 123 fleet", corporate ESG audience.

### [ ] F-05 · Vehicle Total Cost of Ownership Comparator

Pick 2 vehicles from a dropdown of 50 popular models → side-by-side TCO over 4 years (lease, fuel/energy, tax, insurance, excess mileage likelihood, residual).

Highest-shareability tool — fleet managers send these to their FD.

### [ ] F-06 · Driver Licence Check Simulator

A 30-second lightweight interactive: *"Enter DOB + licence details — we'll show what DVLA compliance actually checks."* No real API call, educational + lead capture at the end.

Pairs with `/features/driver-behaviour`.

### [ ] F-07 · EV Transition Planner v2

Currently exists at `/tools/ev-transition-planner` (40 imp, pos 40). Upgrade it:

- Input current fleet → output phased 3-year EV transition plan
- Depots + charging capacity modelling
- Tax savings projection (BIK + VAT)
- Generates a PDF roadmap

Not new — just 10x what's there.

### [ ] F-08 · Fleet Compliance Quick-Check

Enter fleet size → 10-item checklist ticks green/amber/red with timeline implications. Exists as `/tools/fleet-compliance-checker` (113 imp, pos 76). Upgrade rather than replace.

---

## SPRINT G — Content formats beyond blog posts (week 3–10)

Blog posts are 90% of your content output. Other formats each tap different audiences and search surfaces.

### [ ] G-01 · YouTube channel — "The Fleet Fix"

Short (3–5 min) videos, biweekly. Alan on camera + screen share:

- *"How to read a BCH quote and spot the 3 gotchas"*
- *"The grey fleet audit I'd do on your business tomorrow"*
- *"Why your excess mileage charge is always higher than you expect"*

YouTube videos rank on Google for commercial queries. And every video embeds on the matching blog post = richer content signal.

**Effort:** 1 video per 2 weeks = ~4 hours including edit. Descript handles the editing.

### [ ] G-02 · LinkedIn carousel series (3/week)

Each carousel = 8–10 slides, one idea. Repurpose blog posts. Link in post back to the full article + a soft CTA for the related tool.

LinkedIn is where UK fleet/finance/procurement people actually live. Your website exists to convert traffic — LinkedIn is how you generate it without waiting on SEO.

**Suggested cadence:** Mon: educational · Wed: contrarian take · Fri: tool spotlight or case study.

### [ ] G-03 · Monthly webinar + on-demand library

45 minutes, live, Alan + one guest (client, insurer, tax advisor). Topics driven by GSC query data:

- Month 1: *"The grey fleet audit every UK business should do in 2026"*
- Month 2: *"BIK 2026/27 — what's changed and what to do before April"*
- Month 3: *"Fleet cost control for businesses 20–200 vehicles"*

Replay gated behind email. Each session becomes: 1 on-demand recording + 4 clips + 1 blog post + 1 LinkedIn carousel. Force-multiplies your content output.

### [ ] G-04 · Interactive comparison pages

Not a blog post, not a tool — a hybrid. Long, data-dense, embeddable charts.

Candidates:
- *"BCH vs Sal-Sac vs Personal Lease — interactive comparison"*
- *"UK company car tax 2026/27 — every band, every vehicle"*
- *"Fleet electrification readiness — UK sector by sector"*

These earn backlinks because they become the canonical reference. Accounting blogs and LinkedIn posts will cite you.

### [ ] G-05 · Email course: "7-day fleet cost teardown"

Opt-in via homepage banner. 7 daily emails walking through a self-audit. Delivers value, qualifies the lead, ends with a fleet review booking CTA.

Higher engagement than a one-off PDF because it's spread over a week — you're in their inbox 7 times before asking for a call.

### [ ] G-06 · Case study videos (3)

Video versions of the written case studies (B-03 in conversion brief). 2-minute client-on-camera testimonials. Even if only 1 of 3 happens, it's worth 100x a written quote.

### [ ] G-07 · Quarterly industry report

Pick one flagship topic and own it: *"State of UK Fleet 2026 Q3"*. 20-page PDF, original data (survey your list + customer anonymised aggregates), hard-hitting charts.

Gate the PDF. Extract 5 blog posts from it. Pitch to FleetWorld, Fleet News, LinkedIn. This is how small firms punch above their weight in thought leadership.

**Effort:** 3–5 days once per quarter. Dominant asset for 90 days.

---

## SPRINT H — Content ops + system (ongoing)

### [ ] H-01 · Editorial calendar driven by GSC data

Stop writing what feels interesting. Write against queries you're already getting impressions for but ranking poorly on. Monthly process:

1. Export GSC queries with > 5 imp, position 20–60
2. Cluster them by theme
3. Plan 2 blog posts per cluster per month
4. Internally link both to a pillar + to commercial pages

Tool it in Notion or a simple Sheet.

### [ ] H-02 · Repurposing pipeline

Every new pillar or long-form asset produces:

```
1 pillar page
  ├─ 4 supporting blog posts
  ├─ 1 downloadable asset (PDF/template/checklist)
  ├─ 1 YouTube video
  ├─ 3 LinkedIn carousels
  ├─ 1 webinar (quarterly)
  └─ 1 email-course module (if fits)
```

Zero orphan content. Every piece supports a commercial destination.

### [ ] H-03 · Content audit (existing 15+ blog posts)

Three buckets for every existing post:

- **Keep + upgrade** — already ranking (e.g. `/blog/what-is-grey-fleet` — 141 imp). Expand, refresh date, add visuals.
- **Merge + redirect** — thin posts on same topic → merge into one stronger post, 301 the old URLs.
- **Delete** — posts that get no impressions and have no commercial path. Dead weight hurts site authority.

Blog consolidation is undervalued — Google rewards sites that prune aggressively.

### [ ] H-04 · Style + voice guide

Document:

- Tone: direct, first-hand, no consulting-speak ("leverage synergies" → bin)
- Reading level: Y9 equivalent. Fleet managers are busy, not thick.
- Length: blog posts ≥ 1,200 words or don't publish
- Required elements per post: TOC, 1 visual, 2 internal links, related-reading block, schema, CTA
- Author byline + photo + bio (E-E-A-T)

One page. Pin it in the repo. Contractors and Claude Code both follow it.

### [ ] H-05 · Visual asset system

Pick 3 recurring visual formats and commit:

- **"Fleet Snapshot"** — a hero-style card with one big number + context. Used in blog headers, LinkedIn, webinar slides.
- **"Before / After"** — split-screen comparison. For grey fleet → managed, pre-Orbis → post-Orbis.
- **"Timeline strip"** — 4-stage horizontal for "how this works" sections.

Build these once in Figma + as React components. Reused 50x/year, always on-brand.

---

## Priority — if you can only ship 5 pieces of content this quarter

1. **E-02 · 60-second founder video on homepage** — transforms trust signal in 1 day of work
2. **E-01 · 8 Orbis screenshots (or high-fid mockups)** — makes `/platform` real
3. **F-01 · Fleet Cost Scorecard** — new capture engine + keyword expansion
4. **F-03 · Grey Fleet Risk Calculator** — pairs with SEO pillar, same traffic pool
5. **G-03 · First monthly webinar** — force-multiplies into blog/LinkedIn/video/email

If you nail these five by end of Sprint 2 (day 60), the audit's conversion numbers become achievable rather than aspirational.

---

## Honest caveats

- **Don't ship video that looks AI-generated.** Bad video is worse than no video. iPhone + natural light + Alan talking straight > slick AI avatar + polished script.
- **Don't build 5 tools before any convert.** Ship F-01, measure 3 weeks, then the next. One great tool beats 5 forgotten ones.
- **Content ops is harder than content creation.** The repurposing pipeline (H-02) is what turns 1 piece into 10 — without it you'll burn out after 2 months.
- **Resist the urge to write about AI, EVs generally, or macro trends.** Google doesn't reward generic takes. Your edge is *specific UK fleet operator pain* — stay narrow.

---

*Content without capture is theatre. Capture without content is a dead form. This brief makes the content good enough that the capture surfaces in the conversion brief actually fire.*
