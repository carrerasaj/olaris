import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { FleetComplianceChecker } from '@/components/tools/FleetComplianceChecker'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Free Fleet Compliance Checker UK — Audit Your Fleet in 2 Minutes | Olaris',
  description:
    "Check your fleet's compliance against UK requirements in 2 minutes. Free assessment covering DVLA checks, grey fleet policy, MOT tracking, insurance, and duty of care. No signup.",
  alternates: { canonical: 'https://olaris.co.uk/tools/fleet-compliance-checker' },
  openGraph: {
    title: 'Free Fleet Compliance Checker UK | Olaris',
    description:
      'Audit your fleet compliance in 2 minutes. Free assessment — DVLA, grey fleet, MOT, insurance, duty of care.',
    type: 'website',
    url: 'https://olaris.co.uk/tools/fleet-compliance-checker',
    images: [{ url: 'https://olaris.co.uk/images/fleet-hero.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Fleet Compliance Checker',
  description:
    'Free fleet compliance audit tool for UK fleet managers. Check your compliance across DVLA, insurance, MOT, grey fleet, and duty of care requirements.',
  url: 'https://olaris.co.uk/tools/fleet-compliance-checker',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  author: {
    '@type': 'Organization',
    name: 'Olaris Consulting Limited',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the UK fleet compliance requirements?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'UK fleet compliance requirements include: regular DVLA licence checking for all drivers, valid MOT certificates for vehicles over 3 years old, continuous insurance verification, duty of care obligations under the Health and Safety at Work Act 1974, grey fleet policy for employees using personal vehicles for business, and maintaining accurate mileage and maintenance records. Failure to meet these obligations can result in corporate liability, insurance invalidation, and prosecution.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often should you check fleet driver licences?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Best practice is to check fleet driver licences at least quarterly. Many insurance policies require this as a condition of cover. The DVLA offers a free online checking service, and fleet management platforms like Orbis can automate this process with continuous monitoring and alerts when a licence status changes.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a grey fleet policy and do I need one?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A grey fleet policy governs employees who use their own personal vehicles for business purposes. If any of your employees drive their own car for work, you need a grey fleet policy. It should cover: insurance requirements (business use cover), vehicle roadworthiness checks, MOT verification, mileage recording, and expense reimbursement rates. Without a policy, the employer retains duty of care liability but has no visibility of vehicle condition or driver compliance.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if my fleet fails a compliance audit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Failing a fleet compliance audit can result in several consequences: insurance claims being rejected if the driver or vehicle was non-compliant at the time of an incident, corporate prosecution under duty of care legislation, individual prosecution of fleet managers or directors under the Corporate Manslaughter Act in serious cases, and increased insurance premiums. The financial impact of a single non-compliant incident can run into hundreds of thousands of pounds.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I automate fleet compliance checking?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Fleet compliance can be automated using fleet intelligence platforms that integrate with DVLA, MOT, and insurance databases. Orbis, for example, continuously monitors driver licence status, MOT dates, insurance renewals, and vehicle health data \u2014 flagging issues before they become compliance gaps. Automated checking replaces quarterly manual audits with continuous monitoring and real-time alerts.',
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
      name: 'Fleet Compliance Checker',
      item: 'https://olaris.co.uk/tools/fleet-compliance-checker',
    },
  ],
}

export default function FleetComplianceCheckerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <GradientHero
        badge="Free Fleet Tool"
        size="compact"
        title="Fleet Compliance Checker"
        subtitle="Audit your fleet's compliance against UK requirements in 2 minutes. Answer 10 questions, get your score and a prioritised action list."
      />

      {/* Checker */}
      <SectionWrapper variant="dark">
        <FleetComplianceChecker />
      </SectionWrapper>

      {/* Context */}
      <SectionWrapper variant="dark" padding="compact">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-6">
              The real cost of fleet non-compliance
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <p className="text-olaris-text-secondary leading-relaxed">
              UK fleet operators have a legal duty of care to every person who drives on company
              business. This isn&apos;t discretionary &mdash; it&apos;s enshrined in the Health and Safety at
              Work Act 1974 and reinforced by the Corporate Manslaughter and Corporate Homicide Act
              2007. If a driver is involved in a serious incident and you can&apos;t demonstrate
              reasonable compliance measures, the consequences fall on the organisation and its
              directors personally.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <p className="text-olaris-text-secondary leading-relaxed">
              A single at-fault incident with a non-compliant driver can invalidate your entire
              fleet insurance policy &mdash; not just the claim for that vehicle. Insurers routinely
              check licence status, MOT validity, and maintenance records after an incident. If any
              of those are out of date, the claim is refused and the operator is exposed to the
              full cost.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="text-olaris-text-secondary leading-relaxed">
              Under the Corporate Manslaughter Act 2007, directors and fleet managers can be held
              personally liable if a fatal incident is linked to a gross failure in duty of care.
              Prosecution is not theoretical &mdash; it happens. And the reputational damage alone
              can be terminal for a business.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <p className="text-olaris-text-secondary leading-relaxed">
              The cost of proper compliance checking is a fraction of the cost of a single claim.
              Quarterly DVLA checks, MOT tracking, insurance verification, and defect reporting can
              all be systemised for less than the cost of one excess mileage invoice.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <p className="text-olaris-text-secondary leading-relaxed">
              Most compliance gaps aren&apos;t malicious &mdash; they&apos;re just not tracked properly.
              An MOT slips, a licence status changes, an insurance renewal gets missed. It&apos;s the
              gaps between systems that create risk. That&apos;s what Orbis fixes &mdash; continuous
              monitoring across every compliance dimension, with alerts before gaps appear.{' '}
              <Link href="/contact" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                Talk to us about fleet compliance →
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
              Automate every check on this list
            </h2>
            <p className="text-olaris-text-secondary mb-8 max-w-2xl mx-auto">
              Orbis monitors driver licences, MOT dates, insurance renewals, vehicle defects, and
              mileage &mdash; continuously. No spreadsheets. No quarterly audits. No gaps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="lg" asChild>
                <Link href="/contact">Talk to Us</Link>
              </Button>
              <Button variant="secondary-outline" size="lg" asChild>
                <Link href="/platform">See the Platform</Link>
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
                <p className="text-sm text-olaris-text-secondary">Plan your fleet&apos;s move to electric</p>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Link href="/blog/what-is-fleet-compliance" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-5 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-base font-bold text-white mb-1">What is Fleet Compliance?</h3>
                <p className="text-sm text-olaris-text-secondary">The complete UK guide to fleet compliance obligations</p>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.25}>
              <Link href="/blog/what-is-an-at-risk-driver" className="block rounded-xl border border-olaris-border-dark bg-[#1C2128] p-5 hover:border-cyan-500/40 transition-colors h-full">
                <h3 className="text-base font-bold text-white mb-1">What is an At-Risk Driver?</h3>
                <p className="text-sm text-olaris-text-secondary">How to identify, score, and manage driver risk</p>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
