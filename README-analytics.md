# Olaris — Analytics

Typed GA4 event wrapper + event registry. This file documents what fires
where and the manual GA4 admin steps Alan needs to do (marking conversions,
configuring enhanced measurement).

## Setup

- GA4 base snippet lives in `src/app/layout.tsx`, production-only gated via
  `process.env.NEXT_PUBLIC_GA_ID`.
- The typed wrapper is at [`src/lib/analytics.ts`](src/lib/analytics.ts).
  Every event call goes through `track(name, props, opts?)`.
- In development (`NODE_ENV !== 'production'`) events log to the browser
  console instead of firing against the GA property — no noise in the prod
  GA data while building.

To verify locally: temporarily unset the production gate in
`src/app/layout.tsx` OR deploy to a preview branch. The cleaner path is a
preview deploy — GA4 DebugView picks up events with `debug_mode: true`
automatically when tagged via the Chrome GA Debugger extension.

## Event registry

All events and their props live in the `EventMap` type in
[`src/lib/analytics.ts`](src/lib/analytics.ts). TypeScript enforces shape at
every call site. The table below is the human-readable mirror.

| Event | Fires when | Props | Fired from |
|---|---|---|---|
| `tool_calculation_completed` | Calculator produces a headline result (debounced 1s, deduped per page-view) | `tool`: `'excess-mileage' \| 'company-car-tax' \| 'ev-transition' \| 'fleet-compliance'`; `result_numeric?`: number | `FleetMileageCalculator`, `CompanyCarTaxCalculator`, `ExcessMileageCalculator`, `FleetComplianceChecker` |
| `lead_captured` | Any form capture succeeds | `source`: stable enum — see EventMap | `/contact`, `ExcessMileageCalculator` (inline email). Future: exit-intent, sticky-bar, pillar-download, etc. |
| `quote_requested` | `/contact` form success with enquiry = BCH or Salary Sacrifice | `fleet_size_bucket?`, `urgency?` (optional until T4-01 contact redesign) | `/contact` |
| `demo_requested` | `/contact` form success with enquiry = Platform Demo, OR a "Book a demo" CTA click | `from_page`: string | `/contact`. Future: platform demo CTAs |
| `cta_click` | Any primary CTA click | `label`, `destination`, `from_page` | `GradientBorderButton`, `TrackedLink` (via `CTABanner`, homepage hero) |

## Instrumented surfaces

- `src/components/tools/FleetMileageCalculator.tsx` — `tool_calculation_completed`
- `src/components/tools/CompanyCarTaxCalculator.tsx` — `tool_calculation_completed`
- `src/components/tools/ExcessMileageCalculator.tsx` — `tool_calculation_completed`, `lead_captured` (source: excess-mileage)
- `src/components/tools/FleetComplianceChecker.tsx` — `tool_calculation_completed`
- `src/app/contact/page.tsx` — `lead_captured`, `quote_requested`, `demo_requested`
- `src/components/marketing/GradientBorderButton.tsx` — `cta_click`
- `src/components/ui/TrackedLink.tsx` — `cta_click` (via `CTABanner`, homepage hero)

## Known gaps (deliberate, tracked in the growth roadmap)

- **Newsletter signup** — the footer/sidebar newsletter uses a Beehiiv iframe
  (`subscribe-forms.beehiiv.com/embed.js`). Cross-origin — we can't hook its
  submit from our JS. Options when we need the signal:
  1. Switch to a Beehiiv webhook → server route → fire server-side GA Measurement Protocol event.
  2. Replace the iframe with a native form hitting Beehiiv's API.
  3. Use Beehiiv's own analytics + reconcile by email later.
  The SEO brief S1-05 lists `source: 'newsletter'` as a future value; it's
  wired in the EventMap so when one of the above approaches lands, the
  call site is ready.
- **EV transition planner** — no interactive calculator yet; the page is
  content-only. When an interactive tool lands there, wire
  `tool_calculation_completed` with `tool: 'ev-transition'`.
- **SPA page views** — we rely on GA4 Enhanced Measurement (History API
  events) rather than a hand-rolled router listener. See admin steps below.

## Manual GA4 admin steps (Alan)

1. **Confirm Enhanced Measurement is on.**
   GA4 → Admin → Data Streams → pick the Olaris web stream → Enhanced
   Measurement (toggle should be on). This is the default for new properties.
   The "Page changes based on browser history events" sub-option is the one
   that matters for Next.js App Router navigation.

2. **Mark these events as conversions.**
   GA4 → Admin → Events → flip the "Mark as conversion" toggle for:
   - `lead_captured`
   - `quote_requested`
   - `demo_requested`

   (Leave `tool_calculation_completed` and `cta_click` as events — they're
   funnel-stage measures, not conversions.)

3. **Verify events are firing.**
   - Install the GA Debugger Chrome extension OR append `?debug_mode=1` to
     the URL.
   - Open GA4 → Admin → DebugView.
   - Trigger each event (fill a form, complete a calculator, click a CTA).
     Events should appear in DebugView within a few seconds.

4. **Link to Google Search Console** (future, unrelated to F-01 but makes
   the funnel dashboard richer).
   GA4 → Admin → Search Console Links.

5. **Set up a funnel exploration.**
   GA4 → Explore → Funnel exploration. Build with these steps:
   - Step 1: `session_start`
   - Step 2: `tool_calculation_completed`
   - Step 3: `lead_captured`
   - Step 4: `quote_requested` OR `demo_requested`

   Breakdown by `tool` or `source` for per-surface conversion rates.

## When extending

To add an event:

1. Add a row to `EventMap` in `src/lib/analytics.ts` with the prop shape.
2. Call `track('<new_event>', { ... })` from the relevant component.
3. Add a row to the table in this file.
4. If it's a conversion, add it to the "Mark as conversion" list above.

To change a prop shape: update `EventMap` — TypeScript will flag every call
site that needs updating. Keep enum values stable (e.g. `source: 'contact'`)
— renaming breaks historical GA4 reports.

## Known quirk: dedupe vs re-fire

`tool_calculation_completed` uses `{ dedupe: true }` — once a tool fires for
a given result on a given page-view, subsequent input changes that produce
a different result won't re-fire. This is intentional:

- **Pro**: one event per tool per session, clean funnel metrics.
- **Con**: we lose the signal "user tweaked inputs and saw 3 distinct
  results before leaving."

If we later want per-result events (for session-level behaviour analysis),
drop `dedupe: true` and add a separate `tool_result_changed` event — don't
repurpose the existing one.
