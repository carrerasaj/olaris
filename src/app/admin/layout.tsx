/**
 * Admin chrome — wraps every /admin/* page except /admin/login/*.
 *
 * Middleware handles the auth gate; we re-check here so server components
 * below can call `requireAdmin()` and trust the result. Login sub-routes
 * detect themselves via a child route segment and render bare (no chrome).
 */

import { auth, signOut } from '@/lib/auth'
import './admin.css'
import { AdminNav } from './AdminNav'

export const metadata = {
  title: { default: 'Olaris admin', template: '%s · Olaris admin' },
  robots: { index: false, follow: false },
}

// Admin pages are session-dependent and should never be prerendered.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Login routes (page.tsx lives at /admin/login, /admin/login/check-email,
  // /admin/login/error) must render without the chrome. We detect them via
  // the session gate: if there's no session, show a bare <div>. Middleware
  // guarantees non-login routes redirected here are authenticated.
  if (!session?.user) {
    return <>{children}</>
  }

  async function doSignOut() {
    'use server'
    await signOut({ redirectTo: '/admin/login' })
  }

  return (
    <div className="adm-shell">
      <div className="adm-topbar">
        <div className="adm-topbar-left">
          <div className="adm-brand">
            <svg viewBox="0 0 300 60" width="92" height="18">
              <defs>
                <linearGradient id="adm-arcL" x1="0" y1="10" x2="40" y2="50" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#06B6D4" /><stop offset="100%" stopColor="#0891B2" />
                </linearGradient>
                <linearGradient id="adm-arcR" x1="40" y1="10" x2="0" y2="50" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22D3EE" /><stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <path d="M22 6 A20 20 0 0 0 22 50" stroke="url(#adm-arcL)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M22 6 A20 20 0 0 1 22 50" stroke="url(#adm-arcR)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <circle cx="22" cy="28" r="2" fill="#06B6D4" />
              <text x="54" y="38" fontFamily="Manrope, sans-serif" fontSize="30" fontWeight="700" letterSpacing="-0.5" fill="#F1F5F9">Olaris</text>
            </svg>
            <span className="adm-brand-tag">Admin</span>
          </div>
          <AdminNav />
        </div>
        <div className="adm-topbar-right">
          <div className="adm-user">
            Signed in as <strong>{session.user.email}</strong>
          </div>
          <form action={doSignOut}>
            <button type="submit" className="adm-signout">
              Sign out
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  )
}

