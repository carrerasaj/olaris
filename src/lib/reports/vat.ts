/**
 * VAT summary — management-support numbers only. NOT a VAT return / not
 * suitable for HMRC submission. Banner copy on the page makes this
 * explicit to the reader.
 *
 * Output VAT: derived on the fly from orders.pricing jsonb for orders
 * whose basis-date falls in the quarter. We didn't snapshot output-side
 * VAT on the order itself (unlike the supplier-PO side where we did),
 * so it's computed each time the report runs.
 *
 * Input VAT: captured from supplier_orders.supplierInvoiceVatPence when
 * an invoice is recorded. When the invoice isn't captured yet, we
 * surface the PO's expected purchaseVatPence separately as "pending
 * capture" so the accountant can see what's due to land.
 */

import { and, gte, lte } from 'drizzle-orm'
import { db, orders, supplierOrders } from '@/db/client'
import type { VatSummary, VatSummaryParams, DateBasis } from './types'

function basisCol(basis: VatSummaryParams['basis']) {
  return basis === 'signed' ? orders.signedAt : orders.deliveredAt
}

function addMonthsISO(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  // Step back one day for quarter-end inclusive boundary.
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Round an order's output VAT from the stored jsonb. Same formula as the
 * client-side pricing calc — vehicle net + options net − discount, then
 * VAT rate applied.
 */
function orderOutputVatPence(order: {
  pricing: { vehicleNetPence: number; discountPence: number; vatRate: number }
  options: Array<{ netPence: number; qty: number }>
}): { vatPence: number; netPence: number } {
  const p = order.pricing
  const optionsNet = order.options.reduce(
    (s, o) => s + o.netPence * o.qty,
    0,
  )
  const netBeforeVat = p.vehicleNetPence + optionsNet - p.discountPence
  const vat = Math.round((netBeforeVat * p.vatRate) / 100)
  return { vatPence: Math.max(0, vat), netPence: Math.max(0, netBeforeVat) }
}

export async function getVatSummary(
  params: VatSummaryParams,
): Promise<VatSummary> {
  const quarterEndISO = addMonthsISO(params.quarterStartISO, 3)
  const from = new Date(`${params.quarterStartISO}T00:00:00Z`)
  const to = new Date(`${quarterEndISO}T23:59:59Z`)

  const col = basisCol(params.basis)

  const customerRows = await db
    .select({
      pricing: orders.pricing,
      options: orders.options,
    })
    .from(orders)
    .where(and(gte(col, from), lte(col, to)))

  let outputVatPence = 0
  let outputRevenueNetPence = 0
  for (const o of customerRows) {
    const { vatPence, netPence } = orderOutputVatPence(o)
    outputVatPence += vatPence
    outputRevenueNetPence += netPence
  }

  // Input side — POs sent / acknowledged in the same window, matched on
  // sentAt for consistency. (If the PO was sent in the window but invoice
  // captured later, the VAT numbers belong to this quarter for the
  // management view — accountant can re-lay against their own scheme.)
  const poRows = await db
    .select({
      purchaseNetPence: supplierOrders.purchaseNetPence,
      purchaseVatPence: supplierOrders.purchaseVatPence,
      invoiceNetPence: supplierOrders.supplierInvoiceNetPence,
      invoiceVatPence: supplierOrders.supplierInvoiceVatPence,
      sentAt: supplierOrders.sentAt,
    })
    .from(supplierOrders)
    .where(and(gte(supplierOrders.sentAt, from), lte(supplierOrders.sentAt, to)))

  let inputVatCapturedPence = 0
  let inputVatExpectedPence = 0
  let inputPurchaseNetPence = 0
  let pendingCaptureCount = 0
  for (const p of poRows) {
    inputPurchaseNetPence += p.purchaseNetPence
    if (p.invoiceVatPence !== null) {
      inputVatCapturedPence += p.invoiceVatPence
    } else if (p.invoiceNetPence !== null) {
      // Invoice captured but VAT not split — no VAT figure to count. Skip.
    } else {
      inputVatExpectedPence += p.purchaseVatPence
      pendingCaptureCount += 1
    }
  }

  const netPositionPence =
    outputVatPence - (inputVatCapturedPence + inputVatExpectedPence)

  return {
    quarterStartISO: params.quarterStartISO,
    quarterEndISO,
    basis: params.basis,
    outputVatPence,
    outputRevenueNetPence,
    inputVatCapturedPence,
    inputVatExpectedPence,
    inputPurchaseNetPence,
    pendingCaptureCount,
    netPositionPence,
  }
}

/**
 * Helper: given a date, return the ISO start of the UK VAT quarter it's
 * in (Jan/Apr/Jul/Oct). Defaults the report picker to the current quarter.
 */
export function currentQuarterStartISO(now: Date = new Date()): string {
  const month = now.getUTCMonth() // 0-11
  const quarterStartMonth = Math.floor(month / 3) * 3
  const d = new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1))
  return d.toISOString().slice(0, 10)
}

// Re-export DateBasis so pages importing from here don't need ./types too.
export type { DateBasis }
