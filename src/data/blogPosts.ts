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
  {
    id: 'ev-transition-fleet',
    title: "Your Fleet's EV Transition: Start With Data, Not Enthusiasm",
    excerpt:
      "Why blanket EV mandates fail. Use real usage data to transition the right vehicles first and unlock genuine ROI.",
    category: 'ESG',
    readTime: '9 min read',
    date: '2026-03-18',
  },
  {
    id: 'connected-vehicle-data',
    title: 'Your Vehicles Are Already Talking. Are You Listening?',
    excerpt:
      "15+ manufacturers now share live telemetry via OEM APIs. Most fleets don't know it exists. Here's what changes when you plug in.",
    category: 'Thought Leadership',
    readTime: '8 min read',
    date: '2026-03-18',
  },
  {
    id: 'lease-company-mileage',
    title: 'Mileage Compliance Is Where Lease Company Margins Live and Die',
    excerpt:
      "Excess mileage charges, residual values, condition assessment — why live mileage tracking is now table stakes for lease fleet operations.",
    category: 'Mileage',
    readTime: '7 min read',
    date: '2026-03-18',
  },
  {
    id: 'fleet-data-single-view',
    title: 'Five Systems, One Spreadsheet, and a Prayer: Why Fleet Data Needs a Single View',
    excerpt:
      "Telematics, fuel cards, DVLA, maintenance, insurance scattered across systems. Here's how to bring it together without rip-and-replace.",
    category: 'Thought Leadership',
    readTime: '8 min read',
    date: '2026-03-18',
  },
  {
    id: 'fleet-management-2026',
    title: 'Fleet Management in 2026: Five Trends That Will Define the Year',
    excerpt:
      "Connected vehicle APIs, real-time mileage tracking, mandatory ESG reporting, and practical AI. What's changing in fleet management in 2026.",
    category: 'Thought Leadership',
    readTime: '10 min read',
    date: '2026-03-18',
  },
  {
    id: 'what-is-grey-fleet',
    title: 'What is Grey Fleet? And What Are You Actually Responsible For?',
    excerpt:
      "Grey fleet vehicles outnumber company cars 14 to 1 in the UK. Here's what grey fleet means, what you're legally responsible for, and how to manage it properly.",
    category: 'Compliance',
    readTime: '8 min read',
    date: '2026-03-18',
  },
  {
    id: 'what-is-fleet-intelligence',
    title: 'What is Fleet Intelligence?',
    excerpt:
      'Fleet intelligence turns raw vehicle data into decisions. Learn how it differs from fleet management and why UK operators are making the shift.',
    category: 'Thought Leadership',
    readTime: '7 min read',
    date: '2026-03-18',
  },
]
