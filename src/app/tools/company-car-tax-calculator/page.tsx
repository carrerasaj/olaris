import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { CompanyCarTaxCalculator } from '@/components/tools/CompanyCarTaxCalculator'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Free Company Car Tax Calculator UK 2025-2030 — BIK Rates | Olaris',
  description:
    "Calculate your company car BIK tax for 2025 to 2030 with HMRC-confirmed escalating rates. Free tool — covers electric, hybrid, and petrol/diesel. Updated for Autumn Budget 2025.",
  alternates: { canonical: 'https://olaris.co.uk/tools/company-car-tax-calculator' },
  openGraph: {
    title: 'Free Company Car Tax Calculator UK 2025-2030 | Olaris',
    description:
      "Calculate BIK tax on any company car from 2025 to 2030. HMRC-confirmed escalating rates. Free — no signup.",
    type: 'website',
    url: 'https://olaris.co.uk/tools/company-car-tax-calculator',
    images: [{ url: 'https://olaris.co.uk/images/fleet-hero.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Company Car Tax Calculator UK 2025-2030',
  description:
    'Free BIK tax calculator for company cars in the UK. Uses HMRC-confirmed escalating rates through 2030, updated for the Autumn Budget 2025.',
  url: 'https://olaris.co.uk/tools/company-car-tax-calculator',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the company car BIK tax rates for 2025 to 2030?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'HMRC has confirmed BIK rates through 2029/30. Electric vehicles (BEV): 3% in 2025/26, rising to 4%, 5%, 7%, then 9% by 2029/30. Plug-in hybrids (PHEV): 6% in 2025/26, rising to 7%, 8%, 18%, then 19%. Standard hybrids (HEV): 29% rising to 33%. Petrol/diesel (ICE): 36% rising to 39%. These rates were confirmed in the UK Autumn Budget 2025.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is company car tax (BIK) calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Company car tax is calculated as: P11D value \u00d7 BIK rate \u00d7 your income tax rate. The P11D value is the list price of the car including options and delivery but excluding first year registration fee and vehicle excise duty. The BIK rate is determined by the car's CO2 emissions and fuel type. Your income tax rate is 20% for basic rate, 40% for higher rate, or 45% for additional rate taxpayers.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is the BIK rate for electric cars in 2025/26?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The BIK rate for fully electric cars (zero emissions) is 3% for the 2025/26 tax year. This rises to 4% in 2026/27, 5% in 2027/28, 7% in 2028/29, and 9% in 2029/30. Electric cars remain significantly cheaper in BIK tax compared to petrol or diesel vehicles, which start at 36% in 2025/26.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much BIK tax will I pay on a \u00a340,000 electric car?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On a \u00a340,000 electric car in 2025/26: P11D (\u00a340,000) \u00d7 BIK rate (3%) = \u00a31,200 taxable benefit. A basic rate (20%) taxpayer pays \u00a3240 per year (\u00a320/month). A higher rate (40%) taxpayer pays \u00a3480 per year (\u00a340/month). By 2029/30 when the BIK rate rises to 9%, the same car would cost \u00a3720/year for a basic rate taxpayer or \u00a31,440/year for a higher rate taxpayer.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is eVED and when does it start?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Electric Vehicle Excise Duty (eVED) is a new pay-per-mile road tax for electric vehicles, announced in the UK Autumn Budget 2025 and taking effect from April 2028. Battery electric vehicles (BEV) will pay 3p per mile and plug-in hybrids (PHEV) will pay 1.5p per mile. This is in addition to the standard VED flat rate of \u00a3195/year for EVs. Standard hybrids and ICE vehicles are not subject to eVED.',
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
      name: 'Company Car Tax Calculator',
      item: 'https://olaris.co.uk/tools/company-car-tax-calculator',
    },
  ],
}

const BIK_TABLE = [
  { type: 'Electric (BEV)', rates: ['3%', '4%', '5%', '7%', '9%'] },
  { type: 'Plug-in Hybrid (PHEV)', rates: ['6%', '7%', '8%', '18%', '19%'] },
  { type: 'Hybrid (HEV)', rates: ['29%', '30%', '31%', '32%', '33%'] },
  { type: 'Petrol/Diesel (ICE)', rates: ['36%', '37%', '37%', '38%', '39%'] },
]

export default function CompanyCarTaxCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <GradientHero
        badge="Free Fleet Tool"
        size="compact"
        title="Company Car Tax Calculator"
        subtitle="Calculate your BIK tax from 2025 to 2030 using HMRC-confirmed escalating rates. Updated for the UK Autumn Budget 2025."
      />

      {/* Calculator */}
      <SectionWrapper variant="dark">
        <CompanyCarTaxCalculator />
      </SectionWrapper>

      {/* BIK Rate Reference Table */}
      <SectionWrapper variant="dark" padding="compact">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-6">
              HMRC BIK Rates 2025/26 to 2029/30
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-olaris-text-secondary/60 uppercase tracking-wide border-b border-olaris-border-dark">
                    <th className="text-left py-3 pr-4">Vehicle Type</th>
                    <th className="text-center py-3 px-3">2025/26</th>
                    <th className="text-center py-3 px-3">2026/27</th>
                    <th className="text-center py-3 px-3">2027/28</th>
                    <th className="text-center py-3 px-3">2028/29</th>
                    <th className="text-center py-3 pl-3">2029/30</th>
                  </tr>
                </thead>
                <tbody>
                  {BIK_TABLE.map((row) => (
                    <tr key={row.type} className="border-t border-olaris-border-dark">
                      <td className="py-2.5 pr-4 font-medium text-white">{row.type}</td>
                      {row.rates.map((rate, i) => (
                        <td key={i} className="py-2.5 px-3 text-center font-mono text-olaris-text-secondary">
                          {rate}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-olaris-text-secondary/50 mt-3">
              Source: UK Autumn Budget 2025, HMRC confirmed rates. BIK rates for ICE vehicles can
              vary based on exact CO2 emissions. The rates shown are for the most common band.
              Vehicles with emissions below the band thresholds may have lower rates.
            </p>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* Context */}
      <SectionWrapper variant="dark" padding="compact">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-6">
              Understanding Company Car BIK Tax in 2025 and Beyond
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <p className="text-olaris-text-secondary leading-relaxed">
              Benefit-in-kind (BIK) tax is the tax you pay for having a company car available for
              personal use. It&apos;s calculated as the car&apos;s P11D value multiplied by the BIK
              percentage rate for that vehicle type, multiplied by your income tax bracket. The result
              is added to your taxable income for the year.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <p className="text-olaris-text-secondary leading-relaxed">
              The UK Autumn Budget 2025 confirmed escalating BIK rates through 2029/30. Electric
              vehicles remain by far the most tax-efficient company car option, but rates are rising
              &mdash; from 3% in 2025/26 to 9% by 2029/30. That&apos;s still a fraction of the 39%
              rate for petrol and diesel, but it&apos;s a threefold increase that affects the total
              cost of ownership calculation.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <h3 className="text-lg font-bold text-white mb-2">The PHEV Cliff Edge in 2028</h3>
            <p className="text-olaris-text-secondary leading-relaxed">
              Plug-in hybrids see the most dramatic change: from 8% in 2027/28 to 18% in 2028/29
              &mdash; more than doubling in a single year. Anyone starting a 4-year PHEV lease now
              will see their monthly BIK cost jump sharply mid-contract. This is critical for fleet
              procurement decisions being made today.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <h3 className="text-lg font-bold text-white mb-2">eVED from April 2028</h3>
            <p className="text-olaris-text-secondary leading-relaxed">
              A new pay-per-mile charge for electric and plug-in hybrid vehicles takes effect from
              April 2028. Battery electric vehicles pay 3p per mile; PHEVs pay 1.5p per mile. On
              10,000 miles per year, that&apos;s &pound;300 for a BEV or &pound;150 for a PHEV, on
              top of the &pound;195 flat VED. This calculator factors eVED into the projection from
              2028/29 onwards.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <p className="text-olaris-text-secondary leading-relaxed">
              Most BIK calculators show the current year only. But if you&apos;re choosing a company
              car on a 3&ndash;4 year contract, you need to know what it costs in year 3 and 4, not
              just today. That&apos;s what this calculator does &mdash; and it&apos;s why the
              year-by-year projection matters more than a single-year figure.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.35}>
            <p className="text-olaris-text-secondary leading-relaxed">
              Orbis calculates BIK liability automatically across your entire fleet, year by year, for
              every vehicle. It&apos;s part of the TCO calculator in our EV Transition Planner &mdash;
              which also models charging costs, maintenance, insurance, and eVED.{' '}
              <Link href="/contact" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                Talk to us &rarr;
              </Link>
            </p>
          </AnimatedSection>
        </div>
      </SectionWrapper>

      {/* CTA */}
      <SectionWrapper variant="dark">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-4">
              BIK is just one number. Orbis shows you the full picture.
            </h2>
            <p className="text-olaris-text-secondary mb-8 max-w-2xl mx-auto">
              Total cost of ownership, charging costs, maintenance forecasting, eVED modelling, and
              mileage management &mdash; calculated automatically for every vehicle in your fleet.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="lg" asChild>
                <Link href="/contact">Talk to Us</Link>
              </Button>
              <Button variant="secondary-outline" size="lg" asChild>
                <Link href="/tools/ev-transition-planner">See the EV Transition Planner</Link>
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

      {/* Related Tools */}
      <SectionWrapper variant="dark" padding="compact">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="text-2xl font-bold font-heading tracking-tight text-white mb-6">
              Related Tools and Resources
            </h2>
          </AnimatedSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatedSection delay={0.1}>
              <Link href="/tools/excess-mileage-calculator" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-5 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-base font-bold text-white mb-1">Free Excess Mileage Calculator</h3>
                <p className="text-sm text-olaris-text-secondary">Check your fleet&apos;s excess mileage exposure</p>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <Link href="/tools/ev-transition-planner" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-5 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-base font-bold text-white mb-1">EV Transition Planner</h3>
                <p className="text-sm text-olaris-text-secondary">Full TCO comparison with charging costs and eVED</p>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Link href="/tools/fleet-compliance-checker" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-5 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-base font-bold text-white mb-1">Fleet Compliance Checker</h3>
                <p className="text-sm text-olaris-text-secondary">Audit your fleet compliance in 2 minutes</p>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.25}>
              <Link href="/blog/what-is-fleet-intelligence" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-5 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-base font-bold text-white mb-1">What is Fleet Intelligence?</h3>
                <p className="text-sm text-olaris-text-secondary">How data changes fleet decisions</p>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
