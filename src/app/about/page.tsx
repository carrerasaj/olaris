import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { CTABanner } from '@/components/ui/CTABanner'
import { LogoReveal } from '@/components/ui/LogoReveal'
import { Award, Wrench, Handshake } from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'About | Olaris',
  description:
    '40 years in automotive. We built what we wished existed. Olaris is a fleet company that learned to build technology.',
})

export default function AboutPage() {
  return (
    <>
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

      <CTABanner
        headline="Whether you want a demo or just want to talk fleet — we're here."
        buttonText="Get in Touch"
        buttonHref="/contact"
      />
    </>
  )
}
