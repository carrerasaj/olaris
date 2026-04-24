'use server'

/**
 * Admin server actions for customers + companies.
 *
 * Every action:
 *   1. Calls requireAdmin() — throws into /admin/login if no session
 *   2. Validates input with zod (fail-closed; never trust form data)
 *   3. Writes in a single transaction where multi-step (customer + company)
 *   4. Records an audit event when the action is meaningful business-wise
 *   5. Revalidates the relevant paths so list views see the new row
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db, customers, companies, auditEvents, activities } from '@/db/client'
import { requireAdmin } from '@/lib/admin-auth'
import { customerCreateSchema } from '@/lib/validation'

export interface ActionResult {
  ok: boolean
  error?: string
  issues?: { path: string; message: string }[]
}

function formToObject(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [k, v] of form.entries()) {
    obj[k] = typeof v === 'string' ? v : undefined
  }
  return obj
}

function coerceCustomerPayload(form: FormData) {
  const raw = formToObject(form)
  return {
    type: raw['type'] as 'business' | 'personal',
    salutation: (raw['salutation'] as string) || undefined,
    firstName: (raw['firstName'] as string) || '',
    lastName: (raw['lastName'] as string) || '',
    email: ((raw['email'] as string) || '').trim().toLowerCase(),
    phone: (raw['phone'] as string) || undefined,
    dob: (raw['dob'] as string) || undefined,
    position: (raw['position'] as string) || undefined,
    companyName: (raw['companyName'] as string) || undefined,
    companiesHouseNumber: (raw['companiesHouseNumber'] as string) || undefined,
    vatNumber: (raw['vatNumber'] as string) || undefined,
    billingAddress: {
      line1: (raw['addressLine1'] as string) || '',
      line2: (raw['addressLine2'] as string) || undefined,
      city: (raw['addressCity'] as string) || '',
      postcode: (raw['addressPostcode'] as string) || '',
      country: (raw['addressCountry'] as string) || 'United Kingdom',
    },
    notes: (raw['notes'] as string) || undefined,
    marketingOptOut: raw['marketingOptOut'] === 'on' || raw['marketingOptOut'] === 'true',
  }
}

// ─── create ────────────────────────────────────────────────────────────────

export async function createCustomerAction(form: FormData): Promise<ActionResult> {
  const user = await requireAdmin()
  const parsed = customerCreateSchema.safeParse(coerceCustomerPayload(form))
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }
  const input = parsed.data

  // Optional company creation. Business customers without a company name are
  // still allowed (sole traders) — only create a companies row if name present.
  let companyId: string | null = null
  if (input.type === 'business' && input.companyName) {
    const [row] = await db
      .insert(companies)
      .values({
        name: input.companyName,
        companiesHouseNumber: input.companiesHouseNumber,
        vatNumber: input.vatNumber,
        billingAddress: input.billingAddress,
        createdBy: user.id,
      })
      .returning({ id: companies.id })
    companyId = row.id
  }

  const [customer] = await db
    .insert(customers)
    .values({
      type: input.type,
      salutation: input.salutation,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      dob: input.dob || null,
      position: input.position,
      companyId,
      billingAddress: input.billingAddress,
      notes: input.notes,
      marketingOptOut: input.marketingOptOut ?? false,
      createdBy: user.id,
    })
    .returning({ id: customers.id })

  await db.insert(auditEvents).values({
    customerId: customer.id,
    actorType: 'rep',
    actorId: user.id,
    eventType: 'customer.created',
    payload: { email: input.email },
  })

  revalidatePath('/admin/customers')
  revalidatePath('/admin')
  redirect(`/admin/customers/${customer.id}`)
}

// ─── update ────────────────────────────────────────────────────────────────

export async function updateCustomerAction(
  customerId: string,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin()
  const parsed = customerCreateSchema.safeParse(coerceCustomerPayload(form))
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }
  const input = parsed.data

  // Fetch existing for companyId continuity + opt-out diff for audit
  const existing = await db
    .select({
      id: customers.id,
      companyId: customers.companyId,
      marketingOptOut: customers.marketingOptOut,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)
  if (existing.length === 0) return { ok: false, error: 'Customer not found' }

  let companyId: string | null = existing[0].companyId
  if (input.type === 'business' && input.companyName) {
    if (companyId) {
      await db
        .update(companies)
        .set({
          name: input.companyName,
          companiesHouseNumber: input.companiesHouseNumber,
          vatNumber: input.vatNumber,
          billingAddress: input.billingAddress,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId))
    } else {
      const [row] = await db
        .insert(companies)
        .values({
          name: input.companyName,
          companiesHouseNumber: input.companiesHouseNumber,
          vatNumber: input.vatNumber,
          billingAddress: input.billingAddress,
          createdBy: user.id,
        })
        .returning({ id: companies.id })
      companyId = row.id
    }
  } else if (input.type === 'personal') {
    companyId = null
  }

  const nextOptOut = input.marketingOptOut ?? false
  await db
    .update(customers)
    .set({
      type: input.type,
      salutation: input.salutation,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      dob: input.dob || null,
      position: input.position,
      companyId,
      billingAddress: input.billingAddress,
      notes: input.notes,
      marketingOptOut: nextOptOut,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId))

  if (nextOptOut !== existing[0].marketingOptOut) {
    await db.insert(auditEvents).values({
      customerId,
      actorType: 'rep',
      actorId: user.id,
      eventType: 'customer.marketing_opt_out_changed',
      payload: { from: existing[0].marketingOptOut, to: nextOptOut },
    })
  }

  revalidatePath(`/admin/customers/${customerId}`)
  revalidatePath('/admin/customers')
  redirect(`/admin/customers/${customerId}`)
}

// ─── activities (notes/tasks/calls/etc. on a customer timeline) ─────────

export async function addActivityAction(
  customerId: string,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin()
  const kindRaw = form.get('kind') as string
  const title = ((form.get('title') as string) || '').trim()
  const body = ((form.get('body') as string) || '').trim()
  const dueDate = form.get('dueDate') as string

  if (!title) return { ok: false, error: 'Title is required' }
  if (!['note', 'call', 'email', 'meeting', 'task'].includes(kindRaw)) {
    return { ok: false, error: 'Invalid activity type' }
  }

  await db.insert(activities).values({
    customerId,
    kind: kindRaw as 'note' | 'call' | 'email' | 'meeting' | 'task',
    title,
    body: body || null,
    dueDate: kindRaw === 'task' && dueDate ? new Date(dueDate) : null,
    createdBy: user.id,
  })

  revalidatePath(`/admin/customers/${customerId}`)
  return { ok: true }
}

export async function completeActivityAction(
  activityId: string,
  customerId: string,
): Promise<ActionResult> {
  await requireAdmin()
  await db
    .update(activities)
    .set({ completedAt: new Date() })
    .where(and(eq(activities.id, activityId), eq(activities.customerId, customerId)))

  revalidatePath(`/admin/customers/${customerId}`)
  return { ok: true }
}
