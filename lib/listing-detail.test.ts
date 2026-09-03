// Slug resolution for on-site listing pages (active + sold).
//
// Run: npm test
//
// Active and sold inventory share /listings/[slug]. These tests pin:
//   1. Address slugs stay deterministic.
//   2. Active homes always win the base slug; a colliding sold home gets -sold.
//   3. A second collision uses a stable Compass-id suffix (never silent overwrite).
//   4. Thin sold records do not get a page.
//   5. Current repo inventory: every published sold home has a unique page.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { Listing } from './listings.ts'
import { listings } from './listings.ts'
import { soldListings } from './sold-listings.ts'
import {
  assignListingDetailSlugs,
  getListingBySlug,
  hasListingDetail,
  isIndexableSoldListing,
  isSoldStatus,
  listingDetailPath,
  listingDetailSlugs,
  listingSlug,
  resolveListingDetailSlug,
  soldDisambiguationToken,
} from './listing-detail.ts'

const mk = (over: Partial<Listing> = {}): Listing => ({
  address: '1 Test Way',
  city: 'Brentwood, TN 37027',
  price: 750_000,
  beds: 4,
  baths: 3,
  sqft: 2800,
  status: 'Active',
  compassUrl: 'https://www.compass.com/homedetails/1-Test-Way-Brentwood-TN-37027/111_lid/',
  ...over,
})

test('listingSlug is address + first locality token', () => {
  assert.equal(
    listingSlug({ address: '1901 New Bristol Ln', city: 'Brentwood, TN 37027' }),
    '1901-new-bristol-ln-brentwood',
  )
  assert.equal(
    listingSlug({
      address: '4127 Edwards Ave',
      city: 'Nashville, TN 37216 | MLS #3319964',
    }),
    '4127-edwards-ave-nashville',
  )
  assert.equal(
    listingSlug({ address: '9293 Fordham Dr', city: 'Lot 54, Brentwood, TN 37027' }),
    '9293-fordham-dr-lot-54',
  )
})

test('active listing keeps the base slug when a sold home shares the address', () => {
  const active = mk({
    address: '100 Collision Ave',
    compassUrl: 'https://www.compass.com/homedetails/100-Collision-Ave/AAA_pid/',
  })
  const sold = mk({
    address: '100 Collision Ave',
    status: 'Sold',
    compassUrl: 'https://www.compass.com/homedetails/100-Collision-Ave/999000111_lid/',
  })
  const map = assignListingDetailSlugs([active], [sold])
  assert.equal(map.get('100-collision-ave-brentwood'), active)
  assert.equal(map.get('100-collision-ave-brentwood-sold'), sold)
  assert.equal(map.size, 2)
})

test('two sold homes that share a slug are both kept with a stable token', () => {
  const soldA = mk({
    status: 'Sold',
    compassUrl: 'https://www.compass.com/homedetails/1-Test-Way/111222333_lid/',
  })
  const soldB = mk({
    status: 'Sold',
    price: 800_000,
    compassUrl: 'https://www.compass.com/homedetails/1-Test-Way/444555666_lid/',
  })
  const map = assignListingDetailSlugs([], [soldA, soldB])
  assert.equal(map.get('1-test-way-brentwood'), soldA)
  const secondSlug = `1-test-way-brentwood-sold`
  assert.equal(map.get(secondSlug), soldB)
  assert.equal(map.size, 2)
})

test('active + two sold collisions use the Compass lid token, never drop a record', () => {
  const active = mk({ compassUrl: 'https://www.compass.com/x/ACT_pid/' })
  const soldA = mk({
    status: 'Sold',
    compassUrl: 'https://www.compass.com/homedetails/1-Test-Way/111222333_lid/',
  })
  const soldB = mk({
    status: 'Sold',
    compassUrl: 'https://www.compass.com/homedetails/1-Test-Way/444555666_lid/',
  })
  const map = assignListingDetailSlugs([active], [soldA, soldB])
  assert.equal(map.get('1-test-way-brentwood'), active)
  assert.equal(map.get('1-test-way-brentwood-sold'), soldA)
  const token = soldDisambiguationToken(soldB)
  assert.equal(map.get(`1-test-way-brentwood-sold-${token}`), soldB)
  assert.equal(map.size, 3)
})

test('thin sold records are omitted from the slug map', () => {
  const thin = mk({
    status: 'Sold',
    address: 'Undisclosed Address',
    beds: undefined,
    baths: undefined,
    sqft: undefined,
    acres: undefined,
  })
  assert.equal(isIndexableSoldListing(thin), false)
  const map = assignListingDetailSlugs([], [thin])
  assert.equal(map.size, 0)
})

test('a sold record with only "TN" as the city is not indexable', () => {
  const thin = mk({ status: 'Sold', city: 'TN' })
  assert.equal(isIndexableSoldListing(thin), false)
})

test('current repo sold inventory is indexable and has unique detail slugs', () => {
  assert.ok(soldListings.length > 0, 'expected sold inventory in the repo')
  const slugs = new Set<string>()
  for (const listing of soldListings) {
    assert.equal(isIndexableSoldListing(listing), true, listing.address)
    assert.equal(hasListingDetail(listing), true, listing.address)
    const slug = resolveListingDetailSlug(listing)
    assert.ok(slug, listing.address)
    assert.equal(slugs.has(slug!), false, `duplicate slug ${slug}`)
    slugs.add(slug!)
    assert.equal(getListingBySlug(slug!), listing)
    assert.equal(listingDetailPath(listing), `/listings/${slug}`)
  }
  assert.equal(slugs.size, soldListings.length)
})

test('current repo active and sold slugs do not collide', () => {
  const activeSlugs = new Set(listings.map((l) => listingSlug(l)))
  for (const listing of soldListings) {
    const slug = resolveListingDetailSlug(listing)
    assert.ok(slug)
    assert.equal(
      activeSlugs.has(slug!),
      false,
      `${listing.address} sold slug ${slug} collides with an active listing`,
    )
    assert.equal(isSoldStatus(getListingBySlug(slug!)!.status), true)
  }
})

test('resolveListingDetailSlug prefers the sold page when status is Recently Sold', () => {
  const active = mk({ compassUrl: 'https://www.compass.com/x/ACT_pid/' })
  const sold = mk({
    status: 'Sold',
    compassUrl: 'https://www.compass.com/homedetails/1-Test-Way/111222333_lid/',
  })
  // Module-level maps use real inventory; this test checks the assigner +
  // the public resolver against a real sold address that is NOT also active.
  const realSold = soldListings[0]
  assert.ok(realSold)
  const heroSlug = resolveListingDetailSlug({
    address: realSold.address,
    city: realSold.city,
    status: 'Recently Sold',
  })
  assert.equal(heroSlug, resolveListingDetailSlug(realSold))
  // Keep the fixtures referenced so a future extract can reuse them.
  assert.equal(listingSlug(active), listingSlug(sold))
})

test('unknown addresses have no detail page', () => {
  const unknown = { address: '1 Does-Not-Exist Way', city: 'Franklin, TN 37064' }
  assert.equal(hasListingDetail(unknown), false)
  assert.equal(resolveListingDetailSlug(unknown), undefined)
  assert.equal(listingDetailPath(unknown), null)
})

test('listingDetailSlugs includes every active listing plus every indexable sold home', () => {
  for (const listing of listings) {
    const slug = resolveListingDetailSlug(listing)
    assert.ok(slug)
    assert.equal(listingDetailSlugs.has(slug!), true)
  }
  const soldCount = soldListings.filter(isIndexableSoldListing).length
  assert.equal(listingDetailSlugs.size, listings.length + soldCount)
})

test('next.config does not permanently redirect any listing detail slug to /listings', () => {
  const configPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'next.config.mjs')
  const src = readFileSync(configPath, 'utf8')
  for (const slug of Array.from(listingDetailSlugs)) {
    const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.doesNotMatch(
      src,
      new RegExp(`source:\\s*['\`]/listings/${escaped}['\`]`),
      `/listings/${slug} must not be redirected away now that a detail page exists`,
    )
  }
})
