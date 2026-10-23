// Sitemap / IndexNow catalog must include every on-site listing page.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listings, listingsSyncedAt } from './listings.ts'
import { soldListings } from './sold-listings.ts'
import { getSiteUrlCatalog, getSiteUrlsModifiedSince, listingSitemapLastModified } from './site-urls.ts'
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
  assert.equal(nashville?.lastModified?.toISOString(), '2026-10-23T12:00:00.000Z')
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

const HOUR_MS = 60 * 60 * 1000

function ownListingContentTime(path: string): number | undefined {
  for (const listing of [...listings, ...soldListings]) {
    if (listingDetailPath(listing) !== path) continue
    return listingSitemapLastModified(listing)?.getTime()
  }
  return undefined
}

/**
 * Within an hour of now is how `new Date()` and the shared sync clock look.
 * A listing page is exempt only when lastmod is exactly the date stored on
 * that home (added today, or its own fields changed today).
 */
function isBuildClockStamp(lastModified: Date, ownContentTime: number | undefined, now: number): boolean {
  if (ownContentTime !== undefined && lastModified.getTime() === ownContentTime) return false
  return Math.abs(lastModified.getTime() - now) <= HOUR_MS
}

test('sitemap lastmod is not stamped with the build clock', () => {
  const now = Date.now()
  const catalog = getSiteUrlCatalog()
  const stamped = catalog.filter((entry) => {
    if (!entry.lastModified) return false
    const own = entry.path.startsWith('/listings/') ? ownListingContentTime(entry.path) : undefined
    return isBuildClockStamp(entry.lastModified, own, now)
  })
  assert.deepEqual(
    stamped.map((entry) => entry.path),
    [],
  )

  // One shared timestamp on every listing is the sync clock, even when that
  // clock is older than an hour. It is allowed only when every listing's own
  // stored date is that same instant (the whole file was new in one sync).
  const listingEntries = catalog.filter(
    (entry) => entry.path.startsWith('/listings/') && entry.lastModified,
  )
  const stamps = new Set(listingEntries.map((entry) => entry.lastModified!.toISOString()))
  if (listingEntries.length > 1 && stamps.size === 1) {
    const stamp = listingEntries[0].lastModified!.getTime()
    const everyListingOwnsThatStamp = listingEntries.every(
      (entry) => ownListingContentTime(entry.path) === stamp,
    )
    assert.equal(
      everyListingOwnsThatStamp,
      true,
      'every listing lastmod is one shared timestamp, which is how the sync clock looks',
    )
  }
})

test('a listing dated by its own data can be recent without counting as the build clock', () => {
  const now = Date.now()
  const fresh = new Date(now - 5 * 60 * 1000)
  assert.equal(isBuildClockStamp(fresh, fresh.getTime(), now), false)
  assert.equal(isBuildClockStamp(fresh, Date.parse('2026-03-20T14:01:35.000Z'), now), true)
  assert.equal(isBuildClockStamp(fresh, undefined, now), true)
  const yesterday = new Date(now - 26 * HOUR_MS)
  assert.equal(isBuildClockStamp(yesterday, undefined, now), false)
})

test('listing lastmod is the home\'s own date, not the shared sync clock', () => {
  const catalog = getSiteUrlCatalog()
  for (const listing of listings) {
    const path = listingDetailPath(listing)
    assert.ok(path, listing.address)
    const entry = catalog.find((e) => e.path === path)
    const expected = listingSitemapLastModified(listing)
    assert.ok(expected, listing.address)
    assert.equal(entry?.lastModified?.toISOString(), expected.toISOString(), listing.address)
    if (listing.firstSeen !== listingsSyncedAt && listing.contentUpdated !== listingsSyncedAt) {
      assert.notEqual(entry?.lastModified?.toISOString(), listingsSyncedAt, listing.address)
    }
  }

  const wanda = catalog.find((entry) => entry.path === '/listings/511-wanda-dr-nashville')
  assert.equal(wanda?.lastModified?.toISOString(), '2026-03-20T14:01:35.000Z')
  assert.notEqual(wanda?.lastModified?.toISOString(), listingsSyncedAt)

  assert.equal(
    listingSitemapLastModified({
      contentUpdated: 'not-a-date',
      firstSeen: '2026-03-20T14:01:35.000Z',
    })?.toISOString(),
    '2026-03-20T14:01:35.000Z',
  )
  assert.equal(listingSitemapLastModified({ firstSeen: 'nope' }), undefined)
  assert.equal(listingSitemapLastModified(undefined), undefined)
  const changedToday = '2026-10-19T15:22:59.910Z'
  assert.equal(
    listingSitemapLastModified({
      contentUpdated: changedToday,
      firstSeen: '2026-03-20T14:01:35.000Z',
    })?.toISOString(),
    changedToday,
  )
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
