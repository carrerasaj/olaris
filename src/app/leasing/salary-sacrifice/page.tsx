import { Metadata } from 'next'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { CTABanner } from '@/components/ui/CTABanner'
import {
  Car, ShieldCheck, Zap, BarChart3, PoundSterling,
  Users, ClipboardCheck, Truck, Battery,
} from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'Salary Sacrifice Car Scheme | EV & ULEV | Olaris',
  description:
    'Salary sacrifice car schemes for UK employers with Orbis fleet intelligence included. Employees save up to 40% on a new car. Employers get full fleet visibility.',
  url: 'https://olaris.co.uk/leasing/salary-sacrifice',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is salary sacrifice suitable for all employees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Salary sacrifice is available to employees whose post-sacrifice salary remains above the National Minimum Wage. We'll help you identify eligible employees during scheme design.",
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if an employee leaves?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Early termination provisions are built into every scheme. Options typically include the employee taking over the lease personally, a settlement figure, or transfer to another employee.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the scheme really revenue neutral for the employer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. The vehicle cost is funded entirely through the employee's gross salary deduction. The employer actually saves money through reduced employer NI contributions on the sacrificed amount.",
      },
    },
    {
      '@type': 'Question',
      name: 'Which vehicles are available?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "All makes and models, though the strongest savings are on electric and ultra-low emission vehicles due to the favourable BIK rates. We'll recommend an approved vehicle list based on your employee demographics and budget.",
      },
    },
    {
      '@type': 'Question',
      name: 'Do we need to manage the fleet ourselves?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. Orbis handles the intelligence automatically. Maintenance, insurance, and breakdown are included in the monthly deduction. Your involvement is limited to payroll deductions and the occasional HR query.",
      },
    },
  ],
}

const employeeGets = [
  { icon: Car, text: 'Brand new car of their choice (EV, PHEV, or ULEV)' },
  { icon: ShieldCheck, text: 'Insurance, maintenance, breakdown cover, and road tax included' },
  { icon: PoundSterling, text: 'Savings of 30–40% compared to personal leasing' },
  { icon: ClipboardCheck, text: 'No deposit required' },
]

const employerGets = [
  { icon: PoundSterling, text: 'Revenue-neutral benefit — funded through gross salary deduction' },
  { icon: BarChart3, text: 'Employer NI savings on the sacrificed salary' },
  { icon: Users, text: 'Attraction and retention tool for talent' },
  { icon: Truck, text: 'Full fleet visibility through Orbis — every scheme vehicle, in real time' },
]

const orbisDifference = [
  {
    title: 'Charging cost reconciliation',
    description:
      'Orbis tracks every charging session by location and tariff, compares actual cost against HMRC advisory rates, and produces a reconciled figure ready for payroll. No more spreadsheet gymnastics.',
  },
  {
    title: 'Real-world range and efficiency',
    description:
      'The brochure says 300 miles. Your employees are getting 190 in January. Orbis shows actual energy consumption and range per vehicle — not manufacturer estimates.',
  },
  {
    title: 'Compliance and duty of care',
    description:
      'DVLA licence status, MOT dates, insurance validity — all checked automatically. You meet your employer duty of care obligations without manual processes.',
  },
  {
    title: 'Total scheme cost',
    description:
      "Not the projected cost from the provider's quote — the actual, real-time cost of running the scheme. Charging reimbursement, maintenance, insurance, and administration in one view.",
  },
]

const setupSteps = [
  {
    title: 'Scheme design',
    description:
      'We work with you to define the eligible vehicles, employee criteria, and scheme rules. We handle the salary sacrifice agreement template and employer documentation.',
  },
  {
    title: 'Employee ordering',
    description:
      'Employees choose their vehicle from an approved list. We handle the order, the funder, and the delivery.',
  },
  {
    title: 'Payroll integration',
    description:
      'We provide the deduction schedule. Your payroll team applies the gross salary deduction each month.',
  },
  {
    title: 'Orbis goes live',
    description:
      'Every vehicle is automatically connected. You see the entire scheme fleet in real time — no setup, no integration, no IT project.',
  },
]

export default function SalarySacrificePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <GradientHero
        size="compact"
        title="Salary Sacrifice Car Schemes with Fleet Intelligence"
        subtitle="A salary sacrifice car scheme lets your employees drive a brand new car — typically an EV or ultra-low emission vehicle — while saving up to 40% compared to personal leasing. With Olaris, every scheme includes Orbis fleet intelligence."
      />

      {/* How It Works */}
      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-6">
              How a Salary Sacrifice Car Scheme Works
            </h2>
            <div className="space-y-5 text-olaris-text-dark/80 leading-relaxed text-lg">
              <p>
                Your employee chooses a car. The cost is deducted from their gross salary before
                tax and National Insurance are calculated. The employee pays less tax and NI. The
                employer pays less employer NI. The vehicle is insured, maintained, and covered
                for breakdown — all included in the monthly deduction.
              </p>
              <p>
                For electric vehicles, the benefit-in-kind (BIK) rate makes salary sacrifice
                particularly attractive. At the current 2% BIK rate for zero-emission vehicles,
                an employee can drive a brand new EV for significantly less than they&apos;d pay on
                a personal contract.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <AnimatedSection>
              <h3 className="text-lg font-bold mb-4">What the employee gets</h3>
              <ul className="space-y-3">
                {employeeGets.map((item) => {
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
              <h3 className="text-lg font-bold mb-4">What the employer gets</h3>
              <ul className="space-y-3">
                {employerGets.map((item) => {
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
        </div>
      </SectionWrapper>

      {/* The Orbis Difference */}
      <SectionWrapper variant="dark">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white mb-4">
              Why Salary Sacrifice with Olaris Is Different
            </h2>
            <p className="text-olaris-text-secondary leading-relaxed mb-10">
              Most salary sacrifice providers set up the scheme, deliver the vehicles, and give
              you an admin portal. That&apos;s where it ends. With Olaris, every vehicle in the
              salary sacrifice fleet is connected to Orbis from day one.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orbisDifference.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <Card variant="dark" className="h-full">
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-olaris-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Setup Steps */}
      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-4">
              Simple to Set Up, Easy to Run
            </h2>
            <p className="text-olaris-text-dark/80 leading-relaxed mb-8 text-lg">
              Setting up a salary sacrifice scheme with Olaris is straightforward:
            </p>
          </AnimatedSection>

          <div className="space-y-6">
            {setupSteps.map((step, i) => (
              <AnimatedSection key={step.title} delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-50 text-cyan-600 font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{step.title}</h3>
                    <p className="text-sm text-olaris-text-dark/70 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper variant="dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white mb-8">
            Common Questions
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

      {/* Internal links */}
      <SectionWrapper variant="light" padding="compact">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-bold mb-4">Related reading</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { href: '/blog/what-is-fleet-intelligence', label: 'What is Fleet Intelligence?' },
              { href: '/features/ev-transition', label: 'EV Transition Planning' },
              { href: '/platform', label: 'Orbis Platform Overview' },
              { href: '/leasing/business-contract-hire', label: 'Business Contract Hire' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-cyan-600 hover:text-cyan-700 underline underline-offset-2 transition-colors"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <CTABanner
        headline="Offer Your Employees a Better Deal"
        subtext="A salary sacrifice car scheme is one of the most popular employee benefits available — and with Orbis intelligence built in, it's one of the most visible too. Talk to us about setting up a scheme for your organisation."
        buttonText="Discuss a Salary Sacrifice Scheme"
        buttonHref="/contact"
      />
    </>
  )
}
