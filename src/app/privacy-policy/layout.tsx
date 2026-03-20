import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy | Olaris',
  description:
    'How Olaris Consulting Limited collects, uses, and protects your personal data under GDPR. Covers cookies, analytics, and your rights as a data subject.',
  url: 'https://olaris.co.uk/privacy-policy',
})

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
