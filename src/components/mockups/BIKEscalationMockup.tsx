'use client'

import { motion } from 'framer-motion'

const years = ['2025/26', '2026/27', '2027/28', '2028/29', '2029/30']

const lines = [
  { label: 'BEV', rates: [3, 4, 5, 7, 9], color: '#22d3ee' },     // cyan-400
  { label: 'PHEV', rates: [6, 8, 11, 15, 19], color: '#4ade80' },  // green-400
  { label: 'HEV', rates: [29, 30, 31, 32, 33], color: '#f59e0b' }, // amber-500
  { label: 'ICE', rates: [36, 37, 37, 38, 39], color: '#f87171' }, // red-400
]

const maxRate = 42
const chartWidth = 280
const chartHeight = 140
const padLeft = 28
const padRight = 10
const padTop = 10
const padBottom = 24
const plotW = chartWidth - padLeft - padRight
const plotH = chartHeight - padTop - padBottom

function toX(i: number) {
  return padLeft + (i / (years.length - 1)) * plotW
}

function toY(rate: number) {
  return padTop + (1 - rate / maxRate) * plotH
}

export function BIKEscalationMockup() {
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-bold text-white">Benefit in Kind Rate Escalation — HMRC Confirmed</div>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" aria-hidden="true">
        {/* Y-axis grid lines */}
        {[0, 10, 20, 30, 40].map((rate) => (
          <g key={rate}>
            <line
              x1={padLeft}
              y1={toY(rate)}
              x2={chartWidth - padRight}
              y2={toY(rate)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />
            <text
              x={padLeft - 4}
              y={toY(rate) + 3}
              textAnchor="end"
              fill="#64748b"
              fontSize={7}
              fontFamily="JetBrains Mono, monospace"
            >
              {rate}%
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {years.map((year, i) => (
          <text
            key={year}
            x={toX(i)}
            y={chartHeight - 4}
            textAnchor="middle"
            fill="#64748b"
            fontSize={6.5}
            fontFamily="JetBrains Mono, monospace"
          >
            {year}
          </text>
        ))}

        {/* Lines */}
        {lines.map((line) => {
          const points = line.rates.map((r, i) => `${toX(i)},${toY(r)}`).join(' ')
          return (
            <motion.polyline
              key={line.label}
              points={points}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          )
        })}

        {/* Data point dots */}
        {lines.map((line) =>
          line.rates.map((r, i) => (
            <motion.circle
              key={`${line.label}-${i}`}
              cx={toX(i)}
              cy={toY(r)}
              r={2.5}
              fill={line.color}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
            />
          ))
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {lines.map((line) => (
          <div key={line.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
            <span className="text-[10px] text-olaris-text-secondary font-medium">{line.label}</span>
          </div>
        ))}
      </div>

      {/* Caption */}
      <p className="text-[10px] text-center text-olaris-text-secondary italic">
        The EV advantage is narrowing. Plan your transition now while the gap is widest.
      </p>
    </div>
  )
}
