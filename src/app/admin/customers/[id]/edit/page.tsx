import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db, customers, companies } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { CustomerForm } from '../../../CustomerForm'
import { updateCustomerAction } from '../../../actions/customers'

export const metadata = { title: 'Edit customer' }

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const rows = await db
    .select({ customer: customers, company: companies })
    .from(customers)
    .leftJoin(companies, eq(customers.companyId, companies.id))
    .where(eq(customers.id, id))
    .limit(1)

  if (rows.length === 0) notFound()
  const { customer, company } = rows[0]

  async function action(_prev: unknown, formData: FormData) {
    'use server'
    return updateCustomerAction(id, formData)
  }

  const initial = {
    type: customer.type,
    salutation: customer.salutation ?? undefined,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone ?? undefined,
    dob: customer.dob ?? undefined,
    position: customer.position ?? undefined,
    companyName: company?.name,
    companiesHouseNumber: company?.companiesHouseNumber ?? undefined,
    vatNumber: company?.vatNumber ?? undefined,
    addressLine1: customer.billingAddress?.line1,
    addressLine2: customer.billingAddress?.line2,
    addressCity: customer.billingAddress?.city,
    addressPostcode: customer.billingAddress?.postcode,
    addressCountry: customer.billingAddress?.country,
    notes: customer.notes ?? undefined,
  }

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href={`/admin/customers/${id}`}
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← {customer.firstName} {customer.lastName}
          </Link>
          <h1 style={{ marginTop: 4 }}>Edit customer</h1>
        </div>
      </div>

      <CustomerForm action={action} initial={initial} submitLabel="Save changes" />
    </div>
  )
}
