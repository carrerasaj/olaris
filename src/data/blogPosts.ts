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
      'We spent 15 years in fleet operations before we built Olaris, and for most of that time, we didn\'t actually know what our vehicles cost to run. Here\'s why your numbers are probably wrong too.',
    category: 'Cost Intelligence',
    readTime: '6 min read',
    date: '2026-03-05',
  },
  {
    id: 'excess-mileage',
    title: 'The Hidden Cost of Excess Mileage — and How to See It Coming',
    excerpt:
      'The invoice arrived on a Tuesday in November. £160,000 in excess mileage charges across a 200-vehicle fleet. At 8p per mile, the maths are simple and brutal.',
    category: 'Mileage',
    readTime: '8 min read',
    date: '2026-03-05',
  },
  {
    id: 'driver-behaviour-insurance',
    title: 'How Driver Behaviour Scoring Changed One Fleet\'s Insurance Renewal',
    excerpt:
      'The broker came back with two numbers. The standard renewal quote, and a second number with driver behaviour data attached. The difference was 12%. £14,500 in annual savings.',
    category: 'Driver Behaviour',
    readTime: '9 min read',
    date: '2026-03-05',
  },
  {
    id: 'dvla-compliance',
    title: 'DVLA Compliance: What Most Fleet Managers Get Wrong',
    excerpt:
      'A haulage company in Yorkshire was fined £250,000 after an accident involving an unlicensed driver. Their defence was "we didn\'t know." That didn\'t matter.',
    category: 'Compliance',
    readTime: '11 min read',
    date: '2026-03-05',
  },
  {
    id: 'scope-123-fleet',
    title: 'Scope 1, 2, 3: A Practical Guide to Fleet Carbon Reporting',
    excerpt:
      'Most fleet managers know they need to report carbon emissions. Few know how to do it accurately. Here\'s a practical breakdown of Scope 1, 2, and 3 for fleet operations.',
    category: 'ESG',
    readTime: '12 min read',
    date: '2026-03-05',
  },
]
