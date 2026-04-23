// Bare layout for the Puppeteer-only supplier-PO PDF template. Reuses the
// same scoped CSS as the customer-signed PDF template — visual continuity.

import '../../pdf-template/pdf-template.css'

export const metadata = {
  title: 'Supplier PO PDF template · internal',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function SupplierPoPdfTemplateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
