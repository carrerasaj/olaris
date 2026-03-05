export interface Outcome {
  id: string
  title: string
  tagline: string
  description: string
  details: string[]
  callout?: string
  icon: string
}

export const outcomes: Outcome[] = [
  {
    id: 'fleet-visibility',
    title: 'Your fleet, visible',
    tagline: 'Know where every vehicle is — and where every mile goes',
    description:
      'Live tracking, real-time mileage reads, and vehicle health — across every manufacturer. No more spreadsheets, no more chasing drivers. You open the dashboard and the data is there.',
    details: [
      'Real-time telemetry from 15+ manufacturers including Mercedes, BMW, Tesla, VW, Audi, Volvo, and more',
      'Live odometer reads — no driver input needed. Automatic mileage-vs-contract tracking.',
      'Projected annual mileage from actual driving patterns, not guesswork',
      'Early warning when a vehicle is trending towards excess charges',
      'Fleet utilisation benchmarking — average miles/day, active days, underutilised vehicle flagging',
    ],
    callout:
      'Excess mileage charges are one of the biggest hidden costs in fleet. A single vehicle 10,000 miles over at 8p/mile is £800. Across a 200-vehicle fleet, that is tens of thousands — entirely preventable with live tracking.',
    icon: 'MapPin',
  },
  {
    id: 'driver-management',
    title: 'Your drivers, accountable',
    tagline: 'Compliant drivers. Better drivers. A culture that sticks.',
    description:
      'DVLA compliance on autopilot. Behaviour scoring that rewards good driving and coaches the rest. The culture shifts — and your insurance premiums, vehicle condition, and downtime improve with it.',
    details: [
      'DVLA government integration (not a scraper) — automated quarterly, bi-annual, or annual checks',
      '48-hour advance expiry alerts with full audit trail and PII masking',
      'Telemetry-based driver scoring — harsh braking, acceleration, speed, idling, cornering',
      'League tables, badges, and trend tracking. Drivers see their own scores.',
      'Coaching triggers — automatic flagging when behaviour dips, with specific improvement areas',
    ],
    callout:
      'Better driving behaviour has a direct line to your bottom line. Smoother driving means less tyre, brake, and suspension wear. Fewer incidents means fewer vehicles in the bodyshop. And aggressive driving increases fuel consumption by up to 33%.',
    icon: 'Users',
  },
  {
    id: 'cost-control',
    title: 'Your costs, honest',
    tagline: 'The numbers you can actually trust',
    description:
      'Real fuel and energy costs from actual consumption. Mileage tracked against contract allowances. Excess charges spotted 6 months before the vehicle comes back.',
    details: [
      'Real fuel/energy costs from telemetry — not assumed MPG figures',
      '21 pre-seeded UK energy tariffs (Octopus Go, Tesla Supercharger, BP Pulse, Pod Point, and more)',
      'TCO breakdown: maintenance + finance + fuel + insurance per vehicle',
      'Fleet-wide and per-vehicle cost dashboards',
      'Automated contract reporting with scheduled email delivery',
    ],
    callout:
      'That monthly report that takes two days to pull together? It is a dashboard now.',
    icon: 'TrendingDown',
  },
  {
    id: 'sustainability',
    title: 'Your future, measurable',
    tagline: 'Net zero as a measurement, not a slogan',
    description:
      'EV transition planning built from your actual fleet data. Carbon tracking that goes beyond a spreadsheet. A net-zero roadmap that is a measurement, not a marketing exercise.',
    details: [
      'EV route planning with charging stops and range anxiety elimination',
      'Home vs public charging cost comparison — 70% savings on home charging',
      'Battery health monitoring and degradation tracking',
      'Scope 1, 2, 3 emissions tracking across the entire fleet',
      'Carbon offset marketplace — purchase, hold, and retire credits',
      'Net-zero acceleration modelling from actual fleet data',
    ],
    callout:
      'For a 20-vehicle fleet switching to 80% home charging, that is £25,500/year in energy savings alone.',
    icon: 'Leaf',
  },
]
