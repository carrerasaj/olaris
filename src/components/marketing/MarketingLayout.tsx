import { ReactNode } from 'react'
import { WaveBackground } from './WaveBackground'
import { ScrollPathLine } from './ScrollPathLine'

/**
 * Visual wrapper for marketing pages. Mounts the topographic wave background
 * with cursor-proximity highlight and the scroll-linked cyan path line.
 *
 * Scoped to marketing pages only — do NOT wrap tool pages, calculators,
 * blog posts, contact form, or the compliance checker with this.
 *
 * Stacking:
 * - WaveBackground:  fixed, z-index 0  (draws below all page content)
 * - ScrollPathLine:  fixed, z-index 1  (draws above waves, below content)
 * - Content wrapper: position relative, z-index 2  (sits above both)
 *
 * The outer div also paints #0F172A so there's no white flash between
 * sections on marketing pages. Individual SectionWrapper instances that
 * want the waves to show through should use variant="dark-transparent"
 * (to be added), but for now any section using the default bg-olaris-dark
 * will opaquely cover the waves in its area.
 */
export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-[#0F172A]">
      <WaveBackground />
      <ScrollPathLine />
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
