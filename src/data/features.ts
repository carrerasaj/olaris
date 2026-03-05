export interface Feature {
  title: string
  description: string
  icon: string
  comingSoon?: boolean
}

export const additionalFeatures: Feature[] = [
  {
    title: 'Vehicle Sourcing',
    description: '150+ live vehicles, rate cards, multi-filter quotes',
    icon: 'Car',
  },
  {
    title: 'Grey Fleet',
    description: 'Personal vehicle insurance tracking, duty of care compliance',
    icon: 'ShieldCheck',
  },
  {
    title: 'CRM & Sales',
    description: 'Salesforce integration, sales funnel, contract management',
    icon: 'Users',
  },
  {
    title: 'Predictive Maintenance',
    description: 'Service prediction from real-time diagnostics data',
    icon: 'Wrench',
    comingSoon: true,
  },
  {
    title: 'Enterprise Security',
    description: 'Multi-tenant isolation, encryption, audit logging, GDPR compliance',
    icon: 'Lock',
  },
  {
    title: 'Integrations',
    description: 'High Mobility, Mapbox, DVLA, Salesforce, Dynamics 365, NetSuite',
    icon: 'Plug',
  },
]
