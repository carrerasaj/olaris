/**
 * Render the HTML template at /admin/orders/[id]/pdf-template to PDF bytes
 * using headless Chrome.
 *
 *   - Local dev: uses the system Chrome at LOCAL_CHROME_PATH (default macOS
 *     path, overridable via PUPPETEER_EXECUTABLE_PATH env var).
 *   - Production (Vercel): uses @sparticuz/chromium — a Chromium binary
 *     packaged for AWS Lambda-style function runtimes, which Vercel's
 *     serverless platform extends.
 *
 * The template route checks the ?t= HMAC render token before rendering, so
 * this helper mints a fresh one for every call (60s expiry is ample for the
 * full render round-trip even on a cold Chromium start).
 */

import type { Browser, LaunchOptions } from 'puppeteer-core'
import { mintRenderToken } from './render-token'

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

// Dynamic imports defer loading puppeteer + chromium until we actually render.
// Both packages are heavy; we don't want them in the module graph of any route
// that doesn't render PDFs.
async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default
  const isProd = process.env.NODE_ENV === 'production' && !!process.env.VERCEL

  const opts: LaunchOptions = { headless: true }

  if (isProd) {
    // @sparticuz/chromium provides the Chromium binary and recommended args
    // for serverless / lambda runtimes.
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
 * Render the signed-order PDF for `orderId`. Returns the PDF bytes as a Buffer.
 *
 * Throws if Chromium can't launch, the template route can't be reached, or the
 * page itself errors. Caller (generate.ts) wraps this in try/catch and records
 * the failure in the audit trail rather than rolling back the signature state.
 */
export async function renderOrderPdf(orderId: string): Promise<Buffer> {
  const token = mintRenderToken(orderId)
  const url = `${baseUrl()}/admin/orders/${orderId}/pdf-template?t=${encodeURIComponent(token)}`

  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })
    // `print` emulation makes @media print styles apply and matches what the
    // user sees if they Cmd-P the same page — no surprise at the preview/final
    // boundary.
    await page.emulateMediaType('print')
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      // Template supplies its own padding; keep browser margins at 0.
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
