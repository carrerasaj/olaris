import { Metadata } from 'next'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { BrowserFrame } from '@/components/ui/BrowserFrame'
import { MockupEntrance } from '@/components/ui/MockupEntrance'
import { Card } from '@/components/ui/Card'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { CTABanner } from '@/components/ui/CTABanner'
import { Button } from '@/components/ui/button'
import { TCOComparisonMockup } from '@/components/mockups/TCOComparisonMockup'
import { BIKEscalationMockup } from '@/components/mockups/BIKEscalationMockup'
import { FleetRoadmapMockup } from '@/components/mockups/FleetRoadmapMockup'
import { Calculator, Route, PlugZap } from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'EV Transition Planner | Olaris',
  description:
    'Plan your fleet\'s transition to electric with real TCO data, BIK comparison, and charging infrastructure planning. Powered by Orbis fleet intelligence.',
  url: 'https://olaris.co.uk/tools/ev-transition-planner',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the total cost of ownership for an electric vehicle vs diesel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Total cost of ownership includes lease payments, fuel or electricity, maintenance, insurance, VED, eVED, and Benefit in Kind tax. For a typical fleet vehicle doing 10,000 miles per year on a 36-month lease, a BEV currently costs £4,000–£8,000 less than an equivalent diesel over the contract term, primarily driven by lower BIK rates, cheaper running costs, and reduced maintenance. The Orbis EV Transition Planner calculates this using real UK lease rates and HMRC-confirmed BIK escalation through 2030.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the BIK rates for electric cars in 2025-2030?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'HMRC has confirmed BIK rates for company cars through 2029/30. Battery electric vehicles start at 3% in 2025/26, rising to 4%, 5%, 7%, and 9% by 2029/30. Plug-in hybrids start at 6% and rise to 19%. Conventional hybrids start at 29% rising to 33%. ICE vehicles start at 36% rising to 39%. The EV advantage is significant today but narrowing year on year.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is eVED and when does it start?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Electric Vehicle Excise Duty (eVED) is a new pay-per-mile charge announced in the UK Autumn Budget 2025, effective from April 2028. Battery electric vehicles will pay 3p per mile and plug-in hybrids will pay 1.5p per mile. This is in addition to standard VED. The Orbis EV Transition Planner includes eVED in all TCO calculations from 2028 onwards.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I plan an EV transition for my fleet?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Start by identifying which vehicles to replace first — typically the highest-mileage ICE vehicles with the most remaining contract term. Compare TCO for each replacement candidate using real lease rates, not brochure figures. Model your BIK impact year by year as rates escalate. Plan charging infrastructure for depots and home charging reimbursement. The Orbis EV Transition Planner automates this process using your actual fleet data and UK-specific tax rates.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://olaris.co.uk' },
    { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://olaris.co.uk/tools' },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'EV Transition Planner',
      item: 'https://olaris.co.uk/tools/ev-transition-planner',
    },
  ],
}

const featureCards = [
  {
    icon: Calculator,
    title: 'Total Cost of Ownership',
    description:
      'Side-by-side comparison of EV vs ICE vs Hybrid. Lease payments, fuel, electricity, maintenance, insurance, VED, and Benefit in Kind — all modelled with HMRC escalating rates through 2030. See the real cost, not the brochure cost.',
  },
  {
    icon: Route,
    title: 'Fleet Electrification Roadmap',
    description:
      'Build a phased transition plan using your actual fleet data. Which vehicles to replace first, what the cost impact looks like year by year, and how your BIK liability changes as rates escalate. Save and compare multiple scenarios.',
  },
  {
    icon: PlugZap,
    title: 'Charging Infrastructure Planning',
    description:
      'Model your charging needs by location — depot, workplace, and employee home charging. Estimate infrastructure costs, calculate reimbursement rates, and plan capacity against your electrification timeline.',
  },
]

const mockupSections = [
  {
    title: 'TCO Comparison View',
    description:
      'Compare total cost of ownership across BEV, PHEV, and ICE — side by side, with real UK lease rates. Every calculation includes HMRC-confirmed BIK escalation, eVED from 2028, and real-world energy costs split by charging location.',
    url: 'app.orbis.io/ev/tco',
    Component: TCOComparisonMockup,
  },
  {
    title: 'BIK Rate Escalation',
    description:
      'See exactly how Benefit in Kind rates change year by year through 2029/30. The EV advantage is significant today — but it narrows every year. The planner shows your fleet the cost of waiting.',
    url: 'app.orbis.io/ev/bik',
    Component: BIKEscalationMockup,
  },
  {
    title: 'Fleet Electrification Roadmap',
    description:
      'Build a phased replacement plan based on your actual fleet data. Which vehicles to switch first, what the cost impact looks like year by year, and how to phase infrastructure investment alongside the transition.',
    url: 'app.orbis.io/ev/roadmap',
    Component: FleetRoadmapMockup,
  },
]

const coverageList = [
  'TCO comparison across BEV, PHEV, HEV, and ICE — side by side',
  'HMRC BIK rates confirmed through 2029/30 with yearly escalation',
  'eVED pay-per-mile modelling (3p BEV, 1.5p PHEV from April 2028)',
  'Real-world electricity costs: home, depot, and public charging split',
  "Employer's NIC impact at 15% (post-April 2025 rate)",
  'Maintenance cost differential (EV vs ICE service rental)',
  'Fleet-wide roadmap with phased replacement schedule',
  'Charging infrastructure requirements by location',
  'PDF export and email sharing for board presentations',
]

const differentiators = [
  'Uses your actual fleet and contract data, not generic assumptions',
  'Vehicle database with real UK lease rates by manufacturer, model, and variant',
  'Configurable charging tariffs (home EV rate, standard rate, depot, public)',
  'Comparison saved and added to fleet roadmap for scenario planning',
  'Updated for every UK Budget — not a static spreadsheet that goes stale',
]

export default function EVTransitionPlannerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <GradientHero
        badge="Orbis Intelligence Module"
        size="compact"
        title="EV Transition Planner"
        subtitle="Your board wants an EV strategy. Build one with real numbers — TCO comparison, BIK forecasting through 2030, and charging infrastructure planning. Updated for the UK Autumn Budget 2025."
      >
        <Button variant="gradient" size="lg" asChild>
          <Link href="/contact">Request Access</Link>
        </Button>
        <Button variant="secondary-outline" size="lg" asChild>
          <Link href="#features">See a Demo</Link>
        </Button>
      </GradientHero>

      {/* Feature cards */}
      <SectionWrapper variant="light">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-3">
            What the planner covers
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {featureCards.map((card, i) => {
            const Icon = card.icon
            return (
              <AnimatedSection key={card.title} delay={i * 0.1}>
                <Card variant="light" className="h-full flex flex-col">
                  <div className="inline-flex p-3 rounded-lg bg-cyan-50 mb-4">
                    <Icon className="h-6 w-6 text-cyan-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{card.title}</h3>
                  <p className="text-sm text-olaris-text-dark/70 leading-relaxed">
                    {card.description}
                  </p>
                </Card>
              </AnimatedSection>
            )
          })}
        </div>
      </SectionWrapper>

      {/* Dashboard mockups */}
      <SectionWrapper variant="dark" id="features">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white mb-3">
            Built for fleet decisions, not spreadsheet guesswork
          </h2>
        </div>

        <div className="space-y-20">
          {mockupSections.map((section, i) => (
            <div
              key={section.title}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                i % 2 === 1 ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Text */}
              <AnimatedSection className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                <h3 className="text-2xl font-bold font-heading tracking-tight text-white mb-4">
                  {section.title}
                </h3>
                <p className="text-olaris-text-secondary leading-relaxed">
                  {section.description}
                </p>
              </AnimatedSection>

              {/* Mockup */}
              <MockupEntrance className={i % 2 === 1 ? 'lg:col-start-1' : ''}>
                <BrowserFrame url={section.url}>
                  <section.Component />
                </BrowserFrame>
              </MockupEntrance>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* What's included */}
      <SectionWrapper variant="light">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-3">
            Everything you need to plan the transition
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <AnimatedSection>
            <h3 className="text-lg font-bold mb-4">What the planner covers</h3>
            <ul className="space-y-3">
              {coverageList.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-cyan-500 mt-0.5 shrink-0">•</span>
                  <span className="text-olaris-text-dark/70">{item}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <h3 className="text-lg font-bold mb-4">What makes this different</h3>
            <ul className="space-y-3">
              {differentiators.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                  <span className="text-olaris-text-dark/70">{item}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper variant="dark" padding="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-heading tracking-tight text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqSchema.mainEntity.map((faq) => (
              <AnimatedSection key={faq.name}>
                <h3 className="text-lg font-bold text-white mb-2">{faq.name}</h3>
                <p className="text-olaris-text-secondary leading-relaxed">
                  {faq.acceptedAnswer.text}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Cross-link */}
      <SectionWrapper variant="dark" padding="compact">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-olaris-text-secondary">
              Want to check the BIK on a specific car? Use our{' '}
              <Link href="/tools/company-car-tax-calculator" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                free BIK tax calculator
              </Link>{' '}
              with HMRC-confirmed rates through 2030.
            </p>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* CTA */}
      <SectionWrapper variant="dark">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-4">
              Ready to build your EV strategy?
            </h2>
            <p className="text-olaris-text-secondary mb-8 max-w-2xl mx-auto">
              The EV Transition Planner is included in every Olaris lease with Orbis intelligence.
              If you&apos;re not an Olaris customer yet, request a demo and we&apos;ll run the analysis on your fleet data.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="lg" asChild>
                <Link href="/contact">Request a Demo</Link>
              </Button>
              <Button variant="secondary-outline" size="lg" asChild>
                <Link href="/leasing">Explore Leasing</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </SectionWrapper>
    </>
  )
}
