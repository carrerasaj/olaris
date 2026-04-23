import { z } from 'zod'

// UK postcode — compact regex matching the common public-facing forms.
// Not exhaustive (won't catch every BFPO/overseas territory code) but
// catches ~99% of real inputs and rejects obvious garbage.
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address is required').max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  postcode: z
    .string()
    .min(5, 'Postcode looks too short')
    .max(10)
    .regex(UK_POSTCODE, 'Invalid UK postcode'),
  country: z.string().max(80).default('United Kingdom'),
})

export const supplierCreateSchema = z.object({
  kind: z.enum(['dealer', 'broker', 'oem_partner', 'importer', 'funder']),
  legalName: z.string().min(1, 'Legal name is required').max(200),
  tradingName: z.string().max(200).optional().nullable(),
  primaryContactName: z.string().min(1, 'Contact name is required').max(120),
  primaryContactEmail: z.string().email('Invalid email').max(200),
  primaryContactPhone: z.string().max(40).optional().nullable(),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .refine(
      (v) =>
        !v ||
        /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i.test(v),
      { message: 'Invalid website URL' },
    ),
  addressLine1: z.string().max(200).optional().nullable(),
  addressLine2: z.string().max(200).optional().nullable(),
  addressCity: z.string().max(100).optional().nullable(),
  addressPostcode: z
    .string()
    .max(10)
    .optional()
    .nullable()
    .refine((v) => !v || UK_POSTCODE.test(v), { message: 'Invalid UK postcode' }),
  addressCountry: z.string().max(80).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>

export const customerCreateSchema = z.object({
  type: z.enum(['business', 'personal']),
  salutation: z.string().max(5).optional(),
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  email: z.string().email('Invalid email').max(200),
  phone: z.string().max(40).optional(),
  dob: z.string().optional(),
  position: z.string().max(80).optional(),
  companyName: z.string().max(200).optional(),
  companiesHouseNumber: z.string().max(20).optional(),
  vatNumber: z.string().max(20).optional(),
  billingAddress: addressSchema,
  notes: z.string().max(5000).optional(),
})

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>

// Minimum fields needed for a draft order. Fuller validation (required
// before "Send for signature") lives in orderSendSchema below.
export const orderDraftSchema = z.object({
  customerId: z.string().min(1),
  companyId: z.string().optional().nullable(),
  customerType: z.enum(['business', 'personal']),
  financeType: z.enum(['BCH', 'PCH', 'FL', 'HP', 'CP', 'OP']),

  vehicle: z.object({
    category: z.string(),
    make: z.string().min(1),
    model: z.string().min(1),
    derivative: z.string(),
    fuel: z.string(),
    transmission: z.string(),
    colour: z.string(),
    trim: z.string(),
    registration: z.string(),
    co2: z.number().nonnegative(),
  }),
  options: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      sku: z.string(),
      qty: z.number().nonnegative(),
      netPence: z.number().int().nonnegative(),
      vatRate: z.number().nonnegative(),
    }),
  ),
  delivery: z.object({
    method: z.string(),
    address: z.string(),
    city: z.string(),
    postcode: z.string(),
    preferredDate: z.string(),
    contact: z.string(),
    contactPhone: z.string(),
    notes: z.string(),
  }),
  pricing: z.object({
    vehicleNetPence: z.number().int().nonnegative(),
    discountPence: z.number().int().nonnegative(),
    vatRate: z.number().nonnegative(),
    vedPence: z.number().int().nonnegative(),
    firstRegFeePence: z.number().int().nonnegative(),
    deliveryFeePence: z.number().int().nonnegative(),
    numberPlatesPence: z.number().int().nonnegative(),
  }),
  finance: z.object({
    term: z.number().int().nonnegative(),
    annualMileage: z.number().int().nonnegative(),
    initialRental: z.number().int().nonnegative(),
    monthlyNetPence: z.number().int().nonnegative(),
    balloonPence: z.number().int().nonnegative(),
  }),
  addons: z.object({
    maintenance: z.boolean(),
    maintenanceMonthlyPence: z.number().int().nonnegative(),
    gap: z.boolean(),
    gapTotalPence: z.number().int().nonnegative(),
    tyreCover: z.boolean(),
    tyreMonthlyPence: z.number().int().nonnegative(),
    breakdown: z.boolean(),
    breakdownMonthlyPence: z.number().int().nonnegative(),
  }),
  partExchange: z
    .object({
      enabled: z.boolean(),
      reg: z.string(),
      make: z.string(),
      model: z.string(),
      mileage: z.string(),
      condition: z.string(),
      valuationPence: z.number().int().nonnegative(),
      outstandingFinancePence: z.number().int().nonnegative(),
    })
    .optional()
    .nullable(),
  consent: z
    .object({
      terms: z.boolean(),
      gdpr: z.boolean(),
      marketing: z.boolean(),
      fcaDisclosure: z.boolean(),
    })
    .optional()
    .nullable(),
  notes: z.string().optional(),
})

export type OrderDraftInput = z.infer<typeof orderDraftSchema>

// Stricter schema checked before the order can transition draft → sent.
// Note: consent is captured from the customer during signing, not from
// the admin form, so it's not required here.
export const orderSendSchema = orderDraftSchema.extend({
  vehicle: orderDraftSchema.shape.vehicle.extend({
    make: z.string().min(1, 'Vehicle make required'),
    model: z.string().min(1, 'Vehicle model required'),
    derivative: z.string().min(1, 'Derivative required'),
  }),
  pricing: orderDraftSchema.shape.pricing.refine(
    (p) => p.vehicleNetPence > 0,
    { message: 'Vehicle net price must be greater than zero' },
  ),
  delivery: orderDraftSchema.shape.delivery.extend({
    address: z.string().min(1, 'Delivery address required'),
    postcode: z.string().min(5, 'Delivery postcode required'),
  }),
})

// Quotes share the order draft shape (same jsonb columns) minus `consent`
// (not captured at quote time) plus supplier FKs and customer-facing notes.
// We use .omit/extend rather than redeclaring so any future field added to
// orderDraftSchema is automatically inherited by quotes.
export const quoteDraftSchema = orderDraftSchema
  .omit({ consent: true })
  .extend({
    vehicleSupplierId: z.string().optional().nullable(),
    financeProviderId: z.string().optional().nullable(),
    customerNotes: z.string().max(5000).optional().nullable(),
  })

export type QuoteDraftInput = z.infer<typeof quoteDraftSchema>

// Stricter check before a quote can leave `draft` for `sent`.
export const quoteSendSchema = quoteDraftSchema.extend({
  vehicle: quoteDraftSchema.shape.vehicle.extend({
    make: z.string().min(1, 'Vehicle make required'),
    model: z.string().min(1, 'Vehicle model required'),
  }),
  pricing: quoteDraftSchema.shape.pricing.refine(
    (p) => p.vehicleNetPence > 0,
    { message: 'Vehicle net price must be greater than zero' },
  ),
})
