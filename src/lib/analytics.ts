/**
 * GA4 analytics wrapper.
 *
 * The GA4 base snippet is loaded in `src/app/layout.tsx` (production only).
 * This module is the thin, typed surface every caller goes through so:
 *
 *   1. Event names + prop shapes are centralised. No more stringly-typed
 *      gtag('event', 'whatever', {...}) scattered across components.
 *   2. Dev-mode calls log to console instead of calling gtag — visible
 *      feedback while building, no noise in GA property.
 *   3. Double-fire protection for events that might recompute on every
 *      state change (e.g. useMemo-driven calculator results).
 *
 * Usage:
 *
 *     import { track } from '@/lib/analytics'
 *     track('lead_captured', { source: 'excess-mileage' })
 *
 * Pageviews on SPA navigation:
 *
 *   We rely on GA4 Enhanced Measurement (History API events) instead of
 *   hand-rolling a router listener. This is configured in the GA4 admin
 *   and is on by default for new properties. The README-analytics.md
 *   at repo root documents the admin check.
 */

// ─── Event map ──────────────────────────────────────────────────────────

/**
 * Registry of all analytics events. Adding a new event means adding a
 * row here — the `track()` call is then type-checked against it.
 */
interface EventMap {
  /**
   * Fired once per tool page-view when the user has produced a meaningful
   * result. Calculators use useMemo to recompute results on every
   * keystroke; call sites debounce + dedupe so this fires at most once
   * per distinct result within a session.
   */
  tool_calculation_completed: {
    tool:
      | 'excess-mileage'
      | 'company-car-tax'
      | 'ev-transition'
      | 'fleet-compliance'
    /** The headline result number — e.g. annual excess mileage £ for mileage calc, BIK £ for tax calc. Omitted when no single headline exists. */
    result_numeric?: number
  }

  /**
   * Fired on any successful email / form capture across the site. `source`
   * is the surface — keep values stable so funnel queries in GA4 are easy.
   */
  lead_captured: {
    source:
      | 'excess-mileage'
      | 'company-car-tax'
      | 'ev-transition'
      | 'fleet-compliance'
      | 'contact'
      | 'newsletter'
      | 'pillar-download'
      | 'exit-intent'
      | 'sticky-bar'
      | 'case-study'
      | 'fleet-scorecard'
  }

  /** /contact form success when the user selected a quote-style service. */
  quote_requested: {
    fleet_size_bucket?: '1-9' | '10-49' | '50-199' | '200+'
    urgency?: 'now' | '30-days' | '90-days' | 'exploring'
  }

  /** /contact form success when the user selected Platform Demo, or a "Book a demo" CTA click. */
  demo_requested: {
    from_page: string
  }

  /** Primary CTA clicks (hero, banner, in-content). Keep `label` stable — it's the GA4 groupable dimension. */
  cta_click: {
    label: string
    destination: string
    from_page: string
  }
}

export type EventName = keyof EventMap

// ─── gtag typing ────────────────────────────────────────────────────────

type GtagFn = (
  command: 'event' | 'config' | 'js' | 'set',
  eventNameOrDate: string | Date,
  params?: Record<string, unknown>,
) => void

declare global {
  interface Window {
    gtag?: GtagFn
    dataLayer?: unknown[]
  }
}

// ─── Dedup state ────────────────────────────────────────────────────────
//
// Some events are prone to double-firing (calculator results recomputing
// on every keystroke, form submit handlers re-running on StrictMode mount).
// We keep a tiny in-memory set of fingerprints to drop duplicates within
// the same page-view. Crossing a route change clears the set naturally
// because tools live on dedicated routes; if an event fingerprint escapes
// a route it's probably a bug worth investigating.

const firedFingerprints = new Set<string>()

function fingerprint<E extends EventName>(
  event: E,
  props: EventMap[E],
): string {
  // Stable stringify — tiny payloads, JSON.stringify with sorted keys
  // would be overkill. Ordering is consistent enough in practice.
  return `${event}::${JSON.stringify(props)}`
}

// ─── Public API ─────────────────────────────────────────────────────────

export interface TrackOptions {
  /** If true, the same event+props combo fires at most once per page-view. Default: false. */
  dedupe?: boolean
}

/**
 * Fire a GA4 event. Type-safe against the EventMap above.
 *
 * In development, logs to console instead of calling gtag — the GA
 * snippet is production-only per layout.tsx.
 */
export function track<E extends EventName>(
  event: E,
  props: EventMap[E],
  opts: TrackOptions = {},
): void {
  if (opts.dedupe) {
    const fp = fingerprint(event, props)
    if (firedFingerprints.has(fp)) return
    firedFingerprints.add(fp)
  }

  if (typeof window === 'undefined') return

  const isDev = process.env.NODE_ENV !== 'production'
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, props)
    return
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', event, props as Record<string, unknown>)
  }
}

/**
 * Reset the dedupe cache. Mostly useful for tests or when a calculator
 * explicitly wants to re-fire after a hard reset. Routes tear down the
 * component tree so you rarely need to call this yourself.
 */
export function resetAnalyticsDedupe(): void {
  firedFingerprints.clear()
}
