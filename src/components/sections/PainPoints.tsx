'use client'

import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, FileWarning, Calculator } from 'lucide-react'

const painPoints = [
  {
    icon: AlertTriangle,
    text: 'You are chasing mileage readings from drivers who "forgot to check" — and your lease returns are costing you thousands in excess charges.',
  },
  {
    icon: FileWarning,
    text: 'You find out a driver\'s licence expired three weeks after it happened.',
  },
  {
    icon: Clock,
    text: 'Your best drivers subsidise your worst ones, but you have got no data to prove it and no way to change the culture.',
  },
  {
    icon: Calculator,
    text: 'Your monthly cost report takes two days to build and nobody trusts the numbers.',
  },
]

export function PainPoints() {
  return (
    <SectionWrapper variant="light">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-4">
          Sound familiar?
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {painPoints.map((point, i) => {
          const Icon = point.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card variant="light" className="h-full">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1 relative">
                    <Icon className="h-5 w-5 text-cyan-600" />
                    {/* Warning pulse dot */}
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <p className="text-olaris-text-dark/80 leading-relaxed">
                    {point.text}
                  </p>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
