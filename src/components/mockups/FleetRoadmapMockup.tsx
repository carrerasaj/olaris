'use client'

import { motion } from 'framer-motion'

const phases = [
  {
    year: 'Year 1',
    label: 'Highest-mileage ICE → BEV',
    vehicles: 12,
    pct: 27,
    color: '#22d3ee', // cyan-400
  },
  {
    year: 'Year 2',
    label: 'Mid-contract renewals → PHEV/BEV',
    vehicles: 18,
    pct: 40,
    color: '#4ade80', // green-400
  },
  {
    year: 'Year 3',
    label: 'Remaining fleet → BEV',
    vehicles: 15,
    pct: 33,
    color: '#a78bfa', // purple-400
  },
]

const comparisons = [
  { current: 'Ford Focus 1.0T', replacement: 'Tesla Model 3 SR+', delta: '-£1,840/yr' },
  { current: 'BMW 320d', replacement: 'BMW i4 eDrive40', delta: '-£2,410/yr' },
  { current: 'Vauxhall Astra 1.2T', replacement: 'MG4 SE Long Range', delta: '-£1,560/yr' },
  { current: 'VW Passat 2.0 TDI', replacement: 'VW ID.7 Pro', delta: '-£2,180/yr' },
]

export function FleetRoadmapMockup() {
  return (
    <div className="p-4 space-y-4">
      {/* Timeline */}
      <div className="space-y-3">
        {phases.map((phase, i) => (
          <motion.div
            key={phase.year}
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center pt-1">
              <div
                className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-[#0F172A]"
                style={{ backgroundColor: phase.color, ['--tw-ring-color' as string]: phase.color }}
              />
              {i < phases.length - 1 && (
                <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 bg-[#1E293B] rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{phase.year}</span>
                <span
                  className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
                  style={{ color: phase.color, backgroundColor: `${phase.color}15` }}
                >
                  {phase.vehicles} vehicles ({phase.pct}%)
                </span>
              </div>
              <p className="text-[11px] text-olaris-text-secondary">{phase.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary stat */}
      <motion.div
        className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <span className="text-[10px] text-olaris-text-secondary">Projected annual saving by Year 3</span>
        <div className="text-lg font-bold font-mono text-emerald-400">£47,200</div>
      </motion.div>

      {/* Saved comparisons table */}
      <div>
        <div className="text-[10px] text-olaris-text-secondary mb-2">Saved comparisons</div>
        <div className="space-y-1">
          {comparisons.map((c) => (
            <div key={c.current} className="flex items-center gap-2 text-[10px] bg-[#1E293B] rounded px-2 py-1.5">
              <span className="text-olaris-text-secondary flex-1 truncate">{c.current}</span>
              <span className="text-white/30">→</span>
              <span className="text-white flex-1 truncate">{c.replacement}</span>
              <span className="font-mono text-emerald-400 font-medium whitespace-nowrap">{c.delta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
