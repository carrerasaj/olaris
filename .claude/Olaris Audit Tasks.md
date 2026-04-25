# Olaris — SEO & CRO Remediation Brief

**For:** Claude Code (VS Code extension)
**Repo:** `olaris-website` (olaris.co.uk)
**Prepared:** 24 Apr 2026
**Data window:** 28 Mar – 24 Apr 2026
**Sources:** Google Search Console · Ahrefs Site Audit · live crawl of olaris.co.uk

---

## 0 · How to use this file with Claude Code

This brief is structured as **independent tasks** grouped into three sprints (30 / 60 / 90 days). Each task has:

- A clear outcome
- File paths to edit
- Acceptance criteria
- A self-contained prompt you can paste into Claude Code

Work top-to-bottom. Do **not** start sprint 2 tasks before sprint 1 is merged — several depend on technical fixes landing first.

Suggested workflow in VS Code:

```
1. Open a task block below.
2. Copy the "Claude Code prompt" into the chat.
3. Review the diff, run tests/lint, commit on a task branch.
4. Tick the checkbox in this file and commit.
5. Move to the next task.
```

Branch naming: `seo/<sprint>-<slug>` e.g. `seo/s1-fix-ahrefs-issues`.

---

## 1 · Baseline metrics (do not delete — needed for measurement)

| Metric | Current (28d) | Target (day 90) |
|---|---|---|
| Total clicks | 18 | 120–180 |
| Impressions | 1,721 | 3,500+ |
| Avg. CTR | 1.05% | 3–4% |
| Avg. position | 22.3 | < 14 |
| Tech issues (Ahrefs) | 15 | < 5 |
| Captured leads / mo | ~0 | 15–30 |

**Single biggest leak:** `excess mileage charge calculator uk` — 313 impressions at position 4.27, **zero clicks**.

---

## SPRINT 1 — Days 1–30 · Stop the bleeding

Quick technical + on-page wins on pages already ranking. Expect most click gains to come from this sprint.

---

### [ ] S1-01 · Rewrite meta for top 4 pages

**Outcome:** Fix the CTR leak on pages already ranking.

**Files:**
- `src/app/tools/excess-mileage-calculator/page.{tsx,jsx,html}` (or equivalent route file)
- `src/app/tools/company-car-tax-calculator/page.*`
- `src/app/page.*` (homepage)
- `src/app/platform/page.*`

**Current issues (from Ahrefs + GSC):**
- 3× meta descriptions > 160 chars (get truncated in SERP)
- 2× `<title>` doesn't match what Google displays (Google is rewriting because the tag is unhelpful)

**New metadata to ship:**

```ts
// /tools/excess-mileage-calculator
title: "Excess Mileage Calculator UK · Free, HMRC-aligned · Olaris"
description: "Calculate lease excess mileage charges instantly. UK rates, HMRC-aligned, free. See what you owe — and how to avoid it on your next contract."

// /tools/company-car-tax-calculator
title: "Company Car Tax Calculator 2026/27 · BIK Rates · Olaris"
description: "Free UK company car tax calculator. 2026/27 HMRC BIK rates for ICE, hybrid and EV. Includes P11D lookup. Instant result."

// / (homepage)
title: "Fleet Leasing & Fleet Intelligence · Orbis Platform · Olaris"
description: "Business contract hire and salary sacrifice for UK businesses. Every lease includes Orbis fleet intelligence — real-time visibility from day one."

// /platform
title: "Orbis · Fleet Intelligence Platform · DVLA, Mileage, EV, Cost"
description: "Connected vehicle data, DVLA compliance, EV charging reconciliation and cost analysis in one view. Included with every Olaris lease."
```

**Acceptance:**
- All 4 meta descriptions ≤ 155 chars
- All 4 `<title>` tags lead with the commercial query, not the brand
- H1 of `/tools/excess-mileage-calculator` changed to **"Calculate your lease excess mileage charge"**
- H1 of `/platform` changed to **"Orbis · Fleet Intelligence Platform"**

**Claude Code prompt:**

> Update the page metadata and H1s for these four routes:
> `/tools/excess-mileage-calculator`, `/tools/company-car-tax-calculator`, `/`, `/platform`.
> Use exactly the `title`, `description` and H1 copy from S1-01 in `CLAUDE-TASKS.md`.
> Keep all existing OpenGraph/Twitter tags but regenerate their `title`/`description` from the new values.
> Do not touch other pages. After editing, grep for the old descriptions and confirm they're fully replaced.

---

### [ ] S1-02 · Fix 15 Ahrefs technical issues

**Outcome:** Clean Ahrefs + Rich Results Test before starting content work.

**Issue list from Ahrefs site audit (24 Apr 2026):**

| # | Issue | Count | Fix |
|---|---|---|---|
| 1 | Structured data — Google Rich Results validation error | 1 | Validate in https://search.google.com/test/rich-results |
| 2 | Structured data — schema.org validation error | 1 | Validate in https://validator.schema.org/ |
| 3 | 404 page | 1 | Find in Ahrefs export, 301 → nearest live URL |
| 4 | 4XX page (non-404) | 1 | Same — server log to identify |
| 5 | Page has links to broken page | 1 | Resolves when #3/#4 fixed |
| 6 | Page has links to redirect | 2 | Update links to final URL |
| 7 | Redirect chain | 1 | Collapse to single 301 |
| 8 | 3XX redirect + HTTP→HTTPS | 5 | Expected — confirm single-hop only |
| 9 | Meta description too long (> 160 chars) | 3 | Truncate to 150–155 chars (S1-01 covers 3 of these) |
| 10 | Page & SERP titles do not match | 2 | Rewrite title tags (S1-01 covers these) |
| 11 | Indexable page not in sitemap | 3 | Regenerate `sitemap.xml` from router |
| 12 | Page has only one dofollow incoming internal link | 2 | See S1-04 (internal linking) |
| 13 | External 4XX + External 3XX | 5 | Fix or remove outbound blog citations |

**Files likely to touch:**
- `public/sitemap.xml` (or dynamic generator)
- `src/lib/structured-data.ts` (or wherever JSON-LD lives)
- `src/middleware.ts` / `next.config.*` (for redirects)
- Individual blog post MDX/HTML files for dead external links

**Acceptance:**
- `sitemap.xml` regenerated from the live router — all indexable routes included
- Organization + FAQPage JSON-LD passes Rich Results Test **with zero warnings**
- No redirect chains — every inbound link hits its final URL in a single hop
- All external 4xx links in blog posts fixed or removed
- Re-run Ahrefs crawl, issue count < 5

**Claude Code prompt:**

> Work through issues 1–13 in S1-02 of `CLAUDE-TASKS.md` one at a time.
> For each, propose the change, show me the diff, then apply.
> Start by: (1) listing every route the app exposes; (2) diffing that against `sitemap.xml`; (3) locating the JSON-LD block(s) and printing them so we can validate.
> Use `curl` or `fetch` to verify the 404/4xx URLs Ahrefs flagged before we 301 them.

---

### [ ] S1-03 · Post-result lead capture on excess-mileage calculator

**Outcome:** Turn the single-biggest-traffic page into your top lead source.

**File:** `src/app/tools/excess-mileage-calculator/page.*` (+ a new API route for the PDF generator)

**Behaviour spec:**

1. User calculates charge as today.
2. Below the result card, show a new **"Get your personalised report"** block:
   - Headline: *"Your charge: £{result}. That's {miles} over your contract."*
   - Sub: *"A BCH agreement sized to your real usage would have absorbed this."*
   - Inline form: email + optional company name → "Send report" button.
3. On submit: POST to `/api/excess-mileage/report`
   - Validate email (zod)
   - Store to existing CRM table (or create `leads` table: email, company, calc_input_json, source, created_at)
   - Trigger email (Resend/Postmark — use whatever's already configured) with a generated PDF:
     - Customer's calc result
     - Typical 10k/15k/20k mile BCH comparison for the same vehicle class
     - One-paragraph explainer of how Orbis would have flagged the overshoot 6 months earlier
     - CTA: "Book a 20-min call" → `/contact`
4. UI: brand-matched cyan/navy, same card language as existing site.

**Acceptance:**
- Form visible only *after* calculation (not above the fold)
- GA4 event `lead_captured` fires on successful submit with `{ source: 'excess-mileage' }`
- PDF delivered in < 30s
- Mobile: form + result stay above the fold at 360×640

**Claude Code prompt:**

> Implement S1-03 from `CLAUDE-TASKS.md`: a post-result email-gated PDF report on `/tools/excess-mileage-calculator`.
> First check whether we have an existing email provider (scan `package.json`, `.env.example`, and `src/lib/email.*`).
> If we do, reuse it. If not, propose Resend and stop for my approval before adding.
> For the PDF, use `@react-pdf/renderer` if we're on Next.js; otherwise propose the lightest option and wait.
> Stub the BCH comparison data in `src/data/bch-benchmarks.ts` for now — I'll populate with real numbers later.

---

### [ ] S1-04 · Internal linking audit

**Outcome:** Connect the 9 high-impression blog posts to the 4 commercial pages that need traffic.

**Linking rules to apply site-wide:**

| From (blog) | To (commercial) | Anchor text |
|---|---|---|
| `/blog/what-is-grey-fleet` | `/leasing/business-contract-hire` | "move drivers off grey fleet with a BCH agreement" |
| `/blog/fleet-management-2026` | `/platform` | "fleet intelligence platform" |
| `/blog/what-is-fleet-intelligence` | `/platform` | "Orbis fleet intelligence" |
| `/blog/excess-mileage` | `/tools/excess-mileage-calculator` | "excess mileage calculator" |
| `/blog/scope-123-fleet` | `/platform#sustainability` | "carbon tracking" |
| `/blog/what-is-driver-behaviour-scoring` | `/features/driver-behaviour` | "driver behaviour scoring" |
| `/blog/lease-company-mileage` | `/leasing/business-contract-hire` | "business contract hire" |
| `/blog/dvla-compliance` | `/platform#driver-management` | "DVLA compliance on autopilot" |
| `/blog/fleet-data-single-view` | `/platform#fleet-visibility` | "single-view fleet dashboard" |

**Plus:** Every blog post should get a "Related reading" section at the bottom — 3 posts from the same cluster.

**Files:** MDX or HTML files in `src/content/blog/` (or wherever posts live).

**Acceptance:**
- Every blog post has ≥ 2 contextual internal links to commercial pages
- Every blog post has a "Related reading" block with 3 cluster-matched posts
- Grep confirms the anchors above exist in the right files

**Claude Code prompt:**

> Apply S1-04 internal-linking rules from `CLAUDE-TASKS.md`.
> First `ls` the blog directory and map each file to the table above.
> Add each link as a natural sentence within the body copy (not a footer) — show me the proposed insertion point for each before editing.
> For the "Related reading" blocks, create a small `<RelatedPosts cluster="grey-fleet" current="what-is-grey-fleet" />` component that reads from a new `src/content/blog/clusters.ts` manifest I'll provide — stub the manifest now.

---

### [ ] S1-05 · GA4 conversion events

**Outcome:** We can measure the rest of the work.

**Files:** `src/lib/analytics.ts` (create if missing), individual page components.

**Events to register:**

| Event | Trigger | Properties |
|---|---|---|
| `tool_calculation_completed` | Any calculator result renders | `{ tool: 'excess-mileage' / 'company-car-tax' / 'ev-transition', result_numeric }` |
| `lead_captured` | Form submit succeeds on any page | `{ source: 'excess-mileage' / 'contact' / 'newsletter' / 'pillar-download' }` |
| `quote_requested` | `/contact` form submitted | `{ fleet_size_bucket, urgency }` |
| `demo_requested` | "Book a demo" CTA clicked | `{ from_page }` |
| `cta_click` | Any primary CTA in hero / in-content | `{ label, destination, from_page }` |

Also: mark `lead_captured`, `quote_requested`, `demo_requested` as **conversions** in the GA4 admin (manual step — document it in a `README-analytics.md`).

**Acceptance:**
- `gtag('event', ...)` fires with correct props in browser devtools network tab
- No duplicates on SPA navigation
- `README-analytics.md` lists the events + which to mark as conversions

**Claude Code prompt:**

> Implement S1-05 analytics events from `CLAUDE-TASKS.md`.
> Check whether we already have an analytics wrapper (`src/lib/analytics.*`); extend it or create one.
> Make sure SPA navigation doesn't double-fire — for Next.js App Router, hook into the router `useEffect`.
> Add a `README-analytics.md` at repo root documenting each event and the GA4 admin steps I need to do manually.

---

## SPRINT 2 — Days 31–60 · Build authority

Cluster content work. Longer-form writing — expect to pair with Claude Code for scaffolding and iterate the copy yourself.

---

### [ ] S2-01 · `/grey-fleet` pillar page

**Outcome:** Claim the 18-query "grey fleet" cluster currently ranking at avg position 55+.

**File:** `src/app/grey-fleet/page.*` (new route)

**Structure (2,500–3,500 words):**

```
H1: Grey Fleet · The Complete UK Guide (2026)
[Sticky ToC on desktop, jump-links on mobile]

1. What is grey fleet? (target: "what is grey fleet", "grey fleet meaning", "grey fleet definition")
2. Who is a grey fleet driver? (target: "grey fleet driver", "who is a grey fleet driver")
3. The legal risks of operating a grey fleet (target: "what are the legal risks of operating a grey fleet", "grey fleet legal requirements")
4. Insurance — what you need to check (target: "grey fleet insurance", "grey fleet drivers have valid insurance")
5. Driving licences + DVLA compliance (target: "grey fleet drivers have valid driving licences")
6. How to audit your grey fleet (target: "do i need a grey fleet audit", "how can i audit my fleet" — add HowTo schema)
7. Grey fleet policy template (lead magnet — gated PDF download)
8. Grey fleet management software (target: "grey fleet software", "grey fleet solution", "api for grey fleet checks")
9. FAQs (FAQPage schema — 8 questions drawn from GSC data)
```

**Schema:** `Article` + `FAQPage` + `HowTo` (for section 6).

**Required on-page:**
- Author bio block (E-E-A-T signal — use Alan Carreras with 40 years fleet exp)
- Last-updated date, visible
- 5+ outbound citations to gov.uk, HMRC, RAC Foundation
- Lead-magnet block with gated PDF download
- Bottom CTA → `/leasing/business-contract-hire`

**Acceptance:**
- Lighthouse SEO score ≥ 95
- All 3 schema types validate in Rich Results Test
- "Grey Fleet Policy Template" PDF exists and downloads after email capture
- Internal link from every existing blog post tagged "grey fleet" cluster

**Claude Code prompt:**

> Build the `/grey-fleet` pillar page per S2-01 in `CLAUDE-TASKS.md`.
> Scaffold the route file first with H1, H2s, sticky ToC and schema blocks — leave body copy as placeholder `<p>TODO: expand section…</p>`.
> I'll write the long-form copy myself; you handle structure, schema, ToC scroll-spy, and the `RelatedPosts` integration.
> For the policy template PDF, stub the download endpoint the same way as S1-03.

---

### [ ] S2-02 · Four grey-fleet supporting posts

**Outcome:** Surround the pillar with topical support.

**Posts to create:**

| Slug | Target query | Word count |
|---|---|---|
| `/blog/grey-fleet-audit-checklist` | "do i need a grey fleet audit" | 1,200 |
| `/blog/grey-fleet-insurance-requirements` | "grey fleet insurance" | 1,200 |
| `/blog/grey-fleet-legal-risks` | "what are the legal risks of operating a grey fleet" | 1,200 |
| `/blog/grey-fleet-policy-template` | "grey fleet policy" | 1,200 |

Each must: link up to `/grey-fleet` pillar, link across to 2 sibling posts, link down to `/leasing/business-contract-hire`.

**Claude Code prompt:**

> Scaffold four MDX posts per S2-02 with the frontmatter pattern used by existing blog posts.
> For each: H1, 5–7 H2s, one image placeholder, the three required internal links, and `<RelatedPosts cluster="grey-fleet" />`.
> Body copy = placeholder — I'll write it.

---

### [ ] S2-03 · Rebuild `/platform` as Orbis Platform page

**Outcome:** Claim "fleet intelligence" (57 imp, pos 38) and "fleet intelligence platform" (7 imp).

**File:** `src/app/platform/page.*`

**New structure:**
- H1: "Orbis · Fleet Intelligence Platform"
- Sub-headline: "Connected data, DVLA compliance, EV reconciliation and cost analysis — included with every Olaris lease."
- Hero CTA: "See a 3-min demo" (video or scheduled demo)
- 4 capability blocks with screenshots (placeholders OK for now):
  - Fleet visibility · live tracking, mileage, health
  - Driver management · DVLA, behaviour scoring
  - Cost control · fuel/energy, excess mileage forecasting
  - Sustainability · carbon + EV transition planning
- Integrations strip (DVLA, Ohme, Zap-Map, major OEMs — placeholder logos)
- "Included free with every Olaris lease" value prop strip
- Customer quote / case study block
- FAQ (FAQPage schema — 6 Qs)

**Files:** page route + small components for capability card, integrations strip.

**Claude Code prompt:**

> Rebuild `/platform` per S2-03. Use the existing component library and design tokens (extract those first by scanning `tailwind.config.*` and any `src/components/*`).
> Leave the case study block as a `<CaseStudyPlaceholder>` stub for now.
> For the 4 capability screenshots, add `<img src="/platform/{slug}-placeholder.png" alt="..." />` — I'll provide real screenshots.

---

### [ ] S2-04 · Expand `/blog/what-is-grey-fleet`

**Outcome:** Refresh the only blog that earned a click; double its length.

**File:** `src/content/blog/what-is-grey-fleet.mdx` (or equivalent)

**Changes:**
- Update `datePublished` / `dateModified` in frontmatter
- Add "Last updated: {date}" visible in the header
- Expand from current length to 2,500 words
- Add a ToC component at top
- Link up to new `/grey-fleet` pillar (use anchor "the complete guide")
- Add 5 "related reading" links at the bottom (via `<RelatedPosts />`)
- Add Article schema if not present

**Claude Code prompt:**

> Expand `/blog/what-is-grey-fleet` per S2-04. Add ToC, schema, related-reading block and the pillar link. For the length expansion, insert 6 new H2 sections with placeholder body — I'll write the copy.

---

### [ ] S2-05 · Mobile nav surfaces `/tools`

**Outcome:** Mobile converts 60% better than desktop; don't hide the calculators.

**File:** `src/components/navigation/MobileNav.*`

**Changes:**
- Promote "Tools" from secondary menu to first-level nav
- On `/tools/*` pages, result card + primary CTA sticky at top after calculation (mobile only)
- Secondary nav items: Leasing, Platform, About, Blog, Contact

**Acceptance:** "Tools" visible in the mobile nav without opening a submenu. Calculator result stays visible while user scrolls the explainer copy on mobile.

**Claude Code prompt:**

> Apply S2-05 mobile nav changes. Read `src/components/navigation/` first to understand current structure. Use `position: sticky; top: 64px` for the mobile result card; make sure it doesn't collide with the nav.

---

## SPRINT 3 — Days 61–90 · Compound

New commercial page, second cluster, off-site work. Monthly reporting cadence starts.

---

### [ ] S3-01 · `/services/fleet-audit` lead-gen page

**Outcome:** Claim "fleet audit" (106 imp at pos 77).

**File:** `src/app/services/fleet-audit/page.*` (new route) + `/api/fleet-audit/book`

**Structure:**
- H1: "Free 30-point fleet audit · UK businesses"
- What it covers (30 items, grouped 3×10)
- Who it's for (SME fleet operators, mixed-fleet, grey-fleet-heavy)
- Process (3 steps with timeline)
- Booking form (company, fleet size, current pain points, contact)
- Outcome: generates a scheduled call + confirmation email

**Schema:** `Service` with `areaServed: "GB"`, `provider: Olaris`.

**Claude Code prompt:**

> Build `/services/fleet-audit` per S3-01. Reuse the same form component as `/contact` but extend with the "fleet size" + "pain points" fields. Add Service schema.

---

### [ ] S3-02 · Company car tax cluster

**Outcome:** Claim the 25-query BIK cluster. Currently pos 54, 130 imp.

Tasks:

- [ ] Rebuild `/tools/company-car-tax-calculator`:
  - 2026/27 HMRC BIK rates data in `src/data/bik-rates-2026.ts`
  - Tabs: ICE / Hybrid / EV / Van
  - Manufacturer preset dropdown (Toyota, Lexus, BMW, Tesla)
  - Below calc: 600-word explainer + FAQ
- [ ] Create 3 supporting blog posts:
  - `/blog/bik-rates-2026-27-explained`
  - `/blog/ev-company-car-tax-guide`
  - `/blog/how-to-calculate-p11d-value`
- [ ] Internal-link each post to the calculator + `/leasing/salary-sacrifice`

**Claude Code prompt:**

> Implement S3-02. Start with `src/data/bik-rates-2026.ts` — ask me for the canonical HMRC figures if you can't find them already in the repo. Scaffold the three blog posts with frontmatter + H2 structure only.

---

### [ ] S3-03 · Backlink outreach list

**Outcome:** Earn citations to `/tools/excess-mileage-calculator` as a canonical UK resource.

Not a Claude Code task — manual work for Alan. But Claude Code *can* help build the shortlist:

**Claude Code prompt:**

> Generate a CSV at `outreach/backlink-targets.csv` with 20 UK publications that cover fleet, leasing, or SME accounting.
> Columns: publication, url, contact_page_url, topic_fit, pitch_angle.
> Pitch angle should be something like "UK excess mileage calculator as embeddable resource" or "expert quote on 2026 BIK changes".
> Use only publications you have prior knowledge of — don't fabricate URLs.

---

### [ ] S3-04 · Monthly audit cadence

**Outcome:** Keep the programme measurable.

Create a reusable script: `scripts/monthly-audit.ts`

**What it does:**
1. Takes GSC + Ahrefs CSV exports in `reports/YYYY-MM/` as inputs
2. Generates a markdown report in `reports/YYYY-MM/summary.md` with:
   - Clicks / impressions / CTR / position (month-over-month)
   - Top 10 gainers + top 10 losers by position
   - Ahrefs issue delta
   - KPI progress vs targets in this file's section 1
3. Commits the report to the repo

**Claude Code prompt:**

> Build `scripts/monthly-audit.ts` per S3-04. Use `csv-parse`. Output valid GitHub-flavoured Markdown. No external API calls — everything from local CSV exports. Include `npm run audit -- 2026-05` invocation docs in a new `reports/README.md`.

---

### [ ] S3-05 · LinkedIn distribution

**Outcome:** Referring-domain diversity.

Not a Claude Code coding task, but Claude Code *can* draft the assets:

**Claude Code prompt:**

> Turn the `/grey-fleet` pillar into 3 LinkedIn carousels (10 slides each).
> Output as markdown files in `marketing/linkedin/` with slide-by-slide copy.
> Headline, supporting sentence, visual description per slide.
> Voice matches the existing blog — direct, first-hand, no buzzwords.

---

## Appendix A · Query → page map (for future content decisions)

Don't lose this — every time someone pitches a new piece of content, match it to an already-flagged query first.

| Query cluster (GSC) | Imp | Target page | Intent |
|---|---|---|---|
| excess mileage calculator (+variants, 8 queries) | ~580 | `/tools/excess-mileage-calculator` | Commercial-inv. |
| grey fleet (+17 variants) | ~220 | `/grey-fleet` (pillar) + blog cluster | Informational → commercial |
| fleet audit / auditor / assessment | ~115 | `/services/fleet-audit` (new) | Commercial |
| company car tax / BIK / P11D (25 queries) | ~120 | `/tools/company-car-tax-calculator` | Commercial-inv. |
| fleet intelligence / fleet data / ops | ~75 | `/platform` | Brand + commercial |
| driver behaviour / scoring (cluster) | ~40 | `/features/driver-behaviour` | Info → product |
| EV transition / EV fleet | ~15 | `/tools/ev-transition-planner` | Commercial-inv. |
| salary sacrifice providers | ~5 | `/leasing/salary-sacrifice` | Commercial |

---

## Appendix B · Files you'll touch most

- `src/app/page.*` — homepage
- `src/app/platform/page.*`
- `src/app/tools/excess-mileage-calculator/page.*`
- `src/app/tools/company-car-tax-calculator/page.*`
- `src/app/grey-fleet/page.*` (new)
- `src/app/services/fleet-audit/page.*` (new)
- `src/app/leasing/business-contract-hire/page.*`
- `src/app/leasing/salary-sacrifice/page.*`
- `src/content/blog/*` (many posts)
- `src/components/navigation/MobileNav.*`
- `src/lib/analytics.*`
- `src/lib/structured-data.*`
- `public/sitemap.xml`

---

## Appendix C · What NOT to do

- Don't add schema.org markup blindly — it creates more Ahrefs warnings than it fixes. Validate each change.
- Don't spin up new blog posts without an internal-link plan. Orphan posts are what got us here.
- Don't rewrite pages ranking at position 1–3 for anything (there's nothing). When that changes, leave them alone.
- Don't publish thin "ultimate guide" AI content for the sake of volume — Olaris's edge is 40 years of first-hand fleet experience. The voice matters.
- Don't change URL structure on existing pages without 301s. Current authority is fragile.

---

*End of brief. Tick the boxes as you go. Re-run Ahrefs + export GSC at end of each sprint and compare to the baseline in section 1.*
