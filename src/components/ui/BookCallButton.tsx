'use client'

/**
 * Cal.com booking button. Opens the booking flow in a Cal.com popup
 * overlay so the user never leaves the page — significantly stronger
 * conversion than navigating away to /contact (per conversion addendum
 * A-04: "moves commitment up a stage").
 *
 * Uses Cal.com's official bootstrap pattern via `loadCal()`
 * (src/lib/cal-embed.ts). Loading the embed script directly with
 * <script src="..."> doesn't work — the script expects a queueing
 * `window.Cal` stub set up by the bootstrap and throws otherwise.
 *
 * Falls back gracefully when NEXT_PUBLIC_CAL_LINK is unset:
 *   - Renders the `fallback` prop (callers supply a normal link).
 *   - Lets us ship the embed alongside Cal.com setup work without
 *     coupling the deploy to env-var rollout.
 *
 * Fires `demo_requested` on click (intent declared) so funnel analysis
 * can separate "pressed Book a call" from later actual bookings.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { track } from '@/lib/analytics'
import { loadCal, getCalNamespace, getCal } from '@/lib/cal-embed'

const CAL_NAMESPACE = 'olaris-booking'

interface BookCallButtonProps {
  children?: ReactNode
  className?: string
  /** Source label for the demo_requested event. Defaults to current pathname. */
  fromPage?: string
  /** Optional fallback element when NEXT_PUBLIC_CAL_LINK is unset. */
  fallback?: ReactNode
}

export function BookCallButton({
  children = 'Book a 20-min call',
  className = '',
  fromPage,
  fallback = null,
}: BookCallButtonProps) {
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK
  const initStartedRef = useRef(false)

  // Kick off the bootstrap + namespace init as soon as the button mounts.
  // Repeated calls across multiple buttons on the same page are no-ops
  // thanks to loadCal's memoised promise.
  useEffect(() => {
    if (!calLink || initStartedRef.current) return
    initStartedRef.current = true

    // Init the namespace via the queueing stub *before* the script
    // loads — Cal flushes the queue on hydration. Configures branding
    // (dark theme + Olaris cyan brand colour).
    const cal = getCal()
    cal?.('init', CAL_NAMESPACE, { origin: 'https://cal.com' })

    loadCal()
      .then(() => {
        const ns = getCalNamespace(CAL_NAMESPACE)
        ns?.('ui', {
          theme: 'dark',
          cssVarsPerTheme: { dark: { 'cal-brand': '#06b6d4' } },
          hideEventTypeDetails: false,
          layout: 'month_view',
        })
      })
      .catch((e) => {
        console.warn('[cal] embed init failed', e)
      })
  }, [calLink])

  if (!calLink) {
    return <>{fallback}</>
  }

  function handleClick() {
    const page =
      fromPage ?? (typeof window === 'undefined' ? '' : window.location.pathname)
    track('demo_requested', { from_page: page })

    // Trigger the modal imperatively rather than relying on Cal's
    // auto-binding to data attributes — that auto-bind has timing
    // issues if the click lands before the script finishes loading.
    // Calling through the queueing stub means it'll fire as soon as
    // the script is ready, even if the user clicks immediately.
    const ns = getCalNamespace(CAL_NAMESPACE)
    if (ns) {
      ns('modal', {
        calLink,
        config: { layout: 'month_view', theme: 'dark' },
      })
    } else {
      // Stub also accepts queued calls; flushed when script lands.
      const cal = getCal()
      cal?.('modal', {
        calLink,
        config: { layout: 'month_view', theme: 'dark' },
      })
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
