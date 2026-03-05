import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'

export const metadata: Metadata = constructMetadata({
  title: 'Terms of Service | Olaris',
  description:
    'Terms and conditions for using the Olaris fleet intelligence platform and website.',
  url: 'https://olaris.co.uk/terms',
})

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
