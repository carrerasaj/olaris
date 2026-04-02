'use client'

import { useState, useMemo } from 'react'

interface Question {
  id: number
  text: string
  category: string
  weight: number
  whyItMatters: string
  action: string
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Do you check all fleet drivers\u2019 DVLA licences at least quarterly?',
    category: 'Driver Compliance',
    weight: 15,
    whyItMatters:
      'Driving licence status can change at any time \u2014 penalty points, disqualifications, and medical revocations happen between checks. If a driver is disqualified and you don\u2019t know, your insurance is invalid.',
    action:
      'Implement quarterly DVLA checks at minimum. Orbis automates DVLA licence checking with continuous monitoring and real-time alerts.',
  },
  {
    id: 2,
    text: 'Do you have a documented grey fleet policy for employees using personal vehicles?',
    category: 'Grey Fleet',
    weight: 10,
    whyItMatters:
      'If any employee drives their own car for business, you have duty of care liability regardless of whether you have a policy. Without one, you have no visibility of vehicle condition or driver compliance.',
    action:
      'Create a grey fleet policy covering insurance requirements, MOT verification, and mileage recording. Orbis tracks grey fleet compliance alongside your company fleet.',
  },
  {
    id: 3,
    text: 'Are MOT dates tracked and flagged automatically before expiry?',
    category: 'Vehicle Compliance',
    weight: 10,
    whyItMatters:
      'An expired MOT means the vehicle is not legally roadworthy. If a driver is involved in an incident with an expired MOT, insurance can refuse the claim and the operator faces prosecution.',
    action:
      'Set up automated MOT tracking with 30-day advance alerts. Orbis pulls MOT data directly from DVSA and flags upcoming expiries across your fleet.',
  },
  {
    id: 4,
    text: 'Do you verify that all fleet vehicles have valid insurance at all times?',
    category: 'Insurance',
    weight: 15,
    whyItMatters:
      'Continuous insurance enforcement (CIE) means every registered vehicle must be insured. Gaps in cover \u2014 even for a single day \u2014 create personal liability for fleet managers and can invalidate fleet-wide policies.',
    action:
      'Maintain a live insurance register with renewal tracking and gap detection. Orbis monitors insurance status and alerts before policies lapse.',
  },
  {
    id: 5,
    text: 'Is there a formal process for recording and investigating driver incidents?',
    category: 'Duty of Care',
    weight: 10,
    whyItMatters:
      'Under the Health and Safety at Work Act 1974, employers must investigate work-related incidents. A lack of process is evidence of negligence if it goes to court.',
    action:
      'Implement a documented incident reporting process with investigation steps and outcomes tracking.',
  },
  {
    id: 6,
    text: 'Do you track business mileage for all fleet and grey fleet vehicles?',
    category: 'Mileage & Cost',
    weight: 5,
    whyItMatters:
      'Accurate mileage records are required for HMRC compliance (benefit-in-kind), excess mileage forecasting, and demonstrating duty of care. Estimates are not acceptable for audit purposes.',
    action:
      'Move from manual mileage logs to connected vehicle tracking. Orbis captures live odometer data from 15+ vehicle manufacturers.',
  },
  {
    id: 7,
    text: 'Are vehicle defect reports completed regularly by drivers?',
    category: 'Vehicle Compliance',
    weight: 10,
    whyItMatters:
      'Drivers have a legal obligation to ensure their vehicle is roadworthy before every journey. A documented defect reporting process demonstrates the operator\u2019s commitment to safety and provides an audit trail.',
    action:
      'Introduce a digital defect reporting system \u2014 even a simple weekly checklist app. Ensure defect reports are logged and actioned centrally.',
  },
  {
    id: 8,
    text: 'Do you have a documented fleet risk management policy?',
    category: 'Duty of Care',
    weight: 10,
    whyItMatters:
      'A fleet risk management policy is the foundation of your duty of care defence. Without one, proving that you took reasonable steps to manage risk is extremely difficult in court.',
    action:
      'Create a fleet risk management policy covering driver risk assessment, vehicle standards, and incident management procedures.',
  },
  {
    id: 9,
    text: 'Are driver training needs assessed based on driving behaviour or incident history?',
    category: 'Driver Compliance',
    weight: 10,
    whyItMatters:
      'Reactive training after an incident is too late. Proactive assessment of driving behaviour identifies at-risk drivers before they have an accident, reducing claims frequency and severity.',
    action:
      'Implement driver risk scoring based on licence points, incident history, and telematics data. Orbis assigns risk scores and flags drivers who need intervention.',
  },
  {
    id: 10,
    text: 'Can you produce a compliance report for your entire fleet within 24 hours?',
    category: 'Reporting',
    weight: 5,
    whyItMatters:
      'If an auditor, insurer, or regulator asks for compliance evidence, you need it fast. If it takes days to compile, there are gaps you don\u2019t know about.',
    action:
      'Centralise compliance data in a single system. Orbis generates fleet-wide compliance reports on demand \u2014 every driver, vehicle, and document in one view.',
  },
]

type Answer = 'yes' | 'partial' | 'no' | null

interface ScoreResult {
  score: number
  total: number
  percentage: number
  rating: 'strong' | 'moderate' | 'at-risk' | 'critical'
  colour: string
  bgColour: string
  borderColour: string
  message: string
  failedQuestions: Question[]
  partialQuestions: Question[]
}

const RATINGS = {
  strong: {
    colour: 'text-emerald-400',
    bgColour: 'bg-emerald-500/10',
    borderColour: 'border-emerald-500/20',
    message: 'Your fleet compliance is strong. Focus on maintaining continuous monitoring.',
  },
  moderate: {
    colour: 'text-amber-400',
    bgColour: 'bg-amber-500/10',
    borderColour: 'border-amber-500/20',
    message:
      'You have gaps that could expose your organisation to risk. Prioritise the items flagged below.',
  },
  'at-risk': {
    colour: 'text-orange-400',
    bgColour: 'bg-orange-500/10',
    borderColour: 'border-orange-500/20',
    message: 'Significant compliance gaps exist. Several items need immediate attention.',
  },
  critical: {
    colour: 'text-red-400',
    bgColour: 'bg-red-500/10',
    borderColour: 'border-red-500/20',
    message: 'Your fleet has critical compliance gaps. Immediate action is needed to reduce liability.',
  },
}

export function FleetComplianceChecker() {
  const [answers, setAnswers] = useState<Record<number, Answer>>(
    Object.fromEntries(QUESTIONS.map((q) => [q.id, null]))
  )

  const setAnswer = (id: number, value: Answer) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const allAnswered = useMemo(
    () => QUESTIONS.every((q) => answers[q.id] !== null),
    [answers]
  )

  const result = useMemo<ScoreResult | null>(() => {
    if (!allAnswered) return null

    let score = 0
    const failedQuestions: Question[] = []
    const partialQuestions: Question[] = []

    for (const q of QUESTIONS) {
      const a = answers[q.id]
      if (a === 'yes') {
        score += q.weight
      } else if (a === 'partial') {
        score += Math.round(q.weight / 2)
        partialQuestions.push(q)
      } else {
        failedQuestions.push(q)
      }
    }

    const percentage = score
    let rating: ScoreResult['rating']
    if (percentage >= 80) rating = 'strong'
    else if (percentage >= 60) rating = 'moderate'
    else if (percentage >= 40) rating = 'at-risk'
    else rating = 'critical'

    const cfg = RATINGS[rating]

    return {
      score,
      total: 100,
      percentage,
      rating,
      colour: cfg.colour,
      bgColour: cfg.bgColour,
      borderColour: cfg.borderColour,
      message: cfg.message,
      failedQuestions,
      partialQuestions,
    }
  }, [answers, allAnswered])

  const answeredCount = QUESTIONS.filter((q) => answers[q.id] !== null).length
  const progressPercent = Math.round((answeredCount / QUESTIONS.length) * 100)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-xl border border-olaris-border-dark bg-[#1C2128] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0D1117] border-b border-olaris-border-dark">
          <h2 className="text-lg font-bold text-white font-heading">Fleet Compliance Assessment</h2>
          <p className="text-sm text-olaris-text-secondary mt-1">
            Answer 10 questions about your fleet operations. Your score and action list appear
            instantly.
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs text-olaris-text-secondary mb-1.5">
            <span>{answeredCount} of {QUESTIONS.length} answered</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#0D1117] overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-4">
          {QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              className={`rounded-lg border p-4 transition-colors ${
                answers[q.id] !== null
                  ? 'border-olaris-border-dark bg-[#0D1117]/50'
                  : 'border-olaris-border-dark bg-[#0D1117]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-1">{q.text}</p>
                  <p className="text-xs text-olaris-text-secondary/60 mb-3">{q.category}</p>
                  <div className="flex gap-2">
                    {(['yes', 'partial', 'no'] as const).map((value) => (
                      <button
                        key={value}
                        onClick={() => setAnswer(q.id, value)}
                        className={`px-4 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          answers[q.id] === value
                            ? value === 'yes'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : value === 'partial'
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-red-500/20 border-red-500/40 text-red-400'
                            : 'border-olaris-border-dark text-olaris-text-secondary hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {value === 'yes' ? 'Yes' : value === 'partial' ? 'Partially' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        {result && (
          <div className="border-t border-olaris-border-dark">
            {/* Score */}
            <div className="p-6">
              <div className={`rounded-xl p-6 text-center ${result.bgColour} border ${result.borderColour}`}>
                <p className="text-sm font-medium text-olaris-text-secondary mb-1">
                  Your compliance score
                </p>
                <p className={`text-5xl font-bold font-mono tracking-tight ${result.colour}`}>
                  {result.score}<span className="text-2xl text-olaris-text-secondary">/100</span>
                </p>
                <p className={`text-sm font-semibold mt-2 ${result.colour}`}>
                  {result.rating === 'at-risk' ? 'At Risk' : result.rating.charAt(0).toUpperCase() + result.rating.slice(1)}
                </p>
                <p className="text-sm text-olaris-text-secondary mt-2 max-w-md mx-auto">
                  {result.message}
                </p>
              </div>
            </div>

            {/* Action items */}
            {(result.failedQuestions.length > 0 || result.partialQuestions.length > 0) && (
              <div className="px-6 pb-6">
                <h3 className="text-lg font-bold text-white mb-4">Prioritised Action List</h3>
                <div className="space-y-3">
                  {result.failedQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-lg border border-red-500/20 bg-red-500/5 p-4"
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                          !
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{q.text}</p>
                          <p className="text-xs text-olaris-text-secondary mt-1">
                            {q.whyItMatters}
                          </p>
                          <p className="text-xs text-cyan-400 mt-2">{q.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.partialQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                          ~
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{q.text}</p>
                          <p className="text-xs text-olaris-text-secondary mt-1">
                            {q.whyItMatters}
                          </p>
                          <p className="text-xs text-cyan-400 mt-2">{q.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom border */}
        <div className="h-1 bg-cyan-500 rounded-b-xl" />
      </div>
    </div>
  )
}
