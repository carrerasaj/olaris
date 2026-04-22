/**
 * Signing-token lookup + validation.
 *
 * A token is valid iff:
 *   - exists in signing_tokens
 *   - consumedAt is null
 *   - expiresAt > now()
 *   - the parent order is not cancelled
 *
 * Any other state returns a reason code so the caller (page / API) can
 * render the appropriate UX (expired vs consumed vs cancelled).
 */

import { and, eq } from 'drizzle-orm'
import {
  db,
  signingTokens,
  orders,
  customers,
  companies,
  type SigningToken,
  type Order as DbOrder,
  type Customer as DbCustomer,
  type Company as DbCompany,
} from '@/db/client'

export type LookupFailure =
  | 'not_found'
  | 'expired'
  | 'consumed'
  | 'cancelled'
  | 'already_signed'

export interface LookupSuccess {
  ok: true
  token: SigningToken
  order: DbOrder
  customer: DbCustomer
  company: DbCompany | null
}

export interface LookupFail {
  ok: false
  reason: LookupFailure
}

export async function lookupSigningToken(
  token: string,
): Promise<LookupSuccess | LookupFail> {
  if (!token || token.length < 16 || token.length > 64) {
    return { ok: false, reason: 'not_found' }
  }

  const rows = await db
    .select({
      token: signingTokens,
      order: orders,
      customer: customers,
      company: companies,
    })
    .from(signingTokens)
    .innerJoin(orders, eq(signingTokens.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(companies, eq(orders.companyId, companies.id))
    .where(eq(signingTokens.token, token))
    .limit(1)

  if (rows.length === 0) return { ok: false, reason: 'not_found' }
  const { token: tk, order, customer, company } = rows[0]

  if (tk.consumedAt) return { ok: false, reason: 'consumed' }
  if (tk.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' }
  if (order.status === 'cancelled') return { ok: false, reason: 'cancelled' }
  if (order.status === 'signed' || order.status === 'delivered') {
    return { ok: false, reason: 'already_signed' }
  }

  return { ok: true, token: tk, order, customer, company }
}

// Human-friendly failure messages for the customer-facing error page.
export function lookupFailureCopy(reason: LookupFailure): {
  title: string
  body: string
} {
  switch (reason) {
    case 'expired':
      return {
        title: 'This signing link has expired',
        body: 'Links are valid for 7 days. Please contact your Olaris representative to request a fresh link.',
      }
    case 'consumed':
      return {
        title: 'This link has already been used',
        body: 'Each signing link can only be used once. If you need to review the signed order, please reply to your confirmation email.',
      }
    case 'cancelled':
      return {
        title: 'This order has been cancelled',
        body: 'Your Olaris representative has cancelled this order. Please contact them with any questions.',
      }
    case 'already_signed':
      return {
        title: 'This order has already been signed',
        body: 'No further action is needed from you. A signed copy has been emailed to you.',
      }
    case 'not_found':
    default:
      return {
        title: 'Link not found',
        body: 'This signing link is invalid or has been revoked. Please check the URL or contact your Olaris representative.',
      }
  }
}
