// Bare layout for the Puppeteer-only PDF template route. The parent
// /admin/layout.tsx would wrap this in the admin chrome, so we override
// by rendering our own HTML/body here. Next allows multiple root layouts
// only with route groups; the simplest workaround is to hide the admin
// chrome via CSS from this route's stylesheet. See pdf-template.css.

import './pdf-template.css'

export const metadata = {
  title: 'Order PDF template · internal',
  robots: { index: false, follow: false },
}

// Cache aggressively off — each render is for a specific order + token.
export const dynamic = 'force-dynamic'

export default function PdfTemplateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
