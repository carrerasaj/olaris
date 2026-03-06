import { serviceSchema, faqSchema } from '@/lib/seo'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
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
      </head>
      {children}
    </>
  )
}
