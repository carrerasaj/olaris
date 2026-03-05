export interface Industry {
  id: string
  title: string
  subtitle: string
  description: string
  painPoints: string[]
  whatChanges: string[]
  keyLine: string
  icon: string
}

export const industries: Industry[] = [
  {
    id: 'fleet-operators',
    title: 'Fleet Operators',
    subtitle:
      'You are running 50 to 5,000 vehicles and drowning in data from systems that don\'t talk to each other.',
    description:
      'Fragmented telemetry, manual compliance, cost reports nobody trusts, chasing mileage, no real driver accountability — you know the drill.',
    painPoints: [
      'Data scattered across six different systems with no single view',
      'Manual DVLA licence checks that slip through the cracks',
      'Cost reports that take days to build and nobody trusts the numbers',
      'No way to measure or improve driver behaviour at scale',
    ],
    whatChanges: [
      'Single view across every manufacturer — live mileage without chasing anyone',
      'DVLA checks that run themselves, with 48-hour expiry alerts',
      'Driver behaviour scoring that rewards the good and coaches the rest',
      'Cost data from actual consumption, not assumptions',
    ],
    keyLine:
      'You will spend less time in spreadsheets and more time managing your fleet.',
    icon: 'Truck',
  },
  {
    id: 'lease-companies',
    title: 'Lease Companies',
    subtitle:
      'We have built and run a lease company. We know where the margin leaks.',
    description:
      'Your margin lives and dies on mileage compliance, vehicle condition, and knowing what is happening on every contract. We have sat where you sit.',
    painPoints: [
      'Excess mileage charges discovered at end of contract — too late to fix',
      'No visibility on how drivers are treating your assets mid-term',
      'Manual contract lifecycle reporting that takes days',
      'Residual value surprises on battery health and odometer discrepancies',
    ],
    whatChanges: [
      'Live mileage tracking against contract allowance with projected end-of-contract mileage',
      'Driver behaviour scoring identifies who is punishing your assets before return',
      'Automated reporting and audit trail from onboarding to end-of-life',
      'Battery health + odometer data for accurate end-of-contract valuations',
    ],
    keyLine:
      'We built this for lease companies because we are one. The problems this solves are problems we have had ourselves.',
    icon: 'FileText',
  },
  {
    id: 'oems',
    title: 'OEMs & Manufacturers',
    subtitle:
      'You have connected vehicle data. The question is what you are doing with it.',
    description:
      'Your vehicles are generating data every second. We help you turn it into fleet-level intelligence that your customers and dealers actually use.',
    painPoints: [
      'Connected vehicle data sitting in silos with no fleet-level view',
      'Real-world efficiency figures that don\'t match lab results',
      'No visibility on battery degradation across the fleet',
      'Dealer and fleet programmes lacking data-driven EV transition insights',
    ],
    whatChanges: [
      'High Mobility direct integration across 15+ manufacturers',
      'Real-world efficiency vs lab figures for honest fleet conversations',
      'Battery health and degradation tracking across the whole fleet',
      'Carbon and ESG reporting for corporate sustainability commitments',
    ],
    keyLine:
      'Turn connected vehicle data into fleet-level intelligence.',
    icon: 'Factory',
  },
  {
    id: 'brokers',
    title: 'Brokers & Intermediaries',
    subtitle:
      'Your clients want choice, speed, and the right mileage on the contract.',
    description:
      'Less time on the phone chasing quotes. More time closing deals with the right vehicle at the right mileage band.',
    painPoints: [
      'Hours spent sourcing vehicles and comparing rate cards manually',
      'Clients choosing the wrong mileage band and facing excess charges later',
      'No CRM integration — deals tracked in spreadsheets',
      'Renewal conversations without data to back up recommendations',
    ],
    whatChanges: [
      'Live vehicle stock — 150+ vehicles with rate cards and multi-filter search',
      'Quote engine for instant pricing across fuel type, finance product, term, and mileage bands',
      'Sales funnel and CRM integration for end-to-end deal tracking',
      'Real mileage data to help clients right-size their contract allowance',
    ],
    keyLine:
      'Less time on the phone, more time closing.',
    icon: 'Handshake',
  },
]
