/**
 * UI-form ↔ quote server-action mapping. Mirrors `order-mapping.ts` but
 * drops the `consent` object (quotes aren't signed) and adds optional
 * supplier + customer-notes fields.
 */

import type { Order as UiOrder } from '@/components/order-form'
import type {
  Quote as DbQuote,
  Customer as DbCustomer,
  Company as DbCompany,
} from '@/db/schema'
import { uiOrderToInput } from './order-mapping'
import { dbOrderToUi } from './order-mapping'
import type { Order as DbOrder } from '@/db/schema'
import type { QuoteDraftInput } from './validation'

// ─── UI → quote-action input ─────────────────────────────────────────────

export function uiQuoteToInput(
  uiOrder: UiOrder,
  customerId: string,
  companyId: string | null,
  supplierIds?: {
    vehicleSupplierId?: string | null
    financeProviderId?: string | null
  },
  customerNotes?: string | null,
): QuoteDraftInput {
  // Reuse the existing UI→order mapper (shared shape) and strip consent.
  const orderInput = uiOrderToInput(uiOrder, customerId, companyId)
  const { consent: _drop, ...rest } = orderInput
  void _drop
  return {
    ...rest,
    vehicleSupplierId: supplierIds?.vehicleSupplierId ?? null,
    financeProviderId: supplierIds?.financeProviderId ?? null,
    customerNotes: customerNotes ?? null,
  }
}

// ─── DB → UI for editing ─────────────────────────────────────────────────

export function dbQuoteToUi(
  quote: DbQuote,
  customer: DbCustomer,
  company: DbCompany | null,
): UiOrder {
  // Quotes and orders share the same jsonb shape, so we can construct a
  // synthetic order row just to feed dbOrderToUi. The `consent`/signatures
  // fields are defaulted by dbOrderToUi itself when null.
  const fakeOrder = {
    ...quote,
    // Order-only fields that dbOrderToUi reads but quotes don't carry.
    consent: null,
    status: 'draft',
    sentAt: null,
    signedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    // dbOrderToUi doesn't read ref/id but the type demands them
    ref: quote.ref,
    id: quote.id,
  } as unknown as DbOrder
  return dbOrderToUi(fakeOrder, customer, company)
}
