import { Metadata } from 'next'
import Link from 'next/link'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { NewsletterSignup } from '@/components/sections/NewsletterSignup'
import { blogPosts } from '@/data/blogPosts'

export const metadata: Metadata = constructMetadata({
  title: 'Fleet Management Blog: Insights, Tips & Industry News | Olaris',
  description:
    'Fleet management guides, industry insights and best practices for UK fleet operators. Mileage management, driver monitoring, compliance & EV transition.',
  url: 'https://olaris.co.uk/blog',
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const categoryColours: Record<string, string> = {
  'Cost Intelligence': 'bg-cyan-100 text-cyan-800',
  Mileage: 'bg-blue-100 text-blue-800',
  'Driver Behaviour': 'bg-emerald-100 text-emerald-800',
  Compliance: 'bg-amber-100 text-amber-800',
  ESG: 'bg-teal-100 text-teal-800',
}

export default function BlogPage() {
  return (
    <>
      <GradientHero
        size="compact"
        title="Blog"
        subtitle="Fleet management insights from people who have actually done it."
        showPattern={false}
      />

      <SectionWrapper variant="light">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`} className="group">
              <Card variant="light" className="flex flex-col h-full">
                {/* Category + date */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      categoryColours[post.category] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {post.category}
                  </span>
                  <span className="text-xs text-olaris-text-dark/40">
                    {post.readTime}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold font-heading leading-tight mb-2 group-hover:text-cyan-600 transition-colors">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-sm text-olaris-text-dark/60 leading-relaxed flex-1">
                  {post.excerpt}
                </p>

                {/* Date + read prompt */}
                <div className="mt-4 pt-3 border-t border-olaris-border-light flex items-center justify-between">
                  <span className="text-xs text-olaris-text-dark/40">
                    {formatDate(post.date)}
                  </span>
                  <span className="text-xs font-medium text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read article &rarr;
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </SectionWrapper>
      <NewsletterSignup
        heading="Stay ahead of the fleet"
        subtext="Join UK fleet operators getting industry insights, practical guides, and expert commentary."
      />
    </>
  )
}
