import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import ExcessMileageCalculator from '@/components/tools/ExcessMileageCalculator'

export const metadata: Metadata = {
  title: 'Free Excess Mileage Calculator | Fleet Mileage Projection Tool | Olaris',
  description:
    'Calculate projected excess mileage charges for your fleet. Free interactive tool using the same methodology as the Olaris platform.',
  alternates: { canonical: 'https://olaris.co.uk/tools/excess-mileage-calculator' },
}

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Olaris Excess Mileage Calculator',
  description: 'Free tool to project excess mileage charges across a fleet of up to 10 vehicles.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GBP',
  },
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
        text: 'An excess mileage charge is a fee applied when a leased vehicle exceeds its contracted annual mileage allowance. Charges are calculated at a set rate per mile (pence per mile) for every mile over the allowance, applied at lease return.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is excess mileage calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Excess mileage is the difference between actual miles driven and the contracted mileage allowance. The charge is calculated as: (Actual Miles − Contract Allowance) × Pence Per Mile rate. This calculator projects that charge based on current trajectory rather than waiting until lease end.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a typical excess mileage charge rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Rates vary by vehicle, funder, and contract but typically range from 3p to 15p per mile for cars and light commercial vehicles. Premium and specialist vehicles may attract higher rates. Your lease agreement will specify the exact rate.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I avoid excess mileage charges?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — the key is early identification. By monitoring mileage trajectory against contract allowance throughout the lease term, you can take action: redistribute mileage across the fleet, negotiate a contract amendment, extend the lease, or swap the vehicle early.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often should I check fleet mileage against contract?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'At minimum quarterly. Best practice is continuous monitoring using telematics data. This calculator is designed for periodic reviews; for real-time monitoring, the Olaris mileage tracking platform provides live visibility across your entire fleet.',
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
    { '@type': 'ListItem', position: 3, name: 'Excess Mileage Calculator', item: 'https://olaris.co.uk/tools/excess-mileage-calculator' },
  ],
}

const faqs = [
  {
    q: 'What is an excess mileage charge?',
    a: 'An excess mileage charge is a fee applied when a leased vehicle exceeds its contracted annual mileage allowance. Charges are calculated at a set rate per mile (pence per mile) for every mile over the allowance, applied at lease return.',
  },
  {
    q: 'How is excess mileage calculated?',
    a: 'Excess mileage is the difference between actual miles driven and the contracted mileage allowance. The charge is calculated as: (Actual Miles − Contract Allowance) × Pence Per Mile rate. This calculator projects that charge based on current trajectory rather than waiting until lease end.',
  },
  {
    q: 'What is a typical excess mileage charge rate?',
    a: 'Rates vary by vehicle, funder, and contract but typically range from 3p to 15p per mile for cars and light commercial vehicles. Premium and specialist vehicles may attract higher rates. Your lease agreement will specify the exact rate.',
  },
  {
    q: 'Can I avoid excess mileage charges?',
    a: 'Yes — the key is early identification. By monitoring mileage trajectory against contract allowance throughout the lease term, you can take action: redistribute mileage across the fleet, negotiate a contract amendment, extend the lease, or swap the vehicle early.',
  },
  {
    q: 'How often should I check fleet mileage against contract?',
    a: 'At minimum quarterly. Best practice is continuous monitoring using telematics data. This calculator is designed for periodic reviews; for real-time monitoring, see the Olaris mileage tracking feature.',
  },
]

export default function ExcessMileageCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <GradientHero
        size="compact"
        title="Free Excess Mileage Calculator"
        subtitle="Excess mileage charges are one of the largest avoidable costs in fleet operations. Project annual mileage for every vehicle and estimate the charges you are heading for — before they hit."
      />

      <SectionWrapper variant="light">
        <ExcessMileageCalculator />

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16 pt-12 border-t border-gray-100">
          <h2 className="text-2xl font-bold font-heading tracking-tight mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-base font-semibold text-olaris-text-dark mb-2">{faq.q}</h3>
                <p className="text-sm text-olaris-text-dark/70 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related content */}
        <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-olaris-text-dark/50 mb-4">Related</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/features/mileage-tracking" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                See real-time mileage monitoring →
              </Link>
            </li>
            <li>
              <Link href="/features/cost-tracking" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                Track total fleet cost per mile →
              </Link>
            </li>
            <li>
              <Link href="/blog/excess-mileage" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                Read: Why Excess Mileage Is the Cost Nobody Tracks
              </Link>
            </li>
            <li>
              <Link href="/blog/what-is-fleet-intelligence" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                Read: What is Fleet Intelligence?
              </Link>
            </li>
            <li>
              <Link href="/blog/fleet-cost-report" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                Read: Understanding Your Fleet Cost Report
              </Link>
            </li>
            <li>
              <Link href="/platform" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                See the full Olaris platform →
              </Link>
            </li>
          </ul>
        </div>
      </SectionWrapper>
    </>
  )
}
