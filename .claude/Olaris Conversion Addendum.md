# Olaris — Conversion & Engagement Addendum

**Companion to:** `Olaris Audit Tasks.md`
**Focus:** engagement · prospect capture · conversion
**Prepared:** 24 Apr 2026

The SEO brief gets the right people to the site. This brief makes them **stay, identify themselves, and buy**. Work it in parallel with the SEO sprints — none of this depends on ranking improvements to produce value.

---

## 0 · The conversion model

Today, olaris.co.uk has essentially one conversion surface: the `/contact` form. That's **one** way for a prospect to raise their hand. Best-in-class fleet/SaaS sites offer **6–10**, calibrated to visitor intent and commitment level.

```
AWARENESS          INTEREST             EVALUATION          INTENT              DECISION
───────────────────────────────────────────────────────────────────────────────────────
blog post    →   tool / calculator  →  gated resource  →  calculator w/    →  "Book a call"
                                       (PDF, template)    capture + report    / live chat
                 newsletter signup     webinar reg.       fleet audit req.    demo request
                                                                              quote form
```

Olaris currently covers two of those surfaces (blog, contact). We're leaving 4–6 capture opportunities on the floor.

---

## SPRINT A — Capture surfaces (week 1–3)

Six specific capture points to add. Each independent, each shippable in <1 day.

### [ ] A-01 · Exit-intent on calculator pages

Single modal, triggers on mouse-leave (desktop) or back-button (mobile), only on `/tools/*`, only after calc completed, once per session.

Copy: *"Before you go — want a PDF of your result plus 3 comparable lease quotes? 30 seconds."* · email-only form.

**Expected capture:** 8–12% of calculator completions.

### [ ] A-02 · Sticky bottom bar on blog posts

Persistent thin bar, dismissible, one per session. Appears after user scrolls past 40% of post. Copy adapts to cluster:

- Grey fleet posts → *"Get the Grey Fleet Policy Template (Word, editable)"*
- Leasing posts → *"Compare BCH vs sal-sac in 60s → free calculator"*
- EV posts → *"Plan your EV transition with our free tool"*

**Expected capture:** 3–5% of blog readers.

### [ ] A-03 · Inline lead magnets per blog post

Mid-article embedded block, not sidebar. 6 downloadable assets to create (same design, single component):

| Asset | Target posts | Format |
|---|---|---|
| Grey Fleet Policy Template | grey-fleet cluster | Word doc |
| Fleet Audit Checklist (30 points) | audit / compliance posts | PDF |
| BIK Rates 2026/27 One-Pager | company-car-tax cluster | PDF |
| Excess Mileage Forecast Template | mileage posts | Excel |
| EV Transition Readiness Scorecard | EV cluster | PDF |
| Driver Behaviour Policy Template | driver-behaviour posts | Word doc |

**Expected capture:** 5–8% of blog readers. Higher-intent leads than the bar.

### [ ] A-04 · "Book a 20-min fleet review" calendar embed

Replace static "Contact Us" CTAs on high-intent pages (`/platform`, `/leasing/*`, post-calculator) with a Cal.com / Calendly embed. Zero-friction booking.

**Why this beats a form:** moves commitment up a stage. Someone who books a call is 10x more likely to become a customer than someone who submits a contact form.

**Expected bookings:** 8–15/month at current traffic, 30+/month post-SEO work.

### [ ] A-05 · Newsletter sign-up with actual value prop

Current footer CTA is generic. Reframe it:

> **"The Fleet Intelligence Brief"** — 1 email, every other Tuesday.
> One chart, one regulatory update, one cost-saving tactic.
> 400 words, 4 minutes. No fluff.

Add a visible recent-issue preview (auto-pull latest MailerLite/Mailchimp). Social proof: *"Read by 340 UK fleet operators."*

**Expected capture:** 1.5–3% of all visitors (industry norm is 0.5%).

### [ ] A-06 · Post-calculator email drip (7 touches, 21 days)

When someone captures via A-01 or the calculator PDF gate, enroll them in a short sequence:

| Day | Subject | Purpose |
|---|---|---|
| 0 | Your report + 3 comparable quotes | Deliver promised asset |
| 2 | The one question that predicts excess mileage | Build authority |
| 5 | How Orbis flagged 8k overshoot for a client 6mo early | Case study |
| 9 | BCH vs PCH vs sal-sac — which fits you? | Product education |
| 14 | "Is your fleet costing 12% more than it should?" | Pain-point activation |
| 18 | Offer: free 30-point fleet audit | Soft pitch |
| 21 | Book a 20-min call with Alan | Direct CTA |

Use existing ESP (or Resend + a simple queue). Pause sequence on any reply. GA4 event per step for funnel analysis.

**Expected outcome:** 3–6% sequence-to-call booking rate.

---

## SPRINT B — Engagement depth (week 2–5)

Capture is step 1. Making the site *sticky* — people stay, come back, trust you — is step 2.

### [ ] B-01 · Fleet Cost Scorecard (interactive)

New tool at `/tools/fleet-cost-scorecard`. 8-question self-assessment → scored rating (1–100) + benchmark against fleet size peers → email-gated detailed PDF.

Questions cover: fleet size, % grey fleet, mileage variance, EV %, current software, last audit, driver scoring, cost visibility.

This is the highest-conversion pattern in B2B SaaS — Hubspot's website grader built their whole growth engine. Cost: ~2 dev-days.

### [ ] B-02 · Live testimonials / logo strip

Not a static "trusted by" row. Rotating specific claims:

> *"We cut excess mileage charges 43% in year one." — David M., 120-vehicle fleet*
> *"Grey fleet dropped from 60 drivers to 12 in six months." — Sarah P., Facilities Director*

Anchor with 3–5 real client logos (get written permission). Even 3 placeholders reading "[Client logo — anonymised]" is more credible than none.

### [ ] B-03 · Case study section (currently missing)

Create `/case-studies` with 3 stories, each following:

- **Situation** — fleet size, sector, specific pain
- **Intervention** — what Olaris did (Orbis rollout, policy, leasing switch)
- **Outcome** — 3 numeric results (cost, compliance, satisfaction)
- **Quote** from a named contact

Link every mention of "we helped" or "for a client" across the site to a specific case study.

### [ ] B-04 · Alan as the face of the brand

You have 40 years of fleet experience. The site barely says so. Options:

- **/about** page: full-bleed photo of Alan, 300-word origin story ("Why I built Olaris"), LinkedIn link, first-person voice.
- Blog post author bylines with photo + short bio + 2 other posts link.
- A 90-second founder video on homepage — *"Hi, I'm Alan. Here's what makes Olaris different."* Shot on iPhone, unpolished is better than polished here.

E-E-A-T signals Google loves *and* builds trust with buyers in parallel.

### [ ] B-05 · Live-chat / async message widget

Add Crisp, Intercom Lite, or a Cal.com popover — something that accepts messages even if you're not online. Over half of B2B buyers report abandoning a site because they couldn't get one question answered immediately.

Gate it to `/platform`, `/leasing/*`, `/contact`, `/services/*` — high-intent only.

### [ ] B-06 · Interactive platform demo

Current `/platform` page *tells*. A 60-second interactive product tour (Storylane / Arcade / Navattic / self-built with recordings) *shows*. Embed on `/platform`. Gate optional — the tour itself is the lead magnet; email asked at the end for "save your tour + get pricing".

---

## SPRINT C — Conversion mechanics (week 3–8)

Optimise the capture → close path.

### [ ] C-01 · Re-designed `/contact` page

Current: one long form. Three-column redesign:

| Column | Who it's for | Outcome |
|---|---|---|
| Book a 20-min call | Ready to talk | Calendar embed |
| Get a fleet quote | Tyre-kicking | Richer form (fleet size, vehicles, timeline) → auto-routed to sales |
| Ask a question | Info-seekers | Simple form, replies in 1 business day |

Separating these doubles conversion — the "ready to talk" user doesn't have to wade through a qualification form.

### [ ] C-02 · Smart form progressive profiling

Don't ask for 9 fields on first capture. Ask for email only. Then on every subsequent page visit, ask for one more field via a small inline prompt:

```
"Welcome back. What size fleet are you managing?" [10–49 / 50–199 / 200+ / other]
```

Over 3–4 visits you build a full profile without the friction of a long form. Needs cookies + a tiny backend to merge visits to a single lead record.

### [ ] C-03 · Pricing transparency

Current: zero pricing visible. Even a "from £X/month for a [vehicle category]" indicator massively reduces bounce from price-sensitive prospects.

Minimum: a **"How we price"** page explaining the model (all-inclusive monthly, variable by vehicle/term/mileage, Orbis included free). Signals confidence.

Better: a "vehicle of the month" card rotating examples — *"Tesla Model 3 · 48mo · 10k miles · £459/mo · Orbis included"*.

### [ ] C-04 · Social proof on every form

Above every capture form add:

> *"Join 340 UK fleet operators already using Olaris."* (newsletter)
> *"8 quotes requested in the last 7 days."* (contact)
> *"Alan personally replies within 4 business hours."* (personal touch)

The recent-activity widget in your existing site code — repurpose it. Credible > impressive.

### [ ] C-05 · Nurture existing contacts

How many emails are in your current contact list that never converted? If >50, build a "re-engagement" campaign. One email: *"We've built a lot since we last spoke. 90 seconds to show you what's new."* — with a Loom video.

Cheapest pipeline there is.

### [ ] C-06 · Thank-you pages that do work

Every form submit currently goes to "thanks, we'll reply". Instead, route to dedicated thank-you pages with:

- Confirmation of what happens next (+ timeline)
- An immediate next step (read this case study · book a 20-min call)
- A shareable resource (*"Send this to a colleague who cares about fleet cost"* — with a tracking UTM)

A thank-you page is the highest-attention moment on your site. Use it.

---

## SPRINT D · Measurement + iteration (ongoing)

### [ ] D-01 · Funnel dashboard

Set up a simple Sheet or Metabase view:

| Stage | Current | Target 90d | Measure |
|---|---|---|---|
| Sessions | ~600/mo | 2,500/mo | GA4 |
| Tool completions | ? | 400/mo | `tool_calculation_completed` |
| Email captures | ~0 | 120/mo | `lead_captured` |
| Calls booked | ~? | 25/mo | Cal.com |
| Quotes issued | ~? | 15/mo | Sales CRM |
| Signed deals | ? | 2–4/mo | Sales CRM |

Review monthly. If any stage-to-stage conversion is <10% of benchmark, fix that stage first.

### [ ] D-02 · A/B test the top 3 CTAs

Once traffic justifies it (day 60+):

1. Homepage hero CTA copy: "Get a Quote" vs "Book a 20-min call" vs "See Orbis in 3 minutes"
2. Post-calculator CTA: PDF report vs BCH quote vs "talk to Alan"
3. Exit intent: resource vs call booking vs newsletter

Use a simple tool (PostHog Experiments, GrowthBook, or DIY with Edge Config). Ship one, win or lose cleanly in 3 weeks, ship the next.

### [ ] D-03 · Session replay on tool pages

Add Hotjar / PostHog session recordings, gated to `/tools/*` only (privacy-sensitive on commercial pages). Watch 10 sessions per month. You'll find friction points no analytics can show.

### [ ] D-04 · Quarterly voice-of-customer interview

Book 3 × 30-min calls with recent customers each quarter. Questions: "What nearly stopped you signing?" "Which page/moment convinced you?" "What didn't we explain clearly?"

This is the single most underused growth tool in B2B. One call often changes a CTA that was costing you 40% conversion.

---

## Priority ordering — if you can only do 10 things

If sprint discipline slips, these are the 10 that produce the most conversion leverage:

1. **A-01 · Exit-intent on calculator pages** — catches the #1 traffic source
2. **A-04 · Cal.com booking embed** — replaces "contact us" on high-intent pages
3. **A-03 · Grey Fleet Policy Template** — first inline lead magnet, pairs with SEO pillar
4. **A-06 · 7-email drip post-calculator** — converts captures into conversations
5. **C-01 · Three-column /contact redesign** — stops high-intent prospects bouncing
6. **B-04 · Alan as face of the brand** — E-E-A-T + trust + differentiator
7. **B-03 · 3 case studies with real numbers** — credibility at decision stage
8. **A-05 · Newsletter reframe** — ongoing top-of-funnel engine
9. **C-03 · Pricing transparency page** — removes the silent bounce
10. **D-01 · Funnel dashboard** — so you know what's working

Everything else compounds on top of these.

---

## Honest caveats

- All capture-rate numbers above are industry benchmarks for B2B SaaS/leasing at similar traffic. Your mileage will vary in the first 60 days as you find voice/offer fit.
- Don't launch all 6 capture surfaces at once on the same page — they'll fight each other and degrade UX. Add one, measure 2 weeks, add the next.
- Email list quality > quantity. A 500-person list of UK fleet managers is worth more than a 5,000-person list with half consumers and half bots. Optimise for fit.
- If your sales capacity can't handle 25 calls/month post-growth, hire or qualify harder before you turn up the capture taps. Nothing kills conversion like a prospect ghosted for a week.

---

*Pair this with the SEO brief. SEO builds the top of the funnel; this builds the middle and bottom. Both together is how engagement, capture, and conversion all move at once.*
