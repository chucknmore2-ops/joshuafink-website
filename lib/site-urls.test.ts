// Sitemap / IndexNow catalog must include every on-site listing page.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listings } from './listings.ts'
import { soldListings } from './sold-listings.ts'
import { getSiteUrlCatalog, getSiteUrlsModifiedSince } from './site-urls.ts'
import { listingDetailPath, listingDetailSlugs } from './listing-detail.ts'

test('every listing detail slug is in the sitemap catalog exactly once', () => {
  const catalog = getSiteUrlCatalog()
  const listingPaths = catalog.filter((e) => e.path.startsWith('/listings/')).map((e) => e.path)
  const unique = new Set(listingPaths)
  assert.equal(unique.size, listingPaths.length, 'duplicate listing URLs in sitemap')
  assert.equal(listingPaths.length, listingDetailSlugs.size)

  for (const slug of Array.from(listingDetailSlugs)) {
    assert.ok(
      unique.has(`/listings/${slug}`),
      `missing /listings/${slug} from sitemap catalog`,
    )
  }
})

test('every sold home with an on-site page is in the sitemap', () => {
  for (const listing of soldListings) {
    const path = listingDetailPath(listing)
    assert.ok(path, listing.address)
    const entry = getSiteUrlCatalog().find((e) => e.path === path)
    assert.ok(entry, `${listing.address} missing from sitemap`)
    assert.equal(entry!.changeFrequency, 'monthly')
  }
})

test('active listing pages stay in the sitemap at daily frequency', () => {
  const listing = listings[0]
  const path = listingDetailPath(listing)
  assert.ok(path)
  const entry = getSiteUrlCatalog().find((e) => e.path === path)
  assert.ok(entry)
  assert.equal(entry!.changeFrequency, 'daily')
})

test('sitemap lastmod uses real content dates and omits pages without one', () => {
  const catalog = getSiteUrlCatalog()
  const stamped = catalog.filter((entry) => entry.lastModified)
  const days = new Set(stamped.map((entry) => entry.lastModified!.toISOString().slice(0, 10)))
  assert.ok(days.size > 1, 'lastmod should not be one shared build timestamp')

  const nashville = catalog.find((entry) => entry.path === '/cash-offer/nashville-tn')
  assert.equal(nashville?.lastModified?.toISOString(), '2026-10-17T12:00:00.000Z')
  const franklinCash = catalog.find((entry) => entry.path === '/cash-offer/franklin-tn')
  assert.equal(franklinCash?.lastModified?.toISOString(), '2026-10-05T12:00:00.000Z')
  const privacy = catalog.find((entry) => entry.path === '/privacy')
  assert.equal(privacy?.lastModified, undefined)
  const blog = catalog.find((entry) => entry.path.startsWith('/blog/'))
  assert.ok(blog?.lastModified)
})

test('IndexNow selects only URLs with a real lastmod inside the window', () => {
  const catalog = getSiteUrlCatalog()
  const recent = getSiteUrlsModifiedSince(new Date('2026-10-16T00:00:00.000Z'))
  assert.ok(recent.includes('https://www.joshuafink.com/cash-offer/nashville-tn'))
  assert.equal(recent.includes('https://www.joshuafink.com/cash-offer/franklin-tn'), false)
  assert.equal(recent.includes('https://www.joshuafink.com/privacy'), false)
  assert.ok(recent.length < catalog.length)
  assert.ok(recent.every((url) => url.startsWith('https://www.joshuafink.com')))
})

test('sitemap lastmod is not stamped with the build clock', () => {
  const now = Date.now()
  const catalog = getSiteUrlCatalog()
  for (const entry of catalog) {
    if (!entry.lastModified) continue
    assert.ok(
      Math.abs(entry.lastModified.getTime() - now) > 60 * 60 * 1000,
      `${entry.path} lastmod is within an hour of now, which is how a build-time stamp looks`,
    )
  }
})

test('core GEO pages stay in the catalog', () => {
  const paths = new Set(getSiteUrlCatalog().map((e) => e.path))
  assert.ok(paths.has('/market/brentwood-tn'))
  assert.ok(paths.has('/neighborhoods'))
  assert.ok(paths.has('/neighborhoods/cool-springs-franklin-tn'))
  assert.ok(paths.has('/neighborhoods/scales-farmstead-nolensville-tn'))
  assert.ok(paths.has('/neighborhoods/benington-nolensville-tn'))
  assert.ok(paths.has('/listings'))
})
