'use server'

/**
 * Admin server actions for suppliers.
 *
 * Split vs combined roles: the `suppliers` table carries both
 * vehicle-sourcing parties (dealers, brokers, OEM partners, importers)
 * and finance underwriters (funders). Orders reference them via two
 * distinct FKs — `vehicle_supplier_id` and `finance_provider_id` —
 * rather than a single `supplier_id`. That split is intentional: a
 * party like Leasys UK Ltd is a funder (never sources vehicles), a
 * party like Van Choices is a dealer (never underwrites finance). The
 * UI surfaces them separately; this action file doesn't care.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import {
  db,
  suppliers,
  orders,
  auditEvents,
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { supplierCreateSchema } from '@/lib/validation'

export interface ActionResult {
  ok: boolean
  error?: string
  issues?: { path: string; message: string }[]
  id?: string
}

function formToObject(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [k, v] of form.entries()) {
    obj[k] = typeof v === 'string' ? v : undefined
  }
  return obj
}

function coerceSupplierPayload(form: FormData) {
  const raw = formToObject(form)
  const str = (k: string) => {
    const v = raw[k]
    return typeof v === 'string' && v.trim() ? v.trim() : null
  }
  return {
    kind: raw['kind'] as 'dealer' | 'broker' | 'oem_partner' | 'importer' | 'funder',
    legalName: (raw['legalName'] as string) ?? '',
    tradingName: str('tradingName'),
    primaryContactName: (raw['primaryContactName'] as string) ?? '',
    primaryContactEmail: ((raw['primaryContactEmail'] as string) ?? '').toLowerCase(),
    primaryContactPhone: str('primaryContactPhone'),
    website: str('website'),
    addressLine1: str('addressLine1'),
    addressLine2: str('addressLine2'),
    addressCity: str('addressCity'),
    addressPostcode: str('addressPostcode'),
    addressCountry: str('addressCountry'),
    notes: str('notes'),
  }
}

// ─── create ────────────────────────────────────────────────────────────────

export async function createSupplierAction(form: FormData): Promise<ActionResult> {
  const user = await requireAdmin()
  const parsed = supplierCreateSchema.safeParse(coerceSupplierPayload(form))
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }
  const input = parsed.data

  const [row] = await db
    .insert(suppliers)
    .values({
      kind: input.kind,
      legalName: input.legalName,
      tradingName: input.tradingName ?? null,
      primaryContactName: input.primaryContactName,
      primaryContactEmail: input.primaryContactEmail,
      primaryContactPhone: input.primaryContactPhone ?? null,
      website: input.website ?? null,
      addressLine1: input.addressLine1 ?? null,
      addressLine2: input.addressLine2 ?? null,
      addressCity: input.addressCity ?? null,
      addressPostcode: input.addressPostcode ?? null,
      addressCountry: input.addressCountry ?? null,
      notes: input.notes ?? null,
      createdBy: user.id,
    })
    .returning({ id: suppliers.id })

  await db.insert(auditEvents).values({
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier.created',
    payload: { supplierId: row.id, kind: input.kind, legalName: input.legalName },
  })

  revalidatePath('/admin/suppliers')
  redirect(`/admin/suppliers/${row.id}`)
}

// ─── update ────────────────────────────────────────────────────────────────

export async function updateSupplierAction(
  supplierId: string,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin()
  const parsed = supplierCreateSchema.safeParse(coerceSupplierPayload(form))
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }
  const input = parsed.data

  const existing = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(eq(suppliers.id, supplierId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Supplier not found' }

  await db
    .update(suppliers)
    .set({
      kind: input.kind,
      legalName: input.legalName,
      tradingName: input.tradingName ?? null,
      primaryContactName: input.primaryContactName,
      primaryContactEmail: input.primaryContactEmail,
      primaryContactPhone: input.primaryContactPhone ?? null,
      website: input.website ?? null,
      addressLine1: input.addressLine1 ?? null,
      addressLine2: input.addressLine2 ?? null,
      addressCity: input.addressCity ?? null,
      addressPostcode: input.addressPostcode ?? null,
      addressCountry: input.addressCountry ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(suppliers.id, supplierId))

  await db.insert(auditEvents).values({
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier.updated',
    payload: { supplierId, legalName: input.legalName },
  })

  revalidatePath(`/admin/suppliers/${supplierId}`)
  revalidatePath('/admin/suppliers')
  redirect(`/admin/suppliers/${supplierId}`)
}

// ─── deactivate / reactivate ───────────────────────────────────────────────
// Soft-toggle only. Never delete: FK constraints on orders prevent removing
// a supplier that's been assigned to any order, and we want that — the
// audit trail on historic orders must keep pointing at a real row.

export async function setSupplierActiveAction(
  supplierId: string,
  active: boolean,
): Promise<ActionResult> {
  const user = await requireAdmin()
  await db
    .update(suppliers)
    .set({ active, updatedAt: new Date() })
    .where(eq(suppliers.id, supplierId))
  await db.insert(auditEvents).values({
    actorType: 'rep',
    actorId: user.id,
    eventType: active ? 'supplier.reactivated' : 'supplier.deactivated',
    payload: { supplierId },
  })
  revalidatePath(`/admin/suppliers/${supplierId}`)
  revalidatePath('/admin/suppliers')
  return { ok: true, id: supplierId }
}

// ─── Assign / clear on an order ────────────────────────────────────────────
// Both columns are nullable. Passing `null` clears the assignment. Writes
// go via these helpers (not direct UPDATEs) so the audit trail captures
// who set what and when.

async function setOrderSupplierField(
  field: 'vehicleSupplierId' | 'financeProviderId',
  orderId: string,
  supplierId: string | null,
): Promise<ActionResult> {
  const user = await requireAdmin()

  const orderRows = await db
    .select({
      id: orders.id,
      status: orders.status,
      customerId: orders.customerId,
      vehicleSupplierId: orders.vehicleSupplierId,
      financeProviderId: orders.financeProviderId,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (orderRows.length === 0) return { ok: false, error: 'Order not found' }
  const order = orderRows[0]

  // Legitimately allow change at any order status — supplier is operational,
  // not part of the signed contract. If an order's already signed and we
  // later discover a different vehicle source, updating this field doesn't
  // alter the legally-bound vehicle spec; it just records procurement truth.

  if (supplierId) {
    const supplierRows = await db
      .select({ id: suppliers.id, kind: suppliers.kind, active: suppliers.active })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1)
    if (supplierRows.length === 0) {
      return { ok: false, error: 'Supplier not found' }
    }
    if (!supplierRows[0].active) {
      return { ok: false, error: 'Supplier is deactivated and cannot be assigned' }
    }
    // Sanity check kind vs role. Funders should be finance; dealers should
    // be vehicle. Not blocking (you may want a dealer-funder edge case) —
    // we warn in the UI but this action allows anything.
  }

  const previousId =
    field === 'vehicleSupplierId'
      ? order.vehicleSupplierId
      : order.financeProviderId

  await db
    .update(orders)
    .set({
      [field]: supplierId,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))

  await db.insert(auditEvents).values({
    orderId,
    customerId: order.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType:
      field === 'vehicleSupplierId'
        ? 'order.vehicle_supplier_set'
        : 'order.finance_provider_set',
    payload: { previousId, newId: supplierId },
  })

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  return { ok: true, id: orderId }
}

export async function setOrderVehicleSupplierAction(
  orderId: string,
  supplierId: string | null,
): Promise<ActionResult> {
  return setOrderSupplierField('vehicleSupplierId', orderId, supplierId)
}

export async function setOrderFinanceProviderAction(
  orderId: string,
  supplierId: string | null,
): Promise<ActionResult> {
  return setOrderSupplierField('financeProviderId', orderId, supplierId)
}
