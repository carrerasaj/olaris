#!/usr/bin/env node
/**
 * IndexNow ping script — run after deploy to notify Bing of updated URLs.
 * Usage: node scripts/indexnow-ping.js
 *
 * Blog slugs are discovered dynamically by scanning marketing/blog-posts/
 * so new posts are picked up automatically without editing this script.
 *
 * Uses the bulk POST API to submit all URLs in a single request.
 */

const { readdirSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')

const HOST = 'olaris.co.uk'
const BASE_URL = `https://${HOST}`
const INDEXNOW_KEY = '66d844914d944ade83dedcc592be221a'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow'

// Derive slugs from markdown filenames: blog-01-fleet-cost-report.md -> fleet-cost-report
function discoverBlogSlugs() {
  const dir = join(ROOT, 'marketing', 'blog-posts')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/^blog-\d+-/, '').replace(/\.md$/, ''))
    .sort()
}

// Derive slugs from subdirectory names under src/app/features/
function discoverFeatureSlugs() {
  const dir = join(ROOT, 'src', 'app', 'features')
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

const STATIC_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/leasing`,
  `${BASE_URL}/leasing/business-contract-hire`,
  `${BASE_URL}/leasing/salary-sacrifice`,
  `${BASE_URL}/platform`,
  `${BASE_URL}/industries`,
  `${BASE_URL}/about`,
  `${BASE_URL}/contact`,
  `${BASE_URL}/blog`,
  `${BASE_URL}/tools/excess-mileage-calculator`,
]

const BLOG_URLS = discoverBlogSlugs().map((slug) => `${BASE_URL}/blog/${slug}`)
const FEATURE_URLS = discoverFeatureSlugs().map((slug) => `${BASE_URL}/features/${slug}`)

const ALL_URLS = [...STATIC_URLS, ...BLOG_URLS, ...FEATURE_URLS]

async function main() {
  console.log(`Submitting ${ALL_URLS.length} URLs to IndexNow...`)

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: ALL_URLS,
    }),
  })

  if (res.status === 200 || res.status === 202) {
    console.log(`  ✓ ${res.status} — all ${ALL_URLS.length} URLs submitted successfully.`)
  } else {
    console.warn(`  ✗ ${res.status} — IndexNow submission failed.`)
    console.warn('  This is non-fatal; the build will continue.')
  }
}

main().catch((err) => {
  console.error('IndexNow ping failed:', err)
  console.warn('This is non-fatal; the build will continue.')
})
