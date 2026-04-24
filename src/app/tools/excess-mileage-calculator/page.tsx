import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { FleetMileageCalculator } from '@/components/tools/FleetMileageCalculator'

export const metadata: Metadata = {
  title: 'Excess Mileage Calculator UK · Free, HMRC-aligned · Olaris',
  description:
    'Calculate lease excess mileage charges instantly. UK rates, HMRC-aligned, free. See what you owe — and how to avoid it on your next contract.',
  alternates: { canonical: 'https://olaris.co.uk/tools/excess-mileage-calculator' },
  openGraph: {
    title: 'Excess Mileage Calculator UK · Free, HMRC-aligned · Olaris',
    description:
      'Calculate lease excess mileage charges instantly. UK rates, HMRC-aligned, free. See what you owe — and how to avoid it on your next contract.',
    type: 'website',
    url: 'https://olaris.co.uk/tools/excess-mileage-calculator',
    images: [{ url: 'https://olaris.co.uk/images/fleet-hero.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
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
        text: 'An excess mileage charge is a per-mile fee applied when a leased vehicle exceeds its contracted annual mileage allowance. Rates typically range from 6p to 20p per mile depending on the vehicle and funder, and charges are assessed at the end of the contract term.',
      },
    },
    {
      '@type': 'Question',
      name: 'How are excess mileage charges calculated UK?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Excess mileage charges are calculated by multiplying the number of miles driven over the contracted allowance by the agreed pence-per-mile rate. For example, if you contracted 10,000 miles per year but drove 12,000, and your excess rate is 12p per mile, the charge is 2,000 × £0.12 = £240 per vehicle per year.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I avoid excess mileage charges on my fleet?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The most effective way to avoid excess mileage charges is to monitor actual mileage against contracted allowances throughout the lease term, not just at the end. Regular monitoring lets you renegotiate contracts, redistribute mileage across vehicles (mileage pooling), or adjust driver assignments before charges compound. Fleet intelligence platforms like Orbis track this automatically using connected vehicle data.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the average excess mileage charge per mile in the UK?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The average excess mileage charge in the UK ranges from 6p to 20p per mile depending on the vehicle type, funder, and contract terms. Premium and electric vehicles typically attract higher rates (12p-20p), while standard fleet vehicles are usually 6p-12p. These charges are set at the start of the contract and apply to every mile over the allowance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can you negotiate excess mileage charges at end of lease?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Some funders will negotiate excess mileage charges at end of lease, particularly if the vehicle is in good condition or if you are renewing with them. However, negotiation is much harder after the fact. The most effective approach is to flag excess mileage early in the contract term and request a mileage amendment or contract variation before the lease ends.',
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
        title="Calculate your lease excess mileage charge"
        subtitle="Find out what your fleet's excess mileage charges could cost — before the invoice lands"
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
              Most fleet managers only check mileage when the vehicle comes back at end of contract.
              By then, the invoice is a fait accompli — no time to adjust driver behaviour,
              redistribute vehicles, or negotiate with the funder. The charges are baked in.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <p className="text-olaris-text-secondary leading-relaxed">
              The compounding effect is what catches people out. An extra 200 miles per month sounds
              trivial — but multiply that across 50 vehicles over a 36-month contract and the numbers
              become serious. At 12p per mile, that&apos;s £43,200 in excess charges that accumulated
              gradually and landed as a single bill at lease end.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="text-olaris-text-secondary leading-relaxed">
              Mileage pooling — offsetting over-mileage vehicles against under-mileage ones — can
              reduce the hit significantly. Some funders support it, but most don&apos;t make it easy
              to track. Without a live view of where every vehicle sits against contract, pooling
              remains a theoretical benefit rather than a practical tool.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <p className="text-olaris-text-secondary leading-relaxed">
              Connected vehicle data has changed the equation. Real-time odometer feeds from 15+
              manufacturers mean fleet operators can now track mileage continuously, not quarterly.
              The data exists — the question is whether your systems are set up to use it.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <p className="text-olaris-text-secondary leading-relaxed">
              The calculator above gives you a snapshot. Orbis gives you the live picture — continuous
              mileage tracking, excess charge forecasting, mileage pooling analysis, and automatic
              alerts when a vehicle trends over contract.{' '}
              <Link href="/contact" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                Talk to us about mileage management →
              </Link>
            </p>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* Next Steps */}
      <SectionWrapper variant="dark">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-8">
              What to do about excess mileage
            </h2>
          </AnimatedSection>
          <div className="grid gap-4 sm:grid-cols-3">
            <AnimatedSection delay={0.1}>
              <Link href="/contact" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-6 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-lg font-bold text-white mb-2">Get a Quote</h3>
                <p className="text-sm text-olaris-text-secondary">Talk to us about fleet leasing with mileage intelligence built in.</p>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Link href="/platform" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-6 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-lg font-bold text-white mb-2">See How Orbis Tracks Mileage</h3>
                <p className="text-sm text-olaris-text-secondary">Real-time mileage monitoring, forecast alerts, and mileage pooling analysis.</p>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.3}>
              <Link href="/tools/fleet-compliance-checker" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-6 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-lg font-bold text-white mb-2">Fleet Compliance Checker</h3>
                <p className="text-sm text-olaris-text-secondary">Looking beyond mileage? Check your fleet&apos;s overall compliance in 2 minutes.</p>
              </Link>
            </AnimatedSection>
          </div>
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
