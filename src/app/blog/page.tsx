import { Metadata } from 'next'
import { constructMetadata } from '@/lib/seo'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Card } from '@/components/ui/Card'
import { blogPosts } from '@/data/blogPosts'

export const metadata: Metadata = constructMetadata({
  title: 'Blog | Olaris',
  description:
    'Fleet management insights, mileage tracking tips, driver behaviour analysis, and sustainability reporting — from people who actually run fleets.',
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
  Sustainability: 'bg-green-100 text-green-800',
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
            <Card key={post.id} variant="light" className="flex flex-col">
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
              <h2 className="text-lg font-bold font-heading leading-tight mb-2">
                {post.title}
              </h2>

              {/* Excerpt */}
              <p className="text-sm text-olaris-text-dark/60 leading-relaxed flex-1">
                {post.excerpt}
              </p>

              {/* Date */}
              <div className="mt-4 pt-3 border-t border-olaris-border-light text-xs text-olaris-text-dark/40">
                {formatDate(post.date)}
              </div>
            </Card>
          ))}
        </div>
      </SectionWrapper>
    </>
  )
}
