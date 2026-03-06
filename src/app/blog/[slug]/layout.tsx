import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { siteConfig } from '@/lib/seo'

const slugToFile: Record<string, string> = {
  'fleet-cost-report': 'blog-01-fleet-cost-report.md',
  'excess-mileage': 'blog-02-excess-mileage.md',
  'driver-behaviour-insurance': 'blog-03-driver-behaviour-insurance.md',
  'dvla-compliance': 'blog-04-dvla-compliance.md',
  'scope-123-fleet': 'blog-05-fleet-carbon-reporting.md',
}

function getFrontmatter(slug: string) {
  const filename = slugToFile[slug]
  if (!filename) return null

  const filePath = path.join(process.cwd(), 'marketing', 'blog-posts', filename)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  return matter(raw).data
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const frontmatter = getFrontmatter(slug)

  if (!frontmatter) return <>{children}</>

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
      {children}
    </>
  )
}
