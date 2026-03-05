import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { CredibilitySection } from '@/components/sections/CredibilitySection'
import { PainPoints } from '@/components/sections/PainPoints'
import { WhatChanges } from '@/components/sections/WhatChanges'
import { WhoWeHelp } from '@/components/sections/WhoWeHelp'
import { CTABanner } from '@/components/ui/CTABanner'
import { Button } from '@/components/ui/button'
import { constructMetadata, serviceSchema, faqSchema } from '@/lib/seo'

export const metadata: Metadata = constructMetadata({
  title: 'Fleet Intelligence & Management Software for UK Operators | Olaris',
  description:
    'Olaris gives fleet operators real-time tracking, mileage management, driver scoring & cost visibility. Built for UK lease companies, operators & OEMs.',
})

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <GradientHero
        badge="Fleet Intelligence, Built From Experience"
        title={
          <>
            We&apos;ve run fleets. We&apos;ve built lease companies.
            <br className="hidden md:block" />
            {' '}Now we build the tools we wished we&apos;d had.
          </>
        }
        subtitle="40 years of automotive experience, distilled into a platform that actually works the way fleet people think."
        size="full"
      >
        <Button variant="gradient" size="lg" asChild>
          <Link href="/platform">See What We Do</Link>
        </Button>
        <Button variant="secondary-outline" size="lg" asChild>
          <Link href="/contact">Talk to Us</Link>
        </Button>
      </GradientHero>

      <CredibilitySection />
      <PainPoints />
      <WhatChanges />
      <WhoWeHelp />

      <CTABanner
        headline="We'd rather show you than tell you."
        subtext="Book 20 minutes. We'll use your data, not a slide deck."
        buttonText="Book a Demo"
        buttonHref="/contact"
      />
    </>
  )
}
