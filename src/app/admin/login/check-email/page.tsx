export const metadata = {
  title: 'Check your email · Olaris admin',
  robots: { index: false, follow: false },
}

export default function CheckEmailPage() {
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
            background: '#ecfeff',
            color: '#0891b2',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, color: '#0b1e3f', margin: '0 0 8px' }}>
          Check your email
        </h1>
        <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          If your email is on the admin allowlist, a sign-in link is on its way.
          The link expires in 24 hours.
        </p>
      </div>
    </div>
  )
}
