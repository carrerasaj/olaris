'use client'

import { ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

interface RevealProps {
  children: ReactNode
  /** Delay in ms before the reveal starts once the element is in view. */
  delay?: number
  /** Direction the content slides from. */
  direction?: 'up' | 'down'
  className?: string
}

/**
 * Opt-in scroll reveal wrapper. Fades + slides content into view once it
 * intersects the viewport. Staggers look best with 150ms increments between
 * sibling Reveals.
 *
 * Respects prefers-reduced-motion via useScrollReveal — content is visible
 * immediately when motion is reduced.
 */
export function Reveal({ children, delay = 0, direction = 'up', className }: RevealProps) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>()
  const initialTransform = direction === 'up' ? 'translate3d(0, 40px, 0)' : 'translate3d(0, -40px, 0)'

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : initialTransform,
        transition: `opacity 0.9s ease-out ${delay}ms, transform 0.8s ease-out ${delay}ms`,
        willChange: visible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
