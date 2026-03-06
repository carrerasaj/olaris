import { Metadata } from 'next'

export const siteConfig = {
  name: 'Olaris Consulting Limited',
  description:
    'Fleet intelligence platform built from 40 years of automotive experience. Visibility, compliance, cost control, and sustainability tools for fleet operators, lease companies, and brokers across the UK.',
  url: 'https://olaris.co.uk',
  ogImage: 'https://olaris.co.uk/opengraph-image',
  links: {
    linkedin: 'https://linkedin.com/company/olaris-consulting-limited',
    twitter: 'https://twitter.com/olarisconsult',
  },
  contact: {
    email: 'alan@olaris.co.uk',
    phone: '+44-7919-35-40-68',
    address: {
      street: '10 Bull Street, Aston',
      city: 'Nr Bampton',
      postcode: 'OX18 2DN',
      country: 'United Kingdom',
    },
  },
}

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  url,
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string
  url?: string
  noIndex?: boolean
} = {}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: url || siteConfig.url,
    },
    keywords: [
      'fleet management UK',
      'fleet visibility platform',
      'mileage tracking fleet',
      'excess mileage management',
      'driver licence checking UK',
      'DVLA compliance fleet',
      'driver behaviour scoring',
      'fleet cost management',
      'fleet carbon emissions tracking',
      'EV fleet transition',
      'lease company fleet management',
      'fleet operator software',
      'OEM connected vehicle data',
      'broker vehicle sourcing',
      'grey fleet management UK',
      'fleet sustainability reporting',
      'Oxfordshire fleet consulting',
      'fleet intelligence platform',
    ],
    authors: [{ name: 'Alan Carreras', url: siteConfig.url }],
    creator: 'Olaris Consulting Limited',
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      url: siteConfig.url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@olarisconsult',
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    metadataBase: new URL(siteConfig.url),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  description: siteConfig.description,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: siteConfig.contact.phone,
    contactType: 'customer service',
    email: siteConfig.contact.email,
    areaServed: 'GB',
    availableLanguage: ['English'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: siteConfig.contact.address.street,
    addressLocality: siteConfig.contact.address.city,
    postalCode: siteConfig.contact.address.postcode,
    addressCountry: 'GB',
  },
  sameAs: [siteConfig.links.linkedin, siteConfig.links.twitter],
  founder: {
    '@type': 'Person',
    name: 'Alan Carreras',
    jobTitle: 'Founder & CEO',
  },
}

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: siteConfig.name,
  image: `${siteConfig.url}/logo.png`,
  '@id': siteConfig.url,
  url: siteConfig.url,
  telephone: siteConfig.contact.phone,
  priceRange: '££',
  address: {
    '@type': 'PostalAddress',
    streetAddress: siteConfig.contact.address.street,
    addressLocality: siteConfig.contact.address.city,
    postalCode: siteConfig.contact.address.postcode,
    addressCountry: 'GB',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 51.7134,
    longitude: -1.5498,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '17:00',
  },
}

export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Fleet Management Intelligence',
  provider: {
    '@type': 'Organization',
    name: siteConfig.name,
  },
  areaServed: {
    '@type': 'Country',
    name: 'United Kingdom',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Fleet Intelligence Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Fleet Visibility & Mileage Tracking',
          description:
            'Real-time telemetry from 15+ manufacturers with live odometer reads, mileage-vs-contract tracking, and projected annual mileage to prevent excess charges.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Driver Compliance & Behaviour',
          description:
            'Automated DVLA licence checking, driver behaviour scoring, gamification league tables, and coaching triggers to improve fleet safety and reduce insurance costs.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Cost & Contract Intelligence',
          description:
            'Real fuel and energy costs from telemetry data, TCO breakdown per vehicle, fleet-wide cost dashboards, and automated contract reporting.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Sustainability & EV Transition',
          description:
            'Scope 1, 2, 3 emissions tracking, EV transition planning from actual fleet data, carbon offset marketplace, and net-zero acceleration modelling.',
        },
      },
    ],
  },
}

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is fleet intelligence?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Fleet intelligence is the practice of unifying vehicle telematics, driver data, cost tracking, and compliance information into a single platform. Olaris provides real-time fleet intelligence that helps operators reduce costs, manage driver behaviour, and maintain DVLA compliance across their entire fleet.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Olaris help fleet managers reduce costs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Olaris tracks real-time cost per mile, excess mileage exposure, fuel and energy consumption, and driver behaviour impact across your fleet. By surfacing hidden costs that spreadsheets miss — like the link between aggressive driving and excess mileage charges — fleet managers typically identify 10-15% in preventable costs.",
      },
    },
    {
      '@type': 'Question',
      name: 'What vehicle manufacturers does Olaris support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Olaris connects to multiple vehicle manufacturers including Mercedes-Benz, BMW, Tesla, Volkswagen, Ford, and more through connected vehicle APIs. This multi-manufacturer support means you get a single view across your entire fleet, regardless of make or model.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Olaris integrate with DVLA for driver compliance?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Olaris provides automated DVLA licence checking, endorsement monitoring, and compliance alerts. Instead of manual checks, the platform continuously monitors driver licence status and flags issues before they become risks — helping fleet operators stay compliant without the admin overhead.',
      },
    },
  ],
}
