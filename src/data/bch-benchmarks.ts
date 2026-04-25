/**
 * BCH (Business Contract Hire) benchmark reference data for the
 * excess-mileage PDF comparison.
 *
 * STUB — populate with real Olaris rate card figures. Every figure below
 * is a reasonable-but-synthetic industry ballpark chosen to make the
 * comparison table coherent in early-live testing; not for use in
 * customer-facing quotes.
 *
 * Shape: indicative monthly £ per vehicle for a "mid-range fleet saloon"
 * reference vehicle (e.g. Skoda Superb / VW Passat class) across three
 * common annual mileage bands. Real Olaris quotes depend on vehicle,
 * term, funder and deposit — this table exists only to illustrate that
 * *the right allowance absorbs the overshoot* at typically-lower cost
 * than the excess-mileage surcharge.
 *
 * When replacing with real figures, keep the same shape so the PDF
 * renderer doesn't need to change.
 */

export interface BchBand {
  annualMiles: number
  /** Indicative monthly cost per vehicle, £ (ex-VAT). */
  monthlyPerVehicleGBP: number
}

export const BCH_BENCHMARKS: BchBand[] = [
  { annualMiles: 10_000, monthlyPerVehicleGBP: 425 },
  { annualMiles: 15_000, monthlyPerVehicleGBP: 465 },
  { annualMiles: 20_000, monthlyPerVehicleGBP: 510 },
]

/** The vehicle class the figures above reference. Shown in PDF disclaimer. */
export const BCH_REFERENCE_CLASS =
  'mid-range fleet saloon, 36-month term, indicative only'
