'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { track } from '@/lib/analytics'

function fmt(n: number) {
  return n.toLocaleString('en-GB')
}

function fmtGBP(n: number) {
  return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function useAnimatedValue(target: number, duration = 800) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const fromRef = useRef<number>(0)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    fromRef.current = display
    startRef.current = 0

    function step(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(fromRef.current + (target - fromRef.current) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return display
}

const termOptions = [
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
  { value: 18, label: '18 months' },
  { value: 24, label: '24 months' },
  { value: 36, label: '36 months' },
]

export function FleetMileageCalculator() {
  const [vehicles, setVehicles] = useState(10)
  const [contractedMileage, setContractedMileage] = useState(10000)
  const [actualMileage, setActualMileage] = useState(12000)
  const [termRemaining, setTermRemaining] = useState(12)
  const [ppmRate, setPpmRate] = useState(12)
  const [whatIfReduction, setWhatIfReduction] = useState(0)

  const results = useMemo(() => {
    const v = Math.max(1, Math.min(1000, vehicles || 1))
    const excess = actualMileage - contractedMileage
    const excessPerVehicle = Math.max(0, excess)
    const totalFleetExcessPerYear = excessPerVehicle * v
    const projectedExcess = Math.round(totalFleetExcessPerYear * (termRemaining / 12))
    const estimatedCharge = Math.round(projectedExcess * (ppmRate / 100))
    const chargePerVehicle = Math.round(estimatedCharge / v)

    // "What if?" scenario
    const reducedActual = actualMileage - whatIfReduction
    const reducedExcess = Math.max(0, reducedActual - contractedMileage)
    const reducedFleetExcess = reducedExcess * v
    const reducedProjected = Math.round(reducedFleetExcess * (termRemaining / 12))
    const reducedCharge = Math.round(reducedProjected * (ppmRate / 100))
    const saving = estimatedCharge - reducedCharge

    return {
      excess,
      excessPerVehicle,
      totalFleetExcessPerYear,
      projectedExcess,
      estimatedCharge,
      chargePerVehicle,
      reducedCharge,
      saving,
      isOver: excess > 0,
    }
  }, [vehicles, contractedMileage, actualMileage, termRemaining, ppmRate, whatIfReduction])

  const animatedCharge = useAnimatedValue(results.estimatedCharge)
  const animatedReduced = useAnimatedValue(results.reducedCharge)

  // Fire tool_calculation_completed once the headline result has
  // settled (1s after last input change) and is non-trivial. useMemo
  // recomputes on every keystroke; debounce + dedupe keeps GA clean.
  useEffect(() => {
    if (results.estimatedCharge <= 0) return
    const t = window.setTimeout(() => {
      track(
        'tool_calculation_completed',
        { tool: 'excess-mileage', result_numeric: results.estimatedCharge },
        { dedupe: true },
      )
    }, 1000)
    return () => window.clearTimeout(t)
  }, [results.estimatedCharge])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-xl border border-olaris-border-dark bg-[#1C2128] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0D1117] border-b border-olaris-border-dark">
          <h2 className="text-lg font-bold text-white font-heading">Fleet Mileage Exposure</h2>
          <p className="text-sm text-olaris-text-secondary mt-1">
            Enter your fleet details below. Results update as you type.
          </p>
        </div>

        {/* Inputs */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InputField
              label="Number of vehicles"
              value={vehicles}
              onChange={setVehicles}
              min={1}
              max={1000}
            />
            <InputField
              label="Contracted annual mileage"
              value={contractedMileage}
              onChange={setContractedMileage}
              min={1000}
              max={100000}
              suffix="miles/yr"
            />
            <InputField
              label="Actual annual mileage"
              value={actualMileage}
              onChange={setActualMileage}
              min={1000}
              max={100000}
              suffix="miles/yr"
            />
            <div>
              <label className="block text-sm font-medium text-olaris-text-secondary mb-1.5">
                Contract term remaining
              </label>
              <select
                value={termRemaining}
                onChange={(e) => setTermRemaining(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {termOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <InputField
              label="Excess mileage charge"
              value={ppmRate}
              onChange={setPpmRate}
              min={1}
              max={50}
              suffix="p/mile"
            />
          </div>

          {/* Results */}
          <div className="border-t border-olaris-border-dark pt-5 space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox
                label="Excess per vehicle/yr"
                value={results.isOver ? `${fmt(results.excessPerVehicle)} miles` : 'On track'}
                variant={results.isOver ? 'danger' : 'success'}
              />
              <StatBox
                label="Total fleet excess/yr"
                value={results.isOver ? `${fmt(results.totalFleetExcessPerYear)} miles` : 'No excess'}
                variant={results.isOver ? 'danger' : 'success'}
              />
              <StatBox
                label="Projected at end of term"
                value={`${fmt(results.projectedExcess)} miles`}
                variant={results.projectedExcess > 0 ? 'danger' : 'success'}
              />
              <StatBox
                label="Charge per vehicle"
                value={fmtGBP(results.chargePerVehicle)}
                variant={results.chargePerVehicle > 0 ? 'danger' : 'success'}
              />
            </div>

            {/* Main result */}
            <div
              className={`rounded-xl p-6 text-center ${
                results.isOver
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'bg-emerald-500/10 border border-emerald-500/20'
              }`}
            >
              <p className="text-sm font-medium text-olaris-text-secondary mb-1">
                Estimated excess mileage charge
              </p>
              <p
                className={`text-4xl sm:text-5xl font-bold font-mono tracking-tight ${
                  results.isOver ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {fmtGBP(animatedCharge)}
              </p>
              <p className="text-xs text-olaris-text-secondary mt-2">
                Over remaining {termRemaining} months across {fmt(vehicles)} vehicle{vehicles !== 1 ? 's' : ''}
              </p>
            </div>

            {/* What if slider */}
            {results.isOver && (
              <div className="rounded-xl p-5 bg-[#0D1117] border border-olaris-border-dark">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">
                    What if your drivers did fewer miles?
                  </p>
                  <span className="text-sm font-mono text-cyan-400">
                    −{fmt(whatIfReduction)} miles/yr
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={100}
                  value={whatIfReduction}
                  onChange={(e) => setWhatIfReduction(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#1E293B] accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-olaris-text-secondary mt-1">
                  <span>No change</span>
                  <span>−2,000 miles/yr</span>
                </div>

                {whatIfReduction > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3 bg-[#1C2128] text-center">
                      <p className="text-xs text-olaris-text-secondary mb-1">Revised charge</p>
                      <p className="text-xl font-bold font-mono text-amber-400">
                        {fmtGBP(animatedReduced)}
                      </p>
                    </div>
                    <div className="rounded-lg p-3 bg-emerald-500/10 text-center">
                      <p className="text-xs text-olaris-text-secondary mb-1">You could save</p>
                      <p className="text-xl font-bold font-mono text-emerald-400">
                        {fmtGBP(results.saving)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-olaris-text-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-olaris-text-secondary">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant: 'success' | 'danger'
}) {
  return (
    <div className="rounded-lg bg-[#0D1117] p-3 text-center">
      <p className="text-[10px] text-olaris-text-secondary mb-1 leading-tight">{label}</p>
      <p
        className={`text-sm font-bold font-mono ${
          variant === 'danger' ? 'text-red-400' : 'text-emerald-400'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
