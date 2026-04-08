import { serviceSchema, faqSchema } from '@/lib/seo'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <MarketingLayout>{children}</MarketingLayout>
    </>
  )
}
