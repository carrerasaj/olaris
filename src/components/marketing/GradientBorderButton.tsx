'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface GradientBorderButtonProps {
  children: ReactNode
  href?: string
  onClick?: () => void
  'aria-label'?: string
}

/**
 * Editorial-style CTA button with an SVG-drawn cyan border and a cyan fill
 * that sweeps up on hover. Text colour inverts when the fill covers it.
 *
 * Used for primary CTAs on marketing hero sections. Don't substitute for the
 * default <Button> component elsewhere — this is deliberately more expensive
 * to render and reserved for the hero.
 */
export function GradientBorderButton({
  children,
  href,
  onClick,
  'aria-label': ariaLabel,
}: GradientBorderButtonProps) {
  const content = (
    <span className="gbb-wrap relative inline-flex items-center justify-center w-[225px] h-[64px] overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 225 64"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="223"
          height="62"
          fill="none"
          stroke="#26D8FD"
          strokeWidth="2"
        />
        <rect
          className="gbb-fill"
          x="1"
          y="1"
          width="223"
          height="62"
          fill="#26D8FD"
        />
      </svg>
      <span className="gbb-label relative z-10 font-display text-base font-semibold tracking-tight text-white transition-colors duration-300">
        {children}
      </span>

      <style jsx>{`
        .gbb-wrap :global(.gbb-fill) {
          transform: translateY(63px);
          transition: transform 0.35s ease-out;
        }
        .gbb-wrap:hover :global(.gbb-fill) {
          transform: translateY(0);
        }
        .gbb-wrap:hover .gbb-label {
          color: #0f172a;
        }
      `}</style>
    </span>
  )

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className="inline-block">
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="inline-block">
      {content}
    </button>
  )
}
