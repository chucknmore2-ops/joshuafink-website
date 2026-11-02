import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { blogDateToIso, blogPosts } from './blog.ts'
import { getSiteUrlCatalog } from './site-urls.ts'
import { suburbs } from './suburbs.ts'
import { franklinPriceSentence } from './franklin-family-guide.ts'

const SLUG = 'best-franklin-neighborhoods-for-families-2026'
const post = blogPosts.find((p) => p.slug === SLUG)
const neighborhoodPage = readFileSync('app/neighborhoods/[slug]/page.tsx', 'utf8')
const blogPage = readFileSync('app/blog/[slug]/page.tsx', 'utf8')
const schoolZones = blogPosts.find((p) => p.slug === 'best-williamson-county-school-zones-2026')

function blobOf(entry: NonNullable<typeof post>): string {
  return [
    entry.title,
    entry.excerpt,
    entry.content,
    ...(entry.faq ?? []).map((f) => `${f.q} ${f.a}`),
  ].join('\n')
}

test('Franklin family neighborhoods post is dated November 2026 and in the sitemap', () => {
  assert.ok(post)
  assert.equal(post.title, 'Best Franklin Neighborhoods for Families (2026)')
  assert.equal(post.date, 'November 2, 2026')
  assert.equal(post.dateModified, 'November 2, 2026')
  assert.equal(blogDateToIso(post.date), '2026-11-02')
  assert.equal(blogDateToIso(post.dateModified), '2026-11-02')
  assert.match(post.content, /Last updated November 2, 2026/)
  assert.equal(post.category, 'For Families')
  assert.ok(post.faq && post.faq.length >= 3)
  const listed = getSiteUrlCatalog().find((entry) => entry.path === `/blog/${SLUG}`)
  assert.ok(listed)
  assert.equal(listed.changeFrequency, 'monthly')
  assert.equal(listed.lastModified?.toISOString(), '2026-11-02T12:00:00.000Z')
})

test('the post links the required guides and only repeats sourced citywide figures', () => {
  assert.ok(post)
  const blob = blobOf(post)
  for (const href of [
    '/neighborhoods/westhaven-franklin-tn',
    '/neighborhoods/fieldstone-farms-franklin-tn',
    '/neighborhoods/mckays-mill-franklin-tn',
    '/neighborhoods/berry-farms-franklin-tn',
    '/neighborhoods/highlands-at-ladd-park-franklin-tn',
    '/neighborhoods/cool-springs-franklin-tn',
    '/blog/best-williamson-county-school-zones-2026',
    '/buy/franklin-tn',
    '/contact',
  ]) {
    assert.match(blob, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.ok(blob.includes(franklinPriceSentence()), 'citywide price sentence drifted from suburbs.ts')
  assert.match(blob, /\$862,929/)
  assert.match(blob, /\$330\.85/)
  assert.match(blob, /Source: Redfin, as of October 5, 2026/)
  assert.equal(suburbs['franklin-tn'].medianPrice, '$862,929')
  assert.match(blob, /23\.9 minutes/)
  assert.match(blob, /2020–2024/)
  assert.match(blob, /October 17, 2026/)
  assert.match(blob, /3,130/)
  assert.match(blob, /42,000/)
  assert.match(blob, /25\.3/)
  assert.match(blob, /18 city parks/)
  assert.match(blob, /900 acres/)
  // Subdivision price bands in lib/neighborhoods.ts have no source or as-of date.
  assert.doesNotMatch(blob, /\$650K|\$2\.5M|\$550K|\$1\.8M|\$900K|\$1\.2M|\$1\.1M|mid-\$600s|\$700K|\$1\.5M/)
  assert.doesNotMatch(blob, /5–10 min|15–20 min|20–30 min/)
})

test('author line is Compass only, and neighborhood pages plus the school-zones post link back', () => {
  assert.ok(post)
  assert.ok(schoolZones)
  const blob = blobOf(post)
  assert.match(blob, /licensed since 2008/)
  assert.match(blob, /TREC #351484/)
  assert.match(blob, /Compass Real Estate/)
  assert.doesNotMatch(blob, /\bParks\b/)
  assert.doesNotMatch(blob, /RE\/MAX/)
  assert.match(schoolZones.content, new RegExp(`/blog/${SLUG}`))
  assert.match(neighborhoodPage, new RegExp(`/blog/${SLUG}`))
  for (const slug of [
    'westhaven-franklin-tn',
    'fieldstone-farms-franklin-tn',
    'mckays-mill-franklin-tn',
    'berry-farms-franklin-tn',
    'highlands-at-ladd-park-franklin-tn',
    'cool-springs-franklin-tn',
  ]) {
    assert.match(neighborhoodPage, new RegExp(slug))
  }
  assert.match(blogPage, /FAQPage/)
  assert.match(blogPage, /BlogPosting/)
  assert.match(blogPage, /Last updated/)
  assert.match(blogPage, /licensed since 2008/)
  assert.match(blogPage, /TREC #351484/)
  assert.match(blogPage, /Compass Real Estate/)
  assert.doesNotMatch(blogPage, /\bParks\b/)
})
