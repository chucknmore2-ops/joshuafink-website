// Structured data for listing grids and detail pages.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listings } from './listings.ts'
import { soldListings } from './sold-listings.ts'
import { buildListingItemList, buildListingSchema } from './listing-schema.ts'
import { listingCanonicalUrl, listingDetailPath } from './listing-detail.ts'
import { parseListingPostalAddress } from './listing-address.ts'

test('sold detail schema uses SoldOut and the on-site canonical URL', () => {
  const sold = soldListings[0]
  assert.ok(sold)
  const url = listingCanonicalUrl(sold)
  assert.match(url, /^https:\/\/www\.joshuafink\.com\/listings\//)
  const schema = buildListingSchema(sold, url)
  assert.equal(schema['@type'], 'RealEstateListing')
  assert.equal(schema.url, url)
  assert.equal(schema.availability, 'https://schema.org/SoldOut')
  assert.equal('datePosted' in schema, false)
  assert.equal('validThrough' in schema, false)
  const about = schema.about as { address: Record<string, string> }
  assert.equal(about.address.addressCountry, 'US')
  assert.equal(about.address.addressLocality, 'Brentwood')
})

test('active detail schema stays InStock (or PreOrder) and is not SoldOut', () => {
  const active = listings.find((l) => l.status === 'Active')
  assert.ok(active)
  const url = listingCanonicalUrl(active)
  const schema = buildListingSchema(active, url)
  assert.notEqual(schema.availability, 'https://schema.org/SoldOut')
  assert.equal(schema.url, url)
})

test('ItemList sold items point at on-site pages, not Compass', () => {
  const list = buildListingItemList(soldListings, 'Recently Sold')
  assert.equal(list.numberOfItems, soldListings.length)
  for (let i = 0; i < soldListings.length; i++) {
    const item = list.itemListElement[i].item
    const path = listingDetailPath(soldListings[i])
    assert.ok(path)
    assert.equal(item.url, `https://www.joshuafink.com${path}`)
    assert.doesNotMatch(item.url, /compass\.com/i)
  }
})

test('lot/unit prefixes do not become the schema locality', () => {
  const address = parseListingPostalAddress(
    '9293 Fordham Dr',
    'Lot 54, Brentwood, TN 37027',
  )
  assert.equal(address.addressLocality, 'Brentwood')
  assert.equal(address.addressRegion, 'TN')
  assert.equal(address.postalCode, '37027')
})

test('plain City, ST ZIP still parses', () => {
  const address = parseListingPostalAddress('9209 Duncaster Ct', 'Brentwood, TN 37027')
  assert.equal(address.addressLocality, 'Brentwood')
  assert.equal(address.addressRegion, 'TN')
  assert.equal(address.postalCode, '37027')
})
