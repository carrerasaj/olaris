/**
 * GET /api/orders/[id]/pdf
 *
 * Streams the signed-order PDF from private Vercel Blob storage.
 *
 * Access:
 *   - Admin session  → always allowed (used by the admin Download button)
 *   - Valid download token in ?t=  → allowed (embedded in the signed-copy
 *     email so the customer can download without an account)
 *
 * Records a `pdf.downloaded` audit event on every successful download so
 * Alan can see who fetched a copy and when.
 */

import { desc, eq, and } from 'drizzle-orm'
import { get } from '@vercel/blob'
import {
  db,
  orders,
  documents,
  auditEvents,
} from '@/db/client'
import { auth } from '@/lib/auth'
import { verifyDownloadToken } from '@/lib/pdf/download-token'
import { captureForensics } from '@/lib/forensics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const url = new URL(req.url)
  const token = url.searchParams.get('t')

  // ── Auth: session OR token ─────────────────────────────────
  let actor: 'rep' | 'customer'
  let actorId: string | null = null
  const session = await auth()
  if (session?.user?.role === 'admin') {
    actor = 'rep'
    actorId = session.user.id
  } else if (token && verifyDownloadToken(token, id)) {
    actor = 'customer'
  } else {
    return new Response('Not found', { status: 404 })
  }

  // ── Lookup the order (by id OR ref — email links use the human ref) ──
  const byId = await db
    .select({ id: orders.id, customerId: orders.customerId })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1)
  const byRef = byId.length === 0
    ? await db
        .select({ id: orders.id, customerId: orders.customerId })
        .from(orders)
        .where(eq(orders.ref, id))
        .limit(1)
    : []
  const orderRow = byId[0] ?? byRef[0]
  if (!orderRow) return new Response('Not found', { status: 404 })

  // ── Find the signed PDF document ────────────────────────────
  const docRows = await db
    .select()
    .from(documents)
    .where(
      and(eq(documents.orderId, orderRow.id), eq(documents.kind, 'signed_order_pdf')),
    )
    .orderBy(desc(documents.uploadedAt))
    .limit(1)
  if (docRows.length === 0) return new Response('PDF not generated yet', { status: 404 })
  const doc = docRows[0]

  // ── Fetch from Blob ─────────────────────────────────────────
  let blobResult
  try {
    blobResult = await get(doc.filename, { access: 'private' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[pdf.download] blob get failed:', msg)
    return new Response('Storage error', { status: 500 })
  }
  if (!blobResult || blobResult.statusCode !== 200) {
    return new Response('PDF unavailable', { status: 404 })
  }

  // ── Audit the download ──────────────────────────────────────
  const forensics = await captureForensics()
  await db.insert(auditEvents).values({
    orderId: orderRow.id,
    customerId: orderRow.customerId,
    actorType: actor,
    actorId,
    eventType: 'pdf.downloaded',
    payload: { sha256: doc.sha256 },
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
  })

  // ── Stream the PDF back ─────────────────────────────────────
  // `attachment` forces the browser to treat this as a download rather than
  // try to render/intercept it — avoids Next's app-router error boundary
  // taking over when the response is opened in a new tab.
  const filename = doc.filename.split('/').pop() ?? 'order.pdf'
  return new Response(blobResult.stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      // Prevent Next's client router from hijacking this response
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
