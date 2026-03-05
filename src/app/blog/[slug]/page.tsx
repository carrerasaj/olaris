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
import { constructMetadata, siteConfig } from '@/lib/seo'
import { blogPosts } from '@/data/blogPosts'

const slugToFile: Record<string, string> = {
  'fleet-cost-report': 'blog-01-fleet-cost-report.md',
  'excess-mileage': 'blog-02-excess-mileage.md',
  'driver-behaviour-insurance': 'blog-03-driver-behaviour-insurance.md',
  'dvla-compliance': 'blog-04-dvla-compliance.md',
  'scope-123-fleet': 'blog-05-fleet-carbon-reporting.md',
}

const categoryColours: Record<string, string> = {
  'Cost Intelligence': 'bg-cyan-100 text-cyan-800',
  Mileage: 'bg-blue-100 text-blue-800',
  'Driver Behaviour': 'bg-emerald-100 text-emerald-800',
  Compliance: 'bg-amber-100 text-amber-800',
  ESG: 'bg-teal-100 text-teal-800',
}

const relatedPosts: Record<string, string[]> = {
  'fleet-cost-report': ['excess-mileage', 'driver-behaviour-insurance'],
  'excess-mileage': ['fleet-cost-report', 'scope-123-fleet'],
  'driver-behaviour-insurance': ['dvla-compliance', 'fleet-cost-report'],
  'dvla-compliance': ['driver-behaviour-insurance', 'scope-123-fleet'],
  'scope-123-fleet': ['excess-mileage', 'dvla-compliance'],
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
  return constructMetadata({
    title: frontmatter.metaTitle || frontmatter.title,
    description: frontmatter.metaDescription || '',
  })
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
  const postUrl = `${siteConfig.url}/blog/${slug}`
  const dateStr = frontmatter.date.toString().split('T')[0]

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: frontmatter.title,
    description: frontmatter.metaDescription || '',
    datePublished: dateStr,
    dateModified: dateStr,
    author: {
      '@type': 'Person',
      name: 'Alan Carreras',
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    url: postUrl,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteConfig.url}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: frontmatter.title,
        item: postUrl,
      },
    ],
  }

  const related = (relatedPosts[slug] || [])
    .map((id) => blogPosts.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

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

          {related.length > 0 && (
            <div className="mt-16 pt-8 border-t border-olaris-border-light">
              <h3 className="text-lg font-bold font-heading mb-6">
                Related Reading
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((post) => (
                  <Link
                    key={post!.id}
                    href={`/blog/${post!.id}`}
                    className="group block p-4 rounded-lg border border-olaris-border-light hover:border-cyan-300 transition-colors"
                  >
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-2 ${
                        categoryColours[post!.category] ||
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {post!.category}
                    </span>
                    <h4 className="text-sm font-semibold leading-snug group-hover:text-cyan-600 transition-colors">
                      {post!.title}
                    </h4>
                    <p className="text-xs text-olaris-text-dark/50 mt-1">
                      {post!.readTime}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

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
