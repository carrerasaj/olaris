import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { SupplierForm } from '../../SupplierForm'
import { createSupplierAction } from '../../actions/suppliers'

export const metadata = { title: 'New supplier' }

export default async function NewSupplierPage() {
  await requireAdmin()

  async function action(_prev: unknown, formData: FormData) {
    'use server'
    return createSupplierAction(formData)
  }

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href="/admin/suppliers"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Suppliers
          </Link>
          <h1 style={{ marginTop: 4 }}>New supplier</h1>
          <div className="sub">Vehicle source, broker, OEM partner, importer, or funder</div>
        </div>
      </div>

      <SupplierForm action={action} submitLabel="Create supplier" />
    </div>
  )
}
