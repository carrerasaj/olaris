export const metadata = {
  title: 'Sign-in error · Olaris admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const MESSAGES: Record<string, string> = {
  not_admin: "This account doesn't have admin access.",
  Verification: 'That sign-in link is invalid or has already been used.',
  default: 'Something went wrong signing you in.',
}

export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const { code, error } = await searchParams
  const key = code || error || 'default'
  const msg = MESSAGES[key] ?? MESSAGES.default
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: '#fff',
          border: '1px solid #e4e9f1',
          borderRadius: 10,
          padding: '32px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: '#fef2f2',
            color: '#dc2626',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, color: '#0b1e3f', margin: '0 0 8px' }}>
          Sign-in error
        </h1>
        <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.55, margin: '0 0 16px' }}>
          {msg}
        </p>
        <a
          href="/admin/login"
          style={{
            display: 'inline-block',
            background: '#0b1e3f',
            color: '#fff',
            textDecoration: 'none',
            padding: '10px 18px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Try again
        </a>
      </div>
    </div>
  )
}
