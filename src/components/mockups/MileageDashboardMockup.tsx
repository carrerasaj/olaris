'use client'

import { useState, useEffect } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function MileageDashboardMockup() {
  const reduceMotion = useReducedMotion()
  const [animatedPct, setAnimatedPct] = useState(60)

  useEffect(() => {
    if (reduceMotion) return
    const interval = setInterval(() => {
      setAnimatedPct((prev) => {
        if (prev >= 85) return 60
        return prev + 1
      })
    }, 120)
    return () => clearInterval(interval)
  }, [reduceMotion])

  const vehicles = [
    { plate: 'AB21 XYZ', driver: 'J. Williams', contract: 15000, current: 11200, projected: 14800 },
    { plate: 'CD22 ABC', driver: 'S. Patel', contract: 20000, current: 18400, projected: 22100 },
    { plate: 'EF23 DEF', driver: 'M. Thompson', contract: 10000, current: 6800, projected: 9200 },
    { plate: 'GH24 GHI', driver: 'R. Davies', contract: 15000, current: 14200, projected: 17600 },
    { plate: 'JK25 JKL', driver: 'A. Khan', contract: 12000, current: 8100, projected: 11500 },
  ]

  const getStatus = (projected: number, contract: number) => {
    const ratio = projected / contract
    if (ratio > 1.05) return { colour: 'bg-red-500', label: 'Over', text: 'text-red-400' }
    if (ratio > 0.95) return { colour: 'bg-yellow-500', label: 'At risk', text: 'text-yellow-400' }
    return { colour: 'bg-emerald-500', label: 'On track', text: 'text-emerald-400' }
  }

  const onTrack = vehicles.filter((v) => v.projected / v.contract <= 0.95).length
  const atRisk = vehicles.filter((v) => v.projected / v.contract > 0.95 && v.projected / v.contract <= 1.05).length
  const over = vehicles.filter((v) => v.projected / v.contract > 1.05).length

  return (
    <div className="p-4 space-y-4">
      {/* Summary */}
      <div className="flex gap-4 text-xs">
        <div className="px-3 py-2 rounded bg-[#1E293B] flex-1 text-center">
          <div className="text-emerald-400 font-mono text-lg font-bold">{onTrack}</div>
          <div className="text-olaris-text-secondary">On track</div>
        </div>
        <div className="px-3 py-2 rounded bg-[#1E293B] flex-1 text-center">
          <div className="text-yellow-400 font-mono text-lg font-bold">{atRisk}</div>
          <div className="text-olaris-text-secondary">At risk</div>
        </div>
        <div className="px-3 py-2 rounded bg-[#1E293B] flex-1 text-center">
          <div className="text-red-400 font-mono text-lg font-bold">{over}</div>
          <div className="text-olaris-text-secondary">Over</div>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-[100px_1fr_80px_80px_1fr_70px] gap-2 text-xs text-olaris-text-secondary px-2 pb-1 border-b border-olaris-border-dark">
          <span>Reg</span>
          <span>Driver</span>
          <span className="text-right">Contract</span>
          <span className="text-right">Current</span>
          <span>Progress</span>
          <span className="text-right">Status</span>
        </div>

        {vehicles.map((v, idx) => {
          const status = getStatus(v.projected, v.contract)
          const basePct = Math.min((v.current / v.contract) * 100, 100)
          // Animate the first row's progress bar
          const pct = idx === 0 ? animatedPct : basePct
          return (
            <div
              key={v.plate}
              className="grid grid-cols-[100px_1fr_80px_80px_1fr_70px] gap-2 text-xs items-center px-2 py-1.5 rounded hover:bg-[#1E293B] transition-colors"
            >
              <span className="font-mono text-white">{v.plate}</span>
              <span className="text-olaris-text-secondary truncate">{v.driver}</span>
              <span className="text-right font-mono text-olaris-text-secondary">
                {(v.contract / 1000).toFixed(0)}k
              </span>
              <span className="text-right font-mono text-white">
                {(v.current / 1000).toFixed(1)}k
              </span>
              <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${status.colour}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-right text-xs font-medium ${status.text}`}>
                {status.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
