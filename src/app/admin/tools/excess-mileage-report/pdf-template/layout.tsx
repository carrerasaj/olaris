// Bare layout for the Puppeteer-only excess-mileage report template.
// Same pattern as /admin/orders/[id]/pdf-template — ancestor admin
// chrome is hidden via CSS in the stylesheet.

import './pdf-template.css'

export const metadata = {
  title: 'Excess mileage report PDF template · internal',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function PdfTemplateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
