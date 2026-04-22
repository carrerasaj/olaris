// Public signing routes are bare-chrome — the page is the product.
// Parent RootLayout still supplies <html>, <body>, fonts, analytics.

import './sign.css'

export const metadata = {
  title: 'Review & sign order · Olaris',
  robots: { index: false, follow: false },
}

export default function SignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
