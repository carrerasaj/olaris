/**
 * Public unsubscribe page. Linked from the footer of every drip email.
 *
 * Behaviour:
 *   - Page loads: confirm-or-cancel view.
 *   - User clicks "Confirm unsubscribe": POST to /unsubscribe/[token]/confirm,
 *     which marks the lead unsubscribed + cancels pending drips, then
 *     redirects back here showing the thank-you state.
 *
 * Why a confirm click instead of one-click on page load? Some corporate
 * link-scanners prefetch URLs in emails — one-click unsubscribe would
 * silently opt everyone out when their IT gateway warms the link. The
 * confirm step is explicit.
 */

import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db, leads } from '@/db/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Unsubscribe · Olaris',
  robots: { index: false, follow: false },
}

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.unsubscribeToken, token))
    .limit(1)

  if (rows.length === 0) {
    return (
      <Shell>
        <h1>Link not recognised</h1>
        <p>
          This unsubscribe link is no longer valid. If you still want to opt
          out of our emails, reply <strong>UNSUBSCRIBE</strong> to any email
          from us and we&apos;ll sort it manually.
        </p>
      </Shell>
    )
  }

  const lead = rows[0]

  if (lead.unsubscribedAt) {
    return (
      <Shell>
        <h1>You&apos;re unsubscribed</h1>
        <p>
          We won&apos;t send you any more marketing email. If something we do
          send you ever feels transactional-but-shouldn&apos;t-be, reply and
          let us know — we&apos;ll sort it out.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1>Unsubscribe from Olaris emails?</h1>
      <p>
        We&apos;ll stop sending you follow-ups and marketing email
        immediately. Any email we&apos;ve already scheduled for you will be
        cancelled.
      </p>
      <p>You were signed up as <strong>{lead.email}</strong>.</p>

      <form
        action={`/unsubscribe/${encodeURIComponent(token)}/confirm`}
        method="post"
        style={{ marginTop: 24 }}
      >
        <button
          type="submit"
          style={{
            background: '#b91c1c',
            color: '#fff',
            padding: '10px 20px',
            border: 0,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Confirm unsubscribe
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 13, color: '#64748b' }}>
        Changed your mind?{' '}
        <Link href="/" style={{ color: '#0b1e3f' }}>
          Back to olaris.co.uk
        </Link>
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: '80px auto',
        padding: '0 24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#0f172a',
        lineHeight: 1.6,
      }}
    >
      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 24,
          fontWeight: 700,
          color: '#0b1e3f',
          marginBottom: 32,
        }}
      >
        Olaris
      </div>
      {children}
    </div>
  )
}
