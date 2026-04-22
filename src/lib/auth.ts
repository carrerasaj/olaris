/**
 * Auth.js (v5) configuration for Olaris admin.
 *
 * Auth model:
 *   - Magic-link sign-in via Resend, whitelist-based (allowlist in DB)
 *   - No self-registration anywhere. A user not in `users` never gets a link.
 *     We silently report success either way to avoid leaking which emails
 *     are real admins.
 *   - Session length: 30 days sliding. Admin-only (role='admin').
 *
 * This module is imported by:
 *   - `middleware.ts` — for route gating
 *   - `src/app/api/auth/[...nextauth]/route.ts` — for the handlers
 *   - server actions/components via `auth()` to fetch the session
 */

import NextAuth, { type DefaultSession } from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { db, users, accounts, sessions, verificationTokens } from '@/db/client'

// Extend the session user with role so server components can gate on it.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'admin'
    } & DefaultSession['user']
  }

  interface User {
    role?: 'admin'
  }
}

const EMAIL_FROM = 'Olaris <alan@olaris.co.uk>'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // refresh once per day of activity
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: EMAIL_FROM,
      // Only send the link if the email is already an admin. Otherwise
      // swallow the request silently — no enumeration signal.
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const existing = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1)

        if (existing.length === 0 || existing[0].role !== 'admin') {
          // Log so Alan can see failed attempts in Vercel logs, but don't
          // surface the failure to the caller.
          console.warn(`[auth] magic-link requested for non-admin: ${email}`)
          return
        }

        const { Resend: ResendClient } = await import('resend')
        const resend = new ResendClient(provider.apiKey as string)

        const { error } = await resend.emails.send({
          from: provider.from as string,
          to: email,
          subject: 'Sign in to Olaris admin',
          html: signInEmailHtml(url),
          text: signInEmailText(url),
        })
        if (error) {
          console.error('[auth] resend error', error)
          throw new Error('Could not send sign-in email')
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
    verifyRequest: '/admin/login/check-email',
    error: '/admin/login/error',
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      session.user.role = (user as { role?: 'admin' }).role ?? 'admin'
      return session
    },
    // Final guard — even if a link was somehow issued to a non-admin, this
    // prevents a session being created for them.
    async signIn({ user }) {
      if (!user.email) return false
      const row = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.email, user.email.toLowerCase()))
        .limit(1)
      return row.length > 0 && row[0].role === 'admin'
    },
  },
  trustHost: true,
})

function signInEmailHtml(url: string) {
  return `<!DOCTYPE html>
<html><body style="font-family:Inter,-apple-system,Segoe UI,sans-serif;background:#f8fafc;padding:32px 16px;margin:0">
  <table cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e9f1;border-radius:10px;overflow:hidden">
    <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #e4e9f1">
      <div style="font-family:Manrope,sans-serif;font-size:20px;font-weight:700;color:#0b1e3f;letter-spacing:-0.01em">Olaris</div>
      <div style="font-size:11px;color:#64748b;letter-spacing:0.1em;text-transform:uppercase;margin-top:2px">Fleet Intelligence</div>
    </td></tr>
    <tr><td style="padding:28px 32px">
      <h1 style="font-family:Manrope,sans-serif;font-size:18px;color:#0f172a;margin:0 0 12px">Sign in to Olaris admin</h1>
      <p style="color:#334155;line-height:1.55;font-size:14px;margin:0 0 20px">Click the button below to sign in. This link expires in 24 hours and can only be used once.</p>
      <a href="${url}" style="display:inline-block;background:#0b1e3f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px">Sign in securely</a>
      <p style="color:#64748b;font-size:12px;line-height:1.55;margin:28px 0 0">If you didn't request this, you can safely ignore it.</p>
    </td></tr>
  </table>
</body></html>`
}

function signInEmailText(url: string) {
  return `Sign in to Olaris admin\n\n${url}\n\nThis link expires in 24 hours. If you didn't request this, ignore this email.`
}
