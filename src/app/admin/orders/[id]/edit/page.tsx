import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db, orders, customers, companies } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { OrderAdminEditor } from '../../OrderAdminEditor'
import { updateOrderAction } from '../../../actions/orders'
import { dbOrderToUi, uiOrderToInput } from '@/lib/order-mapping'
import type { Order as UiOrder } from '@/components/order-form'

export const metadata = { title: 'Edit order' }

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const rows = await db
    .select({ order: orders, customer: customers, company: companies })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(companies, eq(orders.companyId, companies.id))
    .where(eq(orders.id, id))
    .limit(1)
  if (rows.length === 0) notFound()
  const { order, customer, company } = rows[0]

  // Only drafts are editable — bounce others back to detail view where the
  // read-only render explains why.
  if (order.status !== 'draft') {
    redirect(`/admin/orders/${id}`)
  }

  const initial = dbOrderToUi(order, customer, company)

  async function handleSubmit(
    ui: UiOrder,
    custId: string,
    companyId: string | null,
  ) {
    'use server'
    return updateOrderAction(id, uiOrderToInput(ui, custId, companyId))
  }

  return (
    <>
      <div style={{ padding: '16px 28px 0', background: '#0b1e3f' }}>
        <Link
          href={`/admin/orders/${id}`}
          style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}
        >
          ← Order {order.ref}
        </Link>
      </div>
      <OrderAdminEditor
        initial={initial}
        orderRef={order.ref}
        customerId={customer.id}
        companyId={company?.id ?? null}
        onSubmit={handleSubmit}
        submitLabel="Save draft"
      />
    </>
  )
}
