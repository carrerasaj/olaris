export interface BlogPostPreview {
  id: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
}

export const blogPosts: BlogPostPreview[] = [
  {
    id: 'fleet-cost-report',
    title: 'Why Your Fleet Cost Report Is Wrong (And What to Do About It)',
    excerpt:
      'Most fleet cost reports rely on assumed MPG figures and estimated fuel prices. Here is why that approach costs you money — and how telemetry-based cost data changes the picture.',
    category: 'Cost Intelligence',
    readTime: '5 min read',
    date: '2026-02-15',
  },
  {
    id: 'excess-mileage',
    title: 'The Hidden Cost of Excess Mileage — and How to See It Coming',
    excerpt:
      'At 8p/mile, a single vehicle 10,000 miles over contract costs you £800. Across a fleet, it adds up fast. Live mileage tracking changes the game.',
    category: 'Mileage',
    readTime: '4 min read',
    date: '2026-01-28',
  },
  {
    id: 'driver-behaviour-insurance',
    title: 'How Driver Behaviour Scoring Changed One Fleet\'s Insurance Renewal',
    excerpt:
      'When you can show your insurer 12 months of improving driver behaviour data, the conversation changes. Here is how one fleet operator cut their premium by 15%.',
    category: 'Driver Behaviour',
    readTime: '6 min read',
    date: '2026-01-10',
  },
  {
    id: 'dvla-compliance',
    title: 'DVLA Compliance: What Most Fleet Managers Get Wrong',
    excerpt:
      'Manual licence checks, missed expiry dates, and Friday afternoon DVLA failures. If any of that sounds familiar, here is what automated compliance looks like.',
    category: 'Compliance',
    readTime: '5 min read',
    date: '2025-12-20',
  },
  {
    id: 'scope-123-fleet',
    title: 'Scope 1, 2, 3: A Practical Guide to Fleet Carbon Reporting',
    excerpt:
      'Carbon reporting does not have to be a spreadsheet exercise. Here is how to track Scope 1, 2, and 3 emissions from actual fleet data — not estimates.',
    category: 'Sustainability',
    readTime: '7 min read',
    date: '2025-12-05',
  },
]
