/**
 * Handover-pack service — generate (frozen artefact), fetch, regenerate.
 *
 * Generation runs Puppeteer → PDF → Vercel Blob → documents row. Every
 * subsequent access streams from Blob; we never re-render on access. If
 * admin explicitly regenerates (e.g. VIN correction after handover),
 * the prior documents row is kept with a supersededAt-style audit trail
 * via the `handover_pack.superseded` event; the new row becomes the
 * current pack.
 */

import { createHash } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { put } from '@vercel/blob'
import { db, orders, documents, auditEvents } from '@/db/client'
import { renderHandoverPackPdf } from '@/lib/pdf/render-handover-pack'

export interface HandoverPackResult {
  ok: boolean
  documentId?: string
  blobUrl?: string
  sha256?: string
  sizeBytes?: number
  buffer?: Buffer
  error?: string
}

/**
 * Returns the current (non-superseded) handover-pack documents row for
 * this order, or null if none has been generated.
 */
export async function getCurrentHandoverPack(orderId: string): Promise<{
  id: string
  blobUrl: string
  sha256: string
  sizeBytes: number | null
  uploadedAt: Date
} | null> {
  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.orderId, orderId), eq(documents.kind, 'handover_pack')))
    .orderBy(desc(documents.uploadedAt))
    .limit(1)
  if (rows.length === 0) return null
  return {
    id: rows[0].id,
    blobUrl: rows[0].blobUrl,
    sha256: rows[0].sha256,
    sizeBytes: rows[0].sizeBytes,
    uploadedAt: rows[0].uploadedAt,
  }
}

/**
 * Generate (or regenerate) the handover pack for this order. Caller
 * (action) handles status checks + audit context; this function owns
 * the render+upload+document-row path.
 */
export async function generateHandoverPack(
  orderId: string,
  opts: { actorId: string; mode: 'create' | 'regenerate' },
): Promise<HandoverPackResult> {
  const orderRows = await db
    .select({
      id: orders.id,
      customerId: orders.customerId,
      ref: orders.ref,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (orderRows.length === 0) return { ok: false, error: 'Order not found' }
  const { customerId, ref } = orderRows[0]

  // If regenerating, mark the existing pack superseded via audit BEFORE
  // the new one lands — so the trail reads cleanly in chronological order.
  let previousDocumentId: string | null = null
  if (opts.mode === 'regenerate') {
    const existing = await getCurrentHandoverPack(orderId)
    if (existing) previousDocumentId = existing.id
  }

  // Render
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderHandoverPackPdf(orderId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Handover pack render failed: ${msg}` }
  }
  const sha256 = createHash('sha256').update(pdfBuffer).digest('hex')

  // Upload. Blob path includes the SHA so regenerated packs land on a
  // fresh URL — we don't overwrite; the old pack stays reachable from
  // its documents row for audit reasons.
  const pathname = `handover-pack/${ref}-${sha256.slice(0, 12)}.pdf`
  let blobUrl: string
  try {
    const uploaded = await put(pathname, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
      allowOverwrite: true,
    })
    blobUrl = uploaded.url
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Handover pack upload failed: ${msg}` }
  }

  const [doc] = await db
    .insert(documents)
    .values({
      orderId,
      customerId,
      kind: 'handover_pack',
      filename: pathname,
      blobUrl,
      sha256,
      mimeType: 'application/pdf',
      sizeBytes: pdfBuffer.byteLength,
      uploadedBy: opts.actorId,
    })
    .returning({ id: documents.id })

  await db.insert(auditEvents).values({
    orderId,
    customerId,
    actorType: 'rep',
    actorId: opts.actorId,
    eventType: 'handover_pack.generated',
    payload: {
      documentId: doc.id,
      sha256,
      blobUrl,
      sizeBytes: pdfBuffer.byteLength,
      mode: opts.mode,
    },
  })

  if (previousDocumentId) {
    await db.insert(auditEvents).values({
      orderId,
      customerId,
      actorType: 'rep',
      actorId: opts.actorId,
      eventType: 'handover_pack.superseded',
      payload: {
        previousDocumentId,
        newDocumentId: doc.id,
        newSha256: sha256,
      },
    })
  }

  return {
    ok: true,
    documentId: doc.id,
    blobUrl,
    sha256,
    sizeBytes: pdfBuffer.byteLength,
    buffer: pdfBuffer,
  }
}
