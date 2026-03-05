'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useInView } from 'react-intersection-observer'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface StatCardProps {
  value: string
  label: string
  variant?: 'dark' | 'light'
  accent?: 'cyan' | 'emerald'
}

function parseNumericValue(value: string): { num: number; prefix: string; suffix: string } | null {
  const match = value.match(/^([^0-9]*)(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return null
  return { prefix: match[1], num: parseFloat(match[2]), suffix: match[3] }
}

function useCountUp(target: number, inView: boolean, reduceMotion: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setCount(target)
      return
    }

    let startTime: number | null = null
    const duration = 1500

    function tick(timestamp: number) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [target, inView, reduceMotion])

  return count
}

export function StatCard({
  value,
  label,
  variant = 'dark',
  accent = 'cyan',
}: StatCardProps) {
  const reduceMotion = useReducedMotion()
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 })
  const parsed = parseNumericValue(value)
  const count = useCountUp(parsed?.num ?? 0, inView, reduceMotion)

  const displayValue = parsed
    ? `${parsed.prefix}${count}${parsed.suffix}`
    : value

  return (
    <div ref={ref} className="text-center">
      <div
        className={cn(
          'text-4xl md:text-5xl font-bold font-mono tracking-tight transition-opacity duration-500',
          accent === 'cyan' ? 'text-cyan-400' : 'text-emerald-400',
          inView ? 'opacity-100' : 'opacity-0'
        )}
      >
        {displayValue}
      </div>
      <div
        className={cn(
          'mt-2 text-sm font-medium transition-opacity duration-500 delay-300',
          variant === 'dark'
            ? 'text-olaris-text-secondary'
            : 'text-olaris-text-dark/60',
          inView ? 'opacity-100' : 'opacity-0'
        )}
      >
        {label}
      </div>
    </div>
  )
}
