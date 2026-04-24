# Olaris — Content Style & Voice Guide

**Scope:** blog posts, pillar pages, lead-magnet assets (PDFs, templates), LinkedIn copy, email drips.
**Not in scope:** tool UI copy, form labels, error messages, transactional email (those follow product copy rules — not this doc).

This guide documents what already works in the Olaris blog and pins it as the standard for future work. When a new post drifts from this, either the post needs revising or this file does — it's a living document.

## Voice

**First-person plural for company perspective. First-person singular when it's Alan's lived experience.**

The blog's edge is that it comes from someone who has actually run fleets. Lean into that. The existing opener from blog-01 is the template:

> *"Here's a confession: we spent 15 years in fleet operations before we built Olaris, and for most of that time, we didn't actually know what our vehicles cost to run."*

That sentence tells the reader within the first 20 words (a) we've been in their shoes, (b) this isn't a product pitch dressed as an article, (c) we're going to be direct. Every long-form piece should hit those three within the first paragraph.

**Rules of thumb:**

- Write like you're explaining something to another fleet manager over coffee. Not a presentation. Not a white paper.
- Use "you" for the reader. Don't address them as "fleet managers" or "organisations" — that distance kills trust.
- Concrete numbers beat adjectives. "£160,000 in excess mileage charges across a 200-vehicle fleet at 8p per mile" is a better opener than "enormous potential savings."
- Cite sources for claims that would otherwise sound like marketing copy (DfT, HSE, BVRLA, HMRC, Energy Saving Trust, ONS — see the existing blog-12 pattern).
- Admit what you don't know. "We've seen fleets discover…" is stronger than "every fleet suffers from…"

## Voice — what NOT to do

From the content addendum and what the existing corpus avoids:

- **No consulting-speak.** "Leverage synergies", "drive alignment", "unlock value" — bin.
- **No SEO filler.** Don't repeat the target keyword every other paragraph. The existing blog-11 mentions "fleet intelligence" naturally in-flow; that's the pattern.
- **No breathless hype.** "Revolutionary", "game-changing", "cutting-edge" — bin. Claims that specific = trust. Claims that vague = noise.
- **No generic AI takes.** Per content addendum: resist the urge to write about AI, EVs in general, or macro trends. Google doesn't reward generic takes. Our edge is *specific UK fleet operator pain* — stay narrow.
- **No fabricated case studies.** If we don't have client permission to tell a specific story, the story uses anonymised descriptors ("a 200-vehicle logistics fleet in the Midlands"). Never invent quotes.

## Reading level

- **Target: Year 9 UK equivalent** (~age 14). Fleet managers are busy, not thick — short words + short sentences respect their time.
- Break complex ideas into numbered steps or a list. The existing blog-01 "Where the Numbers Lie" section (1. Fuel Consumption, 2. …) is a good pattern.
- Aim for sentences under 25 words. Anything over 35 words rewrite or split.
- If you write a paragraph over 5 sentences, break it up. Fleet managers skim on mobile.

## Length

Established range in the current blog corpus:

| | Words |
|---|---|
| Shortest published | ~1,500 |
| Median | ~2,400 |
| Longest | ~3,200 |
| Target for new posts | 2,000–2,800 |
| Pillar pages (per SEO brief T3-01) | 2,500–3,500 |

**Don't publish under 1,500 words.** Short posts don't rank on the queries we care about, and the topics we cover genuinely need the space.

**Don't pad to hit a target.** If a post says what it needs to say in 1,800 words, stop. The length rule is a floor, not a fill level.

## Required elements per blog post

Every new post must include all of:

1. **Frontmatter** — see template below. `title`, `metaTitle`, `metaDescription`, `category`, `headerImage`, `date`, optional `faqSchema`.
2. **H1 at the top of the markdown body.** Matches the frontmatter `title`. The `[slug]/page.tsx` template strips it from rendering (it's used in the hero) but it must exist in the `.md` file for markdown parsers + previews.
3. **Strong opener.** 2–3 paragraphs that hook with a story or number, not a definition. See the "Voice" section examples.
4. **2+ H2 sections.** No hard cap, but existing posts typically use 5–8.
5. **2+ contextual internal links to other blog posts or commercial pages.** The cluster system (`<RelatedPostsBlock>`) adds related reading automatically — that's in addition to body-copy links, not a substitute.
6. **1+ link to a commercial destination** (the cluster's `commercialCTA` from `src/content/blog/clusters.ts`, or equivalent). Every post earns its keep by giving readers a path toward conversion.
7. **Closing "Further Reading" list** — 3–5 authoritative external citations (.gov.uk, HSE, BVRLA, HMRC, ORSA, Energy Saving Trust, etc.). Builds E-E-A-T; makes the post feel like reporting, not marketing.
8. **`faqSchema` in frontmatter** when the topic naturally answers questions. Current posts average 5–7 questions each. The `[slug]/layout.tsx` emits this as `FAQPage` JSON-LD automatically.
9. **Category** from the existing enum: *Cost Intelligence, Mileage, Driver Behaviour, Compliance, ESG, Thought Leadership, Fleet Management*. Don't invent new categories without adding them to `src/app/blog/[slug]/page.tsx` and `[slug]/layout.tsx`.
10. **Cluster assignment.** Before merging, add the post's slug to the appropriate cluster in [`src/content/blog/clusters.ts`](../src/content/blog/clusters.ts). Unclustered posts are orphan posts — same thing.

What is **automatic** (don't duplicate in the body):

- **Author byline** — the shared [`AuthorBio`](../src/components/ui/AuthorBio.tsx) component renders at the bottom. Don't write "By Alan Carreras" in the markdown; the template handles it.
- **Related reading block** — `<RelatedPostsBlock>` renders after the body from the cluster manifest.
- **Breadcrumb schema + BlogPosting schema** — emitted by `src/app/blog/[slug]/layout.tsx`.
- **Category badge, read time, publication date** — rendered from frontmatter by the slug page.

## Frontmatter template

```yaml
---
title: "The Hook-Heavy Title — Sub-Phrase That Explains"
metaTitle: "Primary Query First · Secondary Context | Olaris"
metaDescription: "155-char pitch. Lead with the specific insight, not the brand. See README-analytics.md-style density."
category: "Compliance" # or Cost Intelligence / Mileage / Driver Behaviour / ESG / Thought Leadership / Fleet Management
headerImage: "Literal visual description for future art/photo brief — not alt text"
date: 2026-05-01 # ISO date. Update if the post is materially refreshed.
faqSchema:
  - question: "A natural question a reader would search for?"
    answer: "A 30–80 word answer. Complete sentence. Quotable on its own. Don't write 'it depends' — pick the most common case."
  - question: "Another natural question?"
    answer: "…"
---
```

**Meta title rules:**

- Lead with the commercial query, not the brand. "Olaris · X" loses; "X · Olaris" wins.
- Separator: `·` (middle dot) — matches the existing set (`Excess Mileage Calculator UK · Free, HMRC-aligned · Olaris`).
- Keep under 60 chars where possible; hard limit 70.

**Meta description rules:**

- 140–155 chars. Under 70 is underusing; over 160 gets truncated by Google.
- Specific insight, not puffery. Numbers, "HMRC-aligned", "UK rates" — concrete hooks.
- Don't repeat the title verbatim.

## Byline + E-E-A-T

The [`AuthorBio`](../src/components/ui/AuthorBio.tsx) component renders at the bottom of every blog post automatically. It includes:

- Alan's name + "Founder, Olaris" + LinkedIn icon (external link)
- Avatar (initials card for now — swap to photo in T2-03 when headshot lands)
- Credentials block: former Chair of the BVRLA Leasing Broker Committee, 12 years at Bridle Group, 18 acquisitions. These are the signals Google weighs for E-E-A-T on YMYL-adjacent topics.

**Don't override the byline per-post.** If a post has a guest author, the right move is to extend `AuthorBio` with a prop — not to write bylines inline in markdown.

## Schema

All blog posts automatically get three schema blocks from `src/app/blog/[slug]/layout.tsx`:

1. **`BlogPosting`** — pulled from frontmatter (title, date, description, canonical URL).
2. **`BreadcrumbList`** — Home → Blog → Post title.
3. **`FAQPage`** — only when `faqSchema` is present in frontmatter.

If you need a *different* schema type (`HowTo`, `Recipe`, `Article` variant), add it to the post-specific `page.tsx` or a per-cluster layout. Don't hand-roll JSON-LD inside the markdown body — it renders as literal text.

## Internal linking

See the cluster manifest at [`src/content/blog/clusters.ts`](../src/content/blog/clusters.ts).

Before merging a new post:

1. Add its slug to the relevant cluster's `posts` array.
2. In the body, include **at least** one link to the cluster's `commercialCTA.href` with the anchor phrase from `commercialCTA.anchor` (or a variant — the anchor phrase is a suggested default, not a legal contract).
3. Include 1–2 sibling post links in-body. Don't rely only on the auto-rendered `<RelatedPostsBlock>` for cross-links — Google weighs body links more heavily than footer links.

Don't link to the same URL more than 2× in one post. The second instance has diminishing SEO value and starts to read spammy.

## External citations

- Prefer **.gov.uk**, regulators (BVRLA, FLA, DVLA, HMRC), trade bodies (BVRLA, ORSA, Brake, RAC Foundation), and national statistics bodies (ONS, DfT).
- One `.org` citation per post minimum where the topic touches safety or policy.
- Don't link to competitor software vendors — it trades authority for nothing.
- Don't link to posts older than ~5 years unless they're the canonical source (e.g. foundational government legislation).
- Each external link opens in the same tab unless it would break a flow the reader is clearly working through — default is same-tab.

## Related roadmap tasks

- **T2-02** (shipped) created the cluster system this guide references.
- **T3-01** (grey-fleet pillar) and **T3-02** (four supporting posts) are the first major tests of this guide. If either task finds a rule that's blocking rather than helping, update this doc in the same PR.
- **CO-01 editorial calendar** (deferred) will reference this guide's required elements as the acceptance checklist for planned posts.
- **CO-02 repurposing pipeline** (deferred) will consume this guide's voice rules when we generate LinkedIn carousels / YouTube scripts / email-course modules from pillar content.

## Change log

- **24 Apr 2026** — Initial version, documenting the voice + length + structural patterns established in the existing 16-post corpus. Frontmatter template pulled from blog-14 (fullest example in the corpus).
