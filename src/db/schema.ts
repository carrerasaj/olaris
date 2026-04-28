/**
 * Olaris CRM + order execution schema.
 *
 * Conventions:
 *   - IDs are text (nanoid-21) unless stated otherwise
 *   - Money is stored as integer pence, never float
 *   - All timestamps are TIMESTAMPTZ, default now()
 *   - JSONB blobs are typed via $type<T>() so callers get autocomplete
 *   - Enums are Postgres-native (not CHECK constraints) for readability
 */

import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'

// ─── Enums ─────────────────────────────────────────────────────────────────

export const userRole = pgEnum('user_role', ['admin'])
export const customerType = pgEnum('customer_type', ['business', 'personal'])
export const financeType = pgEnum('finance_type', [
  'BCH',
  'PCH',
  'FL',
  'HP',
  'CP',
  'OP',
])
export const orderStatus = pgEnum('order_status', [
  'draft',
  'sent',
  'partially_signed',
  'signed',
  'confirmed',
  'on_order',
  'ready_for_handover',
  'delivered',
  'cancelled',
  'cancelled_post_sign',
])
// Quote lifecycle. `viewed` is a unique-link-opened activity signal only —
// not identity, not acceptance. Once a quote leaves `draft` its terms are
// frozen; edits require cancel + new draft. Terminal states: `converted`,
// `cancelled`, `declined`, `expired`.
export const quoteStatus = pgEnum('quote_status', [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'declined',
  'expired',
  'converted',
  'cancelled',
])
export const signerRole = pgEnum('signer_role', ['customer', 'rep'])
export const signatureType = pgEnum('signature_type', ['typed', 'drawn'])
export const otpMethod = pgEnum('otp_method', ['email'])
export const auditEventType = pgEnum('audit_event_type', [
  'customer.created',
  'customer.updated',
  'order.created',
  'order.updated',
  'order.sent',
  'order.cancelled',
  'order.delivered',
  'link.viewed',
  'otp.requested',
  'otp.verified',
  'otp.failed',
  'signed',
  'sign.declined',
  'pdf.generated',
  'pdf.downloaded',
  'reminder.sent',
  'email.sent',
  'email.failed',
  'supplier.created',
  'supplier.updated',
  'supplier.deactivated',
  'supplier.reactivated',
  'order.vehicle_supplier_set',
  'order.finance_provider_set',
  'quote.created',
  'quote.updated',
  'quote.sent',
  'quote.viewed',
  'quote.accepted',
  'quote.declined',
  'quote.expired',
  'quote.converted',
  'quote.cancelled',
  'order.confirmed',
  'order.on_order',
  'order.ready_for_handover',
  'order.cancelled_post_sign',
  'order.eta_updated',
  'order.chassis_recorded',
  'order.reg_recorded',
  'order.logistics_updated',
  'order.status_override',
  'supplier_po.created',
  'supplier_po.updated',
  'supplier_po.sent',
  'supplier_po.acknowledged',
  'supplier_po.cancelled',
  'supplier_po.snapshot_refreshed',
  'supplier_po.superseded_by',
  'supplier_po.invoice_received',
  'email.suppressed',
  'feedback.requested',
  'feedback.submitted',
  'feedback.detractor_flagged',
  'handover_pack.generated',
  'handover_pack.superseded',
  'customer.marketing_opt_out_changed',
])
export const actorType = pgEnum('actor_type', ['rep', 'customer', 'system'])
export const documentKind = pgEnum('document_kind', [
  'id',
  'proof_of_address',
  'proof_of_income',
  'signed_order_pdf',
  'handover_pack',
  'other',
])
// NPS band derived on insert from the 0–10 score. Promoters 9–10,
// passives 7–8, detractors 0–6. Stored so queries can aggregate without
// re-deriving.
// ─── Phase 13 / F-03: lead capture + drip infrastructure ─────────────
//
// `leads` is the pre-conversion counterpart to `customers`. Anyone who
// gives us their email via a calculator, a lead magnet, or an exit-intent
// popover lands here. When a lead signs a contract, the sales flow
// promotes the row into `customers` (outside F-03 scope); until then the
// lead is nurtured via drip sequences defined in `src/lib/drip-sequences.ts`.
//
// Kept separate from `customers` because:
//   - Lifecycle differs (nurture vs. signed contract)
//   - Most leads never convert; polluting `customers` hurts query speed
//   - Leads carry source / attribution the customers table doesn't need

export const leadSource = pgEnum('lead_source', [
  'excess-mileage',
  'company-car-tax',
  'ev-transition',
  'fleet-compliance',
  'contact',
  'newsletter',
  'pillar-download',
  'exit-intent',
  'sticky-bar',
  'case-study',
  'fleet-scorecard',
  'other',
])

export const leadEventType = pgEnum('lead_event_type', [
  'lead.created',
  'gated_resource.sent',
  'gated_resource.failed',
  'drip.enrolled',
  'drip.sent',
  'drip.suppressed',
  'drip.failed',
  'lead.unsubscribed',
  'lead.converted_to_customer',
])

export const feedbackCategory = pgEnum('feedback_category', [
  'promoter',
  'passive',
  'detractor',
])
export const activityKind = pgEnum('activity_kind', [
  'note',
  'call',
  'email',
  'meeting',
  'task',
])
// Supplier categories — split "who sources the vehicle" from "who underwrites
// the finance" at the `orders` layer (two separate FKs). Both types live in
// the same `suppliers` table, distinguished by `kind`. `funder` is a lender
// like Leasys UK Ltd; `dealer` is a vehicle source like Van Choices.
export const supplierKind = pgEnum('supplier_kind', [
  'dealer',
  'broker',
  'oem_partner',
  'importer',
  'funder',
])

// Supplier purchase-order lifecycle (Phase 10). No `delivered` — that lives
// on the customer order via the Phase 9 delivery lifecycle. A PO's job is
// done at `acknowledged`.
export const supplierPoStatus = pgEnum('supplier_po_status', [
  'draft',
  'sent',
  'acknowledged',
  'cancelled',
])

// ─── Helpers ───────────────────────────────────────────────────────────────

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => nanoid(21))

const createdAt = () =>
  timestamp('created_at', { withTimezone: true })
    .default(sql`now()`)
    .notNull()

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .default(sql`now()`)
    .notNull()

// ─── JSONB payload types ───────────────────────────────────────────────────

export interface AddressJson {
  line1: string
  line2?: string
  city: string
  postcode: string
  country: string
}

export interface VehicleJson {
  category: string
  make: string
  model: string
  derivative: string
  fuel: string
  transmission: string
  colour: string
  trim: string
  registration: string
  co2: number
}

export interface OrderOptionJson {
  id: string
  name: string
  sku: string
  qty: number
  netPence: number
  vatRate: number
}

export interface DeliveryJson {
  method: string
  address: string
  city: string
  postcode: string
  preferredDate: string
  contact: string
  contactPhone: string
  notes: string
}

export interface PricingJson {
  vehicleNetPence: number
  discountPence: number
  vatRate: number
  vedPence: number
  firstRegFeePence: number
  deliveryFeePence: number
  numberPlatesPence: number
}

export interface FinanceJson {
  term: number
  annualMileage: number
  initialRental: number
  monthlyNetPence: number
  balloonPence: number
}

export interface AddonsJson {
  maintenance: boolean
  maintenanceMonthlyPence: number
  gap: boolean
  gapTotalPence: number
  tyreCover: boolean
  tyreMonthlyPence: number
  breakdown: boolean
  breakdownMonthlyPence: number
}

export interface PartExchangeJson {
  enabled: boolean
  reg: string
  make: string
  model: string
  mileage: string
  condition: string
  valuationPence: number
  outstandingFinancePence: number
}

export interface ConsentJson {
  terms: boolean
  gdpr: boolean
  marketing: boolean
  fcaDisclosure: boolean
}

// ─── Auth.js tables (Drizzle adapter standard shape, with `role` added) ────

export const users = pgTable('users', {
  id: id(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  role: userRole('role').default('admin').notNull(),
  createdAt: createdAt(),
})

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
)

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
)

// ─── Domain tables ─────────────────────────────────────────────────────────

export const companies = pgTable(
  'companies',
  {
    id: id(),
    name: text('name').notNull(),
    companiesHouseNumber: text('companies_house_number'),
    vatNumber: text('vat_number'),
    billingAddress: jsonb('billing_address').$type<AddressJson>(),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    nameIdx: index('companies_name_idx').on(t.name),
  }),
)

// Suppliers cover both the vehicle-source side (dealer, broker, OEM
// partner, importer) and the finance-underwriting side (funder). Orders
// reference them via two separate FKs (`vehicle_supplier_id` and
// `finance_provider_id`) so the two roles are never conflated. Olaris is
// always the broker in the commercial sense — it's never a row in this
// table pointing at itself.
export const suppliers = pgTable(
  'suppliers',
  {
    id: id(),
    kind: supplierKind('kind').notNull(),
    legalName: text('legal_name').notNull(),
    tradingName: text('trading_name'),
    primaryContactName: text('primary_contact_name').notNull(),
    primaryContactEmail: text('primary_contact_email').notNull(),
    primaryContactPhone: text('primary_contact_phone'),
    website: text('website'),
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    addressCity: text('address_city'),
    addressPostcode: text('address_postcode'),
    addressCountry: text('address_country'),
    notes: text('notes'),
    // Soft-disable rather than delete — keeps foreign-key integrity on
    // historical orders if a supplier relationship ends. Default true;
    // list views filter on this.
    active: boolean('active').notNull().default(true),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    kindIdx: index('suppliers_kind_idx').on(t.kind),
    legalNameIdx: index('suppliers_legal_name_idx').on(t.legalName),
    activeIdx: index('suppliers_active_idx').on(t.active),
  }),
)

export const customers = pgTable(
  'customers',
  {
    id: id(),
    type: customerType('type').notNull().default('business'),
    salutation: text('salutation'),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    dob: text('dob'), // ISO date string; no timezone needed
    position: text('position'),
    companyId: text('company_id').references(() => companies.id, {
      onDelete: 'set null',
    }),
    billingAddress: jsonb('billing_address').$type<AddressJson>(),
    notes: text('notes'),
    // Phase 12 — suppresses NPS + future referral/anniversary comms only.
    // Transactional emails (confirmed / ETA / ready / delivered) are the
    // service we're contracted to provide and ignore this flag.
    marketingOptOut: boolean('marketing_opt_out').notNull().default(false),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    emailIdx: index('customers_email_idx').on(t.email),
    lastNameIdx: index('customers_last_name_idx').on(t.lastName),
  }),
)

export const orders = pgTable(
  'orders',
  {
    id: id(),
    // Human-facing order ref like OL-2026-04-8F3K. Generated server-side at
    // creation; unique within the system.
    ref: text('ref').notNull().unique(),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    companyId: text('company_id').references(() => companies.id, {
      onDelete: 'set null',
    }),
    // Vehicle supplier — dealer / broker / OEM / importer. Nullable because
    // legacy orders (pre-supplier-module) won't have one, and draft orders
    // may be entered before a supplier is chosen.
    vehicleSupplierId: text('vehicle_supplier_id').references(
      () => suppliers.id,
      { onDelete: 'restrict' }, // never auto-delete a supplier that's on an order
    ),
    // Finance provider (lender). Nullable — outright-purchase orders and
    // pending-finance orders legitimately have none. Distinct from
    // vehicle supplier even when the same party could in theory do both.
    financeProviderId: text('finance_provider_id').references(
      () => suppliers.id,
      { onDelete: 'restrict' },
    ),
    // Back-link to the quote this order was converted from. Null for orders
    // created directly. Set null on quote delete — we never lose the order.
    // `AnyPgColumn` breaks the TS inference cycle with quotes.convertedOrderId.
    sourceQuoteId: text('source_quote_id').references(
      (): AnyPgColumn => quotes.id,
      { onDelete: 'set null' },
    ),
    status: orderStatus('status').notNull().default('draft'),
    customerType: customerType('customer_type').notNull().default('business'),
    financeType: financeType('finance_type').notNull().default('BCH'),

    // Snapshot of the order at whatever the current edit state is. jsonb so
    // we can evolve the form without DB migrations for every field.
    vehicle: jsonb('vehicle').$type<VehicleJson>().notNull(),
    options: jsonb('options').$type<OrderOptionJson[]>().notNull().default([]),
    delivery: jsonb('delivery').$type<DeliveryJson>().notNull(),
    pricing: jsonb('pricing').$type<PricingJson>().notNull(),
    finance: jsonb('finance').$type<FinanceJson>().notNull(),
    addons: jsonb('addons').$type<AddonsJson>().notNull(),
    partExchange: jsonb('part_exchange').$type<PartExchangeJson>(),
    consent: jsonb('consent').$type<ConsentJson>(),

    notes: text('notes'),

    // Per-order opt-in to email-OTP at signing time. Default is false —
    // single-step SES (link click + IP/UA/geo + drawn signature + Ed25519
    // doc hash) is sufficient for UK eIDAS SES tier and is the standard
    // for B2B contract hire. Alan flips this true on the order detail
    // page when extra verification is warranted (high-value, unfamiliar
    // counterparty, etc.). Server enforces — client doesn't decide.
    requiresOtp: boolean('requires_otp').notNull().default(false),

    // Derived totals at the moment of last save — in pence. Source of truth is
    // still the pricing/finance jsonb above; these are denormalised for list
    // views that don't want to re-run the calc per row.
    totalAmountPence: integer('total_amount_pence').notNull().default(0),
    monthlyAmountPence: integer('monthly_amount_pence').notNull().default(0),

    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    // Delivery-lifecycle stamps (Phase 9). All nullable; populated as the
    // order moves through signed → confirmed → on_order → ready_for_handover
    // → delivered. `deliveredAt` is the status-flip timestamp; the
    // operational "keys changed hands" date is `actualDeliveryDate` below.
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    onOrderAt: timestamp('on_order_at', { withTimezone: true }),
    readyForHandoverAt: timestamp('ready_for_handover_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledPostSignAt: timestamp('cancelled_post_sign_at', { withTimezone: true }),
    // Operational logistics — captured at various stages; all nullable.
    supplierPoNumber: text('supplier_po_number'),
    supplierOrderRef: text('supplier_order_ref'),
    chassisNumber: text('chassis_number'),
    registrationPlate: text('registration_plate'),
    // Dates not timestamps — we care about the day, not the minute.
    estimatedDeliveryDate: text('estimated_delivery_date'),
    // Last ETA we *successfully emailed the customer about*. The drift
    // threshold for the next customer-facing ETA email compares against
    // this, not against estimated_delivery_date, so internal churn doesn't
    // spam the customer. Populated only when an ETA-bearing email sends.
    lastCommunicatedEtaDate: text('last_communicated_eta_date'),
    actualDeliveryDate: text('actual_delivery_date'),
    handoverLocation: text('handover_location'),
    handoverNotes: text('handover_notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    statusIdx: index('orders_status_idx').on(t.status),
    customerIdx: index('orders_customer_idx').on(t.customerId),
    createdAtIdx: index('orders_created_at_idx').on(t.createdAt),
    refIdx: uniqueIndex('orders_ref_idx').on(t.ref),
    vehicleSupplierIdx: index('orders_vehicle_supplier_idx').on(t.vehicleSupplierId),
    financeProviderIdx: index('orders_finance_provider_idx').on(t.financeProviderId),
    sourceQuoteIdx: index('orders_source_quote_idx').on(t.sourceQuoteId),
  }),
)

// Quotes sit before orders in the funnel. Shape deliberately mirrors
// `orders` so `convertQuoteToOrderAction` is a field-for-field copy.
// Terms are immutable after send: once status leaves `draft`, edits
// require cancel + new draft (no revision layer in v1).
export const quotes = pgTable(
  'quotes',
  {
    id: id(),
    // Human-facing ref like OL-Q-2026-04-8F3K. The "Q" segment makes it
    // instantly clear whether a ref a customer reads back to us is a
    // committed order or a pre-sale quote.
    ref: text('ref').notNull().unique(),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    companyId: text('company_id').references(() => companies.id, {
      onDelete: 'set null',
    }),
    // Optional — same role split as orders. Carried through on conversion.
    vehicleSupplierId: text('vehicle_supplier_id').references(
      () => suppliers.id,
      { onDelete: 'restrict' },
    ),
    financeProviderId: text('finance_provider_id').references(
      () => suppliers.id,
      { onDelete: 'restrict' },
    ),
    status: quoteStatus('status').notNull().default('draft'),
    customerType: customerType('customer_type').notNull().default('business'),
    financeType: financeType('finance_type').notNull().default('BCH'),

    // Same jsonb blobs as orders — the editor is shared between the two
    // flows, so the storage shape must be identical.
    vehicle: jsonb('vehicle').$type<VehicleJson>().notNull(),
    options: jsonb('options').$type<OrderOptionJson[]>().notNull().default([]),
    delivery: jsonb('delivery').$type<DeliveryJson>().notNull(),
    pricing: jsonb('pricing').$type<PricingJson>().notNull(),
    finance: jsonb('finance').$type<FinanceJson>().notNull(),
    addons: jsonb('addons').$type<AddonsJson>().notNull(),
    partExchange: jsonb('part_exchange').$type<PartExchangeJson>(),

    // Internal notes (not shown to customer on public quote view).
    notes: text('notes'),
    // Notes shown on the customer-facing /quote/[token] page.
    customerNotes: text('customer_notes'),

    totalAmountPence: integer('total_amount_pence').notNull().default(0),
    monthlyAmountPence: integer('monthly_amount_pence').notNull().default(0),

    // Defaults to now() + 14 days at creation; explicit rather than derived
    // so we can shorten/extend per quote without schema changes.
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    declinedAt: timestamp('declined_at', { withTimezone: true }),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),

    // Set by `convertQuoteToOrderAction`. Null until conversion. We keep the
    // quote row around indefinitely — the customer timeline reads from both.
    // `AnyPgColumn` breaks the TS inference cycle with orders.sourceQuoteId.
    convertedOrderId: text('converted_order_id').references(
      (): AnyPgColumn => orders.id,
      { onDelete: 'set null' },
    ),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    statusIdx: index('quotes_status_idx').on(t.status),
    customerIdx: index('quotes_customer_idx').on(t.customerId),
    createdAtIdx: index('quotes_created_at_idx').on(t.createdAt),
    refIdx: uniqueIndex('quotes_ref_idx').on(t.ref),
    expiresAtIdx: index('quotes_expires_at_idx').on(t.expiresAt),
    convertedOrderIdx: index('quotes_converted_order_idx').on(t.convertedOrderId),
  }),
)

// Public view token for /quote/[token]. One active token per quote: the
// "resend" flow looks up the existing unexpired token and reuses it rather
// than minting a new URL every time. `consumed_at` is reserved for symmetry
// with `signing_tokens`; v1 quote tokens are never consumed (view-only).
export const quoteTokens = pgTable(
  'quote_tokens',
  {
    id: id(),
    quoteId: text('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    tokenIdx: uniqueIndex('quote_tokens_token_idx').on(t.token),
    quoteIdx: index('quote_tokens_quote_idx').on(t.quoteId),
  }),
)

// Phase 10 — Olaris → supplier purchase order.
//
// One row per customer order (partial unique index enforces "one active PO
// per order" while cancelled rows are allowed to coexist for the audit
// trail). Snapshot jsonb (vehicle/options/delivery) is refreshable while
// draft and frozen at send time — after `sent`, this row is the canonical
// record of what Olaris asked the supplier to supply, even if the customer
// order diverges later.
//
// Margin fields are computed and written by the server on every save; the
// rule is:
//   marginPence = customerTotalSnapshotPence - purchaseTotalPence + marginAdjustmentPence
// There is no admin override of marginPence itself — corrections go via
// marginAdjustmentPence + a required note.
export const supplierOrders = pgTable(
  'supplier_orders',
  {
    id: id(),
    // Human-facing ref: OL-PO-YYYY-MM-XXXX. "PO" segment distinguishes from
    // customer orders (OL-YYYY-…) and quotes (OL-Q-YYYY-…).
    ref: text('ref').notNull().unique(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    supplierId: text('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    status: supplierPoStatus('status').notNull().default('draft'),

    // Snapshot of customer-order jsonb fields at PO creation / last refresh.
    // Frozen at send. Supplier sees this, not whatever the customer order
    // currently shows.
    vehicle: jsonb('vehicle').$type<VehicleJson>().notNull(),
    options: jsonb('options').$type<OrderOptionJson[]>().notNull().default([]),
    delivery: jsonb('delivery').$type<DeliveryJson>().notNull(),

    // Purchase-side commercials (what Olaris pays the supplier). Admin-
    // entered; totals + margin are derived server-side on save.
    purchaseNetPence: integer('purchase_net_pence').notNull().default(0),
    purchaseVatRate: integer('purchase_vat_rate').notNull().default(20),
    purchaseVatPence: integer('purchase_vat_pence').notNull().default(0),
    purchaseGrossPence: integer('purchase_gross_pence').notNull().default(0),
    deliveryFeePence: integer('delivery_fee_pence').notNull().default(0),
    onRoadPence: integer('on_road_pence').notNull().default(0),
    purchaseTotalPence: integer('purchase_total_pence').notNull().default(0),

    // Margin snapshot — derived, stored for reporting stability.
    customerTotalSnapshotPence: integer('customer_total_snapshot_pence'),
    marginAdjustmentPence: integer('margin_adjustment_pence').notNull().default(0),
    marginAdjustmentNote: text('margin_adjustment_note'),
    marginPence: integer('margin_pence'),
    // stored as basis points for precision: (margin / customerTotal) × 10000
    marginBps: integer('margin_bps'),

    // Supplier-side refs captured at acknowledge / invoice time
    supplierPoRefReceived: text('supplier_po_ref_received'),
    supplierEtaDate: text('supplier_eta_date'),
    supplierInvoiceRef: text('supplier_invoice_ref'),
    // Supplier invoice capture (Phase 11). All nullable — populated when
    // the supplier's actual invoice arrives. Variance columns are derived
    // server-side on save by deriveInvoice().
    supplierInvoiceDate: text('supplier_invoice_date'),
    supplierInvoiceNetPence: integer('supplier_invoice_net_pence'),
    supplierInvoiceVatPence: integer('supplier_invoice_vat_pence'),
    supplierInvoiceTotalPence: integer('supplier_invoice_total_pence'),
    supplierInvoiceVarianceNetPence: integer('supplier_invoice_variance_net_pence'),
    supplierInvoiceVarianceTotalPence: integer('supplier_invoice_variance_total_pence'),
    supplierInvoiceReceivedAt: timestamp('supplier_invoice_received_at', {
      withTimezone: true,
    }),
    supplierInvoiceNotes: text('supplier_invoice_notes'),

    // Operational notes
    notesToSupplier: text('notes_to_supplier'),
    internalNotes: text('internal_notes'),

    // PDF artefact (set at send)
    pdfBlobUrl: text('pdf_blob_url'),
    pdfSha256: text('pdf_sha256'),

    // Lifecycle stamps
    sentAt: timestamp('sent_at', { withTimezone: true }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),

    createdBy: text('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    refIdx: uniqueIndex('supplier_orders_ref_idx').on(t.ref),
    orderIdx: index('supplier_orders_order_idx').on(t.orderId),
    supplierIdx: index('supplier_orders_supplier_idx').on(t.supplierId),
    statusIdx: index('supplier_orders_status_idx').on(t.status),
    // Partial unique index: at most one non-cancelled PO per customer order.
    // Cancelled rows are free to coexist, preserving audit history.
    oneActivePerOrder: uniqueIndex('supplier_orders_one_active_per_order')
      .on(t.orderId)
      .where(sql`status <> 'cancelled'`),
  }),
)

export const signingTokens = pgTable(
  'signing_tokens',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    // The token itself — 32 bytes, base64url. Indexed for lookup.
    token: text('token').notNull().unique(),
    signerRole: signerRole('signer_role').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    tokenIdx: uniqueIndex('signing_tokens_token_idx').on(t.token),
    orderIdx: index('signing_tokens_order_idx').on(t.orderId),
  }),
)

export const otpCodes = pgTable(
  'otp_codes',
  {
    id: id(),
    signingTokenId: text('signing_token_id')
      .notNull()
      .references(() => signingTokens.id, { onDelete: 'cascade' }),
    // SHA-256 of the 6-digit code. Plaintext never stored.
    codeHash: text('code_hash').notNull(),
    sentToEmail: text('sent_to_email').notNull(),
    method: otpMethod('method').notNull().default('email'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => ({
    tokenIdx: index('otp_codes_token_idx').on(t.signingTokenId),
  }),
)

export const signatures = pgTable(
  'signatures',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    signerRole: signerRole('signer_role').notNull(),
    signerName: text('signer_name').notNull(),
    signerEmail: text('signer_email').notNull(),
    signatureType: signatureType('signature_type').notNull(),
    // Base64 PNG (drawn) or the text string (typed).
    signatureData: text('signature_data').notNull(),
    signedAt: timestamp('signed_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    geoCity: text('geo_city'),
    geoCountry: text('geo_country'),

    // Forensic envelope
    otpMethod: otpMethod('otp_method'),
    otpVerifiedAt: timestamp('otp_verified_at', { withTimezone: true }),
    // SHA-256 hex of the exact PDF bytes presented at sign time.
    documentSha256: text('document_sha256').notNull(),
    // Ed25519 signature (base64) of the documentSha256 by the server key.
    // Lets future readers verify the document was approved by our server.
    serverSignature: text('server_signature').notNull(),
    signingKeyFingerprint: text('signing_key_fingerprint').notNull(),
  },
  (t) => ({
    orderIdx: index('signatures_order_idx').on(t.orderId),
    uniqueRolePerOrder: uniqueIndex('signatures_unique_role_per_order').on(
      t.orderId,
      t.signerRole,
    ),
  }),
)

export const auditEvents = pgTable(
  'audit_events',
  {
    id: id(),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    // Quote-targeted audit rows populate this; order-targeted rows populate
    // `order_id`. A few events on conversion legitimately populate both.
    quoteId: text('quote_id').references(() => quotes.id, { onDelete: 'cascade' }),
    customerId: text('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    actorType: actorType('actor_type').notNull(),
    // For rep actors, userId; for customer actors, signingTokenId; null for system.
    actorId: text('actor_id'),
    eventType: auditEventType('event_type').notNull(),
    // Free-form payload: OTP method, email provider message id, token id, etc.
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    geoCity: text('geo_city'),
    geoCountry: text('geo_country'),
    createdAt: createdAt(),
  },
  (t) => ({
    orderIdx: index('audit_events_order_idx').on(t.orderId),
    quoteIdx: index('audit_events_quote_idx').on(t.quoteId),
    customerIdx: index('audit_events_customer_idx').on(t.customerId),
    eventTypeIdx: index('audit_events_event_type_idx').on(t.eventType),
    createdAtIdx: index('audit_events_created_at_idx').on(t.createdAt),
  }),
)

export const documents = pgTable(
  'documents',
  {
    id: id(),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    customerId: text('customer_id').references(() => customers.id, {
      onDelete: 'cascade',
    }),
    kind: documentKind('kind').notNull(),
    filename: text('filename').notNull(),
    blobUrl: text('blob_url').notNull(),
    sha256: text('sha256').notNull(),
    mimeType: text('mime_type'),
    sizeBytes: integer('size_bytes'),
    uploadedBy: text('uploaded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    uploadedAt: createdAt(),
  },
  (t) => ({
    orderIdx: index('documents_order_idx').on(t.orderId),
    customerIdx: index('documents_customer_idx').on(t.customerId),
    kindIdx: index('documents_kind_idx').on(t.kind),
  }),
)

export const activities = pgTable(
  'activities',
  {
    id: id(),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
    kind: activityKind('kind').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    customerIdx: index('activities_customer_idx').on(t.customerId),
    orderIdx: index('activities_order_idx').on(t.orderId),
    dueDateIdx: index('activities_due_date_idx').on(t.dueDate),
  }),
)

// Reminders for customer signing links. One row per scheduled reminder;
// Vercel Cron sweeps at 07:00 UTC daily, sends any where scheduledFor <= now()
// and sentAt is null.
export const reminderSchedule = pgTable(
  'reminder_schedule',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    kind: text('kind').notNull(), // 'day_3' | 'day_6'
    sentAt: timestamp('sent_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    scheduledIdx: index('reminder_schedule_scheduled_idx').on(t.scheduledFor),
    orderIdx: index('reminder_schedule_order_idx').on(t.orderId),
  }),
)

// Phase 12 — post-delivery NPS capture.
//
// One feedback row per (order, submission). A short-lived token is minted
// at delivery and emailed to the customer +2 days later; clicking it
// lands them on /feedback/[token], scoring submits a row and consumes the
// token (one submission per token). The token is independent of
// signing_tokens — different purpose, different lifecycle.
export const feedbackTokens = pgTable(
  'feedback_tokens',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    tokenIdx: uniqueIndex('feedback_tokens_token_idx').on(t.token),
    orderIdx: index('feedback_tokens_order_idx').on(t.orderId),
  }),
)

export const feedback = pgTable(
  'feedback',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    score: integer('score').notNull(), // 0–10, app-level bounds-checked
    category: feedbackCategory('category').notNull(),
    comment: text('comment'),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    tokenId: text('token_id').references(() => feedbackTokens.id, {
      onDelete: 'set null',
    }),
    // Forensic envelope — same shape as signatures, so customer-submitted
    // NPS has a comparable "who clicked this from where" record.
    ip: text('ip'),
    userAgent: text('user_agent'),
    geoCity: text('geo_city'),
    geoCountry: text('geo_country'),
  },
  (t) => ({
    orderIdx: index('feedback_order_idx').on(t.orderId),
    customerIdx: index('feedback_customer_idx').on(t.customerId),
    submittedAtIdx: index('feedback_submitted_at_idx').on(t.submittedAt),
    categoryIdx: index('feedback_category_idx').on(t.category),
  }),
)

// ─── F-03: leads + drip enrolments + lead events ──────────────────────
//
// One row per captured email. Attribution fields let us trace which
// surface produced the lead (calculator, exit-intent, newsletter, etc.)
// for GA4 reconciliation. marketingOptOut mirrors the customers column
// of the same name — respected by every drip send.
//
// `sourceContext` is a free-form jsonb for per-source context that
// doesn't deserve its own column yet — e.g. the calculator inputs that
// produced a result, or the UTM params the visitor arrived with.
export const leads = pgTable(
  'leads',
  {
    id: id(),
    email: text('email').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    company: text('company'),
    source: leadSource('source').notNull(),
    /** Free-form attribution context captured at creation time. */
    sourceContext: jsonb('source_context').$type<Record<string, unknown>>(),
    /** Suppresses all drip / marketing email. Transactional email (e.g. "your PDF is attached") still sends. */
    marketingOptOut: boolean('marketing_opt_out').notNull().default(false),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    /** URL-safe token for one-click unsubscribe links in every drip email. */
    unsubscribeToken: text('unsubscribe_token')
      .notNull()
      .$defaultFn(() => nanoid(32)),
    /** When this lead converts to a paid customer, stamp the id here. */
    convertedCustomerId: text('converted_customer_id').references(
      (): AnyPgColumn => customers.id,
      { onDelete: 'set null' },
    ),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
    ip: text('ip'),
    userAgent: text('user_agent'),
    geoCity: text('geo_city'),
    geoCountry: text('geo_country'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    // One email can be captured via multiple sources over time. Unique on
    // (email, source) avoids duplicate capture from the same surface
    // while still letting the same person be captured again via a
    // different surface (which tells us something).
    emailSourceIdx: uniqueIndex('leads_email_source_idx').on(t.email, t.source),
    emailIdx: index('leads_email_idx').on(t.email),
    sourceIdx: index('leads_source_idx').on(t.source),
    createdAtIdx: index('leads_created_at_idx').on(t.createdAt),
    unsubTokenIdx: uniqueIndex('leads_unsubscribe_token_idx').on(t.unsubscribeToken),
  }),
)

// Drip-sequence enrolment. One row per scheduled step; mirrors the
// existing reminder_schedule pattern so the cron sweep is the same
// shape. When a step sends, the service inserts the next step's row.
// cancelledAt is stamped when the lead unsubscribes or opts out.
export const dripEnrolments = pgTable(
  'drip_enrolments',
  {
    id: id(),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    /** Sequence identifier from src/lib/drip-sequences.ts (e.g. 'post-excess-mileage-calc'). */
    sequenceId: text('sequence_id').notNull(),
    /** Zero-indexed step within the sequence. */
    step: integer('step').notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    // One row per (lead, sequence, step). Prevents accidental duplicates
    // if the enqueue helper is called twice for the same step.
    uniqueStepIdx: uniqueIndex('drip_enrolments_lead_sequence_step_idx').on(
      t.leadId,
      t.sequenceId,
      t.step,
    ),
    scheduledIdx: index('drip_enrolments_scheduled_idx').on(t.scheduledFor),
    leadIdx: index('drip_enrolments_lead_idx').on(t.leadId),
  }),
)

// Lead audit trail. Same shape as auditEvents but FK to leads — the
// audit_events table is order-centric and doesn't cleanly fit pre-sale
// records. Typed payload via jsonb.
export const leadEvents = pgTable(
  'lead_events',
  {
    id: id(),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    eventType: leadEventType('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: createdAt(),
  },
  (t) => ({
    leadIdx: index('lead_events_lead_idx').on(t.leadId),
    typeIdx: index('lead_events_type_idx').on(t.eventType),
    createdAtIdx: index('lead_events_created_at_idx').on(t.createdAt),
  }),
)

// ─── Relations ─────────────────────────────────────────────────────────────
// Drizzle relations — used for typed joins via db.query.* API.

export const usersRelations = relations(users, ({ many }) => ({
  ordersCreated: many(orders),
  quotesCreated: many(quotes),
  customersCreated: many(customers),
  activities: many(activities),
}))

export const companiesRelations = relations(companies, ({ many, one }) => ({
  customers: many(customers),
  orders: many(orders),
  createdBy: one(users, { fields: [companies.createdBy], references: [users.id] }),
}))

export const customersRelations = relations(customers, ({ many, one }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  orders: many(orders),
  quotes: many(quotes),
  activities: many(activities),
  documents: many(documents),
  createdBy: one(users, { fields: [customers.createdBy], references: [users.id] }),
}))

export const ordersRelations = relations(orders, ({ many, one }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  company: one(companies, { fields: [orders.companyId], references: [companies.id] }),
  // Two separate supplier relations: sourcing the vehicle vs underwriting
  // finance. Both point at the same `suppliers` table but carry different
  // operational meaning.
  vehicleSupplier: one(suppliers, {
    fields: [orders.vehicleSupplierId],
    references: [suppliers.id],
    relationName: 'vehicleSupplier',
  }),
  financeProvider: one(suppliers, {
    fields: [orders.financeProviderId],
    references: [suppliers.id],
    relationName: 'financeProvider',
  }),
  signatures: many(signatures),
  auditEvents: many(auditEvents),
  signingTokens: many(signingTokens),
  activities: many(activities),
  documents: many(documents),
  reminders: many(reminderSchedule),
  supplierOrders: many(supplierOrders),
  // The quote this order was converted from, if any.
  sourceQuote: one(quotes, {
    fields: [orders.sourceQuoteId],
    references: [quotes.id],
    relationName: 'sourceQuote',
  }),
  createdBy: one(users, { fields: [orders.createdBy], references: [users.id] }),
}))

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  company: one(companies, { fields: [quotes.companyId], references: [companies.id] }),
  vehicleSupplier: one(suppliers, {
    fields: [quotes.vehicleSupplierId],
    references: [suppliers.id],
    relationName: 'quoteVehicleSupplier',
  }),
  financeProvider: one(suppliers, {
    fields: [quotes.financeProviderId],
    references: [suppliers.id],
    relationName: 'quoteFinanceProvider',
  }),
  // The order this quote was converted into, if any.
  convertedOrder: one(orders, {
    fields: [quotes.convertedOrderId],
    references: [orders.id],
    relationName: 'sourceQuote',
  }),
  tokens: many(quoteTokens),
  auditEvents: many(auditEvents),
  createdBy: one(users, { fields: [quotes.createdBy], references: [users.id] }),
}))

export const quoteTokensRelations = relations(quoteTokens, ({ one }) => ({
  quote: one(quotes, { fields: [quoteTokens.quoteId], references: [quotes.id] }),
}))

export const suppliersRelations = relations(suppliers, ({ many, one }) => ({
  vehicleSupplierOrders: many(orders, { relationName: 'vehicleSupplier' }),
  financeProviderOrders: many(orders, { relationName: 'financeProvider' }),
  vehicleSupplierQuotes: many(quotes, { relationName: 'quoteVehicleSupplier' }),
  financeProviderQuotes: many(quotes, { relationName: 'quoteFinanceProvider' }),
  supplierOrders: many(supplierOrders),
  createdBy: one(users, { fields: [suppliers.createdBy], references: [users.id] }),
}))

export const supplierOrdersRelations = relations(supplierOrders, ({ one }) => ({
  order: one(orders, {
    fields: [supplierOrders.orderId],
    references: [orders.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierOrders.supplierId],
    references: [suppliers.id],
  }),
  createdBy: one(users, {
    fields: [supplierOrders.createdBy],
    references: [users.id],
  }),
}))

export const signingTokensRelations = relations(signingTokens, ({ one, many }) => ({
  order: one(orders, { fields: [signingTokens.orderId], references: [orders.id] }),
  otpCodes: many(otpCodes),
}))

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  signingToken: one(signingTokens, {
    fields: [otpCodes.signingTokenId],
    references: [signingTokens.id],
  }),
}))

export const signaturesRelations = relations(signatures, ({ one }) => ({
  order: one(orders, { fields: [signatures.orderId], references: [orders.id] }),
}))

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  order: one(orders, { fields: [auditEvents.orderId], references: [orders.id] }),
  quote: one(quotes, { fields: [auditEvents.quoteId], references: [quotes.id] }),
  customer: one(customers, {
    fields: [auditEvents.customerId],
    references: [customers.id],
  }),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  customer: one(customers, {
    fields: [activities.customerId],
    references: [customers.id],
  }),
  order: one(orders, { fields: [activities.orderId], references: [orders.id] }),
  createdBy: one(users, { fields: [activities.createdBy], references: [users.id] }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  order: one(orders, { fields: [documents.orderId], references: [orders.id] }),
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  uploadedBy: one(users, { fields: [documents.uploadedBy], references: [users.id] }),
}))

export const reminderScheduleRelations = relations(reminderSchedule, ({ one }) => ({
  order: one(orders, { fields: [reminderSchedule.orderId], references: [orders.id] }),
}))

export const feedbackRelations = relations(feedback, ({ one }) => ({
  order: one(orders, { fields: [feedback.orderId], references: [orders.id] }),
  customer: one(customers, {
    fields: [feedback.customerId],
    references: [customers.id],
  }),
  token: one(feedbackTokens, {
    fields: [feedback.tokenId],
    references: [feedbackTokens.id],
  }),
}))

export const feedbackTokensRelations = relations(feedbackTokens, ({ one }) => ({
  order: one(orders, { fields: [feedbackTokens.orderId], references: [orders.id] }),
  customer: one(customers, {
    fields: [feedbackTokens.customerId],
    references: [customers.id],
  }),
}))

export const leadsRelations = relations(leads, ({ many, one }) => ({
  events: many(leadEvents),
  dripEnrolments: many(dripEnrolments),
  convertedCustomer: one(customers, {
    fields: [leads.convertedCustomerId],
    references: [customers.id],
  }),
}))

export const dripEnrolmentsRelations = relations(dripEnrolments, ({ one }) => ({
  lead: one(leads, { fields: [dripEnrolments.leadId], references: [leads.id] }),
}))

export const leadEventsRelations = relations(leadEvents, ({ one }) => ({
  lead: one(leads, { fields: [leadEvents.leadId], references: [leads.id] }),
}))

// ─── Inferred types (for use across the app) ──────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
export type SupplierKind = (typeof supplierKind.enumValues)[number]
export type SupplierOrder = typeof supplierOrders.$inferSelect
export type NewSupplierOrder = typeof supplierOrders.$inferInsert
export type SupplierPoStatus = (typeof supplierPoStatus.enumValues)[number]
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert
export type QuoteStatus = (typeof quoteStatus.enumValues)[number]
export type QuoteToken = typeof quoteTokens.$inferSelect
export type NewQuoteToken = typeof quoteTokens.$inferInsert
export type Signature = typeof signatures.$inferSelect
export type NewSignature = typeof signatures.$inferInsert
export type AuditEvent = typeof auditEvents.$inferSelect
export type NewAuditEvent = typeof auditEvents.$inferInsert
export type SigningToken = typeof signingTokens.$inferSelect
export type OtpCode = typeof otpCodes.$inferSelect
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert
export type ReminderSchedule = typeof reminderSchedule.$inferSelect
export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert
export type FeedbackCategory = (typeof feedbackCategory.enumValues)[number]
export type FeedbackToken = typeof feedbackTokens.$inferSelect
export type NewFeedbackToken = typeof feedbackTokens.$inferInsert
export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type LeadSource = (typeof leadSource.enumValues)[number]
export type DripEnrolment = typeof dripEnrolments.$inferSelect
export type NewDripEnrolment = typeof dripEnrolments.$inferInsert
export type LeadEvent = typeof leadEvents.$inferSelect
export type NewLeadEvent = typeof leadEvents.$inferInsert
export type LeadEventType = (typeof leadEventType.enumValues)[number]
