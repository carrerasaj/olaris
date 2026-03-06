'use client'

import { useMemo } from 'react'
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

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

function ConstellationDots() {
  const dots = useMemo(() => {
    const seed = [
      { top: 8, left: 12 }, { top: 15, left: 45 }, { top: 22, left: 78 },
      { top: 30, left: 25 }, { top: 35, left: 62 }, { top: 42, left: 88 },
      { top: 48, left: 8 }, { top: 52, left: 35 }, { top: 58, left: 72 },
      { top: 65, left: 18 }, { top: 70, left: 52 }, { top: 75, left: 85 },
      { top: 80, left: 30 }, { top: 85, left: 65 }, { top: 90, left: 10 },
      { top: 12, left: 92 }, { top: 28, left: 5 }, { top: 38, left: 48 },
      { top: 55, left: 55 }, { top: 68, left: 38 }, { top: 78, left: 70 },
      { top: 18, left: 30 }, { top: 45, left: 15 }, { top: 62, left: 82 },
      { top: 88, left: 42 }, { top: 25, left: 58 }, { top: 72, left: 22 },
      { top: 33, left: 75 }, { top: 50, left: 90 }, { top: 82, left: 55 },
    ]
    return seed.map((d, i) => ({
      ...d,
      opacity: 0.04 + (i % 4) * 0.01,
      delay: i * 0.7,
    }))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {dots.map((dot, i) => (
        <div
          key={i}
          className="constellation-dot"
          style={{
            top: `${dot.top}%`,
            left: `${dot.left}%`,
            opacity: dot.opacity,
            animationDelay: `${dot.delay}s`,
          }}
        />
      ))}
    </div>
  )
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
        'relative flex items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1a2744] gradient-shift',
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

      {/* Floating constellation — CSS handles reduced-motion */}
      <ConstellationDots />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {badge && (
          <motion.div variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-cyan-400 border border-cyan-500/30 rounded-full bg-cyan-500/10">
              {badge}
            </span>
          </motion.div>
        )}

        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-heading tracking-tight text-white mb-6 text-balance"
        >
          {title}
        </h1>

        {subtitle && (
          <motion.p
            className="text-lg md:text-xl text-olaris-text-secondary max-w-3xl mx-auto mb-10"
            variants={fadeUp}
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeUp}
          >
            {children}
          </motion.div>
        )}
      </motion.div>

      {/* Bottom gradient fade */}
      {size === 'full' && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-olaris-dark to-transparent" />
      )}
    </section>
  )
}
