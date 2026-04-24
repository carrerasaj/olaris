// Bare layout for the Puppeteer-only handover-pack PDF template.
// Reuses the same scoped CSS as the other PDF templates for visual
// continuity.

import '../../pdf-template/pdf-template.css'

export const metadata = {
  title: 'Handover pack template · internal',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function HandoverPackTemplateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
