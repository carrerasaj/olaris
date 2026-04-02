import { Metadata } from 'next'
import Link from 'next/link'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { CTABanner } from '@/components/ui/CTABanner'
import { constructMetadata } from '@/lib/seo'

export const metadata: Metadata = constructMetadata({
  title: 'Automated DVLA Licence Checking for Fleet Compliance | Olaris',
  description:
    'Automated DVLA licence checking at scale. Verify driver licences, track endorsements, and ensure fleet compliance without manual admin.',
  url: 'https://olaris.co.uk/features/dvla-compliance',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is DVLA licence checking for fleets?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'DVLA licence checking is the process of verifying that every driver operating a company vehicle holds a valid licence appropriate for that vehicle. UK employers have a legal duty of care to ensure this. Checks must be performed regularly across all drivers — not just at onboarding — and should cover licence validity, endorsements, penalty points, disqualifications, and category entitlements.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often should fleet operators check driver licences?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The DVLA and industry bodies recommend checking at least every six months for standard drivers, and quarterly for high-risk drivers or those with existing endorsements. Automated systems like Olaris allow you to set custom check frequencies per driver risk level, ensuring higher-risk drivers are monitored more frequently without additional admin.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if a driver receives penalty points between checks?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'With manual checking, you may not find out until the next scheduled review — which could be months later. Olaris detects changes at the next automated check and immediately alerts the fleet manager. For high-risk events such as disqualification or points approaching a threshold, you can configure real-time notifications.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does DVLA licence checking require driver consent?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Drivers must provide consent for their licence data to be accessed via the DVLA\'s driver data service. Olaris manages this consent process — each driver provides a one-time consent, after which automated checks can run on schedule without requiring further driver action.',
      },
    },
  ],
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Automated DVLA Licence Checking',
  description: 'Automated DVLA driver licence verification and endorsement tracking for UK fleet compliance.',
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

export default function DvlaCompliancePage() {
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
        title="Automated DVLA Licence Checking for Fleets"
        subtitle="Every driver. Every licence. Verified — without the spreadsheet and the phone calls."
      />

      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto space-y-12">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              What is DVLA licence checking for fleets?
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              UK employers have a legal duty of care to ensure that anyone driving on company
              business holds a valid licence appropriate for the vehicle being driven. DVLA licence
              checking is the process of verifying this — confirming the licence is valid, checking
              for endorsements, penalty points, disqualifications, and whether the driver holds the
              correct categories for the vehicles they operate. For fleets, this must be done
              regularly across every driver, not just at onboarding. Failure to maintain adequate
              checks is a compliance failure with potential legal and insurance consequences.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              How automated licence checking works
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Olaris integrates directly with the DVLA&apos;s driver data service. Each driver
              provides a one-time consent, after which Olaris can query their licence status
              automatically — on a schedule set by the fleet manager (monthly, quarterly, or
              triggered by specific events). The system checks licence validity, endorsements,
              penalty points, category entitlements, and expiry dates. Results are stored against
              each driver record, with a full audit trail showing when each check was performed
              and what was returned.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Endorsement tracking and alerts
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              When a driver receives new penalty points, a disqualification, or a change to their
              licence categories, Olaris detects this at the next scheduled check and immediately
              alerts the fleet manager. For high-risk events — a disqualification, or points
              approaching a threshold that would make the driver a risk — you can configure
              immediate notifications so that action is taken before that driver gets behind the
              wheel of a company vehicle again.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
              Compliance without the admin burden
            </h2>
            <p className="text-olaris-text-dark/70 leading-relaxed">
              Manual licence checking typically means emailing drivers, collecting paper copies,
              logging them to a spreadsheet, and chasing the ones who don&apos;t respond. For a
              fleet of 50 drivers checked quarterly, that is 200 manual tasks per year — before
              you add follow-ups. Automated checking removes this entirely. The system runs
              checks on schedule, records the results, and only flags the exceptions that require
              human attention. Your compliance record is always current, always documented, and
              available for audit at any time.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-olaris-text-dark/50 mb-3">Related reading</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog/dvla-compliance" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  DVLA Compliance: What Most Fleet Managers Get Wrong
                </Link>
              </li>
              <li>
                <Link href="/platform" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  The full Olaris platform
                </Link>
              </li>
              <li>
                <Link href="/features/driver-behaviour" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                  Driver Behaviour Scoring & Monitoring
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </SectionWrapper>

      <CTABanner
        headline="Take the admin out of licence compliance."
        subtext="Automated DVLA checking, scheduled and logged — so you're always covered."
        buttonText="Book a Demo"
        buttonHref="/contact"
      />
    </>
  )
}
