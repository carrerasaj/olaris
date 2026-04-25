/**
 * Server-authoritative excess-mileage calculation + report payload.
 *
 * The calculator page computes these numbers client-side for the live
 * UX. When a lead captures for the PDF, the API route re-runs the same
 * maths here from validated inputs — the PDF never trusts what the
 * browser submitted.
 *
 * Single source of truth for two call sites: `/api/tools/excess-mileage/report`
 * (POST) and the Puppeteer template at `/admin/tools/excess-mileage-report/pdf-template`.
 */

import { z } from 'zod'
import { BCH_BENCHMARKS, type BchBand } from '@/data/bch-benchmarks'

export const excessMileageInputSchema = z.object({
  vehicles: z.number().int().min(1).max(1000),
  contractedMileage: z.number().int().min(1_000).max(100_000),
  actualMileage: z.number().int().min(1_000).max(100_000),
  termRemainingMonths: z.number().int().min(1).max(60),
  /** Pence per mile (1–50). Calculator's `ppmRate`. */
  pencePerMile: z.number().int().min(1).max(50),
})
export type ExcessMileageInput = z.infer<typeof excessMileageInputSchema>

export interface ExcessMileageResult {
  /** True when the fleet is projected to overshoot contract. */
  isOver: boolean
  /** Excess miles per vehicle per year (0 if on-track). */
  excessPerVehiclePerYear: number
  /** Total fleet excess miles per year (0 if on-track). */
  totalFleetExcessPerYear: number
  /** Projected excess miles across the remaining term. */
  projectedExcessMiles: number
  /** Estimated charge in £ across the remaining term. */
  estimatedChargeGBP: number
  /** Estimated charge in £ per vehicle. */
  chargePerVehicleGBP: number
}

export function computeExcessMileage(input: ExcessMileageInput): ExcessMileageResult {
  const excess = input.actualMileage - input.contractedMileage
  const excessPerVehiclePerYear = Math.max(0, excess)
  const totalFleetExcessPerYear = excessPerVehiclePerYear * input.vehicles
  const projectedExcessMiles = Math.round(
    totalFleetExcessPerYear * (input.termRemainingMonths / 12),
  )
  const estimatedChargeGBP = Math.round(
    projectedExcessMiles * (input.pencePerMile / 100),
  )
  const chargePerVehicleGBP = Math.round(estimatedChargeGBP / input.vehicles)
  return {
    isOver: excess > 0,
    excessPerVehiclePerYear,
    totalFleetExcessPerYear,
    projectedExcessMiles,
    estimatedChargeGBP,
    chargePerVehicleGBP,
  }
}

export interface BchComparisonRow extends BchBand {
  /** Does this band cover the customer's actual annual mileage? */
  coversActual: boolean
  /** Difference vs their contracted band — positive = more expensive. */
  monthlyDeltaVsContractedGBP: number
}

/**
 * Given the customer's contracted + actual annual mileage, produce a
 * three-row comparison anchored at the benchmark bands. Marks the row
 * that would have absorbed their actual usage.
 */
export function bchComparison(input: ExcessMileageInput): BchComparisonRow[] {
  // The monthly cost "equivalent" of the customer's contracted mileage —
  // picked by nearest-lower band so deltas land in the right direction.
  const contractedBand = [...BCH_BENCHMARKS]
    .reverse()
    .find((b) => b.annualMiles <= input.contractedMileage)
    ?? BCH_BENCHMARKS[0]

  return BCH_BENCHMARKS.map((band) => ({
    ...band,
    coversActual: band.annualMiles >= input.actualMileage,
    monthlyDeltaVsContractedGBP:
      band.monthlyPerVehicleGBP - contractedBand.monthlyPerVehicleGBP,
  }))
}

/**
 * Full payload the PDF template renders from. Everything the template
 * needs in one object so the template route can look it up atomically.
 */
export interface ExcessMileageReportPayload {
  input: ExcessMileageInput
  result: ExcessMileageResult
  bch: BchComparisonRow[]
  /** ISO timestamp — generated at report-build time. */
  generatedAt: string
  /** Optional recipient details to personalise the header. */
  recipient?: {
    email?: string
    company?: string | null
  }
}

export function buildReportPayload(
  input: ExcessMileageInput,
  recipient?: ExcessMileageReportPayload['recipient'],
): ExcessMileageReportPayload {
  return {
    input,
    result: computeExcessMileage(input),
    bch: bchComparison(input),
    generatedAt: new Date().toISOString(),
    recipient,
  }
}
