import { Metadata } from 'next'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { CTABanner } from '@/components/ui/CTABanner'
import {
  Car, ShieldCheck, Wrench, MapPin, TrendingDown, Users,
  PoundSterling, BarChart3, Building2,
} from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'Business Contract Hire | Fleet Leasing with Intelligence | Olaris',
  description:
    'Business contract hire for UK fleets with Orbis intelligence included. Competitive rates across all makes with real-time fleet visibility built in.',
  url: 'https://olaris.co.uk/leasing/business-contract-hire',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is business contract hire?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BCH is a vehicle leasing arrangement where a business hires vehicles for a fixed period at a fixed monthly rental. The business never owns the vehicles — at contract end, they\'re returned to the funder.',
      },
    },
    {
      '@type': 'Question',
      name: "What's included in the monthly rental?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The rental covers the vehicle hire. With Olaris, it also includes access to Orbis fleet intelligence — real-time fleet visibility, DVLA compliance, maintenance forecasting, and cost analysis at no extra cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I include maintenance in the contract?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We offer both fully maintained and non-maintained options. Fully maintained includes servicing, tyres, and breakdown cover in the monthly rental.',
      },
    },
    {
      '@type': 'Question',
      name: 'What fleet sizes do you support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'From 5 vehicles to 500+. The Orbis platform scales to any fleet size.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to install any software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. Orbis connects to vehicle data automatically. There's no software to install, no integration project, and no IT resource required.",
      },
    },
  ],
}

const vehicleFinance = [
  { icon: Car, text: 'Access to all manufacturers through our multi-funder panel' },
  { icon: PoundSterling, text: 'Fixed monthly rentals with no residual value risk' },
  { icon: BarChart3, text: 'Contract terms from 24 to 48 months' },
  { icon: Wrench, text: 'Fully maintained or non-maintained options' },
  { icon: Users, text: 'Fleet of 5 to 500+ vehicles' },
]

const intelligence = [
  { icon: MapPin, text: 'Connected vehicle data — real-time location, status, and usage' },
  { icon: ShieldCheck, text: 'DVLA licence checking — automated verification and compliance alerts' },
  { icon: Wrench, text: 'MOT, service, and insurance tracking — never miss a renewal' },
  { icon: TrendingDown, text: 'Cost-per-mile analysis — actual figures, not estimates' },
  { icon: Users, text: 'Driver behaviour insights — identify risk and reduce costs' },
  { icon: BarChart3, text: 'Maintenance forecasting — plan your budget against real data' },
]

const steps = [
  'Tell us what you need — vehicle types, volumes, contract terms, maintenance preference.',
  'We quote from our multi-funder panel and find the most competitive rates.',
  'Vehicles are delivered and automatically connected to Orbis.',
  'You see your fleet in real time — compliance, costs, maintenance, and performance.',
]

export default function BusinessContractHirePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <GradientHero
        size="compact"
        title="Business Contract Hire with Fleet Intelligence"
        subtitle="Business contract hire gives your organisation vehicles on a fixed monthly rental with no residual value risk. With Olaris, every BCH agreement includes access to Orbis — our fleet intelligence platform that delivers real-time visibility of your fleet from day one."
      />

      {/* What You Get */}
      <SectionWrapper variant="light">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-10">
              More Than a Monthly Payment
            </h2>
            <p className="text-lg text-olaris-text-dark/80 leading-relaxed mb-8">
              When you lease through Olaris, the monthly rental covers the vehicle. Orbis covers
              everything else:
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatedSection>
              <h3 className="text-lg font-bold mb-4">Vehicle &amp; Finance</h3>
              <ul className="space-y-3">
                {vehicleFinance.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-cyan-50 shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-cyan-600" />
                      </div>
                      <span className="text-sm text-olaris-text-dark/80">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h3 className="text-lg font-bold mb-4">Fleet Intelligence (included)</h3>
              <ul className="space-y-3">
                {intelligence.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-cyan-50 shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-cyan-600" />
                      </div>
                      <span className="text-sm text-olaris-text-dark/80">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.2}>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-lg border border-olaris-border-light bg-slate-50">
                <h4 className="font-bold mb-2">For Fully Maintained Contracts</h4>
                <p className="text-sm text-olaris-text-dark/70 leading-relaxed">
                  Know what maintenance is likely before the dealer invoice arrives. Orbis analyses
                  connected vehicle data, service history, and usage patterns to flag vehicles that
                  are likely to need attention — giving you time to plan, not react.
                </p>
              </div>
              <div className="p-5 rounded-lg border border-olaris-border-light bg-slate-50">
                <h4 className="font-bold mb-2">For Non-Maintained Contracts</h4>
                <p className="text-sm text-olaris-text-dark/70 leading-relaxed">
                  Plan your maintenance budget against real data instead of estimates and averages.
                  Orbis tracks every vehicle&apos;s condition and usage, so you know what&apos;s coming
                  and can budget accordingly.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* How BCH Works */}
      <SectionWrapper variant="dark">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white mb-6">
              How Business Contract Hire Works
            </h2>
            <p className="text-olaris-text-secondary leading-relaxed mb-4">
              Business contract hire is straightforward: your business hires vehicles for a fixed
              period at a fixed monthly rental. At the end of the contract, you hand the vehicles
              back. There&apos;s no balloon payment and no residual value risk — that sits with the funder.
            </p>
            <p className="text-olaris-text-secondary leading-relaxed mb-8">
              What makes Olaris different is what happens between signing and handback. From the day
              the first vehicle is delivered, Orbis connects to the data and starts delivering
              insight. You don&apos;t wait for a software implementation or an integration project.
              It&apos;s already there.
            </p>
          </AnimatedSection>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-olaris-text-secondary pt-1">{step}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Who It's For */}
      <SectionWrapper variant="light">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight">
            Built for Every Fleet Size
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Building2,
              title: 'SME fleets (5–50 vehicles)',
              description:
                "You've never had access to fleet intelligence because the software is priced for enterprise. With Olaris, it comes with your lease.",
            },
            {
              icon: TrendingDown,
              title: 'Growing businesses (50–200 vehicles)',
              description:
                "You're at the point where spreadsheets aren't working anymore but a full fleet management platform feels like overkill. Orbis gives you the visibility you need without the overhead.",
            },
            {
              icon: Users,
              title: 'Established fleets (200+ vehicles)',
              description:
                "You're probably paying for fleet management software separately, and it doesn't connect to your leasing data. With Olaris, the intelligence and the finance are the same relationship.",
            },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <Card variant="light" className="h-full">
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

      {/* Internal links */}
      <SectionWrapper variant="dark" padding="compact">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-white mb-4">Related reading</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { href: '/tools/excess-mileage-calculator', label: 'Free Excess Mileage Calculator' },
              { href: '/blog/what-is-fleet-intelligence', label: 'What is Fleet Intelligence?' },
              { href: '/blog/what-is-fleet-compliance', label: 'What is Fleet Compliance?' },
              { href: '/platform', label: 'Orbis Platform Overview' },
              { href: '/leasing/salary-sacrifice', label: 'Salary Sacrifice' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqSchema.mainEntity.map((faq) => (
              <AnimatedSection key={faq.name}>
                <h3 className="text-lg font-bold mb-2">{faq.name}</h3>
                <p className="text-olaris-text-dark/70 leading-relaxed">
                  {faq.acceptedAnswer.text}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <CTABanner
        headline="Get a Business Contract Hire Quote"
        subtext="Tell us about your fleet — size, vehicle types, sector — and we'll come back with competitive rates and a demonstration of what Orbis intelligence looks like for your operation. No obligation. No hard sell. Just a conversation with people who've been doing this for 40 years."
        buttonText="Book a 20-min call"
        buttonHref="/contact"
        mode="book-call"
      />
    </>
  )
}
