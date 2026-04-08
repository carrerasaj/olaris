'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Topographic wave background with cursor-proximity cyan highlight.
 *
 * - Base layer: 40 horizontal wave paths in dark grey.
 * - Highlight layer: identical paths in cyan, masked by a radial gradient
 *   that follows the cursor via CSS custom properties (no React re-renders).
 * - Respects prefers-reduced-motion (no cursor tracking, no highlight layer).
 * - Mobile / touch: no mousemove events, so the highlight stays off-screen.
 * - pointer-events-none: purely decorative, never blocks interaction.
 */
export function WaveBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    // Set initial cursor position off-screen so the highlight isn't visible
    // until the user actually moves their mouse.
    document.documentElement.style.setProperty('--wave-cursor-x', '-9999px')
    document.documentElement.style.setProperty('--wave-cursor-y', '-9999px')

    const onMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--wave-cursor-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--wave-cursor-y', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [reducedMotion])

  // Generate 40 wave paths once. Stable across re-renders.
  const paths = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const y = (i / 40) * 1080
      const amplitude = 15 + (i % 7) * 8
      const frequency = 0.003 + (i % 4) * 0.001
      const phase = i * 0.5
      const points = Array.from({ length: 80 })
        .map((_, x) => {
          const xPos = (x / 80) * 1920
          const yPos = y + Math.sin(xPos * frequency + phase) * amplitude
          return `${x === 0 ? 'M' : 'L'}${xPos.toFixed(1)},${yPos.toFixed(1)}`
        })
        .join(' ')
      return points
    })
  }, [])

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Base layer: all wave lines in dark grey */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {paths.map((d, i) => (
          <path
            key={`base-${i}`}
            d={d}
            fill="none"
            stroke="#262626"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
        ))}
      </svg>

      {/* Highlight layer: same lines in cyan, masked by radial gradient around cursor */}
      {!reducedMotion && (
        <svg
          className="wave-highlight absolute inset-0 w-full h-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
        >
          {paths.map((d, i) => (
            <path
              key={`hi-${i}`}
              d={d}
              fill="none"
              stroke="#26D8FD"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      )}

      <style jsx>{`
        .wave-highlight {
          -webkit-mask-image: radial-gradient(
            circle 260px at var(--wave-cursor-x, -9999px) var(--wave-cursor-y, -9999px),
            black 0%,
            rgba(0, 0, 0, 0.4) 60%,
            transparent 100%
          );
          mask-image: radial-gradient(
            circle 260px at var(--wave-cursor-x, -9999px) var(--wave-cursor-y, -9999px),
            black 0%,
            rgba(0, 0, 0, 0.4) 60%,
            transparent 100%
          );
        }
      `}</style>
    </div>
  )
}
