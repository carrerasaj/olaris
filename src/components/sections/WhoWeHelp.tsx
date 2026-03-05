'use client'

import Link from 'next/link'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { Truck, FileText, Factory, Handshake } from 'lucide-react'

const industries = [
  {
    icon: Truck,
    title: 'Fleet Operators',
    description:
      'You need visibility across vehicles, drivers, mileage, and costs — without logging into six different systems.',
    href: '/industries#fleet-operators',
  },
  {
    icon: FileText,
    title: 'Lease Companies',
    description:
      'Your margin lives and dies on mileage compliance, vehicle condition, and knowing what is happening on every contract.',
    href: '/industries#lease-companies',
  },
  {
    icon: Factory,
    title: 'OEMs',
    description:
      'You have got connected vehicle data. We help you turn it into fleet-level intelligence.',
    href: '/industries#oems',
  },
  {
    icon: Handshake,
    title: 'Brokers',
    description:
      'Your clients want quotes fast, with the right mileage, the right term, and the right vehicle.',
    href: '/industries#brokers',
  },
]

export function WhoWeHelp() {
  const { ref, inView } = useScrollAnimation()

  return (
    <SectionWrapper variant="light">
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-4">
            We speak your language
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry, i) => {
            const Icon = industry.icon
            return (
              <motion.div
                key={industry.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={industry.href}>
                  <Card variant="light" className="h-full text-center">
                    <div className="inline-flex p-3 rounded-lg bg-cyan-50 mb-4">
                      <Icon className="h-6 w-6 text-cyan-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{industry.title}</h3>
                    <p className="text-sm text-olaris-text-dark/70 leading-relaxed">
                      {industry.description}
                    </p>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </SectionWrapper>
  )
}
