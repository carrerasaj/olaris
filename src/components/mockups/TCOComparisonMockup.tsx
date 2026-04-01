'use client'

import { motion } from 'framer-motion'

const costs = [
  { category: 'Lease', ev: 380, ice: 360 },
  { category: 'Fuel/Elec', ev: 85, ice: 220 },
  { category: 'Maintenance', ev: 45, ice: 95 },
  { category: 'Insurance', ev: 110, ice: 105 },
  { category: 'VED', ev: 0, ice: 35 },
  { category: 'BIK (net)', ev: 52, ice: 230 },
]

const evTotal = 18420
const iceTotal = 24680
const saving = iceTotal - evTotal
const bikSaving = 4890

export function TCOComparisonMockup() {
  const maxMonthly = Math.max(...costs.flatMap((c) => [c.ev, c.ice]))

  return (
    <div className="p-4 space-y-4">
      {/* Vehicle headers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1E293B] rounded-lg p-3">
          <div className="text-[10px] text-cyan-400 font-medium mb-1">EV Vehicle</div>
          <div className="text-xs font-bold text-white">Tesla Model 3 Long Range</div>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-3">
          <div className="text-[10px] text-olaris-text-secondary font-medium mb-1">Comparison</div>
          <div className="text-xs font-bold text-white">BMW 3 Series 320d M Sport</div>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#1E293B] rounded-lg p-2 text-center">
          <div className="text-cyan-400 font-mono text-sm font-bold">£{evTotal.toLocaleString('en-GB')}</div>
          <div className="text-[9px] text-olaris-text-secondary">EV 3yr Total</div>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-2 text-center">
          <div className="text-white font-mono text-sm font-bold">£{iceTotal.toLocaleString('en-GB')}</div>
          <div className="text-[9px] text-olaris-text-secondary">ICE 3yr Total</div>
        </div>
        <div className="bg-emerald-500/15 rounded-lg p-2 text-center">
          <div className="text-emerald-400 font-mono text-sm font-bold">£{saving.toLocaleString('en-GB')}</div>
          <div className="text-[9px] text-emerald-400/70">EV Saving</div>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-2 text-center">
          <div className="text-emerald-400 font-mono text-sm font-bold">£{bikSaving.toLocaleString('en-GB')}</div>
          <div className="text-[9px] text-olaris-text-secondary">BIK Saving</div>
        </div>
      </div>

      {/* Bar chart — paired bars */}
      <div>
        <div className="text-xs text-olaris-text-secondary mb-2">Monthly cost breakdown (£/mo)</div>
        <div className="space-y-2">
          {costs.map((c, i) => (
            <div key={c.category} className="flex items-center gap-2 text-xs">
              <span className="text-olaris-text-secondary w-16 truncate text-[10px]">{c.category}</span>
              <div className="flex-1 flex flex-col gap-0.5">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(c.ev / maxMonthly) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                />
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-slate-500 to-slate-400"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(c.ice / maxMonthly) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 + 0.04 }}
                />
              </div>
              <div className="w-14 text-right">
                <div className="font-mono text-cyan-400 text-[10px]">£{c.ev}</div>
                <div className="font-mono text-slate-400 text-[10px]">£{c.ice}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Autumn Budget badge */}
      <div className="flex justify-center">
        <span className="inline-block px-3 py-1 text-[10px] font-medium text-amber-400 border border-amber-500/30 rounded-full bg-amber-500/10">
          Updated for eVED, escalating BIK rates &amp; revised VED — Autumn Budget 2025
        </span>
      </div>
    </div>
  )
}
