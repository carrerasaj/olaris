/**
 * Generate + persist the signed-order PDF.
 *
 * Renders /admin/orders/[id]/pdf-template via headless Chrome (see render.ts),
 * uploads to Vercel Blob, writes a `documents` row, writes a `pdf.generated`
 * audit event, returns the URL + the PDF's own SHA-256.
 *
 * Idempotent: if a signed_order_pdf already exists for this order, returns
 * the existing row (no re-render).
 */

import { createHash } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { put } from '@vercel/blob'
import { db, orders, signatures, auditEvents, documents } from '@/db/client'
import { renderOrderPdf } from './render'

export interface GenerateResult {
  ok: boolean
  /** blob URL — for private stores, this is NOT directly dereferenceable.
   *  Use the redirector at /api/orders/[id]/pdf for downloads. Recorded here
   *  for audit / debugging only. */
  url?: string
  /** SHA-256 hex of the PDF bytes */
  pdfSha256?: string
  /** existing documents row id (if we reused one) */
  documentId?: string
  /** PDF bytes as Buffer — only populated when we *just* rendered (i.e. not
   *  when an idempotent cache hit returns an existing row). Callers who need
   *  to attach the PDF to an email use this directly. When undefined, the
   *  caller can fall back to fetching via the redirector URL. */
  buffer?: Buffer
  error?: string
}

export async function generateOrderPdf(orderId: string): Promise<GenerateResult> {
  // 1. Ensure the order exists and is fully signed. Failing fast here stops
  //    us from launching Chrome for an order we wouldn't render anyway.
  const orderRows = await db
    .select({ id: orders.id, customerId: orders.customerId, ref: orders.ref })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (orderRows.length === 0) return { ok: false, error: 'Order not found' }
  const { customerId, ref } = orderRows[0]

  const sigs = await db
    .select({ id: signatures.id })
    .from(signatures)
    .where(eq(signatures.orderId, orderId))
  if (sigs.length < 2) {
    return { ok: false, error: 'Order is not fully signed yet' }
  }

  // 2. Idempotency — return the existing blob if one already exists
  const existing = await db
    .select()
    .from(documents)
    .where(and(eq(documents.orderId, orderId), eq(documents.kind, 'signed_order_pdf')))
    .orderBy(desc(documents.uploadedAt))
    .limit(1)
  if (existing.length > 0) {
    return {
      ok: true,
      url: existing[0].blobUrl,
      pdfSha256: existing[0].sha256,
      documentId: existing[0].id,
    }
  }

  // 3. Render via Puppeteer
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderOrderPdf(orderId)
  } catch (e) {
    console.error('[pdf.generate] renderOrderPdf threw:', e)
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `PDF render failed: ${msg}` }
  }

  const pdfSha256 = createHash('sha256').update(pdfBuffer).digest('hex')

  // 4. Upload to Vercel Blob (private store — URL returned is not
  //    directly accessible; the redirector at /api/orders/[id]/pdf
  //    re-fetches via @vercel/blob's get(pathname) at download time.
  const pathname = `orders/${ref}.pdf`
  let blobUrl: string
  try {
    const uploaded = await put(pathname, pdfBuffer, {
      access: 'private',
      contentType: 'application/pdf',
      allowOverwrite: true,
    })
    blobUrl = uploaded.url
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Blob upload failed: ${msg}` }
  }

  // 5. Record the document + audit event. We store `blob_url` as the raw
  //    blob URL for audit purposes, but customers and admins should never
  //    link to it directly — they go through /api/orders/[id]/pdf which
  //    streams from Blob with auth.
  const [doc] = await db
    .insert(documents)
    .values({
      orderId,
      customerId,
      kind: 'signed_order_pdf',
      filename: pathname,
      blobUrl,
      sha256: pdfSha256,
      mimeType: 'application/pdf',
      sizeBytes: pdfBuffer.byteLength,
    })
    .returning({ id: documents.id })

  await db.insert(auditEvents).values({
    orderId,
    customerId,
    actorType: 'system',
    eventType: 'pdf.generated',
    payload: { sha256: pdfSha256, url: blobUrl, sizeBytes: pdfBuffer.byteLength },
  })

  return {
    ok: true,
    url: blobUrl,
    pdfSha256,
    documentId: doc.id,
    buffer: pdfBuffer,
  }
}
