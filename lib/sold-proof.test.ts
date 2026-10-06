// Sold-inventory proof helpers (GEO sections).
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { soldListings } from './sold-listings.ts'
import {
  publishedSoldListings,
  soldListingLocationNames,
  soldListingsForSuburb,
} from './sold-proof.ts'
import { listingDetailPath } from './listing-detail.ts'
import { getSuburbSlugForListing } from './suburbs.ts'

test('published sold inventory matches the repo file (all current records are indexable)', () => {
  const published = publishedSoldListings()
  assert.equal(published.length, soldListings.length)
  assert.ok(published.length >= 16)
})

test('Brentwood sold records include lot/unit-prefixed city strings', () => {
  const brentwood = soldListingsForSuburb('brentwood-tn')
  assert.ok(brentwood.length >= 10, `expected several Brentwood records, got ${brentwood.length}`)
  assert.ok(
    brentwood.some((l) => l.address === '9293 Fordham Dr'),
    'Lot 54 Fordham should count as Brentwood',
  )
  assert.ok(
    brentwood.some((l) => l.address === '1858 Traditions Cir'),
    'Unit 69 Traditions should count as Brentwood',
  )
  for (const listing of brentwood) {
    assert.ok(listingDetailPath(listing), listing.address)
  }
})

test('suburb filter does not invent cities — College Grove is omitted from Brentwood', () => {
  const brentwood = soldListingsForSuburb('brentwood-tn')
  assert.equal(
    brentwood.some((l) => /college grove/i.test(l.city)),
    false,
  )
})

test('location names come from the records themselves', () => {
  const names = soldListingLocationNames(soldListings)
  assert.ok(names.includes('Brentwood'))
  assert.ok(names.includes('Franklin'))
  assert.ok(names.includes('Nashville'))
  assert.equal(names.includes('Lot 54'), false)
  assert.equal(names.includes('Unit 69'), false)
})

test('getSuburbSlugForListing reads past lot/unit prefixes', () => {
  assert.equal(getSuburbSlugForListing('Lot 54, Brentwood, TN 37027'), 'brentwood-tn')
  assert.equal(getSuburbSlugForListing('Unit 69, Brentwood, TN 37027'), 'brentwood-tn')
  assert.equal(getSuburbSlugForListing('Brentwood, TN 37027'), 'brentwood-tn')
  assert.equal(getSuburbSlugForListing('College Grove, TN 37046'), undefined)
})
