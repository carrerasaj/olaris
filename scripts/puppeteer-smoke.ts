// Standalone Puppeteer smoke test. Nothing Next.js, nothing admin, nothing
// react-pdf. Just: can we go from HTML string to PDF bytes on disk?
//
//   tsx /tmp/puppeteer-smoke.ts
//
// If /tmp/olaris-smoke.pdf appears and opens, infrastructure is sound.

import puppeteer from 'puppeteer-core'
import { writeFile } from 'node:fs/promises'

const LOCAL_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function main() {
  console.log('launching Chrome…')
  const browser = await puppeteer.launch({
    executablePath: LOCAL_CHROME,
    headless: true,
  })
  try {
    const page = await browser.newPage()
    await page.setContent(
      `<!doctype html><html><head><style>
        body { font-family: system-ui, sans-serif; padding: 48px; color: #0b1e3f }
        h1 { color: #06b6d4 }
      </style></head><body>
        <h1>Olaris Puppeteer smoke test</h1>
        <p>If you're reading this in a PDF, the infrastructure works.</p>
        <p>Rendered at ${new Date().toISOString()}</p>
      </body></html>`,
      { waitUntil: 'networkidle0' },
    )
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    })
    await writeFile('/tmp/olaris-smoke.pdf', pdf)
    console.log('wrote /tmp/olaris-smoke.pdf — size:', pdf.byteLength, 'bytes')
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error('smoke test failed:', e)
  process.exit(1)
})
