import { Button } from '@/components/ui/button'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { BookCallButton } from '@/components/ui/BookCallButton'

interface CTABannerProps {
  headline: string
  subtext?: string
  buttonText?: string
  buttonHref?: string
  /**
   * 'link' (default) — renders as a tracked Next.js link, navigates away.
   * 'book-call' — renders the Cal.com popup booking button, keeping the
   *   user on the page. Used on high-intent surfaces (platform, leasing,
   *   post-calculator) per T1-04. Falls back to the link mode if
   *   NEXT_PUBLIC_CAL_LINK is unset.
   */
  mode?: 'link' | 'book-call'
}

export function CTABanner({
  headline,
  subtext,
  buttonText = 'Talk to Us',
  buttonHref = '/contact',
  mode = 'link',
}: CTABannerProps) {
  const fallbackLink = (
    <Button variant="gradient" size="lg" asChild>
      <TrackedLink href={buttonHref} ctaLabel={buttonText}>
        {buttonText}
      </TrackedLink>
    </Button>
  )

  return (
    <section className="bg-olaris-dark py-20 md:py-28 border-t border-olaris-border-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white mb-4">
          {headline}
        </h2>
        {subtext && (
          <p className="text-lg text-olaris-text-secondary mb-8 max-w-2xl mx-auto">
            {subtext}
          </p>
        )}
        {mode === 'book-call' ? (
          <BookCallButton
            fallback={fallbackLink}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-8 py-4 text-lg transition-all shadow-lg hover:shadow-cyan-500/30"
          >
            {buttonText}
          </BookCallButton>
        ) : (
          fallbackLink
        )}
      </div>
    </section>
  )
}
