import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { CTABanner } from '@/components/ui/CTABanner'

export const metadata: Metadata = {
  title: 'Driver Behaviour Scoring & Monitoring Software | Olaris',
  description:
    'Monitor and score driver behaviour across your fleet. Reduce accidents, lower insurance costs, and improve safety with real-time telematics data.',
  alternates: { canonical: 'https://olaris.co.uk/features/driver-behaviour' },
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Driver Behaviour Scoring & Monitoring',
  description: 'Real-time driver behaviour scoring using telematics data for UK fleet operators.',
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

export default function DriverBehaviourPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <GradientHero
        size="compact"
        title="Driver Behaviour Scoring & Monitoring"
        subtitle="Turn telematics data into measurable safety improvements — and lower insurance premiums."
      />

      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto space-y-12">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              What is driver behaviour scoring?
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Driver behaviour scoring uses telematics data from connected vehicles to rate how
              safely and efficiently each driver operates their vehicle. Metrics typically include
              harsh braking, rapid acceleration, cornering, speeding, and idling. Each event is
              weighted to produce a composite score per driver, giving fleet managers an objective,
              data-driven view of driving standards across the whole fleet — not just the
              vehicles that have been involved in incidents.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              How driver scoring reduces fleet costs
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              The financial case for driver scoring is well-documented. Insurers increasingly
              price commercial fleet premiums based on claims history and, where provided, telematics
              evidence of driving standards. Fleets that can demonstrate consistent high-scoring
              driver behaviour see measurable reductions at renewal. Beyond insurance, aggressive
              driving increases fuel consumption by 15–20%, accelerates brake and tyre wear, and
              elevates accident probability — each a direct cost to the business. Scoring makes the
              invisible visible, and gives you the data to act.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Real-time monitoring vs periodic reviews
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Periodic driver reviews — monthly or quarterly — tell you what happened, not what
              is happening. By the time a pattern shows up in a quarterly report, it has already
              cost you in fuel, wear, or worse. Olaris surfaces driver behaviour continuously,
              so you can identify a deteriorating score and intervene before it becomes an
              incident or an insurance claim. Live data also means drivers receive feedback
              closer in time to the behaviour itself, which is demonstrably more effective for
              changing habits.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Coaching drivers with data
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Scores are only useful if they change behaviour. Olaris gives fleet managers the
              specific event data — not just a number — to have a productive conversation with
              a driver. &ldquo;Your score dropped this week because of three instances of harsh
              braking on Tuesday morning&rdquo; is a coaching conversation. &ldquo;Your score
              is low&rdquo; is not. The platform supports driver-level reporting that managers
              can use directly in one-to-ones, without requiring separate reporting tools or
              manual data extraction.
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
                <Link href="/features/dvla-compliance" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  Automated DVLA Licence Checking
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </SectionWrapper>

      <CTABanner
        headline="See your drivers' behaviour scores in real time."
        subtext="No hardware installations. Live data from your existing connected vehicles."
        buttonText="Book a Demo"
        buttonHref="/contact"
      />
    </>
  )
}
