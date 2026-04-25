/**
 * Render the excess-mileage PDF report via headless Chrome.
 *
 * Same launch shape as render.ts (signed-order PDFs). The template
 * route at /admin/tools/excess-mileage-report/pdf-template reads the
 * payload from a base64url query param and validates the render token
 * before rendering — Puppeteer has no admin session.
 *
 * The payload travels in the URL because (a) it's small (<1kb), (b) it
 * avoids any cross-invocation state on serverless, (c) the HMAC token
 * covers the payload so tampering fails verification.
 */

import type { Browser, LaunchOptions } from 'puppeteer-core'
import { createHash } from 'node:crypto'
import { mintRenderToken } from './render-token'
import type { ExcessMileageReportPayload } from '@/lib/excess-mileage-report'

const LOCAL_CHROME_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

function baseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  )
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default
  const isProd = process.env.NODE_ENV === 'production' && !!process.env.VERCEL

  const opts: LaunchOptions = { headless: true }

  if (isProd) {
    const chromium = (await import('@sparticuz/chromium')).default
    opts.args = chromium.args
    opts.executablePath = await chromium.executablePath()
  } else {
    opts.executablePath = LOCAL_CHROME_PATH
    opts.args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none',
    ]
  }

  return puppeteer.launch(opts) as unknown as Browser
}

/**
 * Encode the payload and mint a render token bound to its sha256. The
 * template route reads the payload, re-hashes it, and only renders if
 * the token's `subject` matches — so mutating the payload in transit
 * invalidates the token.
 */
export function prepareReportUrl(
  payload: ExcessMileageReportPayload,
): { url: string; payloadB64: string; token: string } {
  const json = JSON.stringify(payload)
  const payloadB64 = b64url(json)
  const subject = createHash('sha256').update(json).digest('hex')
  const token = mintRenderToken(subject)
  const url = `${baseUrl()}/admin/tools/excess-mileage-report/pdf-template?d=${encodeURIComponent(payloadB64)}&t=${encodeURIComponent(token)}`
  return { url, payloadB64, token }
}

export async function renderExcessMileageReport(
  payload: ExcessMileageReportPayload,
): Promise<Buffer> {
  const { url } = prepareReportUrl(payload)

  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })
    await page.emulateMediaType('print')
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
