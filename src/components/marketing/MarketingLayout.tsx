import { ReactNode } from 'react'
import { WaveBackground } from './WaveBackground'
import { ScrollPathLine } from './ScrollPathLine'

/**
 * Visual wrapper for marketing pages. Mounts the topographic wave background
 * with cursor-proximity highlight and the scroll-linked cyan path line.
 *
 * Scoped to marketing pages only — do NOT wrap tool pages, calculators,
 * blog posts, contact form, or the compliance checker with this.
 */
export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <WaveBackground />
      <ScrollPathLine />
      {children}
    </>
  )
}
