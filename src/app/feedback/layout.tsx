// Public feedback page — bare chrome, same stylesheet family as /sign
// and /verify so the brand treatment stays consistent.

import '../sign/sign.css'

export const metadata = {
  title: 'How was your experience? · Olaris',
  robots: { index: false, follow: false },
}

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
