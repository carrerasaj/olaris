/**
 * Pure helpers for the supplier purchase order.
 *
 * This module is the single source of truth for:
 *   - reconciling customer-order jsonb into a draft PO snapshot
 *   - deriving purchase totals + margin from admin-entered inputs
 *   - margin rule (see below)
 *
 * All functions are pure — they take data, return data. The server actions
 * in src/app/admin/actions/supplier-po.ts handle DB writes, auth, audit,
 * and cache invalidation.
 *
 * MARGIN RULE (canonical — do not reimplement anywhere else):
 *
 *   purchaseVatPence   = round(purchaseNetPence * purchaseVatRate / 100)
 *   purchaseGrossPence = purchaseNetPence + purchaseVatPence
 *   purchaseTotalPence = purchaseGrossPence + deliveryFeePence + onRoadPence
 *
 *   marginPence = (customerTotalSnapshotPence ?? 0)
 *                 - purchaseTotalPence
 *                 + marginAdjustmentPence
 *
 *   marginBps = customerTotalSnapshotPence > 0
 *               ? round(marginPence / customerTotalSnapshotPence * 10000)
 *               : null
 *
 * `marginAdjustmentPence` is the ONLY admin-enterable margin input. There
 * is no override of `marginPence` itself — corrections always flow via the
 * adjustment + a required note, so the derivation chain stays reproducible.
 */

import type {
  Order,
  NewSupplierOrder,
  SupplierOrder,
  VehicleJson,
  OrderOptionJson,
  DeliveryJson,
} from '@/db/schema'

export type { VehicleJson, OrderOptionJson, DeliveryJson }

// ─── Inputs admin can edit on a draft PO ────────────────────────────────

export interface PurchaseInputs {
  purchaseNetPence: number
  purchaseVatRate: number
  deliveryFeePence: number
  onRoadPence: number
  marginAdjustmentPence: number
}

export interface DerivedTotals {
  purchaseVatPence: number
  purchaseGrossPence: number
  purchaseTotalPence: number
  marginPence: number | null
  marginBps: number | null
}

/**
 * Derive all stored totals from the admin inputs + the customer snapshot
 * (if known — it's null on draft, set at send time). Pure; never throws.
 */
export function deriveTotals(
  inputs: PurchaseInputs,
  customerTotalSnapshotPence: number | null,
): DerivedTotals {
  const net = Math.max(0, Math.round(inputs.purchaseNetPence))
  const rate = Math.max(0, Math.round(inputs.purchaseVatRate))
  const deliveryFee = Math.max(0, Math.round(inputs.deliveryFeePence))
  const onRoad = Math.max(0, Math.round(inputs.onRoadPence))
  const adjustment = Math.round(inputs.marginAdjustmentPence) // signed

  const purchaseVatPence = Math.round((net * rate) / 100)
  const purchaseGrossPence = net + purchaseVatPence
  const purchaseTotalPence = purchaseGrossPence + deliveryFee + onRoad

  let marginPence: number | null = null
  let marginBps: number | null = null
  if (customerTotalSnapshotPence !== null) {
    marginPence = customerTotalSnapshotPence - purchaseTotalPence + adjustment
    if (customerTotalSnapshotPence > 0) {
      marginBps = Math.round((marginPence / customerTotalSnapshotPence) * 10000)
    } else {
      marginBps = null
    }
  }

  return {
    purchaseVatPence,
    purchaseGrossPence,
    purchaseTotalPence,
    marginPence,
    marginBps,
  }
}

// ─── Reconciliation ──────────────────────────────────────────────────────

export interface SnapshotFromOrder {
  vehicle: VehicleJson
  options: OrderOptionJson[]
  delivery: DeliveryJson
}

/**
 * Build the jsonb snapshot fields from a customer order. Used both on
 * initial PO creation and on `refreshDraftSnapshot`.
 */
export function snapshotFromOrder(order: Order): SnapshotFromOrder {
  return {
    vehicle: order.vehicle,
    options: order.options,
    delivery: order.delivery,
  }
}

/**
 * Assemble the NewSupplierOrder payload for inserting a fresh draft. The
 * purchase-side commercials start at zero — admin enters them on the draft
 * form. Customer total snapshot is null until send time; margin is
 * therefore also null on fresh drafts.
 */
export function buildDraftPOFromOrder(args: {
  order: Order
  supplierId: string
  ref: string
  createdBy: string
}): NewSupplierOrder {
  const snap = snapshotFromOrder(args.order)
  const initialInputs: PurchaseInputs = {
    purchaseNetPence: 0,
    purchaseVatRate: 20,
    deliveryFeePence: 0,
    onRoadPence: 0,
    marginAdjustmentPence: 0,
  }
  const derived = deriveTotals(initialInputs, null)
  return {
    ref: args.ref,
    orderId: args.order.id,
    supplierId: args.supplierId,
    status: 'draft',
    vehicle: snap.vehicle,
    options: snap.options,
    delivery: snap.delivery,
    purchaseNetPence: initialInputs.purchaseNetPence,
    purchaseVatRate: initialInputs.purchaseVatRate,
    purchaseVatPence: derived.purchaseVatPence,
    purchaseGrossPence: derived.purchaseGrossPence,
    deliveryFeePence: initialInputs.deliveryFeePence,
    onRoadPence: initialInputs.onRoadPence,
    purchaseTotalPence: derived.purchaseTotalPence,
    customerTotalSnapshotPence: null,
    marginAdjustmentPence: initialInputs.marginAdjustmentPence,
    marginAdjustmentNote: null,
    marginPence: derived.marginPence,
    marginBps: derived.marginBps,
    createdBy: args.createdBy,
  }
}

// ─── Diffing snapshots for audit payloads ───────────────────────────────

/**
 * Shallow-ish diff of two snapshots. Returns the list of fields that
 * changed, with before/after values. Used by the "refresh snapshot" audit
 * event so the trail shows exactly what moved.
 */
export function diffSnapshots(
  before: SnapshotFromOrder,
  after: SnapshotFromOrder,
): Record<string, { from: unknown; to: unknown }> {
  const changed: Record<string, { from: unknown; to: unknown }> = {}
  const beforeVehicle = before.vehicle as unknown as Record<string, unknown>
  const afterVehicle = after.vehicle as unknown as Record<string, unknown>
  for (const key of Object.keys(afterVehicle)) {
    if (beforeVehicle[key] !== afterVehicle[key]) {
      changed[`vehicle.${key}`] = { from: beforeVehicle[key], to: afterVehicle[key] }
    }
  }
  const beforeDelivery = before.delivery as unknown as Record<string, unknown>
  const afterDelivery = after.delivery as unknown as Record<string, unknown>
  for (const key of Object.keys(afterDelivery)) {
    if (beforeDelivery[key] !== afterDelivery[key]) {
      changed[`delivery.${key}`] = { from: beforeDelivery[key], to: afterDelivery[key] }
    }
  }
  if (JSON.stringify(before.options) !== JSON.stringify(after.options)) {
    changed.options = { from: before.options, to: after.options }
  }
  return changed
}

// ─── Status guards ───────────────────────────────────────────────────────

/**
 * Can admin edit the purchase-side commercials on this PO? Only while
 * it's still a draft. After `sent` the PO is the frozen record of what
 * Olaris asked of the supplier.
 */
export function isEditable(po: Pick<SupplierOrder, 'status'>): boolean {
  return po.status === 'draft'
}

export function isCancellable(po: Pick<SupplierOrder, 'status'>): boolean {
  return po.status !== 'cancelled'
}
