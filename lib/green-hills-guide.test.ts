import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { blogDateToIso, blogPosts } from './blog.ts'
import { chicagoIsoDate } from './gnar-snapshot.ts'
import { getSiteUrlCatalog } from './site-urls.ts'

const post = blogPosts.find((p) => p.slug === 'living-in-green-hills-nashville-tn-guide')
const neighborhoodPage = readFileSync('app/neighborhoods/[slug]/page.tsx', 'utf8')

test('Green Hills living guide is dated today and indexed', () => {
  assert.ok(post)
  assert.equal(post.date, 'October 22, 2026')
  assert.equal(post.dateModified, 'October 22, 2026')
  assert.equal(blogDateToIso(post.date), '2026-10-22')
  assert.ok(blogDateToIso(post.date)! <= chicagoIsoDate(new Date()))
  assert.equal(post.category, 'Relocation')
  const listed = getSiteUrlCatalog().find(
    (entry) => entry.path === '/blog/living-in-green-hills-nashville-tn-guide',
  )
  assert.ok(listed)
  assert.equal(listed.lastModified?.toISOString(), '2026-10-22T12:00:00.000Z')
})

test('Green Hills living guide stays Compass-only and refuses a neighborhood price', () => {
  assert.ok(post)
  const blob = `${post.title}\n${post.excerpt}\n${post.content}\n${post.faq?.map((f) => `${f.q} ${f.a}`).join('\n')}`
  assert.doesNotMatch(blob, /Parks|RE\/MAX|17-year|17 years|13 years|100\+ homes|price floor/i)
  assert.match(blob, /licensed since 2008/)
  assert.match(blob, /40\+ homes a year in Middle Tennessee/)
  assert.match(blob, /615-551-2727/)
  assert.match(blob, /8119 Isabella Lane Suite 105, Brentwood, TN 37027/)
  assert.match(blob, /Compass/)
  assert.match(blob, /2020/)
  assert.match(blob, /National Blue Ribbon/)
  assert.match(blob, /28 students/)
  assert.match(blob, /\$475,538/)
  assert.match(blob, /\$510,000/)
  assert.match(blob, /57 days/)
  assert.match(blob, /5\.7/)
  assert.match(blob, /715,884/)
  assert.match(blob, /745,904/)
  assert.match(blob, /no published Redfin or Greater Nashville REALTORS/)
  assert.match(blob, /\/neighborhoods\/green-hills-nashville-tn/)
  assert.match(blob, /\/homes-near\/julia-green-elementary-nashville-tn/)
  assert.doesNotMatch(blob, /\$700|\$2\.5|\$900K|83%|85%/)
  assert.match(neighborhoodPage, /\/blog\/living-in-green-hills-nashville-tn-guide/)
})
