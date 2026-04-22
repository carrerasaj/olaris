// Internal routes are development-only previews. They render without the
// public site chrome (Header/Footer) so ported mockups look like the original.
// The parent RootLayout still provides <html>, <body>, fonts, and analytics.

export const metadata = {
  robots: { index: false, follow: false },
}

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
