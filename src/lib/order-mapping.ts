/**
 * Conversion between the DB order row (pence integers, jsonb blobs) and the
 * UI form shape (pounds, typed Order from order-form/shared.tsx).
 *
 * Keeping this in one place means a field added to the schema surfaces once
 * in both directions — no silent drift between the form and the database.
 */

import type { Order as UiOrder } from '@/components/order-form'
import type {
  Order as DbOrder,
  Customer as DbCustomer,
  Company as DbCompany,
  OrderOptionJson,
  PricingJson,
  FinanceJson,
  AddonsJson,
  PartExchangeJson,
  ConsentJson,
  VehicleJson,
  DeliveryJson,
} from '@/db/schema'
import { penceToPounds, poundsToPence } from './format'
import type { OrderDraftInput } from './validation'

// ─── DB row → UI form shape ───────────────────────────────────────────────

export function dbOrderToUi(
  order: DbOrder,
  customer: DbCustomer,
  company: DbCompany | null,
): UiOrder {
  return {
    orderType: order.customerType,
    financeType: order.financeType,
    customer: {
      salutation: customer.salutation ?? 'Mr',
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? '',
      dob: customer.dob ?? '',
      company: company?.name ?? '',
      companyNumber: company?.companiesHouseNumber ?? '',
      vatNumber: company?.vatNumber ?? '',
      position: customer.position ?? '',
      billingAddress: customer.billingAddress?.line1 ?? '',
      billingCity: customer.billingAddress?.city ?? '',
      billingPostcode: customer.billingAddress?.postcode ?? '',
      billingCountry: customer.billingAddress?.country ?? 'United Kingdom',
    },
    vehicle: order.vehicle,
    options: order.options.map((o) => ({
      id: o.id,
      name: o.name,
      sku: o.sku,
      qty: o.qty,
      net: penceToPounds(o.netPence),
      vatRate: o.vatRate,
    })),
    delivery: order.delivery,
    pricing: {
      vehicleNet: penceToPounds(order.pricing.vehicleNetPence),
      discount: penceToPounds(order.pricing.discountPence),
      vatRate: order.pricing.vatRate,
      ved: penceToPounds(order.pricing.vedPence),
      firstRegFee: penceToPounds(order.pricing.firstRegFeePence),
      deliveryFee: penceToPounds(order.pricing.deliveryFeePence),
      numberPlates: penceToPounds(order.pricing.numberPlatesPence),
    },
    finance: {
      term: order.finance.term,
      annualMileage: order.finance.annualMileage,
      initialRental: order.finance.initialRental,
      monthlyNet: penceToPounds(order.finance.monthlyNetPence),
      balloon: penceToPounds(order.finance.balloonPence),
    },
    addons: {
      maintenance: order.addons.maintenance,
      maintenanceMonthly: penceToPounds(order.addons.maintenanceMonthlyPence),
      gap: order.addons.gap,
      gapTotal: penceToPounds(order.addons.gapTotalPence),
      tyreCover: order.addons.tyreCover,
      tyreMonthly: penceToPounds(order.addons.tyreMonthlyPence),
      breakdown: order.addons.breakdown,
      breakdownMonthly: penceToPounds(order.addons.breakdownMonthlyPence),
    },
    partExchange: order.partExchange
      ? {
          enabled: order.partExchange.enabled,
          reg: order.partExchange.reg,
          make: order.partExchange.make,
          model: order.partExchange.model,
          mileage: order.partExchange.mileage,
          condition: order.partExchange.condition,
          valuation: penceToPounds(order.partExchange.valuationPence),
          outstandingFinance: penceToPounds(order.partExchange.outstandingFinancePence),
        }
      : {
          enabled: false,
          reg: '',
          make: '',
          model: '',
          mileage: '',
          condition: 'Good',
          valuation: 0,
          outstandingFinance: 0,
        },
    notes: order.notes ?? '',
    consent: order.consent ?? {
      terms: false,
      gdpr: false,
      marketing: false,
      fcaDisclosure: false,
    },
    signatures: {
      // Phase 4 will hydrate these from the signatures table.
      customer: { signed: false, method: 'pending', name: '', signedAt: null, ip: null },
      representative: { signed: false, method: 'pending', name: '', signedAt: null, ip: null },
    },
  }
}

// ─── UI form shape → server action input (OrderDraftInput) ────────────────
// Never trust this on the server — always re-validate via orderDraftSchema.

export function uiOrderToInput(
  uiOrder: UiOrder,
  customerId: string,
  companyId: string | null,
): OrderDraftInput {
  return {
    customerId,
    companyId,
    customerType: uiOrder.orderType,
    financeType: uiOrder.financeType,
    vehicle: uiOrder.vehicle as VehicleJson,
    options: uiOrder.options.map<OrderOptionJson>((o) => ({
      id: o.id,
      name: o.name,
      sku: o.sku,
      qty: o.qty,
      netPence: poundsToPence(o.net),
      vatRate: o.vatRate,
    })),
    delivery: uiOrder.delivery as DeliveryJson,
    pricing: {
      vehicleNetPence: poundsToPence(uiOrder.pricing.vehicleNet),
      discountPence: poundsToPence(uiOrder.pricing.discount),
      vatRate: uiOrder.pricing.vatRate,
      vedPence: poundsToPence(uiOrder.pricing.ved),
      firstRegFeePence: poundsToPence(uiOrder.pricing.firstRegFee),
      deliveryFeePence: poundsToPence(uiOrder.pricing.deliveryFee),
      numberPlatesPence: poundsToPence(uiOrder.pricing.numberPlates),
    } satisfies PricingJson,
    finance: {
      term: uiOrder.finance.term,
      annualMileage: uiOrder.finance.annualMileage,
      initialRental: uiOrder.finance.initialRental,
      monthlyNetPence: poundsToPence(uiOrder.finance.monthlyNet),
      balloonPence: poundsToPence(uiOrder.finance.balloon),
    } satisfies FinanceJson,
    addons: {
      maintenance: uiOrder.addons.maintenance,
      maintenanceMonthlyPence: poundsToPence(uiOrder.addons.maintenanceMonthly),
      gap: uiOrder.addons.gap,
      gapTotalPence: poundsToPence(uiOrder.addons.gapTotal),
      tyreCover: uiOrder.addons.tyreCover,
      tyreMonthlyPence: poundsToPence(uiOrder.addons.tyreMonthly),
      breakdown: uiOrder.addons.breakdown,
      breakdownMonthlyPence: poundsToPence(uiOrder.addons.breakdownMonthly),
    } satisfies AddonsJson,
    partExchange: uiOrder.partExchange.enabled
      ? ({
          enabled: true,
          reg: uiOrder.partExchange.reg,
          make: uiOrder.partExchange.make,
          model: uiOrder.partExchange.model,
          mileage: uiOrder.partExchange.mileage,
          condition: uiOrder.partExchange.condition,
          valuationPence: poundsToPence(uiOrder.partExchange.valuation),
          outstandingFinancePence: poundsToPence(uiOrder.partExchange.outstandingFinance),
        } satisfies PartExchangeJson)
      : null,
    consent: uiOrder.consent satisfies ConsentJson,
    notes: uiOrder.notes,
  }
}
