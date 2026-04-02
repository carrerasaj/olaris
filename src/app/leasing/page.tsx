import { Metadata } from 'next'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { CTABanner } from '@/components/ui/CTABanner'
import { Button } from '@/components/ui/button'
import {
  MapPin, ShieldCheck, Wrench, Plug, TrendingDown, Car,
  Award, BrainCircuit, Users, PoundSterling,
} from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'Fleet Leasing | Business Contract Hire & Salary Sacrifice | Olaris',
  description:
    'Business contract hire and salary sacrifice for UK businesses with Orbis fleet intelligence built in. All makes, all sectors, one platform.',
  url: 'https://olaris.co.uk/leasing',
})

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Olaris Fleet Leasing',
  provider: {
    '@type': 'Organization',
    name: 'Olaris Consulting Limited',
    url: 'https://olaris.co.uk',
  },
  description:
    'Business contract hire and salary sacrifice solutions with Orbis fleet intelligence built into every agreement.',
  areaServed: 'GB',
  serviceType: ['Business Contract Hire', 'Salary Sacrifice Car Scheme'],
}

const orbisFeatures = [
  { icon: MapPin, text: 'Real-time vehicle location and status from connected vehicle data' },
  { icon: ShieldCheck, text: 'DVLA licence checking and compliance status for every driver' },
  { icon: Wrench, text: 'MOT, service, and insurance renewal tracking with automated alerts' },
  { icon: Plug, text: 'EV charging cost reconciliation against HMRC advisory rates' },
  { icon: TrendingDown, text: 'Predictive maintenance signals based on usage patterns and service history' },
  { icon: PoundSterling, text: 'True cost-per-mile for every vehicle — not estimates, actual figures' },
]

export default function LeasingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <GradientHero
        size="compact"
        title="Fleet Leasing with Intelligence Built In"
        subtitle="Olaris provides business contract hire and salary sacrifice solutions for VAT-registered businesses across the UK. Every agreement includes Orbis, our patent-pending fleet intelligence platform — real-time insight into your entire fleet from day one."
      />

      {/* How It Works */}
      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-6">
              One Provider. One Platform. Complete Visibility.
            </h2>
            <div className="space-y-5 text-olaris-text-dark/80 leading-relaxed text-lg">
              <p>
                Traditional fleet leasing means dealing with a broker for the vehicles, a separate
                provider for telematics, another for DVLA checking, another for maintenance
                management, and spreadsheets to join it all together.
              </p>
              <p>
                Olaris replaces that fragmented approach. When you lease through us, your vehicles
                are automatically connected to Orbis — our fleet intelligence platform. From the
                moment the first vehicle is delivered, you see:
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <ul className="mt-8 space-y-4">
              {orbisFeatures.map((feature) => {
                const Icon = feature.icon
                return (
                  <li key={feature.text} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-cyan-50 shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-cyan-600" />
                    </div>
                    <span className="text-olaris-text-dark/80">{feature.text}</span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-6 text-lg font-medium text-olaris-text-dark">
              This isn&apos;t a bolt-on. It&apos;s built into the lease.
            </p>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* Solutions */}
      <SectionWrapper variant="dark">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white">
            Choose Your Solution
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <AnimatedSection>
            <Card variant="dark" className="h-full flex flex-col">
              <div className="inline-flex p-3 rounded-lg bg-cyan-500/10 mb-4">
                <Car className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Business Contract Hire</h3>
              <p className="text-sm text-olaris-text-secondary leading-relaxed mb-4">
                For businesses that need vehicles on a fixed monthly cost with full fleet
                visibility. Competitive rates across all makes from our multi-funder panel,
                with Orbis intelligence included as standard.
              </p>
              <ul className="space-y-2 text-sm text-olaris-text-secondary mb-6">
                <li className="flex gap-2"><span className="text-cyan-500 shrink-0">•</span>Typical fleet sizes: 5 to 500+ vehicles</li>
                <li className="flex gap-2"><span className="text-cyan-500 shrink-0">•</span>Contract terms: 24 to 48 months</li>
                <li className="flex gap-2"><span className="text-cyan-500 shrink-0">•</span>Maintenance: Fully maintained or non-maintained options</li>
              </ul>
              <div className="mt-auto">
                <Button variant="gradient" size="default" asChild>
                  <Link href="/leasing/business-contract-hire">Get a BCH Quote →</Link>
                </Button>
              </div>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <Card variant="dark" className="h-full flex flex-col">
              <div className="inline-flex p-3 rounded-lg bg-cyan-500/10 mb-4">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Salary Sacrifice</h3>
              <p className="text-sm text-olaris-text-secondary leading-relaxed mb-4">
                For employers offering a car benefit that saves employees tax and NI. Full scheme
                setup and administration, with Orbis providing real-time visibility of charging
                costs, compliance, range performance, and total scheme cost.
              </p>
              <ul className="space-y-2 text-sm text-olaris-text-secondary mb-6">
                <li className="flex gap-2"><span className="text-cyan-500 shrink-0">•</span>Suitable for: Employers of all sizes offering EV or ULEV benefit schemes</li>
                <li className="flex gap-2"><span className="text-cyan-500 shrink-0">•</span>Savings: Employees typically save 30–40% compared to personal leasing</li>
                <li className="flex gap-2"><span className="text-cyan-500 shrink-0">•</span>Employer cost: Revenue neutral — funded through gross salary deduction</li>
              </ul>
              <div className="mt-auto">
                <Button variant="gradient" size="default" asChild>
                  <Link href="/leasing/salary-sacrifice">Explore Salary Sacrifice →</Link>
                </Button>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* Why Olaris */}
      <SectionWrapper variant="light">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight">
            Why Choose Olaris?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Award,
              title: 'Industry Experience',
              description:
                'Three founders with almost a century of combined experience building and running vehicle leasing companies. We\'re not a tech startup that discovered fleet — we\'re fleet people who built the technology.',
            },
            {
              icon: BrainCircuit,
              title: 'Patent-Pending Intelligence',
              description:
                'Orbis processes over 5 million lines of real-world fleet data and growing. The approach to fleet data integration is unique enough that we\'ve filed patents to protect it.',
            },
            {
              icon: Car,
              title: 'All Makes, All Sectors',
              description:
                'Access to a competitive multi-funder panel covering every manufacturer. Whether you run a fleet of 5 vans or 500 company cars, the proposition scales.',
            },
            {
              icon: PoundSterling,
              title: 'No Separate Software Cost',
              description:
                'Other providers charge a per-vehicle monthly fee for fleet management software on top of the lease. With Olaris, intelligence is included. It\'s how we do business.',
            },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <Card variant="light" className="h-full text-center">
                  <div className="inline-flex p-3 rounded-lg bg-cyan-50 mb-4">
                    <Icon className="h-6 w-6 text-cyan-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-olaris-text-dark/70 leading-relaxed">
                    {item.description}
                  </p>
                </Card>
              </AnimatedSection>
            )
          })}
        </div>
      </SectionWrapper>

      <CTABanner
        headline="Ready to See the Difference?"
        subtext="Whether you're looking for business contract hire, salary sacrifice, or both — we'd welcome the conversation. Tell us about your fleet and we'll show you what intelligence built in actually looks like."
        buttonText="Get in Touch"
        buttonHref="/contact"
      />
    </>
  )
}
