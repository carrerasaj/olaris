import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { CTABanner } from '@/components/ui/CTABanner'
import { constructMetadata } from '@/lib/seo'

export const metadata: Metadata = constructMetadata({
  title: 'Fleet Cost Tracking & Total Cost of Ownership Analysis | Olaris',
  description:
    'See the true cost of every vehicle in your fleet. Real-time cost tracking, TCO analysis, fuel monitoring, and financial reporting for fleet operators.',
  url: 'https://olaris.co.uk/features/cost-tracking',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does it cost to run a fleet per vehicle per year?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For a mid-sized UK fleet of 50–200 vehicles, total cost of ownership typically runs £5,000–£12,000 per vehicle per year, depending on vehicle type, usage intensity, and funding method. This includes acquisition or lease costs, fuel, maintenance, insurance, compliance, and administration — many of which are underestimated because they are tracked across separate systems.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is included in fleet total cost of ownership?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Fleet TCO covers the full vehicle lifecycle: acquisition or lease cost, fuel and energy consumption, servicing and maintenance, tyres, insurance premiums, compliance costs (DVLA, MOT, road tax), excess mileage charges, and depreciation or residual value at disposal. Most fleet managers undercount because these costs sit across different systems and suppliers.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why is real-time cost tracking better than monthly reporting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Monthly reports show you what went wrong last month. Real-time tracking shows you what is going wrong now — early enough to act. When a vehicle\'s fuel costs spike mid-month, real-time data lets you investigate immediately rather than discovering the problem in a report three weeks later when the cost is already locked in.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can fleet cost data be exported for finance teams?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Olaris produces exportable cost reports formatted for finance use — budget vs actual by vehicle, driver, department, or cost category. Reports can be scheduled to run automatically and distributed to stakeholders. The underlying data can also be exported to Excel or connected to BI tools for more complex reporting.',
      },
    },
  ],
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Fleet Cost Tracking & TCO Analysis',
  description: 'Real-time fleet cost tracking and total cost of ownership analysis for UK fleet operators.',
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

export default function CostTrackingPage() {
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
        title="Fleet Cost Tracking & TCO Analysis"
        subtitle="The true cost of running your fleet — per vehicle, per driver, in real time."
      />

      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto space-y-12">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              How much does it really cost to run your fleet?
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Most fleet operators significantly underestimate their true costs because the data
              lives in too many places. Lease payments come from one system. Fuel from another.
              Maintenance invoices from a third. Compliance costs — DVLA checks, insurance,
              fines — are tracked manually, if at all. The result is a cost picture that is
              always incomplete, always in arrears, and never quite matches the finance team&apos;s
              expectations. For a mid-sized UK fleet of 50–200 vehicles, total cost of ownership
              typically runs £5,000–£12,000 per vehicle per year — but many operators cannot
              tell you with confidence what their number is, let alone which vehicles are the
              outliers.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Real-time cost tracking per vehicle
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Olaris aggregates cost data across all sources and attributes it to individual
              vehicles in real time. Fuel consumption from OEM telematics. Maintenance invoices
              from your service providers. Lease payments from your funding schedules. The result
              is a live cost profile for every vehicle in the fleet — not a monthly snapshot,
              but a running total that updates as costs are incurred. You can see at a glance
              which vehicles are within budget and which are running over, without waiting for
              month-end.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Total cost of ownership analysis
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Per-vehicle TCO in Olaris covers the full lifecycle: acquisition or lease cost,
              fuel and energy, servicing and maintenance, tyres, insurance, compliance costs,
              and depreciation or residual value. Costs are separated by category so you can see
              where money is going — not just a total, but the breakdown that tells you whether
              a vehicle&apos;s high cost is driven by fuel (a driver behaviour problem), maintenance
              (an age or spec problem), or excess mileage (a contract management problem).
              That distinction determines the correct response.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Cost reporting for finance teams
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Olaris produces exportable cost reports formatted for finance team use — budget vs
              actual by vehicle, by driver, by department, or by cost category. Reports can be
              scheduled to run automatically and distributed to relevant stakeholders, eliminating
              the manual extraction and formatting that currently consumes fleet manager time at
              month end. For organisations with more complex reporting requirements, the underlying
              data can be exported to Excel or connected to BI tools.
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
                <Link href="/features/mileage-tracking" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  Automated Mileage Tracking
                </Link>
              </li>
              <li>
                <Link href="/tools/excess-mileage-calculator" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  Estimate your excess mileage exposure →
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </SectionWrapper>

      <CTABanner
        headline="Know what your fleet actually costs — per vehicle, right now."
        subtext="No more end-of-month surprises. Real costs, in real time."
        buttonText="Book a Demo"
        buttonHref="/contact"
      />
    </>
  )
}
