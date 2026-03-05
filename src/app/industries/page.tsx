import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { CTABanner } from '@/components/ui/CTABanner'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { industries } from '@/data/industries'
import { Truck, FileText, Factory, Handshake } from 'lucide-react'
import { CheckCircle, XCircle } from 'lucide-react'

export const metadata: Metadata = constructMetadata({
  title: 'Fleet Management for Operators, Lease & OEM Companies | Olaris',
  description:
    'Purpose-built for UK lease companies, fleet operators, OEMs & brokers. Automated mileage tracking, compliance checking, cost analysis & driver monitoring.',
  url: 'https://olaris.co.uk/industries',
})

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck, FileText, Factory, Handshake,
}

export default function IndustriesPage() {
  return (
    <>
      <GradientHero
        size="compact"
        title="We've sat in your chair"
        subtitle="Every feature in this platform exists because someone in your role asked for it. Not because we thought it would look good on a feature list."
      />

      {industries.map((industry, i) => {
        const variant = i % 2 === 0 ? 'light' : 'dark'
        const Icon = iconMap[industry.icon] || Truck

        return (
          <SectionWrapper key={industry.id} variant={variant} id={industry.id}>
            <AnimatedSection className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  variant === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-50'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    variant === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
                  }`} />
                </div>
                <h2 className={`text-3xl md:text-4xl font-bold font-heading tracking-tight ${
                  variant === 'dark' ? 'text-white' : ''
                }`}>
                  {industry.title}
                </h2>
              </div>

              <p className={`text-lg font-medium mb-2 ${
                variant === 'dark' ? 'text-cyan-400' : 'text-cyan-700'
              }`}>
                {industry.subtitle}
              </p>

              <p className={`mb-8 leading-relaxed ${
                variant === 'dark' ? 'text-olaris-text-secondary' : 'text-olaris-text-dark/70'
              }`}>
                {industry.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
                    variant === 'dark' ? 'text-olaris-text-secondary' : 'text-olaris-text-dark/50'
                  }`}>
                    The problems
                  </h3>
                  <ul className="space-y-3">
                    {industry.painPoints.map((point, j) => (
                      <li key={j} className="flex gap-3 text-sm">
                        <XCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                          variant === 'dark' ? 'text-red-400/60' : 'text-red-400'
                        }`} />
                        <span className={
                          variant === 'dark' ? 'text-olaris-text-secondary' : 'text-olaris-text-dark/70'
                        }>
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
                    variant === 'dark' ? 'text-olaris-text-secondary' : 'text-olaris-text-dark/50'
                  }`}>
                    What changes
                  </h3>
                  <ul className="space-y-3">
                    {industry.whatChanges.map((change, j) => (
                      <li key={j} className="flex gap-3 text-sm">
                        <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                          variant === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                        }`} />
                        <span className={
                          variant === 'dark' ? 'text-olaris-text-secondary' : 'text-olaris-text-dark/70'
                        }>
                          {change}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className={`text-lg font-medium italic border-l-2 pl-4 ${
                variant === 'dark'
                  ? 'text-cyan-300 border-cyan-500/40'
                  : 'text-cyan-700 border-cyan-500'
              }`}>
                {industry.keyLine}
              </p>
            </AnimatedSection>
          </SectionWrapper>
        )
      })}

      {/* Wider ecosystem */}
      <SectionWrapper variant="light" padding="compact">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-4">
            The broader picture
          </h2>
          <p className="text-olaris-text-dark/70 leading-relaxed mb-6">
            Fleet management does not exist in isolation. Remarketing, insurance, finance,
            maintenance, and charging infrastructure all connect to it. If you work upstream
            or downstream of fleet, we should talk.
          </p>
        </div>
      </SectionWrapper>

      <CTABanner
        headline="Tell us about your use case"
        subtext="Whether you run 50 vehicles or 5,000 — we would rather listen first, then show you what is possible."
        buttonText="Get in Touch"
        buttonHref="/contact"
      />
    </>
  )
}
