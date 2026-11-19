import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { blogDateToIso, blogPosts } from './blog.ts'
import { getSiteUrlCatalog } from './site-urls.ts'

const SLUG = 'selling-a-house-over-the-holidays-middle-tennessee'
const post = blogPosts.find((p) => p.slug === SLUG)
const strategy = readFileSync('docs/content-keyword-strategy.md', 'utf8')
const blogPage = readFileSync('app/blog/[slug]/page.tsx', 'utf8')

function wordCount(content: string): number {
  return content
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[#*_`>-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

function blobOf(entry: NonNullable<typeof post>): string {
  return [
    entry.title,
    entry.excerpt,
    entry.content,
    entry.disclosure ?? '',
    ...(entry.faq ?? []).map((f) => `${f.q} ${f.a}`),
  ].join('\n')
}

test('holiday seller post is dated November 19, 2026 and listed in the sitemap', () => {
  assert.ok(post)
  assert.equal(
    post.title,
    'Selling a House Over the Holidays in Middle Tennessee: Fewer Lookers, Better Buyers',
  )
  assert.equal(post.date, 'November 19, 2026')
  assert.equal(post.dateModified, 'November 19, 2026')
  assert.equal(blogDateToIso(post.date), '2026-11-19')
  assert.equal(blogDateToIso(post.dateModified), '2026-11-19')
  assert.equal(post.category, 'For Sellers')
  assert.ok(post.faq && post.faq.length >= 3 && post.faq.length <= 5)
  const words = wordCount(post.content)
  assert.ok(words >= 1200 && words <= 1600, `expected 1200-1600 words, got ${words}`)
  const listed = getSiteUrlCatalog().find((entry) => entry.path === `/blog/${SLUG}`)
  assert.ok(listed)
  assert.equal(listed.changeFrequency, 'monthly')
  assert.equal(listed.lastModified?.toISOString(), '2026-11-19T12:00:00.000Z')
  assert.match(blogPage, /FAQPage/)
  assert.match(strategy, /16 \| ✅ shipped 2026-11-19/)
  assert.match(strategy, new RegExp(SLUG))
})

test('holiday seller post uses the week 16 links and only published figures', () => {
  assert.ok(post)
  const blob = blobOf(post)
  for (const href of [
    '/sell/brentwood-tn',
    '/sell/franklin-tn',
    '/blog/selling-a-house-in-middle-tennessee-this-fall-2026',
    '/cash-offer/brentwood-tn',
    '/cash-offer/franklin-tn',
    '/blog/middle-tennessee-market-update-october-2026',
  ]) {
    assert.match(post.content, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(post.content, /Selling a house during the holidays/i)
  assert.match(blob, /\$499,990/)
  assert.match(blob, /6\.83 months/)
  assert.match(blob, /61 days on market/)
  assert.match(blob, /November 5, 2026/)
  assert.match(blob, /Greater Nashville REALTORS/)
  assert.match(blob, /\$862,929/)
  assert.match(blob, /\$1,424,058/)
  assert.match(blob, /Redfin, as of October 5, 2026/)
  assert.match(blob, /70-85%/)
  assert.match(blob, /licensed since 2008/)
  assert.match(blob, /40\+ homes a year/)
  assert.match(blob, /TREC #351484/)
  assert.match(blob, /Compass Real Estate/)
  assert.match(blob, /8119 Isabella Lane Suite 105, Brentwood, TN 37027/)
  assert.match(blob, /615-551-2727/)
  assert.doesNotMatch(blob, /\bParks\b/)
  assert.doesNotMatch(blob, /RE\/MAX/)
  assert.doesNotMatch(blob, /615-551-3399|6155513399/)
  assert.doesNotMatch(blob, /\d+%\s+(fewer|drop|decline)/i)
})
