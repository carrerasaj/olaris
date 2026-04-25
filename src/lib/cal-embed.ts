/**
 * Cal.com embed loader.
 *
 * Cal's embed script (`https://app.cal.com/embed/embed.js`) requires a
 * specific bootstrap to be executed BEFORE the script tag is added to
 * the DOM. The bootstrap creates a queueing `window.Cal` stub that the
 * embed script "hydrates" once it loads.
 *
 * If you simply <script src="https://app.cal.com/embed/embed.js">
 * without the bootstrap, the script throws `Cal is not defined` at line
 * 221 of embed.js — observed locally on first integration. So the IIFE
 * is non-negotiable, even though it looks ugly next to a clean
 * `next/script` tag.
 *
 * This module wraps the bootstrap in a single idempotent `loadCal()`
 * promise. Call it from any client component that wants Cal — repeats
 * are no-ops.
 */

const CAL_SCRIPT_URL = 'https://app.cal.com/embed/embed.js'

let loadPromise: Promise<void> | null = null

export function loadCal(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    // Cal.com's verbatim bootstrap, adapted to TS and to resolve once
    // the script has loaded. The cast/disable comments are because the
    // pattern manipulates `window.Cal` in ways TypeScript's structural
    // typing can't follow — Cal.com itself authors this in plain JS.
    const w = window as unknown as {
      Cal?: {
        (...args: unknown[]): void
        loaded?: boolean
        ns?: Record<string, unknown>
        q?: unknown[]
      }
    }

    if (!w.Cal) {
      type CalStub = {
        (...args: unknown[]): void
        loaded?: boolean
        ns?: Record<string, unknown>
        q?: unknown[]
      }
      const stub: CalStub = function (this: unknown) {
        // eslint-disable-next-line prefer-rest-params
        const ar = arguments
        const cal = w.Cal!
        if (!cal.loaded) {
          cal.ns = {}
          cal.q = cal.q || []
          const script = document.createElement('script')
          script.src = CAL_SCRIPT_URL
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Cal embed.js failed to load'))
          document.head.appendChild(script)
          cal.loaded = true
        }
        if (ar[0] === 'init') {
          const namespace = ar[1] as string | undefined
          if (typeof namespace === 'string') {
            type NsApi = ((...args: unknown[]) => void) & { q: unknown[] }
            const api = function (this: unknown) {
              // eslint-disable-next-line prefer-rest-params
              ;(api as NsApi).q.push(arguments)
            } as NsApi
            api.q = []
            cal.ns![namespace] = api
            api.q.push(ar)
            cal.q!.push(['initNamespace', namespace])
            return
          }
          cal.q!.push(ar)
          return
        }
        cal.q!.push(ar)
      }

      stub.q = []
      stub.loaded = false
      stub.ns = {}
      w.Cal = stub
    } else {
      // Already bootstrapped — script may also already be loaded. If
      // it is, resolve straight away; otherwise the in-flight promise
      // will resolve when the existing onload fires.
      if (w.Cal.loaded) resolve()
    }
  })

  return loadPromise
}

interface CalApi {
  (command: string, ...args: unknown[]): void
}

export function getCalNamespace(namespace: string): CalApi | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    Cal?: { ns?: Record<string, CalApi> }
  }
  return w.Cal?.ns?.[namespace] ?? null
}

export function getCal(): CalApi | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { Cal?: CalApi }).Cal ?? null
}
