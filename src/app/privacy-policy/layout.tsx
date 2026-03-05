import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy | Olaris',
  description:
    'How Olaris Consulting Limited collects, uses, and protects your personal data. GDPR compliant.',
})

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
