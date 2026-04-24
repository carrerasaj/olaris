/**
 * Filtered activities view: open NPS detractor follow-up tasks.
 *
 * Reached from the dashboard tile. Shows every uncompleted detractor
 * task across all customers with the originating order ref, score,
 * and the customer's comment. "Mark done" hits the existing
 * completeActivityAction so dispatching is one click.
 */

import Link from 'next/link'
import { and, asc, desc, eq, isNull, like, sql } from 'drizzle-orm'
import { db, activities, customers, orders, feedback } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtDate, fmtRelative } from '@/lib/format'
import { NpsScorePill } from '../../components'
import { completeActivityAction } from '../../actions/customers'

export const metadata = { title: 'Open NPS follow-ups' }

const TITLE_PREFIX = 'Follow up: NPS '

export default async function NpsFollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>
}) {
  await requireAdmin()
  const { show } = await searchParams
  const includeDone = show === 'all'

  const baseFilters = [
    eq(activities.kind, 'task'),
    like(activities.title, `${TITLE_PREFIX}%`),
  ]
  const whereExpr = includeDone
    ? and(...baseFilters)
    : and(...baseFilters, isNull(activities.completedAt))

  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      body: activities.body,
      dueDate: activities.dueDate,
      completedAt: activities.completedAt,
      createdAt: activities.createdAt,
      customerId: activities.customerId,
      orderId: activities.orderId,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerEmail: customers.email,
      orderRef: orders.ref,
    })
    .from(activities)
    .innerJoin(customers, eq(activities.customerId, customers.id))
    .leftJoin(orders, eq(activities.orderId, orders.id))
    .where(whereExpr)
    .orderBy(includeDone ? desc(activities.createdAt) : asc(activities.dueDate))
    .limit(200)

  // Pull the matching feedback row per order (for the score pill + full
  // comment if the activity body got truncated). One round-trip across all
  // orderIds — small enough not to need pagination yet.
  const orderIds = Array.from(new Set(rows.map((r) => r.orderId).filter((x): x is string => !!x)))
  const feedbackRows =
    orderIds.length > 0
      ? await db
          .select({
            orderId: feedback.orderId,
            score: feedback.score,
            comment: feedback.comment,
            submittedAt: feedback.submittedAt,
          })
          .from(feedback)
          .where(sql`${feedback.orderId} = ANY(${orderIds})`)
      : []
  const feedbackByOrder = new Map(feedbackRows.map((f) => [f.orderId, f]))

  return (
    <div className="adm-page">
      <div className="adm-pageheader">
        <div>
          <Link
            href="/admin"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            ← Dashboard
          </Link>
          <h1 style={{ marginTop: 4 }}>Open NPS follow-ups</h1>
          <div className="sub">
            Detractor scores (0–6) auto-create a task with a 3-day due date.
            Resolve by calling the customer and clicking "Mark done".
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href={includeDone ? '/admin/activities/nps-follow-ups' : '/admin/activities/nps-follow-ups?show=all'}
            className="adm-btn adm-btn-ghost"
          >
            {includeDone ? 'Open only' : 'Show completed'}
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <h3>No open follow-ups</h3>
            <p>
              Detractor tasks appear here automatically when a customer scores
              the service 0–6 on the NPS form.
            </p>
          </div>
        </div>
      ) : (
        <div className="adm-card">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Score</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Comment</th>
                <th>Due</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const fb = r.orderId ? feedbackByOrder.get(r.orderId) : null
                const overdue =
                  !r.completedAt &&
                  r.dueDate &&
                  r.dueDate.getTime() < Date.now()
                return (
                  <tr
                    key={r.id}
                    style={{
                      background: overdue ? '#fef2f2' : undefined,
                    }}
                  >
                    <td>
                      {fb ? (
                        <NpsScorePill score={fb.score} />
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/customers/${r.customerId}`}>
                        {r.customerFirstName} {r.customerLastName}
                      </Link>
                      <div style={{ fontSize: 11, color: '#64748b' }} className="mono">
                        {r.customerEmail}
                      </div>
                    </td>
                    <td>
                      {r.orderId && r.orderRef ? (
                        <Link
                          href={`/admin/orders/${r.orderId}`}
                          className="mono"
                        >
                          {r.orderRef}
                        </Link>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td
                      style={{
                        maxWidth: 360,
                        fontSize: 12.5,
                        whiteSpace: 'pre-wrap',
                        color: '#0f172a',
                      }}
                    >
                      {fb?.comment ?? r.body ?? (
                        <span style={{ color: '#94a3b8' }}>No comment left</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {r.dueDate ? (
                        <span
                          style={{
                            color: overdue ? '#b91c1c' : '#334155',
                            fontWeight: overdue ? 700 : 400,
                          }}
                        >
                          {fmtDate(r.dueDate)}
                          {overdue && ' (overdue)'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {fmtRelative(r.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {r.completedAt ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: '#047857',
                            fontWeight: 600,
                          }}
                        >
                          ✓ done
                        </span>
                      ) : (
                        <CompleteForm
                          activityId={r.id}
                          customerId={r.customerId}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CompleteForm({
  activityId,
  customerId,
}: {
  activityId: string
  customerId: string
}) {
  async function complete() {
    'use server'
    await completeActivityAction(activityId, customerId)
  }
  return (
    <form action={complete}>
      <button
        type="submit"
        className="adm-btn adm-btn-ghost adm-btn-sm"
        style={{ color: '#047857' }}
      >
        Mark done
      </button>
    </form>
  )
}
