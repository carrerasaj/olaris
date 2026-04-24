import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { AuthorBio } from '@/components/ui/AuthorBio'
import { constructMetadata, siteConfig } from '@/lib/seo'
import { RelatedPostsBlock } from '@/components/blog/RelatedPostsBlock'

const slugToFile: Record<string, string> = {
  'fleet-cost-report': 'blog-01-fleet-cost-report.md',
  'excess-mileage': 'blog-02-excess-mileage.md',
  'driver-behaviour-insurance': 'blog-03-driver-behaviour-insurance.md',
  'dvla-compliance': 'blog-04-dvla-compliance.md',
  'scope-123-fleet': 'blog-05-fleet-carbon-reporting.md',
  'ev-transition-fleet': 'blog-06-ev-transition-fleet.md',
  'connected-vehicle-data': 'blog-07-connected-vehicle-data.md',
  'lease-company-mileage': 'blog-08-lease-company-mileage.md',
  'fleet-data-single-view': 'blog-09-fleet-data-single-view.md',
  'fleet-management-2026': 'blog-10-fleet-management-2026.md',
  'what-is-fleet-intelligence': 'blog-11-what-is-fleet-intelligence.md',
  'what-is-grey-fleet': 'blog-12-what-is-grey-fleet.md',
  'what-is-driver-behaviour-scoring': 'blog-13-what-is-driver-behaviour-scoring.md',
  'what-is-fleet-compliance': 'blog-14-what-is-fleet-compliance.md',
  'what-is-an-at-risk-driver': 'blog-15-what-is-an-at-risk-driver.md',
  'fleet-data-audit': 'blog-16-fleet-data-audit.md',
}

const categoryColours: Record<string, string> = {
  'Cost Intelligence': 'bg-cyan-100 text-cyan-800',
  Mileage: 'bg-blue-100 text-blue-800',
  'Driver Behaviour': 'bg-emerald-100 text-emerald-800',
  Compliance: 'bg-amber-100 text-amber-800',
  ESG: 'bg-teal-100 text-teal-800',
  'Thought Leadership': 'bg-violet-100 text-violet-800',
  'Fleet Management': 'bg-indigo-100 text-indigo-800',
}

function getBlogPost(slug: string) {
  const filename = slugToFile[slug]
  if (!filename) return null

  const filePath = path.join(process.cwd(), 'marketing', 'blog-posts', filename)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return { frontmatter: data, content }
}

async function markdownToHtml(markdown: string) {
  // Remove the first H1 heading (we render it in the hero)
  const withoutH1 = markdown.replace(/^#\s+.+$/m, '').trim()
  const result = await remark().use(html).process(withoutH1)
  return result.toString()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getReadTime(content: string) {
  const words = content.split(/\s+/).length
  return `${Math.ceil(words / 250)} min read`
}

export function generateStaticParams() {
  return Object.keys(slugToFile).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return constructMetadata()

  const { frontmatter } = post
  const postUrl = `${siteConfig.url}/blog/${slug}`
  const dateStr = frontmatter.date.toString().split('T')[0]
  const base = constructMetadata({
    title: frontmatter.metaTitle || frontmatter.title,
    description: frontmatter.metaDescription || '',
    url: postUrl,
  })
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: dateStr,
      authors: ['Alan Carreras'],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const { frontmatter, content } = post
  const htmlContent = await markdownToHtml(content)
  const readTime = getReadTime(content)

  return (
    <>
      <GradientHero
        size="compact"
        title={
          <span className="text-3xl sm:text-4xl md:text-5xl">
            {frontmatter.title}
          </span>
        }
        showPattern={false}
      >
        <div className="flex items-center justify-center gap-3 mt-4">
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              categoryColours[frontmatter.category] ||
              'bg-gray-100 text-gray-800'
            }`}
          >
            {frontmatter.category}
          </span>
          <span className="text-sm text-olaris-text-secondary">
            {formatDate(frontmatter.date.toString())}
          </span>
          <span className="text-sm text-olaris-text-secondary">{readTime}</span>
        </div>
      </GradientHero>

      <SectionWrapper variant="light">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-olaris-text-dark/50 hover:text-cyan-600 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <article
            className="prose-blog"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          <AuthorBio />

          <RelatedPostsBlock current={slug} />


          <div className="mt-8 pt-8 border-t border-olaris-border-light">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all articles
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
