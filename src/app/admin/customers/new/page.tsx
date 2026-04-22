import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { CustomerForm } from '../../CustomerForm'
import { createCustomerAction } from '../../actions/customers'

export const metadata = { title: 'New customer' }

export default async function NewCustomerPage() {
  await requireAdmin()

  // Thin wrapper so the action matches useActionState's signature
  // (prev, formData) — we discard `prev`.
  async function action(_prev: unknown, formData: FormData) {
    'use server'
    return createCustomerAction(formData)
  }

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href="/admin/customers"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Customers
          </Link>
          <h1 style={{ marginTop: 4 }}>New customer</h1>
          <div className="sub">Add a business or individual to the CRM</div>
        </div>
      </div>

      <CustomerForm action={action} submitLabel="Create customer" />
    </div>
  )
}
