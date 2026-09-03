// Sitemap / IndexNow catalog must include every on-site listing page.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listings } from './listings.ts'
import { soldListings } from './sold-listings.ts'
import { getSiteUrlCatalog } from './site-urls.ts'
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

test('core GEO pages stay in the catalog', () => {
  const paths = new Set(getSiteUrlCatalog().map((e) => e.path))
  assert.ok(paths.has('/market/brentwood-tn'))
  assert.ok(paths.has('/neighborhoods'))
  assert.ok(paths.has('/listings'))
})
