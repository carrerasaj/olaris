/**
 * F-03 gated-resources registry.
 *
 * A gated resource is an asset (PDF, Word doc, xlsx) we offer in
 * exchange for an email. The lead captures, this service sends the
 * email with the attachment, and records the delivery in lead_events.
 *
 * Each registry entry declares:
 *   - `id`: stable key used by the call site
 *   - `filename`: shown to the recipient
 *   - `subject` + body: email wrapper
 *   - `buildAttachment`: async function that returns the file bytes
 *
 * For F-03, the registry is intentionally empty — no asset builders
 * exist yet. T2-04 (inline lead magnets) ships the first asset (Grey
 * Fleet Policy Template). Adding a new asset is:
 *
 *   1. Implement a `buildAttachment` (may stream from blob, generate
 *      via @react-pdf/renderer, or read a static file from disk).
 *   2. Register the entry in `gatedResources` below.
 *   3. Call `sendGatedResource(leadId, assetId)` from the capture path.
 *
 * Why not just hardcode PDFs in a static `/public/downloads` folder?
 * Because we want (a) per-asset delivery audit, (b) the ability to
 * watermark with the lead's details at send time, (c) future-proofing
 * for dynamic reports (e.g. the excess-mileage calculator's PDF
 * includes the lead's calculator inputs — T1-01 scope).
 */

import { and, eq } from 'drizzle-orm'
import { db, leads, type Lead } from '@/db/client'
import { sendEmail, type EmailAttachment } from '@/lib/email'
import { recordLeadEvent, buildUnsubscribeUrl } from '@/lib/leads'

// ─── Registry shape ─────────────────────────────────────────────────────

export interface GatedResourceContext {
  lead: Lead
  siteUrl: string
  unsubscribeUrl: string
}

export interface GatedResource {
  id: string
  label: string
  /** Filename the recipient sees. Include the extension. */
  filename: string
  /** Content-Type for the attachment. */
  contentType: string
  subject: (ctx: GatedResourceContext) => string
  html: (ctx: GatedResourceContext) => string
  text: (ctx: GatedResourceContext) => string
  /**
   * Produce the file bytes. May be async — pull from blob, render a
   * PDF with lead details, etc. Return null to signal the asset isn't
   * available (e.g. file missing); the runtime will log a
   * gated_resource.failed event.
   */
  buildAttachment: (ctx: GatedResourceContext) => Promise<Buffer | null>
}

// ─── Registry ───────────────────────────────────────────────────────────

export const gatedResources: Record<string, GatedResource> = {
  // First real asset ships with T2-04 (Grey Fleet Policy Template).
  // Keeping the registry empty for now so the first addition has a
  // clean, reviewed diff to stand on.
}

export function getResource(id: string): GatedResource | null {
  return gatedResources[id] ?? null
}

// ─── Send ───────────────────────────────────────────────────────────────

function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://olaris.co.uk'
  )
}

export interface SendGatedResourceResult {
  ok: boolean
  outcome: 'sent' | 'failed'
  error?: string
  providerMessageId?: string | null
}

/**
 * Send a gated resource to a lead. Idempotency is NOT automatic — if
 * the caller sends the same asset twice, the lead gets two emails.
 * That's intentional: the only use case we've surfaced is resend
 * (email didn't arrive), and baking in dedup would make that harder
 * than it's worth.
 *
 * Does respect `marketingOptOut` / `unsubscribedAt` — a lead who
 * opted out still *can* receive a gated resource (transactional:
 * "the thing you asked for"), but we audit the fact so it's queryable.
 */
export async function sendGatedResource(
  leadId: string,
  assetId: string,
): Promise<SendGatedResourceResult> {
  const resource = getResource(assetId)
  if (!resource) {
    return { ok: false, outcome: 'failed', error: `unknown_asset:${assetId}` }
  }

  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId)))
    .limit(1)
  if (rows.length === 0) {
    return { ok: false, outcome: 'failed', error: 'lead_not_found' }
  }
  const lead = rows[0]

  const ctx: GatedResourceContext = {
    lead,
    siteUrl: siteUrl(),
    unsubscribeUrl: buildUnsubscribeUrl(siteUrl(), lead.unsubscribeToken),
  }

  let buffer: Buffer | null
  try {
    buffer = await resource.buildAttachment(ctx)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await recordLeadEvent({
      leadId,
      eventType: 'gated_resource.failed',
      payload: { assetId, stage: 'build', error: msg },
    })
    return { ok: false, outcome: 'failed', error: `build_failed:${msg}` }
  }

  if (!buffer) {
    await recordLeadEvent({
      leadId,
      eventType: 'gated_resource.failed',
      payload: { assetId, stage: 'build', error: 'builder_returned_null' },
    })
    return { ok: false, outcome: 'failed', error: 'builder_returned_null' }
  }

  const attachment: EmailAttachment = {
    filename: resource.filename,
    content: buffer,
    contentType: resource.contentType,
  }

  const result = await sendEmail({
    to: lead.email,
    subject: resource.subject(ctx),
    html: resource.html(ctx),
    text: resource.text(ctx),
    attachments: [attachment],
  })

  if (result.ok) {
    await recordLeadEvent({
      leadId,
      eventType: 'gated_resource.sent',
      payload: {
        assetId,
        filename: resource.filename,
        providerMessageId: result.id ?? null,
        sizeBytes: buffer.byteLength,
      },
    })
    return { ok: true, outcome: 'sent', providerMessageId: result.id ?? null }
  }

  await recordLeadEvent({
    leadId,
    eventType: 'gated_resource.failed',
    payload: { assetId, stage: 'send', error: result.error ?? 'unknown' },
  })
  return { ok: false, outcome: 'failed', error: result.error ?? 'send_failed' }
}
