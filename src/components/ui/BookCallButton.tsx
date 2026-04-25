'use client'

/**
 * Cal.com booking button. Opens the booking flow in a Cal.com popup
 * overlay so the user never leaves the page — significantly stronger
 * conversion than navigating away to /contact (per conversion addendum
 * A-04: "moves commitment up a stage").
 *
 * Loads Cal.com's official embed script once (via next/script with
 * strategy="afterInteractive") then triggers the popup imperatively on
 * click. Avoids the verbose IIFE bootstrap from Cal's docs — the
 * runtime API works the same once the script is on the page.
 *
 * Falls back gracefully when NEXT_PUBLIC_CAL_LINK is unset:
 *   - Renders the `fallback` prop (callers supply a normal link).
 *   - Lets us ship the embed alongside Cal.com setup work without
 *     coupling the deploy to env-var rollout.
 *
 * Fires `demo_requested` on click (intent declared) so funnel analysis
 * can separate "pressed Book a call" from later actual bookings.
 */

import Script from 'next/script'
import { useEffect, useState, type ReactNode } from 'react'
import { track } from '@/lib/analytics'

const CAL_NAMESPACE = 'olaris-booking'

type CalApi = (command: string, ...args: unknown[]) => void
interface CalGlobal extends CalApi {
  ns?: Record<string, CalApi>
}

function getCal(): CalGlobal | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { Cal?: CalGlobal }).Cal ?? null
}

function initCalNamespace(): void {
  const Cal = getCal()
  if (!Cal) return
  Cal('init', CAL_NAMESPACE, { origin: 'https://cal.com' })
  Cal.ns?.[CAL_NAMESPACE]?.('ui', {
    theme: 'dark',
    cssVarsPerTheme: { dark: { 'cal-brand': '#06b6d4' } },
    hideEventTypeDetails: false,
    layout: 'month_view',
  })
}

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
  const [scriptReady, setScriptReady] = useState(false)

  // Re-init the namespace if the script was already loaded (e.g. another
  // BookCallButton mounted earlier on the same page). Cheap, idempotent.
  useEffect(() => {
    if (!calLink) return
    if (getCal()) initCalNamespace()
  }, [calLink])

  if (!calLink) {
    return <>{fallback}</>
  }

  return (
    <>
      <Script
        id="cal-embed-loader"
        strategy="afterInteractive"
        src="https://app.cal.com/embed/embed.js"
        onLoad={() => {
          initCalNamespace()
          setScriptReady(true)
        }}
      />
      <button
        type="button"
        data-cal-namespace={CAL_NAMESPACE}
        data-cal-link={calLink}
        data-cal-config={JSON.stringify({ layout: 'month_view', theme: 'dark' })}
        onClick={() => {
          const page =
            fromPage ??
            (typeof window === 'undefined' ? '' : window.location.pathname)
          track('demo_requested', { from_page: page })

          // If the script hasn't loaded yet (rare — user clicks before
          // afterInteractive fires), trigger a manual open via the API
          // once it's available. Cal's data attributes auto-bind on
          // script load, so this only matters for very fast clicks.
          if (!scriptReady) {
            const tryOpen = (attempts: number) => {
              const Cal = getCal()
              if (Cal) {
                Cal.ns?.[CAL_NAMESPACE]?.('modal', {
                  calLink,
                  config: { layout: 'month_view', theme: 'dark' },
                })
                return
              }
              if (attempts > 0) setTimeout(() => tryOpen(attempts - 1), 100)
            }
            tryOpen(20)
          }
        }}
        className={className}
      >
        {children}
      </button>
    </>
  )
}
