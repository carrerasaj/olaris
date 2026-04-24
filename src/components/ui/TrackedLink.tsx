'use client'

/**
 * Drop-in replacement for next/link that fires a `cta_click` analytics
 * event on click. Use it on primary CTA links so server-component
 * parents (CTABanner, section wrappers) can still instrument clicks
 * without becoming client components themselves.
 *
 * For visual / "cta_click isn't relevant" links, keep using next/link.
 */

import Link, { LinkProps } from 'next/link'
import { ReactNode } from 'react'
import { track } from '@/lib/analytics'

interface TrackedLinkProps extends Omit<LinkProps, 'onClick'> {
  children: ReactNode
  className?: string
  ctaLabel?: string
}

export function TrackedLink({
  children,
  ctaLabel,
  href,
  ...rest
}: TrackedLinkProps) {
  return (
    <Link
      {...rest}
      href={href}
      onClick={() => {
        const label =
          ctaLabel ?? (typeof children === 'string' ? children : 'cta')
        const destination =
          typeof href === 'string' ? href : (href as { pathname?: string }).pathname ?? ''
        const fromPage =
          typeof window === 'undefined' ? '' : window.location.pathname
        track('cta_click', { label, destination, from_page: fromPage })
      }}
    >
      {children}
    </Link>
  )
}
