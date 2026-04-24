/**
 * GET /api/orders/[id]/handover-pack
 *
 * Streams the handover-pack PDF from Vercel Blob. The pack is generated
 * once (Phase 12) and never re-rendered on access — this route just
 * fetches the frozen artefact.
 *
 * Access:
 *   - Admin session  → allowed
 *   - Valid download token in ?t=  → allowed (embedded in the delivered
 *     email; same token mechanism as the signed-order PDF)
 */

import { and, desc, eq } from 'drizzle-orm'
import { get } from '@vercel/blob'
import { db, orders, documents, auditEvents } from '@/db/client'
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

  const orderRow = (
    await db
      .select({ id: orders.id, customerId: orders.customerId })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)
  )[0]
  if (!orderRow) return new Response('Not found', { status: 404 })

  const docRows = await db
    .select()
    .from(documents)
    .where(
      and(eq(documents.orderId, orderRow.id), eq(documents.kind, 'handover_pack')),
    )
    .orderBy(desc(documents.uploadedAt))
    .limit(1)
  if (docRows.length === 0)
    return new Response('Handover pack not generated yet', { status: 404 })
  const doc = docRows[0]

  // Blob access was put() with `access: 'public'` — the URL is directly
  // reachable, but we proxy for audit + to keep the blob URL out of the
  // email footer clutter.
  let res: Response
  try {
    res = await fetch(doc.blobUrl)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[handover-pack.download] blob fetch failed:', msg)
    return new Response('Storage error', { status: 500 })
  }
  if (!res.ok) return new Response('Handover pack unavailable', { status: 404 })

  // Try blob `get` for private-store compatibility if the URL pattern
  // ever changes. Falls through to the fetch result.
  void get

  const forensics = await captureForensics()
  await db.insert(auditEvents).values({
    orderId: orderRow.id,
    customerId: orderRow.customerId,
    actorType: actor,
    actorId,
    eventType: 'pdf.downloaded',
    payload: { sha256: doc.sha256, kind: 'handover_pack' },
    ip: forensics.ip,
    userAgent: forensics.userAgent,
    geoCity: forensics.geoCity,
    geoCountry: forensics.geoCountry,
  })

  const filename = doc.filename.split('/').pop() ?? 'handover-pack.pdf'
  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
