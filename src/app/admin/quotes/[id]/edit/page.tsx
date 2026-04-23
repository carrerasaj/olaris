import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db, quotes, customers, companies } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import type { Order as UiOrder } from '@/components/order-form'
import { QuoteAdminEditor } from '../../QuoteAdminEditor'
import { updateQuoteAction } from '../../../actions/quotes'
import { dbQuoteToUi, uiQuoteToInput } from '@/lib/quote-mapping'

export const metadata = { title: 'Edit quote' }

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const rows = await db
    .select({ quote: quotes, customer: customers, company: companies })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .leftJoin(companies, eq(quotes.companyId, companies.id))
    .where(eq(quotes.id, id))
    .limit(1)
  if (rows.length === 0) notFound()
  const { quote, customer, company } = rows[0]

  if (quote.status !== 'draft') {
    // Terms freeze after send. Redirect back to detail so the user sees why.
    redirect(`/admin/quotes/${id}`)
  }

  const initial: UiOrder = dbQuoteToUi(quote, customer, company)

  async function handleSubmit(
    ui: UiOrder,
    custId: string,
    companyId: string | null,
  ) {
    'use server'
    return updateQuoteAction(id, uiQuoteToInput(ui, custId, companyId))
  }

  return (
    <>
      <div style={{ padding: '16px 28px 0', background: '#0b1e3f' }}>
        <Link
          href={`/admin/quotes/${id}`}
          style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}
        >
          ← Back to quote
        </Link>
      </div>
      <QuoteAdminEditor
        initial={initial}
        quoteRef={quote.ref}
        customerId={customer.id}
        companyId={company?.id ?? null}
        onSubmit={handleSubmit}
        submitLabel="Save draft"
      />
    </>
  )
}
