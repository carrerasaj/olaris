import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

// Throws into a /admin/login redirect if the current request has no admin
// session. Server components beyond this point can trust `user.role === 'admin'`.
// Middleware already enforces this — this helper is the belt-and-braces layer
// and gives us a non-nullable `user` with the right type.
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/admin/login')
  }
  return session.user
}
