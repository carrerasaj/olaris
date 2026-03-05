'use client'

import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { StatCard } from '@/components/ui/StatCard'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export function CredibilitySection() {
  const { ref, inView } = useScrollAnimation()

  return (
    <SectionWrapper variant="dark" id="credibility">
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-white mb-6">
            This isn&apos;t our first fleet
          </h2>
          <p className="text-olaris-text-secondary leading-relaxed text-lg">
            Olaris was born from decades of running vehicles, managing drivers, and navigating the
            compliance, cost, and operational headaches that come with it. We have sat where you
            sit — chasing mileage returns, fielding calls about expired licences, pulling together
            cost reports that took days and still did not tell the full story. We built Olaris
            because we could not find a platform that thought the way we did. So we made one.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <StatCard value="40 years" label="Industry Experience" />
          <StatCard value="Lease Co" label="Built & Managed" />
          <StatCard value="First-hand" label="Fleet Operations" />
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
