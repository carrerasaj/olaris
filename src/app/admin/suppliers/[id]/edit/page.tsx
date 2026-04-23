import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db, suppliers } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { SupplierForm } from '../../../SupplierForm'
import { updateSupplierAction } from '../../../actions/suppliers'

export const metadata = { title: 'Edit supplier' }

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const rows = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1)
  if (rows.length === 0) notFound()
  const supplier = rows[0]

  async function action(_prev: unknown, formData: FormData) {
    'use server'
    return updateSupplierAction(id, formData)
  }

  const initial = {
    kind: supplier.kind,
    legalName: supplier.legalName,
    tradingName: supplier.tradingName,
    primaryContactName: supplier.primaryContactName,
    primaryContactEmail: supplier.primaryContactEmail,
    primaryContactPhone: supplier.primaryContactPhone,
    website: supplier.website,
    addressLine1: supplier.addressLine1,
    addressLine2: supplier.addressLine2,
    addressCity: supplier.addressCity,
    addressPostcode: supplier.addressPostcode,
    addressCountry: supplier.addressCountry,
    notes: supplier.notes,
  }

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href={`/admin/suppliers/${id}`}
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← {supplier.tradingName ?? supplier.legalName}
          </Link>
          <h1 style={{ marginTop: 4 }}>Edit supplier</h1>
        </div>
      </div>

      <SupplierForm action={action} initial={initial} submitLabel="Save changes" />
    </div>
  )
}
