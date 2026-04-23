import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db, customers, companies } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import type { Order as UiOrder } from '@/components/order-form'
import { QuoteAdminEditor } from '../QuoteAdminEditor'
import { createQuoteAction } from '../../actions/quotes'
import { uiQuoteToInput } from '@/lib/quote-mapping'
import { emptyOrder } from '@/lib/empty-order'

export const metadata = { title: 'New quote' }

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>
}) {
  await requireAdmin()
  const { customerId } = await searchParams

  if (!customerId) return <CustomerPicker />

  const rows = await db
    .select({ customer: customers, company: companies })
    .from(customers)
    .leftJoin(companies, eq(customers.companyId, companies.id))
    .where(eq(customers.id, customerId))
    .limit(1)

  if (rows.length === 0) redirect('/admin/quotes/new')
  const { customer, company } = rows[0]

  const base = emptyOrder()
  const initial: UiOrder = {
    ...base,
    orderType: customer.type,
    customer: {
      salutation: customer.salutation ?? 'Mr',
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? '',
      dob: customer.dob ?? '',
      company: company?.name ?? '',
      companyNumber: company?.companiesHouseNumber ?? '',
      vatNumber: company?.vatNumber ?? '',
      position: customer.position ?? '',
      billingAddress: customer.billingAddress?.line1 ?? '',
      billingCity: customer.billingAddress?.city ?? '',
      billingPostcode: customer.billingAddress?.postcode ?? '',
      billingCountry: customer.billingAddress?.country ?? 'United Kingdom',
    },
  }

  async function handleSubmit(
    ui: UiOrder,
    custId: string,
    companyId: string | null,
  ) {
    'use server'
    return createQuoteAction(uiQuoteToInput(ui, custId, companyId))
  }

  return (
    <>
      <div style={{ padding: '16px 28px 0', background: '#0b1e3f' }}>
        <Link
          href="/admin/quotes"
          style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}
        >
          ← Quotes
        </Link>
      </div>
      <QuoteAdminEditor
        initial={initial}
        customerId={customer.id}
        companyId={company?.id ?? null}
        onSubmit={handleSubmit}
        submitLabel="Create draft quote"
        redirectOnSuccess
      />
    </>
  )
}

async function CustomerPicker() {
  const list = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      company: companies.name,
    })
    .from(customers)
    .leftJoin(companies, eq(customers.companyId, companies.id))
    .limit(200)

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href="/admin/quotes"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Quotes
          </Link>
          <h1 style={{ marginTop: 4 }}>New quote — pick a customer</h1>
          <div className="sub">Quotes are always attached to a customer</div>
        </div>
        <Link href="/admin/customers/new" className="adm-btn adm-btn-ghost">
          New customer first
        </Link>
      </div>
      <div className="adm-card">
        {list.length === 0 ? (
          <div className="adm-empty">
            <h3>No customers yet</h3>
            <p>Add a customer before creating a quote.</p>
            <Link
              href="/admin/customers/new"
              className="adm-btn adm-btn-primary"
              style={{ marginTop: 14 }}
            >
              New customer
            </Link>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td style={{ color: '#64748b' }}>{c.email}</td>
                  <td>{c.company ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/admin/quotes/new?customerId=${c.id}`}
                      className="adm-btn adm-btn-primary adm-btn-sm"
                    >
                      Select
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
