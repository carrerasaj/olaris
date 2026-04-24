/**
 * Blog post cluster manifest.
 *
 * Each cluster groups topically-related posts around a single
 * commercial destination (pillar page, feature page, or tool). The
 * `<RelatedPostsBlock>` component reads this file to render "related
 * reading" at the end of blog posts — pulling cluster siblings
 * instead of a hardcoded per-post map.
 *
 * Adding a post:
 *   1. Add its slug to the cluster it belongs to below.
 *   2. `<RelatedPostsBlock cluster="..." current={slug} />` on the
 *      post template will pick it up automatically.
 *
 * Adding a cluster:
 *   1. Add a new entry with `slug`, `pillar`, `commercialCTA`, and
 *      `posts`.
 *   2. Update this comment's cluster list so future readers know the
 *      shape.
 *
 * The `pillar` is the page this cluster funnels traffic toward. Some
 * clusters don't have a dedicated pillar page yet (e.g. grey-fleet
 * until T3-01 ships) — that's fine. When the pillar exists, posts
 * will link to it; until then the `commercialCTA` does the work.
 */

export interface BlogCluster {
  /** URL-safe slug used as the lookup key in <RelatedPostsBlock cluster="..."> */
  slug: string
  /** Human-readable label for UI (e.g. future sprint dashboards) */
  label: string
  /** Pillar page URL — may not exist yet, in which case falls back to commercialCTA */
  pillar: string | null
  /** Commercial destination the cluster should convert toward */
  commercialCTA: { href: string; anchor: string }
  /** Blog post slugs in this cluster (must match src/data/blogPosts.ts ids) */
  posts: string[]
}

export const clusters: BlogCluster[] = [
  {
    slug: 'grey-fleet',
    label: 'Grey fleet',
    pillar: null, // /grey-fleet pillar ships in T3-01
    commercialCTA: {
      href: '/leasing/business-contract-hire',
      anchor: 'move drivers off grey fleet with a BCH agreement',
    },
    posts: ['what-is-grey-fleet'],
  },
  {
    slug: 'mileage',
    label: 'Mileage & excess charges',
    pillar: '/tools/excess-mileage-calculator',
    commercialCTA: {
      href: '/tools/excess-mileage-calculator',
      anchor: 'excess mileage calculator',
    },
    posts: ['excess-mileage', 'lease-company-mileage'],
  },
  {
    slug: 'cost-intelligence',
    label: 'Fleet cost intelligence',
    pillar: null,
    commercialCTA: {
      href: '/platform',
      anchor: 'fleet cost intelligence in Orbis',
    },
    posts: ['fleet-cost-report'],
  },
  {
    slug: 'driver-behaviour',
    label: 'Driver behaviour',
    pillar: '/features/driver-behaviour',
    commercialCTA: {
      href: '/features/driver-behaviour',
      anchor: 'driver behaviour scoring',
    },
    posts: [
      'driver-behaviour-insurance',
      'what-is-driver-behaviour-scoring',
      'what-is-an-at-risk-driver',
    ],
  },
  {
    slug: 'compliance',
    label: 'DVLA & compliance',
    pillar: '/features/dvla-compliance',
    commercialCTA: {
      href: '/features/dvla-compliance',
      anchor: 'DVLA compliance on autopilot',
    },
    posts: ['dvla-compliance', 'what-is-fleet-compliance'],
  },
  {
    slug: 'carbon-ev',
    label: 'Carbon & EV transition',
    pillar: '/features/ev-transition',
    commercialCTA: {
      href: '/features/ev-transition',
      anchor: 'EV transition planning',
    },
    posts: ['scope-123-fleet', 'ev-transition-fleet'],
  },
  {
    slug: 'fleet-intelligence',
    label: 'Fleet intelligence platform',
    pillar: '/platform',
    commercialCTA: {
      href: '/platform',
      anchor: 'fleet intelligence platform',
    },
    posts: [
      'connected-vehicle-data',
      'fleet-data-single-view',
      'fleet-management-2026',
      'what-is-fleet-intelligence',
      'fleet-data-audit',
    ],
  },
]

// ─── Derived lookups ────────────────────────────────────────────────────

/**
 * Map a post slug to its cluster. A post lives in exactly one cluster —
 * if this ever needs to go many-to-many, change the return type to an
 * array and update `<RelatedPostsBlock>`.
 */
export function clusterForPost(postSlug: string): BlogCluster | null {
  return clusters.find((c) => c.posts.includes(postSlug)) ?? null
}

/**
 * Sibling posts in the same cluster, excluding the current one.
 * Returns up to `limit` slugs (default 3).
 */
export function siblingPosts(postSlug: string, limit = 3): string[] {
  const cluster = clusterForPost(postSlug)
  if (!cluster) return []
  return cluster.posts.filter((s) => s !== postSlug).slice(0, limit)
}
