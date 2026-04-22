// Public verification page — bare-chrome, just like /sign/*. Reuses sign.css
// so brand styling stays consistent; CSS is scoped to body-level selectors
// there so loading it here applies the same visual treatment.

import '../sign/sign.css'

export const metadata = {
  title: 'Verify signed order · Olaris',
  robots: { index: false, follow: false },
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
