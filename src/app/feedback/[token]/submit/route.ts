/**
 * POST /feedback/[token]/submit
 *
 * Plain form submission endpoint for the public feedback page. Delegates
 * to recordFeedbackSubmissionByToken and redirects back to the page so
 * the consumed/confirmation view renders.
 */

import { NextResponse } from 'next/server'
import { recordFeedbackSubmissionByToken } from '@/app/admin/actions/feedback'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params
  const form = await req.formData()
  const scoreRaw = form.get('score')
  const commentRaw = form.get('comment')
  const score =
    typeof scoreRaw === 'string' && scoreRaw.trim() !== '' ? Number(scoreRaw) : NaN
  const comment = typeof commentRaw === 'string' ? commentRaw : undefined

  const result = await recordFeedbackSubmissionByToken(token, {
    score,
    comment,
  })

  // Whether submit succeeded or was a dup / expired, send the browser back
  // to the /feedback/[token] page — it renders the right state view from
  // the token's current status.
  const url = new URL(`/feedback/${encodeURIComponent(token)}`, req.url)
  if (!result.ok && !result.alreadySubmitted) {
    url.searchParams.set('error', encodeURIComponent(result.error ?? 'error'))
  }
  return NextResponse.redirect(url, { status: 303 })
}
