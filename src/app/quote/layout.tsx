// Public quote-view page — same bare-chrome as /sign/* and /verify/*.

import '../sign/sign.css'

export const metadata = {
  title: 'Your Olaris quote',
  robots: { index: false, follow: false },
}

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
