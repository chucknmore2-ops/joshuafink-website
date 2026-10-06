// Regression tests for homepage hero CTAs.
//
// Run: npm test
//
// The cinematic hero used to hard-code compass.com "View details" links, and
// several sold Brentwood addresses stayed labelled Featured after they closed.
// These tests pin three invariants:
//
//   1. When an on-site /listings/{slug} page exists, the CTA uses that slug.
//   2. When it does not, the CTA stays first-party (/listings) — never Compass.
//   3. Sold homes (lib/sold-listings.ts) are never labelled Featured.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listings } from './listings.ts'
import { soldListings } from './sold-listings.ts'
import { hasListingDetail, listingSlug, resolveListingDetailSlug } from './listing-detail.ts'
import {
  heroSlides,
  resolveHeroHref,
  resolveHeroStatus,
} from './hero-slides.ts'

test('an active listing resolves to its on-site /listings/{slug} page', () => {
  const listing = listings.find((l) => hasListingDetail(l))
  assert.ok(listing, 'lib/listings.ts should contain at least one active listing')
  assert.equal(resolveHeroHref(listing), `/listings/${listingSlug(listing)}`)
})

test('a sold address with an on-site page resolves to /listings/{slug}', () => {
  const sold = soldListings.find((l) => l.address === '9209 Duncaster Ct')
  assert.ok(sold, '9209 Duncaster Ct should be in sold inventory')
  assert.equal(hasListingDetail(sold), true)
  const slug = resolveListingDetailSlug(sold)
  assert.ok(slug)
  assert.equal(resolveHeroHref(sold), `/listings/${slug}`)
})

test('an unknown address falls back to /listings, not compass.com', () => {
  assert.equal(
    hasListingDetail({ address: '1 Does-Not-Exist Way', city: 'Franklin, TN 37064' }),
    false,
  )
  assert.equal(
    resolveHeroHref({ address: '1 Does-Not-Exist Way', city: 'Franklin, TN 37064' }),
    '/listings',
  )
})

test('resolveHeroHref never returns a compass.com URL', () => {
  for (const listing of listings) {
    assert.doesNotMatch(resolveHeroHref(listing), /compass\.com/i)
  }
  for (const listing of soldListings) {
    assert.doesNotMatch(resolveHeroHref(listing), /compass\.com/i)
  }
})

test('a sold address is labelled Recently Sold even if authored as Featured', () => {
  assert.equal(
    resolveHeroStatus({
      address: '9209 Duncaster Ct',
      city: 'Brentwood, TN 37027',
      status: 'Featured',
    }),
    'Recently Sold',
  )
})

test('an active listing keeps its authored Featured / Just Listed status', () => {
  const listing = listings.find((l) => hasListingDetail(l))
  assert.ok(listing)
  assert.equal(
    resolveHeroStatus({ address: listing.address, city: listing.city, status: 'Featured' }),
    'Featured',
  )
  assert.equal(
    resolveHeroStatus({ address: listing.address, city: listing.city, status: 'Just Listed' }),
    'Just Listed',
  )
})

test('published hero slides stay first-party and never leak to Compass', () => {
  assert.ok(heroSlides.length > 0, 'hero deck should not be empty')
  for (const slide of heroSlides) {
    assert.ok(slide.href.startsWith('/'), `${slide.address} href must be first-party`)
    assert.doesNotMatch(slide.href, /compass\.com/i)
    if (hasListingDetail(slide)) {
      assert.equal(slide.href, `/listings/${resolveListingDetailSlug(slide)}`)
    } else {
      assert.equal(slide.href, '/listings')
    }
  }
})

test('published hero slides never label a sold home Featured', () => {
  const soldSlugs = new Set(soldListings.map((l) => listingSlug(l)))
  for (const slide of heroSlides) {
    if (soldSlugs.has(listingSlug(slide))) {
      assert.notEqual(slide.status, 'Featured', `${slide.address} is sold and must not be Featured`)
      assert.equal(slide.status, 'Recently Sold')
    }
  }
})
