'use client'

import { useState, useEffect } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function DriverScoreboardMockup() {
  const reduceMotion = useReducedMotion()
  const scoreSequence = [87, 88, 89, 87]
  const [scoreIdx, setScoreIdx] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const interval = setInterval(() => {
      setScoreIdx((prev) => (prev + 1) % scoreSequence.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [reduceMotion, scoreSequence.length])

  const drivers = [
    { rank: 1, name: 'S. Patel', score: 94, trend: 'up', badge: 'gold' },
    { rank: 2, name: 'M. Thompson', score: 91, trend: 'up', badge: 'silver' },
    { rank: 3, name: 'A. Khan', score: scoreSequence[scoreIdx], trend: 'same', badge: 'bronze' },
    { rank: 4, name: 'J. Williams', score: 72, trend: 'down', badge: null },
    { rank: 5, name: 'R. Davies', score: 64, trend: 'up', badge: null },
    { rank: 6, name: 'L. Brown', score: 51, trend: 'down', badge: null },
  ]

  const getScoreColour = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBadge = (badge: string | null) => {
    if (badge === 'gold') return '\u{1F947}'
    if (badge === 'silver') return '\u{1F948}'
    if (badge === 'bronze') return '\u{1F949}'
    return ''
  }

  const getTrend = (trend: string) => {
    if (trend === 'up') return <span className="text-emerald-400">&uarr;</span>
    if (trend === 'down') return <span className="text-red-400">&darr;</span>
    return <span className="text-olaris-text-secondary">&rarr;</span>
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-olaris-text-secondary uppercase tracking-wider">
          Driver Scoreboard — This Month
        </div>
        <div className="text-xs text-olaris-text-secondary">
          Fleet avg: <span className="text-cyan-400 font-mono">76</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-[40px_1fr_60px_40px_30px] gap-2 text-xs text-olaris-text-secondary px-2 pb-1 border-b border-olaris-border-dark">
          <span>#</span>
          <span>Driver</span>
          <span className="text-right">Score</span>
          <span className="text-center">Trend</span>
          <span></span>
        </div>

        {drivers.map((d) => (
          <div
            key={d.rank}
            className="grid grid-cols-[40px_1fr_60px_40px_30px] gap-2 text-xs items-center px-2 py-2 rounded hover:bg-[#1E293B] transition-colors"
          >
            <span className="font-mono text-olaris-text-secondary">{d.rank}</span>
            <span className="text-white">{d.name}</span>
            <div className="text-right">
              <span className={`font-mono font-bold text-sm transition-all duration-300 ${getScoreColour(d.score)}`}>
                {d.score}
              </span>
            </div>
            <span className="text-center">{getTrend(d.trend)}</span>
            <span className="text-center">{getBadge(d.badge)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-0.5 h-1 rounded-full overflow-hidden mt-2">
        <div className="bg-emerald-500 flex-[3]" />
        <div className="bg-yellow-500 flex-[2]" />
        <div className="bg-red-500 flex-[1]" />
      </div>
      <div className="flex justify-between text-[10px] text-olaris-text-secondary">
        <span>3 excellent</span>
        <span>2 good</span>
        <span>1 needs coaching</span>
      </div>
    </div>
  )
}
