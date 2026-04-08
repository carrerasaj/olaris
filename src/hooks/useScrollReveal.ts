'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Intersection-observer-based scroll reveal hook. Returns a ref + visibility
 * boolean that flips to `true` the first time the element enters the viewport,
 * then disconnects the observer.
 *
 * Respects prefers-reduced-motion by skipping the observer entirely and
 * starting in the visible state — so content is never hidden from users who
 * have opted out of motion.
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If the user prefers reduced motion, show content immediately.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}
