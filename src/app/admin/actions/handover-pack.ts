'use server'

/**
 * Admin action: generate or regenerate the handover pack for an order.
 *
 * Allowed only once the order is at `ready_for_handover` or later (it's
 * not meaningful beforehand — we don't have the VIN / reg yet). The
 * underlying service handles the render+upload+document-row path and
 * the superseded audit link if regenerating.
 */

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db, orders } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { generateHandoverPack, getCurrentHandoverPack } from '@/lib/handover-pack'

export interface HandoverPackActionResult {
  ok: boolean
  error?: string
  documentId?: string
}

export async function generateHandoverPackAction(
  orderId: string,
): Promise<HandoverPackActionResult> {
  const user = await requireAdmin()

  const rows = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (rows.length === 0) return { ok: false, error: 'Order not found' }
  const status = rows[0].status

  if (
    status !== 'ready_for_handover' &&
    status !== 'delivered'
  ) {
    return {
      ok: false,
      error: `Handover pack can only be generated at ready_for_handover or later (status: ${status}).`,
    }
  }

  const existing = await getCurrentHandoverPack(orderId)
  const mode = existing ? 'regenerate' : 'create'
  const result = await generateHandoverPack(orderId, {
    actorId: user.id,
    mode,
  })
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true, documentId: result.documentId }
}
