import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { CTABanner } from '@/components/ui/CTABanner'
import { LogoReveal } from '@/components/ui/LogoReveal'
import { Award, Wrench, Handshake } from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'About Olaris: Fleet Intelligence Built by Automotive Experts',
  description:
    'Founded by someone with 40 years of automotive experience who ran a lease company. Fleet intelligence built by people who know the industry.',
  url: 'https://olaris.co.uk/about',
})

const founderSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Alan Carreras',
  jobTitle: 'Founder & CEO',
  url: 'https://olaris.co.uk/about',
  sameAs: [
    'https://www.linkedin.com/in/alan-carreras-7543231a/',
    'https://leasingbrokernews.co.uk/tag/alan-carreras/',
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'Olaris',
    url: 'https://olaris.co.uk',
  },
  knowsAbout: [
    'Fleet Management',
    'Vehicle Leasing',
    'Fleet Intelligence',
    'BVRLA',
    'Fleet Compliance',
  ],
  description:
    'Former Chair of the BVRLA Leasing Broker Committee. Led 18 acquisitions and grew Bridle Group (now Jurni Leasing) to 37,000+ vehicles over 12 years. Founder of Olaris fleet intelligence platform.',
}

const pressItems = [
  {
    publication: 'Leasing Broker News',
    title: 'Olaris and Carmmunity Form Strategic Partnership',
    href: 'https://leasingbrokernews.co.uk/olaris-and-carmmunity-form-strategic-partnership/',
  },
  {
    publication: 'Broker News',
    title: 'Carmmunity Partners with Olaris Consulting',
    href: 'https://brokernews.co.uk/carmmunity-partners-with-olaris-consulting-run-by-former-bridle-executive-alan-carreras/',
  },
  {
    publication: 'Broker News',
    title: 'Alan Carreras Leaves Bridle as Neil Fox Moves to Chief Executive Role',
    href: 'https://brokernews.co.uk/alan-carreras-leaves-bridle-as-neil-fox-moves-to-chief-executive-role/',
  },
  {
    publication: 'Leasing Broker News',
    title: 'Carreras Leaves Bridle Group',
    href: 'https://leasingbrokernews.co.uk/carreras-leaves-bridle-group/',
  },
  {
    publication: 'Fleet News',
    title: 'Jurni Expands Partner Programme',
    href: 'https://www.fleetnews.co.uk/news/jurni-expands-partner-programme-with-three-uk-leasing-brokers',
  },
]

const credentials = [
  'Former Chair, BVRLA Leasing Broker Committee (2019–2021)',
  'FLA Committee Member',
  '12 years at Bridle Group (now Jurni Leasing) — grew to 37,000+ vehicles',
  'Led 18 acquisitions — including Churchill Vehicle Leasing, Sprint Contracts & Kew Vehicle Leasing',
]

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }}
      />

      <GradientHero
        size="compact"
        title={
          <>
            40 years in automotive.
            <br className="hidden md:block" />
            {' '}We built what we wished existed.
          </>
        }
        subtitle="Olaris isn't a tech company that read about fleet management. It's a fleet company that learned to build technology."
      >
        <LogoReveal className="w-20 h-20 mx-auto mb-2" />
      </GradientHero>

      {/* Founder story */}
      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-6">
            The story
          </h2>
          <div className="space-y-5 text-olaris-text-dark/80 leading-relaxed text-lg">
            <p>
              Olaris was founded by Alan Carreras, who has spent four decades in the automotive
              industry — building and running a lease company, managing fleets, and experiencing
              first-hand the frustration of fragmented systems, manual compliance processes, and
              cost data you could never quite trust.
            </p>
            <p>
              The tools did not exist. The platforms on the market were built by people who had
              never managed a fleet, never dealt with a DVLA check failure on a Friday afternoon,
              never had to explain to a client why their mileage charges were twice the forecast.
            </p>
            <p>
              So we built Olaris. Not as a startup chasing a market. As practitioners building
              the tools we needed. Every feature exists because someone who runs vehicles asked
              for it — not because a product roadmap said it was time.
            </p>
          </div>

          {/* Credentials bar */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-olaris-text-dark/40 mb-4">
              Alan Carreras — credentials
            </p>
            <ul className="space-y-2">
              {credentials.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-olaris-text-dark/70">
                  <span className="text-cyan-500 mt-1 shrink-0">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionWrapper>

      {/* What makes us different */}
      <SectionWrapper variant="dark">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white">
            We&apos;re not a tech company that sells to fleet.
            <br className="hidden md:block" />
            {' '}We&apos;re fleet people who build technology.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: Award,
              title: 'Experience',
              description:
                '40 years in automotive. We have built lease companies, managed fleets, and dealt with every operational headache you are facing right now.',
            },
            {
              icon: Wrench,
              title: 'Practicality',
              description:
                'Every feature exists because someone who runs vehicles asked for it. We do not build things that look good in demos but do not survive Monday morning.',
            },
            {
              icon: Handshake,
              title: 'Partnership',
              description:
                'We are not selling you a licence and disappearing. We work with you, because we understand that fleet management is ongoing, not a one-off implementation.',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} variant="dark" className="text-center">
                <div className="inline-flex p-3 rounded-lg bg-cyan-500/10 mb-4">
                  <Icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-olaris-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </Card>
            )
          })}
        </div>
      </SectionWrapper>

      {/* Technology */}
      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-6">
            Enterprise infrastructure, not a prototype
          </h2>
          <p className="text-olaris-text-dark/70 leading-relaxed mb-8">
            Purpose-built platform, cloud-deployed, multi-tenant architecture. Encrypted,
            compliant, and connected to 15+ vehicle manufacturers. Built to handle the
            demands of real fleet operations at scale.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-olaris-text-dark/50 font-medium">
            <span>High Mobility</span>
            <span>Mapbox</span>
            <span>DVLA</span>
            <span>Oracle Cloud</span>
          </div>
        </div>
      </SectionWrapper>

      {/* In the Press */}
      <SectionWrapper variant="light" padding="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold font-heading tracking-tight mb-5 text-olaris-text-dark">
            In the Press
          </h2>
          <ul className="space-y-3">
            {pressItems.map((item) => (
              <li key={item.href} className="flex items-baseline gap-2 text-sm">
                <span className="font-semibold text-olaris-text-dark shrink-0">{item.publication}</span>
                <span className="text-olaris-text-dark/30">—</span>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors"
                >
                  &ldquo;{item.title}&rdquo;
                </a>
              </li>
            ))}
          </ul>
        </div>
      </SectionWrapper>

      <CTABanner
        headline="Whether you want a demo or just want to talk fleet — we're here."
        buttonText="Get in Touch"
        buttonHref="/contact"
      />
    </>
  )
}
