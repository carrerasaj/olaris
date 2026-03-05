'use client'

import Link from 'next/link'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { MapPin, Users, TrendingDown, Leaf } from 'lucide-react'

const outcomes = [
  {
    icon: MapPin,
    title: 'Your fleet, visible',
    description:
      'Live tracking, real-time mileage reads, and vehicle health — across every manufacturer. No more spreadsheets, no more chasing drivers. You open the dashboard and the data is there.',
    link: '/platform#fleet-visibility',
  },
  {
    icon: Users,
    title: 'Your drivers, accountable',
    description:
      'DVLA compliance on autopilot. Behaviour scoring that rewards good driving and coaches the rest. The culture shifts — and your insurance premiums improve with it.',
    link: '/platform#driver-management',
  },
  {
    icon: TrendingDown,
    title: 'Your costs, honest',
    description:
      'Real fuel and energy costs from actual consumption. Mileage tracked against contract allowances. Excess charges spotted 6 months before the vehicle comes back.',
    link: '/platform#cost-control',
  },
  {
    icon: Leaf,
    title: 'Your future, measurable',
    description:
      'EV transition planning built from your actual fleet data. Carbon tracking that goes beyond a spreadsheet. A net-zero roadmap that is a measurement, not a slogan.',
    link: '/platform#sustainability',
  },
]

export function WhatChanges() {
  const { ref, inView } = useScrollAnimation()

  return (
    <SectionWrapper variant="dark">
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white mb-4">
            What changes when you work with Olaris
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outcomes.map((outcome, i) => {
            const Icon = outcome.icon
            return (
              <motion.div
                key={outcome.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card variant="dark" className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 p-2 rounded-lg bg-cyan-500/10">
                      <Icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        {outcome.title}
                      </h3>
                      <p className="text-olaris-text-secondary leading-relaxed text-sm mb-3">
                        {outcome.description}
                      </p>
                      <Link
                        href={outcome.link}
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        See the detail →
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </SectionWrapper>
  )
}
