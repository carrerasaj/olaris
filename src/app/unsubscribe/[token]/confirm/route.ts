/**
 * POST /unsubscribe/[token]/confirm
 *
 * Completes the unsubscribe flow started by the confirm form on the
 * parent page. Marks the lead unsubscribed, cancels pending drip rows,
 * records a lead.unsubscribed audit, redirects back to the parent
 * page where the "you're unsubscribed" view renders.
 *
 * Why a separate route rather than a server action? The form is
 * a plain POST with a token in the path — easier to reason about
 * security (path-bound token == scoped effect) and it keeps the
 * parent page as a pure RSC.
 */

import { NextResponse } from 'next/server'
import { unsubscribeByToken } from '@/lib/leads'
import { captureForensics } from '@/lib/forensics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params
  const forensics = await captureForensics()
  await unsubscribeByToken(token, forensics.ip, forensics.userAgent)

  // Whether the token was valid or already consumed, redirect back to
  // the parent page — it renders the correct state from the lead row.
  const url = new URL(`/unsubscribe/${encodeURIComponent(token)}`, req.url)
  return NextResponse.redirect(url, { status: 303 })
}
