'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface GradientHeroProps {
  title: string | React.ReactNode
  subtitle?: string
  badge?: string
  showPattern?: boolean
  size?: 'full' | 'compact'
  children?: React.ReactNode
}

export function GradientHero({
  title,
  subtitle,
  badge,
  showPattern = true,
  size = 'full',
  children,
}: GradientHeroProps) {
  return (
    <section
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1a2744]',
        size === 'full' ? 'min-h-screen' : 'py-24 md:py-32'
      )}
    >
      {/* Subtle dot grid overlay */}
      {showPattern && (
        <div
          className="absolute inset-0 dot-pattern animate-grid-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-cyan-400 border border-cyan-500/30 rounded-full bg-cyan-500/10">
              {badge}
            </span>
          </motion.div>
        )}

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-heading tracking-tight text-white mb-6 text-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            className="text-lg md:text-xl text-olaris-text-secondary max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Bottom gradient fade */}
      {size === 'full' && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-olaris-dark to-transparent" />
      )}
    </section>
  )
}
