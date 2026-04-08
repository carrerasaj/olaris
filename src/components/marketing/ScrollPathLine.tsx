'use client'

import { useEffect, useRef } from 'react'

/**
 * Scroll-linked SVG path that draws progressively as the user scrolls the page.
 *
 * As the visitor scrolls, strokeDashoffset reduces from the full path length
 * to 0, revealing a meandering cyan line down the page. The curve shape is
 * tuned via the `d` attribute — adjust the control points to change the flow.
 *
 * Respects prefers-reduced-motion (no animation, line hidden entirely).
 */
export function ScrollPathLine() {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    // Respect reduced motion — skip the scroll-linked draw entirely.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      path.style.opacity = '0'
      return
    }

    const pathLength = path.getTotalLength()
    path.style.strokeDasharray = `${pathLength}`
    path.style.strokeDashoffset = `${pathLength}`

    let rafId = 0
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
      path.style.strokeDashoffset = `${pathLength * (1 - scrollPercent)}`
    }

    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        update()
        rafId = 0
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      viewBox="0 0 1920 8000"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d="M960,0 Q1200,800 800,1600 T1100,3200 T700,4800 T1200,6400 T960,8000"
        fill="none"
        stroke="#26D8FD"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  )
}
