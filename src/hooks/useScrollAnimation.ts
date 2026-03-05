'use client'

import { useInView } from 'react-intersection-observer'

export function useScrollAnimation(options?: {
  threshold?: number
  triggerOnce?: boolean
}) {
  const [ref, inView] = useInView({
    triggerOnce: options?.triggerOnce ?? true,
    threshold: options?.threshold ?? 0.1,
  })
  return { ref, inView }
}
