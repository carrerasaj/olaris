'use client'

import { useState, useCallback } from 'react'

const EMPTY_VEHICLE = { reg: '', startDate: '', annualMileage: '', currentOdo: '', ppm: '' }

interface VehicleInput {
  reg: string
  startDate: string
  annualMileage: string
  currentOdo: string
  ppm: string
}

interface VehicleResult {
  reg: string
  projectedAnnual: number
  variance: number
  excessCharge: number
  potentialSaving: number
  utilisation: number
  status: 'high-risk' | 'moderate' | 'on-track' | 'under'
}

interface Results {
  vehicles: VehicleResult[]
  totalExcess: number
  totalSavings: number
  overCount: number
  underCount: number
  avgUtil: number
  total: number
}

function calcVehicle(v: VehicleInput): Omit<VehicleResult, 'reg'> {
  const start = new Date(v.startDate)
  const now = new Date()
  const monthsElapsed = Math.max((now.getTime() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000), 0.1)
  const projectedAnnual = Math.round((parseFloat(v.currentOdo) / monthsElapsed) * 12)
  const annualContract = parseFloat(v.annualMileage)
  const variance = projectedAnnual - annualContract
  const ppm = parseFloat(v.ppm)
  const excessCharge = variance > 0 ? Math.round(variance * ppm) / 100 : 0
  const potentialSaving = variance < 0 ? Math.round(Math.abs(variance) * ppm) / 100 : 0
  const utilisation = Math.round((projectedAnnual / annualContract) * 1000) / 10

  let status: VehicleResult['status'] = 'on-track'
  if (utilisation > 120) status = 'high-risk'
  else if (utilisation > 105) status = 'moderate'
  else if (utilisation < 95) status = 'under'

  return { projectedAnnual, variance, excessCharge, potentialSaving, utilisation, status }
}

function isValid(v: VehicleInput): boolean {
  return !!(v.startDate && parseFloat(v.annualMileage) > 0 && parseFloat(v.currentOdo) > 0 && parseFloat(v.ppm) > 0)
}

const statusConfig = {
  'high-risk': { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-100 text-red-800', label: 'High Risk' },
  moderate: { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-800', label: 'Moderate' },
  'on-track': { bg: 'bg-green-50', border: 'border-green-300', badge: 'bg-green-100 text-green-800', label: 'On Track' },
  under: { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-100 text-slate-700', label: 'Underutilised' },
}

function fmt(n: number) { return n.toLocaleString('en-GB') }
function fmtGBP(n: number) { return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function ExcessMileageCalculator() {
  const [vehicles, setVehicles] = useState<VehicleInput[]>([
    { ...EMPTY_VEHICLE },
    { ...EMPTY_VEHICLE },
    { ...EMPTY_VEHICLE },
  ])
  const [results, setResults] = useState<Results | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailError, setEmailError] = useState('')

  const updateVehicle = useCallback((idx: number, field: keyof VehicleInput, value: string) => {
    setVehicles(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v))
    setResults(null)
  }, [])

  const addVehicle = () => {
    if (vehicles.length < 10) setVehicles(prev => [...prev, { ...EMPTY_VEHICLE }])
  }

  const removeVehicle = (idx: number) => {
    if (vehicles.length > 1) {
      setVehicles(prev => prev.filter((_, i) => i !== idx))
      setResults(null)
    }
  }

  const calculate = () => {
    const validVehicles = vehicles.filter(isValid)
    if (validVehicles.length === 0) return

    const calculated: VehicleResult[] = validVehicles.map((v, i) => ({
      reg: v.reg || `Vehicle ${i + 1}`,
      ...calcVehicle(v),
    }))

    const totalExcess = calculated.reduce((s, r) => s + r.excessCharge, 0)
    const totalSavings = calculated.reduce((s, r) => s + r.potentialSaving, 0)
    const overCount = calculated.filter(r => r.variance > 0).length
    const underCount = calculated.filter(r => r.variance < 0).length
    const avgUtil = Math.round(calculated.reduce((s, r) => s + r.utilisation, 0) / calculated.length * 10) / 10

    setResults({ vehicles: calculated, totalExcess, totalSavings, overCount, underCount, avgUtil, total: calculated.length })
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')
    setEmailSubmitted(true)
    window.open(`https://olaris-fleet.beehiiv.com/subscribe?email=${encodeURIComponent(email)}`, '_blank')
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 rounded-t-2xl px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Excess Mileage Calculator</h2>
        <p className="text-slate-400 mt-1">Enter your vehicle data below. We&apos;ll project annual mileage and estimate excess charges based on current trajectory.</p>
      </div>

      {/* Vehicle Entry Form */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        {/* Column headers */}
        <div className="hidden md:grid md:grid-cols-12 gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
          <div className="col-span-2">Vehicle</div>
          <div className="col-span-2">Contract Start</div>
          <div className="col-span-2">Annual Allowance</div>
          <div className="col-span-2">Current Odometer</div>
          <div className="col-span-2">Excess Rate (p/mi)</div>
          <div className="col-span-2"></div>
        </div>

        {vehicles.map((v, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 rounded-lg p-3 md:p-2">
            <div className="md:col-span-2">
              <label className="md:hidden text-xs text-slate-500 font-medium">Vehicle Reg / Name</label>
              <input
                type="text"
                placeholder="e.g. AB12 CDE"
                value={v.reg}
                onChange={e => updateVehicle(idx, 'reg', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="md:hidden text-xs text-slate-500 font-medium">Contract Start Date</label>
              <input
                type="date"
                value={v.startDate}
                onChange={e => updateVehicle(idx, 'startDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="md:hidden text-xs text-slate-500 font-medium">Annual Mileage Allowance</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={v.annualMileage}
                onChange={e => updateVehicle(idx, 'annualMileage', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="md:hidden text-xs text-slate-500 font-medium">Current Odometer (miles)</label>
              <input
                type="number"
                placeholder="e.g. 28500"
                value={v.currentOdo}
                onChange={e => updateVehicle(idx, 'currentOdo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="md:hidden text-xs text-slate-500 font-medium">Excess Charge (pence/mile)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 8.50"
                value={v.ppm}
                onChange={e => updateVehicle(idx, 'ppm', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              {vehicles.length > 1 && (
                <button
                  onClick={() => removeVehicle(idx)}
                  className="px-3 py-2 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove vehicle"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          {vehicles.length < 10 && (
            <button onClick={addVehicle} className="px-4 py-2 text-sm text-cyan-600 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors">
              + Add Vehicle
            </button>
          )}
          <button
            onClick={calculate}
            disabled={!vehicles.some(isValid)}
            className="px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Calculate Projections
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="border border-slate-200 border-t-0 bg-white">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50">
            <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
              <div className="text-2xl font-bold text-slate-900">{results.total}</div>
              <div className="text-xs text-slate-500 mt-1">Vehicles Analysed</div>
            </div>
            <div className={`rounded-xl p-4 border text-center ${results.overCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <div className={`text-2xl font-bold ${results.overCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>{results.overCount}</div>
              <div className="text-xs text-slate-500 mt-1">Over Contract</div>
            </div>
            <div className={`rounded-xl p-4 border text-center ${results.totalExcess > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <div className={`text-2xl font-bold ${results.totalExcess > 0 ? 'text-red-700' : 'text-slate-900'}`}>{fmtGBP(results.totalExcess)}</div>
              <div className="text-xs text-slate-500 mt-1">Projected Excess Charges</div>
            </div>
            <div className={`rounded-xl p-4 border text-center ${results.totalSavings > 0 ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
              <div className={`text-2xl font-bold ${results.totalSavings > 0 ? 'text-green-700' : 'text-slate-900'}`}>{fmtGBP(results.totalSavings)}</div>
              <div className="text-xs text-slate-500 mt-1">Unused Allowance Value</div>
            </div>
          </div>

          {/* Vehicle Results */}
          <div className="p-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Vehicle Breakdown</h3>
            {results.vehicles.map((r, i) => {
              const cfg = statusConfig[r.status]
              return (
                <div key={i} className={`rounded-lg border p-4 ${cfg.bg} ${cfg.border}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{r.reg}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <div className="text-sm text-slate-600">{r.utilisation}% utilisation</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-slate-500">Projected Annual</div>
                      <div className="font-semibold text-slate-900">{fmt(r.projectedAnnual)} miles</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Variance</div>
                      <div className={`font-semibold ${r.variance > 0 ? 'text-red-700' : r.variance < 0 ? 'text-green-700' : 'text-slate-900'}`}>
                        {r.variance > 0 ? '+' : ''}{fmt(r.variance)} miles
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Projected Excess</div>
                      <div className={`font-semibold ${r.excessCharge > 0 ? 'text-red-700' : 'text-slate-600'}`}>
                        {r.excessCharge > 0 ? fmtGBP(r.excessCharge) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Unused Allowance</div>
                      <div className={`font-semibold ${r.potentialSaving > 0 ? 'text-green-700' : 'text-slate-600'}`}>
                        {r.potentialSaving > 0 ? fmtGBP(r.potentialSaving) : '—'}
                      </div>
                    </div>
                  </div>
                  {r.status === 'high-risk' && (
                    <div className="mt-3 text-sm text-red-700 bg-red-100 rounded-md px-3 py-2">
                      Action needed: This vehicle is significantly over contract. Consider redistributing mileage, extending the contract, or swapping the vehicle early.
                    </div>
                  )}
                  {r.status === 'under' && r.utilisation < 70 && (
                    <div className="mt-3 text-sm text-slate-600 bg-slate-100 rounded-md px-3 py-2">
                      This vehicle is well under its mileage allowance. Review whether the contract terms match actual usage — you may be paying for mileage you do not need.
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA Section */}
          <div className="p-6 border-t border-slate-200">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Email Capture */}
              <div className="bg-slate-900 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold">Need to analyse your full fleet?</h3>
                <p className="text-slate-300 text-sm mt-2">
                  Download our Excel calculator for up to 100 vehicles — same methodology, with fleet summary dashboard and risk breakdown.
                </p>
                {!emailSubmitted ? (
                  <>
                    {!showEmail ? (
                      <button
                        onClick={() => setShowEmail(true)}
                        className="mt-4 w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        Download Excel Calculator (.xlsx)
                      </button>
                    ) : (
                      <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
                        <p className="text-xs text-slate-400">Enter your email to download — we will also subscribe you to our fleet intelligence newsletter (you can unsubscribe anytime).</p>
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setEmailError('') }}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        {emailError && <p className="text-xs text-red-400">{emailError}</p>}
                        <button
                          type="submit"
                          className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg transition-colors text-sm"
                        >
                          Subscribe &amp; Download
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open('/assets/olaris-excess-mileage-calculator.xlsx', '_blank')}
                          className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          No thanks, just download
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-sm text-green-300">
                      Check your inbox to confirm your subscription.
                    </div>
                    <a
                      href="/assets/olaris-excess-mileage-calculator.xlsx"
                      download
                      className="block w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg transition-colors text-sm text-center"
                    >
                      Download Calculator (.xlsx)
                    </a>
                  </div>
                )}
              </div>

              {/* Platform CTA */}
              <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl p-6 text-white flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold">This calculator is a snapshot.</h3>
                  <p className="text-cyan-100 text-sm mt-2">
                    The Olaris platform does this continuously — with live telematics from 15+ vehicle manufacturers, automated alerts when vehicles trend over contract, and mileage pooling analysis across your entire fleet.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-cyan-100">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-300 mt-0.5">✓</span>
                      Real-time mileage tracking against contract allowance
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-300 mt-0.5">✓</span>
                      Automated excess mileage alerts 6+ months before lease end
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-300 mt-0.5">✓</span>
                      Fleet-wide mileage pooling and redistribution analysis
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-300 mt-0.5">✓</span>
                      Cost-per-mile tracking with full cost visibility
                    </li>
                  </ul>
                </div>
                <a
                  href="/contact"
                  className="mt-6 block w-full px-4 py-3 bg-white text-cyan-800 font-semibold rounded-lg hover:bg-cyan-50 transition-colors text-sm text-center"
                >
                  Talk to Us About Mileage Intelligence
                </a>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">How the Calculator Works</h3>
            <div className="mt-3 text-sm text-slate-600 space-y-3 max-w-3xl">
              <p>
                The calculator uses the same annualisation methodology as the Olaris fleet intelligence platform.
                For each vehicle, it takes the current odometer reading, divides by the number of months elapsed
                since contract start (using 30.44 days per month), and multiplies by 12 to project annual mileage.
              </p>
              <p>
                The mileage variance is the difference between projected annual mileage and your contract allowance.
                Positive variance means the vehicle is trending over contract and will likely incur excess charges.
                Negative variance means mileage allowance is being underutilised — you are paying for miles you are not using.
              </p>
              <p>
                Excess charges are calculated as: <strong>(Mileage Variance × Excess Charge Rate in pence) ÷ 100</strong>.
                This gives the projected annual excess charge in pounds at the current run rate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom border */}
      <div className="h-1 bg-cyan-500 rounded-b-2xl"></div>
    </div>
  )
}
