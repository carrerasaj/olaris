import Link from 'next/link'
import { blogPosts } from '@/data/blogPosts'
import { clusterForPost, siblingPosts } from '@/content/blog/clusters'

/**
 * Renders the "Related Reading" block at the bottom of a blog post.
 *
 * Reads from the cluster manifest in `src/content/blog/clusters.ts`
 * instead of a hardcoded per-post map. When a new post is added and
 * placed into a cluster, this component picks it up automatically
 * for every sibling post.
 *
 * Also renders a cluster-wide commercial CTA card so every blog post
 * has a clean outbound path to a conversion page — the SEO brief's
 * S1-04 concern about orphan posts.
 */

const categoryColours: Record<string, string> = {
  'Cost Intelligence': 'bg-cyan-100 text-cyan-800',
  Mileage: 'bg-blue-100 text-blue-800',
  'Driver Behaviour': 'bg-emerald-100 text-emerald-800',
  Compliance: 'bg-amber-100 text-amber-800',
  ESG: 'bg-teal-100 text-teal-800',
  'Thought Leadership': 'bg-violet-100 text-violet-800',
  'Fleet Management': 'bg-indigo-100 text-indigo-800',
}

interface Props {
  /** The current post's slug — the sibling picker excludes it. */
  current: string
  /** Max number of sibling cards to show. Defaults to 3. */
  limit?: number
}

export function RelatedPostsBlock({ current, limit = 3 }: Props) {
  const cluster = clusterForPost(current)
  if (!cluster) return null

  const siblingIds = siblingPosts(current, limit)
  const siblings = siblingIds
    .map((id) => blogPosts.find((p) => p.id === id))
    .filter((p): p is (typeof blogPosts)[number] => !!p)

  // No siblings yet — the cluster is young or the current post is the
  // only one. Still render the commercial CTA so the block isn't empty.
  const hasSiblings = siblings.length > 0

  return (
    <div className="mt-16 pt-8 border-t border-olaris-border-light">
      {hasSiblings && (
        <>
          <h3 className="text-lg font-bold font-heading mb-6">
            Related Reading
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {siblings.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group block p-4 rounded-lg border border-olaris-border-light hover:border-cyan-300 transition-colors"
              >
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-2 ${
                    categoryColours[post.category] ??
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {post.category}
                </span>
                <h4 className="text-sm font-semibold leading-snug group-hover:text-cyan-600 transition-colors">
                  {post.title}
                </h4>
                <p className="text-xs text-olaris-text-dark/50 mt-1">
                  {post.readTime}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Cluster commercial CTA — every post funnels to a conversion page. */}
      <Link
        href={cluster.commercialCTA.href}
        className="group block p-5 rounded-lg border-2 border-cyan-200 bg-cyan-50/40 hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
      >
        <div className="text-xs uppercase tracking-wide font-semibold text-cyan-700 mb-1">
          {cluster.label}
        </div>
        <div className="text-sm font-semibold text-olaris-text-dark group-hover:text-cyan-700 transition-colors">
          Continue with Olaris → <span className="underline">{cluster.commercialCTA.anchor}</span>
        </div>
      </Link>
    </div>
  )
}
