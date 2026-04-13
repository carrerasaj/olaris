# Olaris SEO Pulse Report — Week of 10 April 2026

**Generated:** Friday 10 April 2026 (automated weekly review)

---

## Content Audit Summary

### Published Blog Posts: 8

| # | Title | Target Keyword | Word Count (est.) | Meta Title | Meta Description | CTA |
|---|-------|---------------|-------------------|------------|-----------------|-----|
| 01 | Why Your Fleet Cost Report Is Wrong | fleet cost per mile / fleet cost report | ~2,100 | ✅ Present (52 chars) | ✅ Present (133 chars — short) | ✅ Contact + Platform |
| 02 | The Hidden Cost of Excess Mileage | excess mileage tracking / management | ~3,200 | ✅ Present (48 chars) | ✅ Present (134 chars — short) | ✅ Contact |
| 03 | How Driver Behaviour Scoring Changed One Fleet's Insurance | driver behaviour scoring | ~3,100 | ✅ Present (52 chars) | ✅ Present (117 chars — too short) | ✅ Contact + Platform |
| 04 | DVLA Compliance: What Most Fleet Managers Get Wrong | DVLA compliance automation | ~4,400 | ✅ Present (50 chars) | ✅ Present (123 chars — too short) | ✅ Contact + Platform |
| 05 | Scope 1, 2, 3: Fleet Carbon Reporting | fleet carbon reporting | ~5,200 | ✅ Present (46 chars) | ✅ Present (121 chars — too short) | ✅ Contact + Platform |
| 06 | Your Fleet's EV Transition: Start With Data | EV fleet transition planning | ~2,400 | ✅ Present (uses `meta_title`) | ✅ Present (uses `meta_description`) | ✅ Contact + Platform |
| 07 | Your Vehicles Are Already Talking | connected vehicle data platform | ~3,400 | ✅ Present (uses `meta_title`) | ✅ Present (uses `meta_description`) | ✅ Contact + Platform |
| 08 | Mileage Compliance: Lease Company Margins | lease company fleet management | ~3,100 | ✅ Present (uses `meta_title`) | ✅ Present (uses `meta_description`) | ✅ Contact + Platform |

### Average Word Count: ~3,360 words
All posts exceed the 1,500-word pillar content target. Strong depth across the board.

### Keyword Coverage Map

| Target Keyword (from SEO strategy) | Dedicated Post? | Post # |
|-------------------------------------|-----------------|--------|
| fleet management software UK | ❌ No dedicated post | — |
| excess mileage tracking | ✅ Yes | 02, 08 |
| driver behaviour scoring | ✅ Yes | 03 |
| DVLA compliance automation | ✅ Yes | 04 |
| fleet carbon reporting | ✅ Yes | 05 |
| EV fleet transition planning | ✅ Yes | 06 |
| connected vehicle data platform | ✅ Yes | 07 |
| lease company fleet management | ✅ Yes | 08 |
| fleet cost per mile calculator | ⚠️ Partially (blog 01 covers cost reporting, not calculator) | 01 (partial) |
| fleet data integration | ⚠️ Partially (blog 07 covers OEM APIs) | 07 (partial) |

**Coverage: 6 of 10 target keywords have strong dedicated posts. 2 partial. 2 gaps.**

---

## Quick Wins (Fix This Week)

### 1. Meta Descriptions Too Short

Several meta descriptions fall below the 150-160 character sweet spot, which means Google may auto-generate a snippet instead of using yours.

| Post | Current Length | Suggested Replacement |
|------|--------------|----------------------|
| 01 | ~133 chars | "Your fleet cost report is probably wrong. Discover why manual reporting hides thousands in fuel, maintenance and mileage costs — and how real-time dashboards fix it." (164 chars) |
| 02 | ~134 chars | "Excess mileage charges blindside UK fleet managers every year. Learn how live odometer tracking prevents costly overages and saves thousands at lease return." (157 chars) |
| 03 | ~117 chars | "A 120-vehicle fleet cut insurance premiums by 12% using driver behaviour scoring. See how gamification, league tables and measurable safety data moved the needle." (163 chars) |
| 04 | ~123 chars | "One unlicensed driver can void your fleet insurance and expose you to criminal liability. Understand your DVLA compliance obligations and how to automate checking." (163 chars) |
| 05 | ~121 chars | "Your fleet emits roughly 2.5 tonnes of CO2 per vehicle per year. Learn how to measure Scope 1, 2 and 3 emissions, plan your EV transition, and build a credible net zero strategy." (160 chars — trim "and build..." to fit) |

### 2. Inconsistent Front Matter Schema

Posts 01–05 use `title`, `metaTitle`, `metaDescription` keys.
Posts 06–08 use `meta_title`, `meta_description` (snake_case) and **no `title` field**.

**Action:** Standardise all posts to one schema. Recommend using `title`, `metaTitle`, `metaDescription` (camelCase) consistently, and ensure the Next.js rendering handles whichever format is chosen. Posts 06–08 also lack `category`, `headerImage`, and `date` fields that 01–05 have.

### 3. Title Tag Improvements

Most titles are strong. A few could be tightened for keyword targeting:

| Post | Current metaTitle | Suggested Improvement |
|------|-------------------|----------------------|
| 01 | "Fleet Cost Reports: Why Numbers Don't Add Up" (47 chars) | "Fleet Cost Per Mile: Why Your Report Is Wrong" (46 chars) — adds target keyword "cost per mile" |
| 06 | "EV Fleet Transition: Start With Data, Not Hype" (48 chars) | Good as-is ✅ |
| 07 | "Connected Vehicle Data: Your Fleet Is Talking" (46 chars) | "Connected Vehicle Data Platform: What Fleets Miss" (50 chars) — adds "platform" keyword |

### 4. Internal Linking Opportunities

Currently, **no blog post links to another blog post**. Every post links only to `/contact` and `/platform`. This is a significant missed opportunity for building topical authority and keeping readers on-site.

**High-priority internal links to add:**

| From Post | Link To | Anchor Text Suggestion |
|-----------|---------|----------------------|
| 01 (Fleet Cost Report) | 02 (Excess Mileage) | "excess mileage charges that never appear in your cost report" |
| 01 (Fleet Cost Report) | 03 (Driver Behaviour) | "driver behaviour drives costs" |
| 02 (Excess Mileage) | 08 (Lease Company Mileage) | "mileage compliance for lease companies" |
| 02 (Excess Mileage) | 01 (Fleet Cost Report) | "real-time cost dashboard" |
| 03 (Driver Behaviour) | 01 (Fleet Cost Report) | "fuel consumption and maintenance costs" |
| 03 (Driver Behaviour) | 05 (Carbon Reporting) | "fleet emissions reduction through driver behaviour" |
| 04 (DVLA Compliance) | 03 (Driver Behaviour) | "driver behaviour monitoring" |
| 05 (Carbon Reporting) | 06 (EV Transition) | "EV transition planning based on data" |
| 05 (Carbon Reporting) | 01 (Fleet Cost Report) | "fuel consumption data from real-time tracking" |
| 06 (EV Transition) | 07 (Connected Vehicle Data) | "connected vehicle data for battery health monitoring" |
| 06 (EV Transition) | 05 (Carbon Reporting) | "carbon reporting and Scope 1 emissions" |
| 07 (Connected Vehicle) | 02 (Excess Mileage) | "live mileage tracking against lease allowances" |
| 07 (Connected Vehicle) | 03 (Driver Behaviour) | "driver behaviour insight from OEM telemetry" |
| 08 (Lease Mileage) | 02 (Excess Mileage) | "the hidden cost of excess mileage" |
| 08 (Lease Mileage) | 07 (Connected Vehicle Data) | "OEM telemetry for live odometer readings" |

**Recommendation:** Add 2–3 internal links per post. This is the single highest-impact quick win available.

---

## Content Gaps

### Target Keywords Without Dedicated Content

| Missing Keyword | SEO Strategy Reference | Suggested Blog Post |
|----------------|----------------------|---------------------|
| **fleet management software UK** | Primary homepage keyword (1,200 MSV) | "Fleet Management Software Buyer's Guide 2026: What UK Operators Actually Need" — comparison/buyer's guide format targeting commercial intent |
| **fleet cost per mile calculator** | Target keyword list | "How to Calculate Your True Fleet Cost Per Mile (With Real Numbers)" — practical guide with worked examples, possibly with an interactive calculator |
| **fleet data integration** | Long-tail: multi-manufacturer fleet tracking (65 MSV) | "Fleet Data Integration: How to Connect Your Fuel Cards, Telematics and Lease Data in One Place" — practical how-to |
| **fleet total cost of ownership** | Blog post 6 in SEO strategy (180 MSV) | "Total Cost of Ownership for Fleet Vehicles: The Complete UK Guide" — comprehensive TCO breakdown |
| **fleet management software comparison** | Blog post 8 in SEO strategy (280 MSV, high intent) | "Fleet Management Software Comparison 2026: Features, Pricing and What Matters" |
| **real-time fleet tracking benefits** | Blog post 9 in SEO strategy (90 MSV) | "Real-Time Fleet Visibility: Why Delayed Data Costs You Money" |
| **lease vehicle mileage management** | Blog post 10 in SEO strategy (140 MSV) | Already partially covered by posts 02 and 08 — could merge into a definitive guide |

### Priority New Posts (Ranked by Impact)

1. **Fleet Management Software Buyer's Guide 2026** — highest commercial intent, 280 MSV, supports homepage keyword cluster
2. **Fleet Cost Per Mile Calculator** — fills a specific gap, practical utility content, link magnet potential
3. **Fleet Total Cost of Ownership Guide** — 180 MSV, strong informational intent, supports cost intelligence pillar

---

## Technical SEO Checklist

### Image Alt Text
⚠️ **Cannot fully verify** — blog posts specify `headerImage` as descriptive text strings (e.g., "Frustrated fleet manager looking at spreadsheet"), which is good practice. However, posts 06–08 use `header_image_description` instead. Verify that the Next.js template actually renders these as `alt` attributes on the `<img>` tags. If the field name mismatch means alt text is missing for posts 06–08, that's a bug.

### Sitemap
⚠️ **Needs verification** — confirm that `sitemap.xml` includes all 8 blog post URLs. With Next.js 15 on Vercel, the sitemap should auto-generate if configured. Run `curl https://olaris.co.uk/sitemap.xml` to verify.

### Broken Internal Links
✅ All posts link to `/contact` and `/platform` — these are relative links and should resolve correctly. No broken internal links detected in content. However, there are **zero cross-post links** (noted above as a priority fix).

### Structured Data
⚠️ **Not visible in markdown** — verify that blog posts render with `Article` or `BlogPosting` schema markup (JSON-LD). This is important for rich snippets in search results.

### Header Structure
✅ All posts follow proper H1 → H2 → H3 hierarchy. No skipped heading levels detected.

### URL Structure
⚠️ **Verify slugs** — ensure blog URLs use keyword-rich slugs (e.g., `/blog/excess-mileage-tracking-fleet` not `/blog/blog-02`). Cannot confirm from file names alone.

---

## Next Week's SEO Priority

### **Add internal links across all 8 blog posts**

This is the single most impactful action available. Currently, zero blog posts link to any other blog post. The content is excellent and comprehensive, but from Google's perspective, each post sits in isolation rather than forming a connected topic cluster.

**Why this matters most:**
- Internal links pass page authority between posts, boosting rankings for all of them
- They signal topical depth to Google (you're an authority on fleet management, not just writing isolated articles)
- They increase time-on-site and reduce bounce rate (readers discover related content)
- They're fast to implement — 30 minutes of editing across 8 posts

**Action plan:**
1. Add 2–3 contextual internal links to each blog post (use the table above)
2. Standardise the front matter schema across all 8 posts (fix snake_case vs camelCase inconsistency)
3. Update the 5 short meta descriptions with the suggested replacements

Estimated effort: 1–2 hours. Expected impact: meaningful ranking signal improvement within 4–6 weeks.

---

*Report generated automatically by the Olaris SEO Analyst. Next pulse: Friday 17 April 2026.*
