import { signIn } from '@/lib/auth'

export const metadata = {
  title: 'Sign in · Olaris admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// Minimal sign-in UI. Submits the email to Auth.js's Resend provider which
// handles the allowlist check + magic-link send. Always navigates to
// /admin/login/check-email on success (even if the email isn't an admin —
// we deliberately avoid leaking which emails are real admins).
export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  async function submit(formData: FormData) {
    'use server'
    const email = String(formData.get('email') || '').trim().toLowerCase()
    if (!email) return
    const cbUrl = String((await searchParams).callbackUrl || '/admin')
    await signIn('resend', { email, redirectTo: cbUrl })
  }

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
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          border: '1px solid #e4e9f1',
          borderRadius: 10,
          padding: '32px 28px',
          boxShadow: '0 4px 14px -4px rgba(15,23,42,.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#0b1e3f',
              letterSpacing: '-0.02em',
            }}
          >
            Olaris admin
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#64748b',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Sign in
          </div>
        </div>
        <form action={submit}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 6,
            }}
          >
            Email
          </label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="alan@olaris.co.uk"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              marginBottom: 16,
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              background: '#0b1e3f',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Email me a sign-in link
          </button>
        </form>
        <p
          style={{
            fontSize: 12,
            color: '#64748b',
            textAlign: 'center',
            marginTop: 20,
            lineHeight: 1.5,
          }}
        >
          We'll email you a one-time sign-in link. Admin access only.
        </p>
      </div>
    </div>
  )
}
