'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface CardProps {
  variant?: 'dark' | 'light'
  hover?: boolean
  children: React.ReactNode
  className?: string
}

export function Card({
  variant = 'light',
  hover = true,
  children,
  className,
}: CardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-xl border p-6',
        variant === 'dark'
          ? 'bg-[#1E293B] border-olaris-border-dark text-olaris-text-primary'
          : 'bg-white border-olaris-border-light text-olaris-text-dark',
        className
      )}
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow:
                variant === 'dark'
                  ? '0 8px 30px rgba(6, 182, 212, 0.15)'
                  : '0 8px 30px rgba(0, 0, 0, 0.1)',
            }
          : undefined
      }
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
