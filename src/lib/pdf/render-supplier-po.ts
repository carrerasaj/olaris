/**
 * Render the supplier purchase-order PDF via headless Chrome.
 *
 * Mirrors src/lib/pdf/render.ts (signed customer PDF) but hits the
 * supplier-PO template route instead. The template enforces the same
 * HMAC ?t= render-token gate so nobody external can hit the route.
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
 * Render the supplier PO PDF for `supplierPoId`. Returns PDF bytes.
 *
 * Note: the render token is minted against `supplierPoId`, so re-using it
 * against the customer PDF route will fail (different template, different
 * token audience via the route path).
 */
export async function renderSupplierPoPdf(
  supplierPoId: string,
  orderId: string,
): Promise<Buffer> {
  const token = mintRenderToken(supplierPoId)
  const url = `${baseUrl()}/admin/orders/${orderId}/supplier-po/pdf-template?t=${encodeURIComponent(token)}&po=${encodeURIComponent(supplierPoId)}`

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
