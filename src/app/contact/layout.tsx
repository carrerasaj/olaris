import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'

export const metadata: Metadata = constructMetadata({
  title: 'Contact Us | Olaris',
  description:
    'Get in touch with the Olaris team. Let us show you how fleet intelligence can improve visibility, compliance, and cost control for your operation.',
  url: 'https://olaris.co.uk/contact',
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
