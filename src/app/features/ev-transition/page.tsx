import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { CTABanner } from '@/components/ui/CTABanner'

export const metadata: Metadata = {
  title: 'EV Fleet Transition Planning & Management Software | Olaris',
  description:
    'Plan your fleet electrification with data. EV readiness assessment, TCO comparison, charge point monitoring, and carbon reporting for UK fleets.',
  alternates: { canonical: 'https://olaris.co.uk/features/ev-transition' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is EV fleet transition planning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'EV fleet transition planning is the process of systematically replacing ICE vehicles in a fleet with electric alternatives in a sequence and at a pace that is operationally and financially sustainable. In the UK, this is increasingly driven by the ZEV mandate and BIK tax incentives that make EVs attractive for company car drivers.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do you identify which fleet vehicles are ready for EV replacement?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'EV readiness depends on daily mileage patterns, route types, dwell locations, and charging access. Olaris analyses your live fleet data — actual daily distances, overnight parking locations, journey patterns — and identifies which vehicles are operationally suited for electric replacement today versus those that need infrastructure changes or more time.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do you calculate total cost of ownership for EV vs ICE vehicles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A full TCO comparison covers acquisition or lease cost, fuel vs electricity (at actual consumption rates), maintenance, insurance, BIK tax, and residual value. Olaris builds this model using your real mileage and energy tariff data rather than industry averages, so the output reflects what the transition will actually cost your business.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the ZEV mandate and how does it affect fleet planning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Zero Emission Vehicle (ZEV) mandate requires vehicle manufacturers to sell a rising percentage of zero-emission cars and vans each year. This is changing vehicle availability and pricing incentives, making earlier EV adoption increasingly advantageous for fleet operators who plan transition schedules in advance.',
      },
    },
  ],
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'EV Fleet Transition Planning',
  description: 'Data-driven EV transition planning, TCO comparison, and carbon reporting for UK fleet operators.',
  provider: {
    '@type': 'Organization',
    name: 'Olaris',
    url: 'https://olaris.co.uk',
  },
  serviceType: 'Fleet Management Software',
  areaServed: {
    '@type': 'Country',
    name: 'United Kingdom',
  },
}

export default function EvTransitionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <GradientHero
        size="compact"
        title="EV Fleet Transition Planning"
        subtitle="Electrify with confidence. Know which vehicles to replace, when, and what it will actually cost."
      />

      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto space-y-12">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              What is EV fleet transition planning?
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              EV fleet transition planning is the process of systematically replacing internal
              combustion engine (ICE) vehicles in a fleet with electric alternatives — in a
              sequence and at a pace that is operationally and financially sustainable. In the UK,
              this is increasingly driven by regulation: the ZEV mandate requires manufacturers
              to sell a rising proportion of zero-emission vehicles, pushing supply and changing
              incentive structures. BIK (Benefit in Kind) tax rates for EVs remain significantly
              lower than for petrol and diesel, making electrification attractive for company car
              drivers. A well-executed transition plan captures these incentives while avoiding
              operational disruption.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              EV readiness assessment
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Not every vehicle in a fleet is an immediate EV candidate. Readiness depends on
              daily mileage patterns, route types, dwell locations, and charging access. Olaris
              analyses your live fleet data — actual daily distances, overnight parking locations,
              journey patterns — and identifies which vehicles are operationally suited for
              electric replacement today, which need infrastructure changes first, and which
              (longer-range or specialist vehicles) may need more time. This replaces guesswork
              with a ranked transition schedule grounded in your actual usage.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Total cost of ownership comparison
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              The purchase or lease cost of an EV is only part of the picture. Olaris builds a
              full TCO model for each vehicle — comparing the equivalent ICE and EV options across
              acquisition cost, fuel vs. electricity costs (at actual consumption rates, not
              theoretical), maintenance, insurance, BIK tax, and residual value. The comparison
              uses your real mileage and tariff data, not industry averages, so the output reflects
              what the transition will actually cost your business — not a vendor&apos;s best case.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Charge point monitoring
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              The UK&apos;s public charging network is expanding rapidly, but reliability remains
              patchy. Olaris monitors charge point availability and uptime across your key
              locations, flagging outages that could affect vehicle readiness. For fleets
              operating depot or workplace charging, the platform tracks utilisation and
              identifies capacity constraints before they affect operations.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Carbon reporting and ESG compliance
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Fleet vehicles are typically the largest single source of Scope 1 and Scope 3
              emissions for organisations that operate them. Olaris calculates your fleet carbon
              footprint from actual fuel and energy consumption data, and tracks progress against
              reduction targets over time. Reports are formatted to align with common ESG
              disclosure frameworks, reducing the manual effort required for sustainability
              reporting.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-olaris-text-dark/50 mb-3">Related reading</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/platform" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  The full Olaris platform
                </Link>
              </li>
              <li>
                <Link href="/features/cost-tracking" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  Fleet Cost Tracking & TCO Analysis
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </SectionWrapper>

      <CTABanner
        headline="Plan your EV transition with real data, not assumptions."
        subtext="We'll show you which vehicles to electrify first — and what it will actually cost."
        buttonText="Book a Demo"
        buttonHref="/contact"
      />
    </>
  )
}
