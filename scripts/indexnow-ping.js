#!/usr/bin/env node
/**
 * IndexNow ping script — run after deploy to notify Bing of updated URLs.
 * Usage: node scripts/indexnow-ping.js
 */

const BASE_URL = 'https://olaris.co.uk'
const INDEXNOW_KEY = 'a3f8c2d17e4b59061f0e3a825d6c9741'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow'

const BLOG_SLUGS = [
  'fleet-cost-report',
  'excess-mileage',
  'driver-behaviour-insurance',
  'dvla-compliance',
  'scope-123-fleet',
  'ev-transition-fleet',
  'connected-vehicle-data',
  'lease-company-mileage',
  'fleet-data-single-view',
  'fleet-management-2026',
  'what-is-fleet-intelligence',
  'what-is-grey-fleet',
  'what-is-driver-behaviour-scoring',
  'what-is-fleet-compliance',
  'what-is-an-at-risk-driver',
]

const FEATURE_SLUGS = [
  'mileage-tracking',
  'driver-behaviour',
  'dvla-compliance',
  'ev-transition',
  'cost-tracking',
]

const STATIC_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/platform`,
  `${BASE_URL}/industries`,
  `${BASE_URL}/about`,
  `${BASE_URL}/contact`,
  `${BASE_URL}/blog`,
  `${BASE_URL}/tools/excess-mileage-calculator`,
]

const BLOG_URLS = BLOG_SLUGS.map((slug) => `${BASE_URL}/blog/${slug}`)
const FEATURE_URLS = FEATURE_SLUGS.map((slug) => `${BASE_URL}/features/${slug}`)

const ALL_URLS = [...STATIC_URLS, ...BLOG_URLS, ...FEATURE_URLS]

async function pingUrl(url) {
  const endpoint = `${INDEXNOW_ENDPOINT}?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}`
  const res = await fetch(endpoint)
  return { url, status: res.status }
}

async function main() {
  console.log(`Pinging IndexNow for ${ALL_URLS.length} URLs...`)

  const results = await Promise.allSettled(ALL_URLS.map(pingUrl))

  let ok = 0
  let failed = 0

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { url, status } = result.value
      // 200 = submitted, 202 = accepted (already known), both are success
      if (status === 200 || status === 202) {
        console.log(`  ✓ ${status} ${url}`)
        ok++
      } else {
        console.warn(`  ✗ ${status} ${url}`)
        failed++
      }
    } else {
      console.error(`  ✗ ERROR ${result.reason}`)
      failed++
    }
  }

  console.log(`\nDone: ${ok} succeeded, ${failed} failed.`)

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('IndexNow ping failed:', err)
  process.exit(1)
})
