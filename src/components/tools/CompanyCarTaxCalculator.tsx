'use client'

import { useState, useMemo, useEffect, useRef } from 'react'

/* ── BIK / VED / eVED rate tables ────────────────────────────── */

type FuelType = 'bev' | 'phev' | 'hev' | 'ice'

const TAX_YEARS = ['2025', '2026', '2027', '2028', '2029'] as const
const TAX_YEAR_LABELS: Record<string, string> = {
  '2025': '2025/26',
  '2026': '2026/27',
  '2027': '2027/28',
  '2028': '2028/29',
  '2029': '2029/30',
}

const BIK_RATES: Record<FuelType, Record<string, number>> = {
  bev:  { '2025': 0.03, '2026': 0.04, '2027': 0.05, '2028': 0.07, '2029': 0.09 },
  phev: { '2025': 0.06, '2026': 0.07, '2027': 0.08, '2028': 0.18, '2029': 0.19 },
  hev:  { '2025': 0.29, '2026': 0.30, '2027': 0.31, '2028': 0.32, '2029': 0.33 },
  ice:  { '2025': 0.36, '2026': 0.37, '2027': 0.37, '2028': 0.38, '2029': 0.39 },
}

const EVED_PPM: Record<FuelType, number> = { bev: 0.03, phev: 0.015, hev: 0, ice: 0 }
const VED_ANNUAL: Record<FuelType, number> = { bev: 195, phev: 170, hev: 170, ice: 190 }

const FUEL_LABELS: Record<FuelType, string> = {
  bev: 'Electric (BEV)',
  phev: 'Plug-in Hybrid (PHEV)',
  hev: 'Hybrid (HEV)',
  ice: 'Petrol/Diesel (ICE)',
}

const FUEL_COLOURS: Record<FuelType, { bg: string; border: string; text: string; dot: string }> = {
  bev:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  phev: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  hev:  { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-400' },
  ice:  { bg: 'bg-slate-500/10', border: 'border-slate-500/40', text: 'text-slate-400', dot: 'bg-slate-400' },
}

const TAX_BRACKETS = [
  { label: 'Basic (20%)', value: 0.20 },
  { label: 'Higher (40%)', value: 0.40 },
  { label: 'Additional (45%)', value: 0.45 },
]

/* ── Helpers ─────────────────────────────────────────────────── */

function fmt(n: number) { return n.toLocaleString('en-GB') }
function fmtGBP(n: number) { return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const fromRef = useRef<number>(0)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    fromRef.current = display
    startRef.current = 0
    function step(ts: number) {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(fromRef.current + (target - fromRef.current) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])
  return display
}

/* ── Vehicle data types for Tier 2 ───────────────────────────── */

interface VehicleRecord {
  manufacturer: string
  model: string
  derivative: string
  p11d: number
  co2: number
  fuel_type: string
}

function fuelTypeFromString(s: string): FuelType {
  const l = s.toLowerCase()
  if (l === 'electric' || l === 'bev') return 'bev'
  if (l.includes('plug') || l === 'phev') return 'phev'
  if (l === 'hybrid' || l === 'hev') return 'hev'
  return 'ice'
}

/* ── Row calculation ─────────────────────────────────────────── */

interface YearRow {
  year: string
  label: string
  bikRate: number
  taxableBenefit: number
  annualTax: number
  monthlyTax: number
  cumulative: number
  evedCost: number
  vedCost: number
}

function calcRows(
  fuelType: FuelType,
  p11d: number,
  taxRate: number,
  startYear: string,
  periods: number,
  annualMiles: number,
): YearRow[] {
  const startIdx = TAX_YEARS.indexOf(startYear as typeof TAX_YEARS[number])
  if (startIdx === -1) return []

  const rows: YearRow[] = []
  let cumulative = 0

  for (let i = 0; i < periods; i++) {
    const yearIdx = startIdx + i
    if (yearIdx >= TAX_YEARS.length) break
    const year = TAX_YEARS[yearIdx]
    const bikRate = BIK_RATES[fuelType][year]
    const taxableBenefit = Math.round(p11d * bikRate)
    const annualTax = Math.round(taxableBenefit * taxRate)
    const monthlyTax = Math.round(annualTax / 12)

    // eVED from 2028 onwards
    const evedCost = Number(year) >= 2028 ? Math.round(EVED_PPM[fuelType] * annualMiles) : 0
    const vedCost = VED_ANNUAL[fuelType]

    cumulative += annualTax
    rows.push({ year, label: TAX_YEAR_LABELS[year], bikRate, taxableBenefit, annualTax, monthlyTax, cumulative, evedCost, vedCost })
  }
  return rows
}

/* ── Main Component ──────────────────────────────────────────── */

export function CompanyCarTaxCalculator() {
  // Tier 1 state
  const [fuelType, setFuelType] = useState<FuelType>('bev')
  const [p11d, setP11d] = useState(40000)
  const [taxRate, setTaxRate] = useState(0.40)
  const [startYear, setStartYear] = useState('2025')
  const [periods, setPeriods] = useState(4)
  const [annualMiles, setAnnualMiles] = useState(10000)

  // Tier 2 state
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [vehicles, setVehicles] = useState<VehicleRecord[] | null>(null)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [selectedManufacturer, setSelectedManufacturer] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedDerivative, setSelectedDerivative] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null)
  const [fuelFilter, setFuelFilter] = useState('')

  // Results
  const rows = useMemo(
    () => calcRows(fuelType, p11d, taxRate, startYear, periods, annualMiles),
    [fuelType, p11d, taxRate, startYear, periods, annualMiles],
  )

  const iceRows = useMemo(
    () => (fuelType !== 'ice' ? calcRows('ice', p11d, taxRate, startYear, periods, annualMiles) : []),
    [fuelType, p11d, taxRate, startYear, periods, annualMiles],
  )

  const firstMonthly = rows[0]?.monthlyTax ?? 0
  const animatedMonthly = useAnimatedValue(firstMonthly)

  const totalBik = rows.reduce((s, r) => s + r.annualTax, 0)
  const iceTotalBik = iceRows.reduce((s, r) => s + r.annualTax, 0)
  const saving = iceTotalBik - totalBik

  const colours = FUEL_COLOURS[fuelType]

  // Tier 2: load vehicles JSON
  const loadVehicleData = async () => {
    setLoadingVehicles(true)
    try {
      const res = await fetch('/data/vehicles.json')
      if (res.ok) {
        const data: VehicleRecord[] = await res.json()
        setVehicles(data)
      }
    } catch {
      // Vehicle data not available — Tier 2 will remain hidden
    } finally {
      setLoadingVehicles(false)
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')
    setEmailSubmitted(true)
    loadVehicleData()

    // Fire-and-forget email capture
    try {
      navigator.sendBeacon?.(
        '/api/capture-email',
        new Blob(
          [JSON.stringify({ email, source: 'bik-calculator', timestamp: new Date().toISOString() })],
          { type: 'application/json' },
        ),
      )
    } catch {
      // Non-critical — email still captured by sheet/webhook if configured
    }
  }

  // Cascade filters
  const manufacturers = useMemo(() => {
    if (!vehicles) return []
    let filtered = vehicles
    if (fuelFilter) filtered = filtered.filter((v) => fuelTypeFromString(v.fuel_type) === fuelFilter)
    return [...new Set(filtered.map((v) => v.manufacturer))].sort()
  }, [vehicles, fuelFilter])

  const models = useMemo(() => {
    if (!vehicles || !selectedManufacturer) return []
    let filtered = vehicles.filter((v) => v.manufacturer === selectedManufacturer)
    if (fuelFilter) filtered = filtered.filter((v) => fuelTypeFromString(v.fuel_type) === fuelFilter)
    return [...new Set(filtered.map((v) => v.model))].sort()
  }, [vehicles, selectedManufacturer, fuelFilter])

  const derivatives = useMemo(() => {
    if (!vehicles || !selectedManufacturer || !selectedModel) return []
    let filtered = vehicles.filter(
      (v) => v.manufacturer === selectedManufacturer && v.model === selectedModel,
    )
    if (fuelFilter) filtered = filtered.filter((v) => fuelTypeFromString(v.fuel_type) === fuelFilter)
    return filtered
  }, [vehicles, selectedManufacturer, selectedModel, fuelFilter])

  const handleSelectDerivative = (deriv: string) => {
    setSelectedDerivative(deriv)
    const v = derivatives.find((d) => d.derivative === deriv)
    if (v) {
      setSelectedVehicle(v)
      setP11d(v.p11d)
      setFuelType(fuelTypeFromString(v.fuel_type))
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* ── Tier 1: Open Calculator ──────────────────────────── */}
      <div className="rounded-xl border border-olaris-border-dark bg-[#1C2128] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0D1117] border-b border-olaris-border-dark">
          <h2 className="text-lg font-bold text-white font-heading">BIK Tax Calculator</h2>
          <p className="text-sm text-olaris-text-secondary mt-1">
            HMRC-confirmed escalating rates through 2029/30. Results update as you type.
          </p>
        </div>

        {/* Inputs */}
        <div className="p-6 space-y-5">
          {/* Vehicle type */}
          <div>
            <label className="block text-sm font-medium text-olaris-text-secondary mb-2">Vehicle type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(FUEL_LABELS) as FuelType[]).map((ft) => {
                const c = FUEL_COLOURS[ft]
                return (
                  <button
                    key={ft}
                    onClick={() => setFuelType(ft)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      fuelType === ft
                        ? `${c.bg} ${c.border} ${c.text}`
                        : 'border-olaris-border-dark text-olaris-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {FUEL_LABELS[ft]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* P11D */}
            <div>
              <label className="block text-sm font-medium text-olaris-text-secondary mb-1.5">
                P11D value
                <span className="ml-1 text-xs text-olaris-text-secondary/50" title="The list price including options and delivery, excluding first registration fee and VED">(?)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-olaris-text-secondary text-sm">£</span>
                <input
                  type="number"
                  value={p11d}
                  onChange={(e) => setP11d(Math.max(5000, Math.min(200000, Number(e.target.value))))}
                  min={5000}
                  max={200000}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Tax bracket */}
            <div>
              <label className="block text-sm font-medium text-olaris-text-secondary mb-1.5">Your tax bracket</label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {TAX_BRACKETS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* Start year */}
            <div>
              <label className="block text-sm font-medium text-olaris-text-secondary mb-1.5">Tax year start</label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {TAX_YEARS.map((y) => (
                  <option key={y} value={y}>{TAX_YEAR_LABELS[y]}</option>
                ))}
              </select>
            </div>

            {/* Analysis period */}
            <div>
              <label className="block text-sm font-medium text-olaris-text-secondary mb-1.5">Analysis period</label>
              <select
                value={periods}
                onChange={(e) => setPeriods(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} year{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="border-t border-olaris-border-dark pt-5 space-y-4">
            {/* Primary figure */}
            <div className={`rounded-xl p-6 text-center ${colours.bg} border ${colours.border}`}>
              <p className="text-sm font-medium text-olaris-text-secondary mb-1">Your monthly BIK tax</p>
              <p className={`text-4xl sm:text-5xl font-bold font-mono tracking-tight ${colours.text}`}>
                {fmtGBP(animatedMonthly)}
              </p>
              <p className="text-xs text-olaris-text-secondary mt-2">
                {TAX_YEAR_LABELS[startYear]} &middot; {FUEL_LABELS[fuelType]} &middot; {fmtGBP(p11d)} P11D
              </p>
            </div>

            {/* ICE comparison */}
            {fuelType !== 'ice' && iceRows.length > 0 && (
              <div className="rounded-lg p-4 bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-sm text-olaris-text-secondary">
                  If this were petrol/diesel, you&apos;d pay{' '}
                  <span className="font-bold font-mono text-red-400">{fmtGBP(iceRows[0].monthlyTax)}/month</span>{' '}
                  in BIK &mdash; you&apos;re saving{' '}
                  <span className="font-bold font-mono text-emerald-400">
                    {fmtGBP(iceRows[0].monthlyTax - rows[0].monthlyTax)}/month
                  </span>
                </p>
              </div>
            )}

            {/* Year-by-year table */}
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-olaris-text-secondary/60 uppercase tracking-wide">
                    <th className="text-left py-2 pr-3">Tax Year</th>
                    <th className="text-right py-2 px-3">BIK Rate</th>
                    <th className="text-right py-2 px-3">Taxable Benefit</th>
                    <th className="text-right py-2 px-3">Annual Tax</th>
                    <th className="text-right py-2 px-3">Monthly</th>
                    <th className="text-right py-2 pl-3">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.year}
                      className={`border-t border-olaris-border-dark ${i === 0 ? 'bg-white/[0.02]' : ''}`}
                    >
                      <td className="py-2.5 pr-3 font-medium text-white">{r.label}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-olaris-text-secondary">{(r.bikRate * 100).toFixed(0)}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-olaris-text-secondary">{fmtGBP(r.taxableBenefit)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">{fmtGBP(r.annualTax)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">{fmtGBP(r.monthlyTax)}</td>
                      <td className="py-2.5 pl-3 text-right font-mono text-olaris-text-secondary">{fmtGBP(r.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* eVED note */}
            {(fuelType === 'bev' || fuelType === 'phev') && rows.some((r) => r.evedCost > 0) && (
              <div className="rounded-lg p-4 bg-[#0D1117] border border-olaris-border-dark">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">eVED from April 2028</p>
                  <span className="text-xs text-olaris-text-secondary">
                    {fuelType === 'bev' ? '3p' : '1.5p'}/mile
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-olaris-text-secondary whitespace-nowrap">Annual miles</label>
                  <input
                    type="number"
                    value={annualMiles}
                    onChange={(e) => setAnnualMiles(Math.max(1000, Math.min(100000, Number(e.target.value))))}
                    className="w-24 px-2 py-1.5 rounded-lg bg-[#1C2128] border border-olaris-border-dark text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-mono text-amber-400">
                    {fmtGBP(Math.round(EVED_PPM[fuelType] * annualMiles))}/year eVED
                  </span>
                </div>
                <p className="text-[10px] text-olaris-text-secondary/50 mt-2">
                  Plus {fmtGBP(VED_ANNUAL[fuelType])}/year flat VED. eVED does not apply to HEV or ICE vehicles.
                </p>
              </div>
            )}

            {/* Total comparison summary */}
            {fuelType !== 'ice' && iceRows.length > 0 && rows.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#0D1117] p-3 text-center">
                  <p className="text-[10px] text-olaris-text-secondary mb-1">Your total BIK</p>
                  <p className={`text-lg font-bold font-mono ${colours.text}`}>{fmtGBP(totalBik)}</p>
                  <p className="text-[10px] text-olaris-text-secondary">{rows.length} year{rows.length > 1 ? 's' : ''}</p>
                </div>
                <div className="rounded-lg bg-[#0D1117] p-3 text-center">
                  <p className="text-[10px] text-olaris-text-secondary mb-1">ICE equivalent</p>
                  <p className="text-lg font-bold font-mono text-red-400">{fmtGBP(iceTotalBik)}</p>
                  <p className="text-[10px] text-olaris-text-secondary">{iceRows.length} year{iceRows.length > 1 ? 's' : ''}</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                  <p className="text-[10px] text-olaris-text-secondary mb-1">Your saving</p>
                  <p className="text-lg font-bold font-mono text-emerald-400">{fmtGBP(saving)}</p>
                  <p className="text-[10px] text-olaris-text-secondary">vs petrol/diesel</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-1 bg-cyan-500 rounded-b-xl" />
      </div>

      {/* ── Tier 2: Vehicle Lookup ───────────────────────────── */}
      <div className="rounded-xl border border-olaris-border-dark bg-[#1C2128] overflow-hidden">
        <div className="px-6 py-4 bg-[#0D1117] border-b border-olaris-border-dark">
          <h2 className="text-lg font-bold text-white font-heading">Get exact figures for your vehicle</h2>
          <p className="text-sm text-olaris-text-secondary mt-1">
            Our vehicle database has P11D values and CO2 emissions for thousands of UK vehicles. Enter your email to look up your exact car.
          </p>
        </div>

        <div className="p-6">
          {!emailSubmitted ? (
            <form onSubmit={handleEmailSubmit} className="max-w-md space-y-3">
              <div>
                <input
                  type="email"
                  placeholder="your@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white text-sm placeholder-olaris-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                {emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
              >
                Look Up My Vehicle
              </button>
              <p className="text-[10px] text-olaris-text-secondary/50">
                We&apos;ll send you a summary of your results. No spam. Unsubscribe anytime.
              </p>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                Vehicle lookup unlocked. Select your car below.
              </div>

              {loadingVehicles ? (
                <p className="text-sm text-olaris-text-secondary">Loading vehicle database...</p>
              ) : vehicles ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fuel filter */}
                  <div>
                    <label className="block text-xs font-medium text-olaris-text-secondary mb-1.5">Fuel type</label>
                    <select
                      value={fuelFilter}
                      onChange={(e) => { setFuelFilter(e.target.value); setSelectedManufacturer(''); setSelectedModel(''); setSelectedDerivative(''); setSelectedVehicle(null) }}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">All fuel types</option>
                      <option value="bev">Electric</option>
                      <option value="phev">Plug-in Hybrid</option>
                      <option value="hev">Hybrid</option>
                      <option value="ice">Petrol/Diesel</option>
                    </select>
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-xs font-medium text-olaris-text-secondary mb-1.5">Manufacturer</label>
                    <select
                      value={selectedManufacturer}
                      onChange={(e) => { setSelectedManufacturer(e.target.value); setSelectedModel(''); setSelectedDerivative(''); setSelectedVehicle(null) }}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select manufacturer</option>
                      {manufacturers.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-xs font-medium text-olaris-text-secondary mb-1.5">Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => { setSelectedModel(e.target.value); setSelectedDerivative(''); setSelectedVehicle(null) }}
                      disabled={!selectedManufacturer}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-40"
                    >
                      <option value="">Select model</option>
                      {models.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Derivative */}
                  <div>
                    <label className="block text-xs font-medium text-olaris-text-secondary mb-1.5">Variant</label>
                    <select
                      value={selectedDerivative}
                      onChange={(e) => handleSelectDerivative(e.target.value)}
                      disabled={!selectedModel}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0D1117] border border-olaris-border-dark text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-40"
                    >
                      <option value="">Select variant</option>
                      {derivatives.map((d) => <option key={d.derivative} value={d.derivative}>{d.derivative}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-olaris-text-secondary">
                  Vehicle database is not available yet. Use the manual calculator above with your vehicle&apos;s P11D value.
                </p>
              )}

              {/* Enhanced vehicle summary */}
              {selectedVehicle && rows.length > 0 && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-olaris-text-secondary/60 mb-1">Your vehicle</p>
                    <p className="text-lg font-bold text-white">
                      {selectedVehicle.manufacturer} {selectedVehicle.model} {selectedVehicle.derivative}
                    </p>
                    <p className="text-xs text-olaris-text-secondary mt-1">
                      P11D: {fmtGBP(selectedVehicle.p11d)} &middot; CO2: {selectedVehicle.co2}g/km &middot; {FUEL_LABELS[fuelType]}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-[#0D1117] p-3">
                      <p className="text-[10px] text-olaris-text-secondary mb-1">Year 1</p>
                      <p className={`text-xl font-bold font-mono ${colours.text}`}>
                        {fmtGBP(rows[0].monthlyTax)}/mo
                      </p>
                      <p className="text-[10px] text-olaris-text-secondary">({(rows[0].bikRate * 100).toFixed(0)}% BIK)</p>
                    </div>
                    {rows.length > 1 && (
                      <div className="rounded-lg bg-[#0D1117] p-3">
                        <p className="text-[10px] text-olaris-text-secondary mb-1">Year {rows.length}</p>
                        <p className={`text-xl font-bold font-mono ${colours.text}`}>
                          {fmtGBP(rows[rows.length - 1].monthlyTax)}/mo
                        </p>
                        <p className="text-[10px] text-olaris-text-secondary">({(rows[rows.length - 1].bikRate * 100).toFixed(0)}% BIK)</p>
                      </div>
                    )}
                  </div>

                  {fuelType !== 'ice' && iceRows.length > 0 && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                      <p className="text-sm text-olaris-text-secondary mb-1">Your BIK saving vs petrol/diesel</p>
                      <p className="text-3xl font-bold font-mono text-emerald-400">{fmtGBP(saving)}</p>
                      <p className="text-xs text-olaris-text-secondary mt-1">over {rows.length} year{rows.length > 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
