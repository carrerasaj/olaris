const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Olaris Fleet Intelligence Platform',
  description:
    'Live fleet tracking across 15+ manufacturers, automated mileage monitoring, driver behaviour scoring, DVLA compliance checks, cost analytics and EV transition planning.',
  applicationCategory: 'Fleet Management Software',
  operatingSystem: 'Web',
  url: 'https://olaris.co.uk/platform',
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
      </head>
      {children}
    </>
  )
}
