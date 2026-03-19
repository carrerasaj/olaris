import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { CTABanner } from '@/components/ui/CTABanner'

export const metadata: Metadata = {
  title: 'Automated Mileage Tracking for Fleet & Lease Vehicles | Olaris',
  description:
    'Track mileage vs contract in real time. Automated excess mileage alerts, lease vehicle monitoring, and mileage overage prevention for UK fleet operators.',
  alternates: { canonical: 'https://olaris.co.uk/features/mileage-tracking' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is excess mileage and why does it matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Excess mileage is the difference between the contractual mileage agreed at lease inception and the actual mileage driven over the contract term. When a vehicle is returned with more miles than agreed, the leasing company charges a per-mile penalty — typically 5–15p per mile. These charges are often a surprise because they only become visible when the vehicle is returned.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does automated mileage tracking work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Automated mileage tracking connects directly to your vehicles via OEM telematics integrations. Live odometer data is pulled from the manufacturer\'s connected vehicle platform and matched against the contracted mileage stored in your fleet records. The system continuously calculates each vehicle\'s mileage trajectory and alerts you when a vehicle is trending over its allowance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to install hardware for mileage tracking?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most modern vehicles have built-in OEM connectivity. Olaris integrates directly with manufacturer data feeds across 15+ brands, so no aftermarket hardware is required for most fleets. For older vehicles without factory telematics, compatible aftermarket devices can be used.',
      },
    },
    {
      '@type': 'Question',
      name: 'How far in advance will I be alerted to mileage overruns?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Olaris analyses mileage trajectory continuously and will flag a vehicle as soon as it is statistically trending over its contract allowance — typically months before lease end, when there is still time to take action such as reallocating the vehicle, adjusting driver behaviour, or renegotiating contract terms.',
      },
    },
  ],
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Automated Mileage Tracking',
  description: 'Real-time mileage vs contract monitoring for UK fleet operators and lease companies.',
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

export default function MileageTrackingPage() {
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
        title="Automated Mileage Tracking for Fleet & Lease Vehicles"
        subtitle="Know exactly where every vehicle stands against its contracted mileage — before the excess charges land."
      />

      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto space-y-12">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              What is excess mileage and why does it matter?
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Excess mileage is the difference between the contractual mileage agreed at lease
              inception and the actual mileage driven over the contract term. When a vehicle is
              returned with more miles than agreed, the leasing company charges a per-mile penalty
              — typically 5–15p per mile. On a fleet of 100 vehicles, a systematic mileage
              overrun can generate excess charges of £20,000–£80,000 at contract end. These
              charges are often a surprise because they only become visible when the vehicle is
              returned. By then, there is nothing to be done.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              How automated mileage tracking works
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Olaris connects directly to your vehicles via OEM telematics integrations — no
              dongles, no hardware installations. Live odometer data is pulled from the
              manufacturer&apos;s connected vehicle platform and matched against the contracted
              mileage stored in your fleet records. The system continuously calculates each
              vehicle&apos;s mileage trajectory: at current pace, will it finish its contract
              over, under, or on target? Fleet managers see this in a single dashboard view,
              updated in real time.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Real-time alerts before charges hit
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              When a vehicle is trending over its contracted mileage, Olaris triggers an alert —
              to the fleet manager, and optionally to the driver. Early enough to act on. You
              can rearrange vehicle assignments, adjust driver allocation, or negotiate an amended
              contract with the leasing company before excess mileage accumulates. Proactive
              management turns a bill into a decision.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Mileage tracking across 15+ manufacturers
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Mixed fleet? Olaris integrates with OEM connected vehicle platforms across 15+
              manufacturers — including Ford, Volkswagen, BMW, Mercedes-Benz, Stellantis brands,
              and more. Every vehicle, regardless of make or funding type, is visible in a single
              mileage view. No separate logins per manufacturer, no manual data consolidation.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-olaris-text-dark/50 mb-3">Related reading</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog/fleet-cost-report" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  Why Your Fleet Cost Report Is Wrong (And What to Do About It)
                </Link>
              </li>
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
              <li>
                <Link href="/tools/excess-mileage-calculator" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  Try the free excess mileage calculator →
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </SectionWrapper>

      <CTABanner
        headline="See your fleet's mileage position in real time."
        subtext="Book a demo and we'll show you exactly how it works with your vehicles."
        buttonText="Book a Demo"
        buttonHref="/contact"
      />
    </>
  )
}
