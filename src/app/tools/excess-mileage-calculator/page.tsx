import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { FleetMileageCalculator } from '@/components/tools/FleetMileageCalculator'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Excess Mileage Calculator | Olaris',
  description:
    "Calculate your fleet's excess mileage exposure before end of contract. Free tool from Olaris — fleet leasing with intelligence built in.",
  alternates: { canonical: 'https://olaris.co.uk/tools/excess-mileage-calculator' },
}

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Olaris Excess Mileage Calculator',
  description:
    'Free tool to calculate fleet excess mileage exposure and projected charges before end of contract.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web browser',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  provider: {
    '@type': 'Organization',
    name: 'Olaris',
    url: 'https://olaris.co.uk',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is an excess mileage charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An excess mileage charge is a fee applied by the leasing company when a vehicle is returned at end of contract having exceeded the agreed annual mileage. Charges typically range from 6p to 20p per mile depending on the vehicle and funder.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I avoid excess mileage charges on my fleet?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Monitor actual vs contracted mileage across your fleet at least quarterly. Redistribute vehicles between high and low mileage drivers where possible. Consider mileage pooling if your funder supports it. Platforms like Orbis automate this tracking and alert you to excess mileage risk months before end of contract.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the average excess mileage charge per mile in the UK?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most UK leasing companies charge between 6p and 20p per excess mile, with the average around 10-14p per mile. The rate is set at the start of the contract and specified in the lease agreement.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I negotiate excess mileage charges?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It is difficult to negotiate once the vehicle has been returned. The best approach is to identify excess mileage risk early in the contract — ideally 6-12 months before end of term — and either adjust driver behaviour, swap vehicles between high and low mileage users, or renegotiate the contracted mileage with the funder before return.',
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
      name: 'Excess Mileage Calculator',
      item: 'https://olaris.co.uk/tools/excess-mileage-calculator',
    },
  ],
}

export default function ExcessMileageCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <GradientHero
        badge="Free Fleet Tool"
        size="compact"
        title="Excess Mileage Calculator"
        subtitle="Find out what your fleet's excess mileage charges could cost you — before the invoice lands."
      />

      {/* Calculator */}
      <SectionWrapper variant="dark">
        <FleetMileageCalculator />
      </SectionWrapper>

      {/* Context */}
      <SectionWrapper variant="dark" padding="compact">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-6">
              Why excess mileage charges catch fleets off guard
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <p className="text-olaris-text-secondary leading-relaxed">
              Most fleet managers don&apos;t know their excess mileage exposure until the vehicle comes
              back. By then, the invoice is a fait accompli — no time to adjust driver behaviour,
              redistribute vehicles, or negotiate with the funder.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="text-olaris-text-secondary leading-relaxed">
              The industry average excess charge is 6p–20p per mile depending on vehicle type and
              funder. On a fleet of 50 vehicles running 2,000 miles over contract per year, that&apos;s
              £12,000–£40,000 in charges that could have been spotted and managed 6–12 months earlier.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <p className="text-olaris-text-secondary leading-relaxed">
              This calculator gives you a snapshot. Orbis gives you the full picture — live mileage
              tracking across every vehicle, excess charge forecasting updated monthly, and automatic
              alerts when a vehicle is trending over. Built into every Olaris lease agreement at no
              extra cost.
            </p>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* CTA */}
      <SectionWrapper variant="dark">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-4">
              Stop guessing. Start forecasting.
            </h2>
            <p className="text-olaris-text-secondary mb-8 max-w-2xl mx-auto">
              Every Olaris lease includes Orbis mileage intelligence — excess charge forecasting that
              flags risk 6 months before the vehicle comes back. No separate software. No integration.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="lg" asChild>
                <Link href="/contact">Get a Quote</Link>
              </Button>
              <Button variant="secondary-outline" size="lg" asChild>
                <Link href="/platform">See How Orbis Works</Link>
              </Button>
            </div>
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
    </>
  )
}
