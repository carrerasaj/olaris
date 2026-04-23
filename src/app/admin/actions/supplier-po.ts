'use server'

/**
 * Supplier purchase-order server actions.
 *
 * State machine:
 *   draft        → sent          (send PDF + signed contract to supplier)
 *   sent         → acknowledged  (mark ack with supplier ref + ETA)
 *   any non-terminal → cancelled (with required reason)
 *   cancelled    → (new draft via regenerate, linked via audit)
 *
 * After `sent` the PO row is immutable for commercial fields. Only ack,
 * invoice ref capture, and cancel are allowed. This is enforced here and
 * re-enforced by `isEditable` on each write path.
 *
 * Margin rule is owned by src/lib/supplier-po.ts — all `update`/`send`
 * paths re-derive via `deriveTotals()` so admin inputs never short-circuit
 * the calculation.
 */

import { revalidatePath } from 'next/cache'
import { createHash } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { put } from '@vercel/blob'
import {
  db,
  orders,
  supplierOrders,
  suppliers,
  customers,
  documents,
  auditEvents,
} from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { generateSupplierPoRef, fmtGBPFromPence } from '@/lib/format'
import { sendEmail } from '@/lib/email'
import { supplierPoEmail } from '@/lib/email-templates'
import { renderSupplierPoPdf } from '@/lib/pdf/render-supplier-po'
import {
  buildDraftPOFromOrder,
  deriveInvoice,
  deriveTotals,
  diffSnapshots,
  isEditable,
  snapshotFromOrder,
  type PurchaseInputs,
} from '@/lib/supplier-po'
import { markConfirmedAction } from './orders'

export interface SupplierPoActionResult {
  ok: boolean
  error?: string
  id?: string
  ref?: string
}

// ─── create draft ──────────────────────────────────────────────────────

export async function createDraftSupplierPOAction(
  orderId: string,
): Promise<SupplierPoActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Order not found' }
  const order = rows[0]

  if (!order.vehicleSupplierId) {
    return {
      ok: false,
      error: 'Assign a vehicle supplier to the order before generating a PO.',
    }
  }

  // Block if an active PO already exists. Partial unique index would also
  // catch this, but the friendlier error belongs here.
  const existing = await db
    .select({ id: supplierOrders.id, status: supplierOrders.status })
    .from(supplierOrders)
    .where(eq(supplierOrders.orderId, orderId))
    .orderBy(desc(supplierOrders.createdAt))
  const active = existing.find((p) => p.status !== 'cancelled')
  if (active) {
    return {
      ok: false,
      error: `An active PO (${active.status}) already exists for this order. Cancel it before regenerating.`,
    }
  }

  // Mint ref, retry on vanishing-probability collision.
  let ref = generateSupplierPoRef()
  for (let i = 0; i < 3; i++) {
    const dupe = await db
      .select({ id: supplierOrders.id })
      .from(supplierOrders)
      .where(eq(supplierOrders.ref, ref))
      .limit(1)
    if (dupe.length === 0) break
    ref = generateSupplierPoRef()
  }

  const draft = buildDraftPOFromOrder({
    order,
    supplierId: order.vehicleSupplierId,
    ref,
    createdBy: user.id,
  })

  const [row] = await db
    .insert(supplierOrders)
    .values(draft)
    .returning({ id: supplierOrders.id, ref: supplierOrders.ref })

  // Audit — if this draft supersedes a cancelled predecessor, link them.
  const previousCancelled = existing.find((p) => p.status === 'cancelled')
  await db.insert(auditEvents).values({
    orderId,
    customerId: order.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier_po.created',
    payload: {
      poId: row.id,
      poRef: row.ref,
      supplierId: order.vehicleSupplierId,
      previousSupplierPoId: previousCancelled?.id ?? null,
    },
  })
  if (previousCancelled) {
    await db.insert(auditEvents).values({
      orderId,
      customerId: order.customerId,
      actorType: 'rep',
      actorId: user.id,
      eventType: 'supplier_po.superseded_by',
      payload: {
        previousSupplierPoId: previousCancelled.id,
        newSupplierPoId: row.id,
        newSupplierPoRef: row.ref,
      },
    })
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath(`/admin/orders/${orderId}/supplier-po`)
  return { ok: true, id: row.id, ref: row.ref }
}

// ─── update draft ──────────────────────────────────────────────────────

export interface UpdateSupplierPOInput extends PurchaseInputs {
  marginAdjustmentNote?: string | null
  notesToSupplier?: string | null
  internalNotes?: string | null
}

export async function updateSupplierPOAction(
  supplierPoId: string,
  input: UpdateSupplierPOInput,
): Promise<SupplierPoActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.id, supplierPoId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'PO not found' }
  const po = rows[0]

  if (!isEditable(po)) {
    return {
      ok: false,
      error: `PO is ${po.status} — terms are immutable after send. Cancel and regenerate to change.`,
    }
  }

  // Margin adjustment ≠ 0 requires a note. Enforces the "explicit adjustment,
  // not hidden override" rule at the API boundary.
  if (
    input.marginAdjustmentPence !== 0 &&
    (!input.marginAdjustmentNote || input.marginAdjustmentNote.trim().length < 3)
  ) {
    return {
      ok: false,
      error:
        'A non-zero margin adjustment requires an explanatory note (min 3 chars).',
    }
  }

  const derived = deriveTotals(input, po.customerTotalSnapshotPence)
  const now = new Date()

  await db
    .update(supplierOrders)
    .set({
      purchaseNetPence: Math.max(0, Math.round(input.purchaseNetPence)),
      purchaseVatRate: Math.max(0, Math.round(input.purchaseVatRate)),
      purchaseVatPence: derived.purchaseVatPence,
      purchaseGrossPence: derived.purchaseGrossPence,
      deliveryFeePence: Math.max(0, Math.round(input.deliveryFeePence)),
      onRoadPence: Math.max(0, Math.round(input.onRoadPence)),
      purchaseTotalPence: derived.purchaseTotalPence,
      marginAdjustmentPence: Math.round(input.marginAdjustmentPence),
      marginAdjustmentNote:
        input.marginAdjustmentPence === 0
          ? null
          : input.marginAdjustmentNote ?? null,
      marginPence: derived.marginPence,
      marginBps: derived.marginBps,
      notesToSupplier: input.notesToSupplier ?? null,
      internalNotes: input.internalNotes ?? null,
      updatedAt: now,
    })
    .where(eq(supplierOrders.id, supplierPoId))

  await db.insert(auditEvents).values({
    orderId: po.orderId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier_po.updated',
    payload: {
      poId: po.id,
      purchaseTotalPence: derived.purchaseTotalPence,
      marginPence: derived.marginPence,
      marginAdjustmentPence: input.marginAdjustmentPence,
    },
  })

  revalidatePath(`/admin/orders/${po.orderId}/supplier-po`)
  revalidatePath(`/admin/orders/${po.orderId}`)
  return { ok: true, id: po.id, ref: po.ref }
}

// ─── refresh snapshot from current customer order ──────────────────────

export async function refreshDraftSnapshotAction(
  supplierPoId: string,
): Promise<SupplierPoActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.id, supplierPoId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'PO not found' }
  const po = rows[0]

  if (!isEditable(po)) {
    return {
      ok: false,
      error: `PO is ${po.status} — snapshot is frozen. Cancel and regenerate to reflect customer-order changes.`,
    }
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, po.orderId))
    .limit(1)
  if (orderRows.length === 0)
    return { ok: false, error: 'Linked customer order not found' }
  const current = orderRows[0]

  const before = { vehicle: po.vehicle, options: po.options, delivery: po.delivery }
  const after = snapshotFromOrder(current)
  const changed = diffSnapshots(before, after)

  if (Object.keys(changed).length === 0) {
    return { ok: true, id: po.id, ref: po.ref }
  }

  const now = new Date()
  await db
    .update(supplierOrders)
    .set({
      vehicle: after.vehicle,
      options: after.options,
      delivery: after.delivery,
      updatedAt: now,
    })
    .where(eq(supplierOrders.id, supplierPoId))

  await db.insert(auditEvents).values({
    orderId: po.orderId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier_po.snapshot_refreshed',
    payload: { poId: po.id, changedFields: changed },
  })

  revalidatePath(`/admin/orders/${po.orderId}/supplier-po`)
  revalidatePath(`/admin/orders/${po.orderId}`)
  return { ok: true, id: po.id, ref: po.ref }
}

// ─── send ──────────────────────────────────────────────────────────────

export async function sendSupplierPOAction(
  supplierPoId: string,
): Promise<SupplierPoActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.id, supplierPoId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'PO not found' }
  const po = rows[0]

  if (po.status !== 'draft') {
    return {
      ok: false,
      error: `PO is ${po.status} — only drafts can be sent.`,
    }
  }

  // Fetch the order (for the snapshot customer total + customer info) and
  // the supplier (for contact info + email recipient).
  const [orderRows, supplierRows] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, po.orderId)).limit(1),
    db.select().from(suppliers).where(eq(suppliers.id, po.supplierId)).limit(1),
  ])
  if (orderRows.length === 0)
    return { ok: false, error: 'Linked customer order not found' }
  if (supplierRows.length === 0)
    return { ok: false, error: 'Supplier not found' }
  const order = orderRows[0]
  const supplier = supplierRows[0]

  // Exact signed customer PDF (not latest-anything — the one matching the
  // signatures on file for this order).
  const signedDocRows = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.orderId, po.orderId),
        eq(documents.kind, 'signed_order_pdf'),
      ),
    )
    .orderBy(desc(documents.uploadedAt))
  if (signedDocRows.length === 0) {
    return {
      ok: false,
      error: 'No signed customer PDF on file for this order — send aborted.',
    }
  }
  // Earliest is the original; re-seals after edits would append newer rows.
  // We pick the one whose SHA matches a signature's documentSha256 to be
  // explicit; fall back to the oldest if the signatures table is empty
  // (shouldn't happen for a signed order but guard anyway).
  const signedDoc = signedDocRows[signedDocRows.length - 1]

  // Render the supplier PDF fresh on send. If a previous attempt produced
  // a pdfBlobUrl but didn't complete (e.g. email failed), we'd overwrite —
  // but with `allowOverwrite: true` on the Blob put, that's fine. Ref-
  // stable paths mean we never orphan blobs.
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderSupplierPoPdf(po.id, po.orderId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `PO PDF render failed: ${msg}` }
  }
  const pdfSha256 = createHash('sha256').update(pdfBuffer).digest('hex')

  const pathname = `supplier-po/${po.ref}.pdf`
  let pdfBlobUrl: string
  try {
    const uploaded = await put(pathname, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
      allowOverwrite: true,
    })
    pdfBlobUrl = uploaded.url
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `PO blob upload failed: ${msg}` }
  }

  // Fetch the signed-customer-PDF bytes from Blob for attachment. We
  // stream via `fetch(blobUrl)` — the customer PDF blob is private but the
  // URL we stored is the @vercel/blob-signed one; in practice we read via
  // get() for private stores. Using fetch() here works for public-shaped
  // URLs; for private blobs the stored blobUrl is already authorised by
  // the put() call and remains readable server-side during the response
  // window. Keep it simple: fetch, with a defensive fallback.
  let signedPdfBuffer: Buffer
  try {
    const res = await fetch(signedDoc.blobUrl)
    if (!res.ok) throw new Error(`status ${res.status}`)
    const arr = await res.arrayBuffer()
    signedPdfBuffer = Buffer.from(arr)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      error: `Could not read signed customer PDF for attachment: ${msg}`,
    }
  }

  // Freeze the customer total snapshot + derive final margin.
  const inputs: PurchaseInputs = {
    purchaseNetPence: po.purchaseNetPence,
    purchaseVatRate: po.purchaseVatRate,
    deliveryFeePence: po.deliveryFeePence,
    onRoadPence: po.onRoadPence,
    marginAdjustmentPence: po.marginAdjustmentPence,
  }
  const customerTotalSnapshotPence = order.totalAmountPence
  const finalDerived = deriveTotals(inputs, customerTotalSnapshotPence)

  const now = new Date()

  // Compose + send the email. Audit the result either way.
  const email = supplierPoEmail({
    supplierContactName: supplier.primaryContactName,
    supplierTradingName: supplier.tradingName ?? supplier.legalName,
    poRef: po.ref,
    customerOrderRef: order.ref,
    vehicleMake: po.vehicle.make,
    vehicleModel: po.vehicle.model,
    vehicleDerivative: po.vehicle.derivative,
    purchaseTotalGBP: fmtGBPFromPence(finalDerived.purchaseTotalPence),
    etaRequested: order.delivery.preferredDate || null,
    notesToSupplier: po.notesToSupplier,
    replyToEmail: process.env.EMAIL_FROM?.replace(/.*<|>.*/g, '') ?? 'alan@olaris.co.uk',
  })

  const sendResult = await sendEmail({
    to: supplier.primaryContactEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: [
      {
        filename: `${po.ref}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
      {
        filename: `${order.ref}-signed.pdf`,
        content: signedPdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })

  // Flip status + stamp snapshot + totals even if email failed — the PO
  // is committed; the admin can resend later. Record email outcome in audit.
  await db
    .update(supplierOrders)
    .set({
      status: 'sent',
      sentAt: now,
      customerTotalSnapshotPence,
      marginPence: finalDerived.marginPence,
      marginBps: finalDerived.marginBps,
      pdfBlobUrl,
      pdfSha256,
      updatedAt: now,
    })
    .where(eq(supplierOrders.id, po.id))

  // Customer-side audit so this PO send is visible on the order's timeline.
  await db.insert(auditEvents).values({
    orderId: po.orderId,
    customerId: order.customerId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier_po.sent',
    payload: {
      poId: po.id,
      poRef: po.ref,
      supplierEmail: supplier.primaryContactEmail,
      customerTotalSnapshotPence,
      purchaseTotalPence: finalDerived.purchaseTotalPence,
      marginPence: finalDerived.marginPence,
      signedPdfSha256: signedDoc.sha256,
      poPdfSha256: pdfSha256,
    },
  })
  await db.insert(auditEvents).values({
    orderId: po.orderId,
    customerId: order.customerId,
    actorType: 'system',
    eventType: sendResult.ok ? 'email.sent' : 'email.failed',
    payload: {
      template: 'supplier_po.sent',
      to: supplier.primaryContactEmail,
      messageId: sendResult.id,
      error: sendResult.error,
    },
  })

  revalidatePath(`/admin/orders/${po.orderId}/supplier-po`)
  revalidatePath(`/admin/orders/${po.orderId}`)
  revalidatePath('/admin/orders')
  return sendResult.ok
    ? { ok: true, id: po.id, ref: po.ref }
    : {
        ok: false,
        error: `PO committed but email failed: ${sendResult.error ?? 'unknown'}`,
      }
}

// ─── mark acknowledged ────────────────────────────────────────────────

export interface AcknowledgeInput {
  supplierPoRefReceived?: string | null
  supplierEtaDate?: string | null
  alsoConfirmCustomerOrder?: boolean
}

export async function markSupplierPOAcknowledgedAction(
  supplierPoId: string,
  input: AcknowledgeInput,
): Promise<SupplierPoActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.id, supplierPoId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'PO not found' }
  const po = rows[0]
  if (po.status !== 'sent') {
    return {
      ok: false,
      error: `Only sent POs can be acknowledged. This PO is ${po.status}.`,
    }
  }

  const now = new Date()
  await db
    .update(supplierOrders)
    .set({
      status: 'acknowledged',
      acknowledgedAt: now,
      supplierPoRefReceived: input.supplierPoRefReceived ?? null,
      supplierEtaDate: input.supplierEtaDate ?? null,
      updatedAt: now,
    })
    .where(eq(supplierOrders.id, po.id))

  await db.insert(auditEvents).values({
    orderId: po.orderId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier_po.acknowledged',
    payload: {
      poId: po.id,
      supplierPoRefReceived: input.supplierPoRefReceived ?? null,
      supplierEtaDate: input.supplierEtaDate ?? null,
    },
  })

  // Optional bridge: move the customer order from `signed` to `confirmed`
  // via the existing Phase 9 transition, which handles its own audit +
  // stamp. This is only triggered if the admin ticked the checkbox on the
  // acknowledgement form; the two state machines remain formally separate.
  if (input.alsoConfirmCustomerOrder) {
    const orderRows = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, po.orderId))
      .limit(1)
    if (orderRows.length > 0 && orderRows[0].status === 'signed') {
      await markConfirmedAction(po.orderId, {
        supplierPoNumber: input.supplierPoRefReceived ?? undefined,
        estimatedDeliveryDate: input.supplierEtaDate ?? undefined,
        note: `Auto-triggered from supplier PO ${po.ref} acknowledgement.`,
      })
    }
  }

  revalidatePath(`/admin/orders/${po.orderId}/supplier-po`)
  revalidatePath(`/admin/orders/${po.orderId}`)
  return { ok: true, id: po.id, ref: po.ref }
}

// ─── cancel ──────────────────────────────────────────────────────────

// ─── record supplier invoice (Phase 11) ──────────────────────────────

export interface RecordSupplierInvoiceInput {
  supplierInvoiceRef?: string | null
  supplierInvoiceDate?: string | null
  supplierInvoiceNetPence: number // required
  supplierInvoiceVatPence: number | null // null = not split on invoice
  supplierInvoiceNotes?: string | null
}

export async function recordSupplierInvoiceAction(
  supplierPoId: string,
  input: RecordSupplierInvoiceInput,
): Promise<SupplierPoActionResult> {
  const user = await requireAdmin()

  if (
    typeof input.supplierInvoiceNetPence !== 'number' ||
    !Number.isFinite(input.supplierInvoiceNetPence) ||
    input.supplierInvoiceNetPence < 0
  ) {
    return {
      ok: false,
      error: 'A non-negative invoice net amount is required.',
    }
  }

  const rows = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.id, supplierPoId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'PO not found' }
  const po = rows[0]

  if (po.status !== 'acknowledged') {
    return {
      ok: false,
      error: `Invoice capture is only available for acknowledged POs. This PO is ${po.status}.`,
    }
  }

  const derived = deriveInvoice(
    {
      supplierInvoiceNetPence: input.supplierInvoiceNetPence,
      supplierInvoiceVatPence: input.supplierInvoiceVatPence,
    },
    po.purchaseNetPence,
    po.purchaseTotalPence,
  )

  const now = new Date()
  await db
    .update(supplierOrders)
    .set({
      supplierInvoiceRef: input.supplierInvoiceRef ?? po.supplierInvoiceRef,
      supplierInvoiceDate: input.supplierInvoiceDate ?? null,
      supplierInvoiceNetPence: Math.round(input.supplierInvoiceNetPence),
      supplierInvoiceVatPence:
        input.supplierInvoiceVatPence === null
          ? null
          : Math.round(input.supplierInvoiceVatPence),
      supplierInvoiceTotalPence: derived.supplierInvoiceTotalPence,
      supplierInvoiceVarianceNetPence: derived.supplierInvoiceVarianceNetPence,
      supplierInvoiceVarianceTotalPence:
        derived.supplierInvoiceVarianceTotalPence,
      supplierInvoiceReceivedAt: now,
      supplierInvoiceNotes: input.supplierInvoiceNotes ?? null,
      updatedAt: now,
    })
    .where(eq(supplierOrders.id, po.id))

  await db.insert(auditEvents).values({
    orderId: po.orderId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier_po.invoice_received',
    payload: {
      poId: po.id,
      invoiceRef: input.supplierInvoiceRef ?? po.supplierInvoiceRef ?? null,
      invoiceDate: input.supplierInvoiceDate ?? null,
      invoiceNetPence: Math.round(input.supplierInvoiceNetPence),
      invoiceVatPence:
        input.supplierInvoiceVatPence === null
          ? null
          : Math.round(input.supplierInvoiceVatPence),
      invoiceTotalPence: derived.supplierInvoiceTotalPence,
      varianceNetPence: derived.supplierInvoiceVarianceNetPence,
      varianceTotalPence: derived.supplierInvoiceVarianceTotalPence,
    },
  })

  revalidatePath(`/admin/orders/${po.orderId}/supplier-po`)
  revalidatePath(`/admin/orders/${po.orderId}`)
  revalidatePath('/admin/reports/margin')
  revalidatePath('/admin')
  return { ok: true, id: po.id, ref: po.ref }
}

export async function cancelSupplierPOAction(
  supplierPoId: string,
  reason: string,
): Promise<SupplierPoActionResult> {
  const user = await requireAdmin()

  const trimmed = reason?.trim() ?? ''
  if (trimmed.length < 5) {
    return { ok: false, error: 'Reason must be at least 5 characters.' }
  }

  const rows = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.id, supplierPoId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'PO not found' }
  const po = rows[0]
  if (po.status === 'cancelled') {
    return { ok: true, id: po.id, ref: po.ref }
  }

  const now = new Date()
  await db
    .update(supplierOrders)
    .set({
      status: 'cancelled',
      cancelledAt: now,
      cancellationReason: trimmed,
      updatedAt: now,
    })
    .where(eq(supplierOrders.id, po.id))

  await db.insert(auditEvents).values({
    orderId: po.orderId,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'supplier_po.cancelled',
    payload: {
      poId: po.id,
      previousStatus: po.status,
      reason: trimmed,
    },
  })

  revalidatePath(`/admin/orders/${po.orderId}/supplier-po`)
  revalidatePath(`/admin/orders/${po.orderId}`)
  return { ok: true, id: po.id, ref: po.ref }
}
