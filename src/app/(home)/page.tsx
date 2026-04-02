import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { CredibilitySection } from '@/components/sections/CredibilitySection'
import { OrbisDemo } from '@/components/ui/OrbisDemo'
import { WhatChanges } from '@/components/sections/WhatChanges'
import { CTABanner } from '@/components/ui/CTABanner'
import { Button } from '@/components/ui/button'
import { constructMetadata } from '@/lib/seo'
import { Car, Users, BrainCircuit } from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'Fleet Leasing with Intelligence Built In | Olaris',
  description:
    'Business contract hire and salary sacrifice for UK businesses with Orbis fleet intelligence included in every agreement. All makes, all sectors.',
})

const leasingCards = [
  {
    icon: Car,
    title: 'Business Contract Hire',
    description:
      'Competitive rates across all manufacturers, backed by a multi-funder panel. Every agreement includes Orbis fleet intelligence — real-time visibility of your fleet from the moment the first vehicle is delivered.',
    href: '/leasing/business-contract-hire',
    linkText: 'Learn more',
  },
  {
    icon: Users,
    title: 'Salary Sacrifice',
    description:
      'Help your employees drive a brand new car while saving on tax and NI. Your organisation gets full fleet visibility through Orbis — charging costs, compliance, real-world range, and total scheme cost in one place.',
    href: '/leasing/salary-sacrifice',
    linkText: 'Learn more',
  },
  {
    icon: BrainCircuit,
    title: 'Fleet Intelligence',
    description:
      'Every lease includes access to Orbis, our patent-pending fleet intelligence platform. Connected vehicle data, DVLA compliance, maintenance forecasting, EV charging reconciliation, and cost analysis — all in one view.',
    href: '/platform',
    linkText: 'Learn more',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Leasing hero */}
      <GradientHero
        badge="Fleet Leasing, Powered by Orbis"
        title="Fleet Leasing with Intelligence Built In"
        subtitle="Business contract hire and salary sacrifice for VAT-registered businesses — with Orbis fleet intelligence included in every agreement. No separate software subscription. No integration project. Insight from day one."
        size="full"
      >
        <Button variant="gradient" size="lg" asChild>
          <Link href="/contact">Get a Quote</Link>
        </Button>
        <Button variant="secondary-outline" size="lg" asChild>
          <Link href="/leasing">Explore Our Platform</Link>
        </Button>
      </GradientHero>

      {/* Orbis platform demo */}
      <OrbisDemo />

      {/* Supporting line + leasing cards */}
      <SectionWrapper variant="dark" padding="compact">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-olaris-text-secondary/50 mb-10">
          All makes. All sectors. Intelligence as standard.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {leasingCards.map((card, i) => {
            const Icon = card.icon
            return (
              <AnimatedSection key={card.title} delay={i * 0.1}>
                <Card variant="dark" className="h-full flex flex-col">
                  <div className="inline-flex p-3 rounded-lg bg-cyan-500/10 mb-4">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{card.title}</h3>
                  <p className="text-sm text-olaris-text-secondary leading-relaxed mb-4 flex-1">
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {card.linkText} →
                  </Link>
                </Card>
              </AnimatedSection>
            )
          })}
        </div>
        <p className="text-center text-sm text-olaris-text-secondary mt-8">
          We work with fleet operators, leasing companies, and OEMs.{' '}
          <Link href="/industries" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            See how we serve your sector →
          </Link>
        </p>
        <p className="text-center text-sm text-olaris-text-secondary mt-3">
          Try our free{' '}
          <Link href="/tools/excess-mileage-calculator" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            Excess Mileage Calculator
          </Link>{' '}
          or explore the{' '}
          <Link href="/tools/ev-transition-planner" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            EV Transition Planner
          </Link>
        </p>
      </SectionWrapper>

      <CredibilitySection />
      <WhatChanges />

      <CTABanner
        headline="We'd rather show you than tell you."
        subtext="Tell us about your fleet and we'll show you what intelligence built in actually looks like."
        buttonText="Get a Quote"
        buttonHref="/contact"
      />
    </>
  )
}
