import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CTABannerProps {
  headline: string
  subtext?: string
  buttonText?: string
  buttonHref?: string
}

export function CTABanner({
  headline,
  subtext,
  buttonText = 'Talk to Us',
  buttonHref = '/contact',
}: CTABannerProps) {
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
        <Button variant="gradient" size="lg" asChild>
          <Link href={buttonHref}>{buttonText}</Link>
        </Button>
      </div>
    </section>
  )
}
