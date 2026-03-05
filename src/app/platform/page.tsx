import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { BrowserFrame } from '@/components/ui/BrowserFrame'
import { Card } from '@/components/ui/Card'
import { CTABanner } from '@/components/ui/CTABanner'
import { MockupEntrance } from '@/components/ui/MockupEntrance'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { FleetMapMockup } from '@/components/mockups/FleetMapMockup'
import { DriverScoreboardMockup } from '@/components/mockups/DriverScoreboardMockup'
import { CostDashboardMockup } from '@/components/mockups/CostDashboardMockup'
import { CarbonTrackerMockup } from '@/components/mockups/CarbonTrackerMockup'
import { outcomes } from '@/data/outcomes'
import { additionalFeatures } from '@/data/features'
import {
  MapPin, Users, TrendingDown, Leaf,
  Car, ShieldCheck, Wrench, Lock, Plug,
} from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'What We Do | Olaris',
  description:
    'Fleet visibility, driver compliance, cost intelligence, and sustainability tools — built from 40 years of automotive experience.',
})

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Users, TrendingDown, Leaf, Car, ShieldCheck, Wrench, Lock, Plug,
}

const mockupMap: Record<string, React.ComponentType> = {
  'fleet-visibility': FleetMapMockup,
  'driver-management': DriverScoreboardMockup,
  'cost-control': CostDashboardMockup,
  sustainability: CarbonTrackerMockup,
}

const mockupUrlMap: Record<string, string> = {
  'fleet-visibility': 'app.olaris.co.uk/fleet/map',
  'driver-management': 'app.olaris.co.uk/drivers/scoreboard',
  'cost-control': 'app.olaris.co.uk/costs/dashboard',
  sustainability: 'app.olaris.co.uk/carbon/tracker',
}

export default function PlatformPage() {
  return (
    <>
      <GradientHero
        size="compact"
        title="A platform built from the operator's chair"
        subtitle="Everything here exists because someone who has actually run a fleet said 'I need this.' Not because a product manager thought it sounded good."
      />

      {outcomes.map((outcome, i) => {
        const variant = i % 2 === 0 ? 'light' : 'dark'
        const MockupComponent = mockupMap[outcome.id]
        const Icon = iconMap[outcome.icon] || MapPin

        return (
          <SectionWrapper key={outcome.id} variant={variant} id={outcome.id}>
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                i % 2 === 1 ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Text */}
              <AnimatedSection className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className={`inline-flex p-2 rounded-lg mb-4 ${
                  variant === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-50'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    variant === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
                  }`} />
                </div>
                <h2 className={`text-3xl md:text-4xl font-bold font-heading tracking-tight mb-4 ${
                  variant === 'dark' ? 'text-white' : ''
                }`}>
                  {outcome.tagline}
                </h2>
                <p className={`leading-relaxed mb-6 ${
                  variant === 'dark' ? 'text-olaris-text-secondary' : 'text-olaris-text-dark/70'
                }`}>
                  {outcome.description}
                </p>
                <ul className="space-y-3 mb-6">
                  {outcome.details.map((detail, j) => (
                    <li key={j} className="flex gap-3 text-sm">
                      <span className="text-cyan-500 mt-1 shrink-0">•</span>
                      <span className={
                        variant === 'dark' ? 'text-olaris-text-secondary' : 'text-olaris-text-dark/70'
                      }>
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
                {outcome.callout && (
                  <div className={`p-4 rounded-lg border text-sm leading-relaxed ${
                    variant === 'dark'
                      ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-300'
                      : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                  }`}>
                    {outcome.callout}
                  </div>
                )}
              </AnimatedSection>

              {/* Mockup with 3D entrance */}
              <MockupEntrance className={i % 2 === 1 ? 'lg:col-start-1' : ''}>
                {MockupComponent && (
                  <BrowserFrame url={mockupUrlMap[outcome.id]}>
                    <MockupComponent />
                  </BrowserFrame>
                )}
              </MockupEntrance>
            </div>
          </SectionWrapper>
        )
      })}

      {/* Also built in */}
      <SectionWrapper variant="light" padding="compact">
        <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-center mb-10">
          And the rest
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {additionalFeatures.map((feature) => {
            const Icon = iconMap[feature.icon] || MapPin
            return (
              <Card key={feature.title} variant="light" hover={false} className="flex items-start gap-3 p-4">
                <Icon className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {feature.title}
                    {feature.comingSoon && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-medium">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-olaris-text-dark/60 mt-0.5">{feature.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </SectionWrapper>

      <CTABanner
        headline="Ready to see your fleet differently?"
        subtext="No slides. No sales pitch. Just your data, in the platform."
        buttonText="Book a Demo"
        buttonHref="/contact"
      />
    </>
  )
}
