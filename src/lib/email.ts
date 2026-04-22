/**
 * Thin wrapper around Resend for all transactional email.
 *
 * Templates live in src/lib/email-templates.ts. This module handles:
 *   - lazy Resend client init (so test/build steps don't crash)
 *   - from-address resolution (EMAIL_FROM env with a safe default)
 *   - error surface: never throws; returns { ok, error } so callers can
 *     log + carry on without disrupting the business action
 */

import { Resend } from 'resend'

const FROM_DEFAULT = 'Olaris <alan@olaris.co.uk>'

let client: Resend | null = null

function getClient(): Resend | null {
  if (client) return client
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  client = new Resend(key)
  return client
}

export interface EmailAttachment {
  /** Filename shown in the email client */
  filename: string
  /** Binary content as Buffer, Uint8Array, or base64 string */
  content: Buffer | Uint8Array | string
  contentType?: string
}

interface SendInput {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

export interface SendResult {
  ok: boolean
  id?: string
  error?: string
}

export async function sendEmail(input: SendInput): Promise<SendResult> {
  const c = getClient()
  if (!c) {
    console.warn(
      `[email] RESEND_API_KEY not set — would have sent "${input.subject}" to ${input.to}`,
    )
    return { ok: false, error: 'email_not_configured' }
  }

  const from = process.env.EMAIL_FROM ?? FROM_DEFAULT

  try {
    const { data, error } = await c.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        // Resend's SDK accepts Buffer | string (base64) | Uint8Array here
        content:
          a.content instanceof Buffer
            ? a.content
            : a.content instanceof Uint8Array
              ? Buffer.from(a.content)
              : a.content,
        contentType: a.contentType,
      })),
    })
    if (error) {
      console.error('[email] resend error', error)
      return { ok: false, error: error.message ?? 'resend_error' }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[email] send failed', msg)
    return { ok: false, error: msg }
  }
}
