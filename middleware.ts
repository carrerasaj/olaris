/**
 * Route gate for /admin/*.
 *
 * - /admin/login and /admin/login/* are public (sign-in UI)
 * - every other /admin/* path requires a session with role='admin'
 * - /sign/*, /verify/*, /api/sign/* stay public (gated by signing token instead)
 *
 * Uses Auth.js v5's session cookie via `auth()` — returns a redirect Response
 * when unauthenticated. Non-admin sessions (shouldn't exist given the signIn
 * callback, but belt-and-braces) get bounced to a 403 page.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/admin/login/check-email',
  '/admin/login/error',
]

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const session = req.auth
  if (!session?.user) {
    const url = new URL('/admin/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (session.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login/error?code=not_admin', req.url))
  }

  return NextResponse.next()
})

// Only run middleware on admin routes — other paths are unaffected.
export const config = {
  matcher: ['/admin/:path*'],
}
