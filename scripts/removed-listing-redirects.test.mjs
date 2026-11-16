/**
 * Auto 308s for listings the Compass sync removes.
 * Run: node --test scripts/removed-listing-redirects.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeCompassUrl } from './listings-file.mjs'
import { legacyRedirects } from '../lib/legacy-redirects.mjs'
import {
  addressMatchKey,
  buySlugForListingCity,
  chooseRemovedListingDestination,
  closingKeysFromRepo,
  closingMatchKey,
  collectListingDetailSlugs,
  effectiveRemovedDestination,
  listingsArrayFromSource,
  listingPathSlug,
  liveListingSlugsFromRepo,
  normalizeListingUrl,
  suburbSlugsFromRepo,
  updateRemovedListingMap,
} from '../lib/removed-listing-redirects.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const closingKeys = closingKeysFromRepo(root)
const suburbSlugs = suburbSlugsFromRepo(root)

function destination(address, city) {
  return chooseRemovedListingDestination({ address, city }, { closingKeys, suburbSlugs })
}

test('street abbreviations match closings without matching a different lot', () => {
  assert.equal(
    closingMatchKey('107 Overlook Trail', 'Goodlettsville, TN 37072'),
    closingMatchKey('107 Overlook Trl', 'Goodlettsville'),
  )
  assert.equal(
    closingMatchKey('1113 Linn Cv Ct', 'Gallatin, TN 37066'),
    closingMatchKey('1113 Linn Cove Ct', 'Gallatin'),
  )
  assert.notEqual(
    closingMatchKey('1113 Linn Cv Ct', 'Gallatin, TN 37066'),
    closingMatchKey('1113 Linn Cove Court Lot 28', 'Gallatin'),
  )
  assert.equal(
    closingMatchKey('870 Reeves Road', 'Antioch, TN 37013'),
    closingMatchKey('870 Reeves Rd', 'Antioch'),
  )
  assert.equal(
    closingMatchKey('8117 Hilldale Drive', 'Brentwood, TN 37027'),
    closingMatchKey('8117 Hilldale Dr', 'Brentwood'),
  )
  assert.equal(
    closingMatchKey('159 N Berwick Ln', 'Franklin, TN 37069'),
    closingMatchKey('159 North Berwick Lane', 'Franklin'),
  )
  assert.notEqual(
    closingMatchKey('870 Reeves Rd', 'Antioch, TN 37013'),
    closingMatchKey('870 Reeves Rd', 'Nashville, TN 37211'),
  )
  assert.equal(addressMatchKey('107 Overlook Trail'), '107 overlook trail')
})

test('removed listings redirect to /sold, the city page, or /listings', () => {
  assert.equal(destination('870 Reeves Rd', 'Antioch, TN 37013'), '/sold')
  assert.equal(destination('107 Overlook Trail', 'Goodlettsville, TN 37072'), '/sold')
  assert.equal(destination('1113 Linn Cv Ct', 'Gallatin, TN 37066'), '/sold')
  assert.equal(destination('8117 Hilldale Dr', 'Brentwood, TN 37027'), '/sold')
  assert.equal(destination('261 Paragon Mills Rd', 'Nashville, TN 37211'), '/buy/nashville-tn')
  assert.equal(destination('1100 Gibson Dr', 'Madison, TN 37115'), '/listings')
  assert.equal(destination('500 Nowhere Ave', 'Antioch, TN 37013'), '/listings')
  // In closings, so a future removal uses /sold. The September Berwick
  // redirect is a separate static rule and stays on the Franklin buyer page.
  assert.equal(destination('159 N Berwick Ln', 'Franklin, TN 37069'), '/sold')
})

test('a bad stored destination cannot send people to a missing page', () => {
  assert.equal(effectiveRemovedDestination('/sold', suburbSlugs), '/sold')
  assert.equal(effectiveRemovedDestination('/listings', suburbSlugs), '/listings')
  assert.equal(effectiveRemovedDestination('/buy/nashville-tn', suburbSlugs), '/buy/nashville-tn')
  assert.equal(effectiveRemovedDestination('/buy/madison-tn', suburbSlugs), '/listings')
  assert.equal(effectiveRemovedDestination('https://evil.example/phish', suburbSlugs), '/listings')
  assert.equal(effectiveRemovedDestination('/buy/nashville-tn/extra', suburbSlugs), '/listings')
})

test('the sync appends a removed slug and drops it when the listing returns', () => {
  const prior = [
    {
      address: '870 Reeves Rd',
      city: 'Antioch, TN 37013',
      price: 340000,
      status: 'Active',
      compassUrl: 'https://www.compass.com/homedetails/870-Reeves-Rd-Antioch-TN-37013/ABC_pid/?utm=1',
    },
    {
      address: '261 Paragon Mills Rd',
      city: 'Nashville, TN 37211 | MLS #1',
      price: 450000,
      status: 'Active',
      compassUrl: 'https://www.compass.com/homedetails/261-Paragon-Mills-Rd/KEEP_pid/',
    },
  ]
  const stillThere = [prior[1]]
  const removed = updateRemovedListingMap({
    prior,
    current: stillThere,
    removed: [],
    closingKeys,
    suburbSlugs,
  })
  assert.deepEqual(removed, [
    {
      slug: '870-reeves-rd-antioch',
      address: '870 Reeves Rd',
      city: 'Antioch, TN 37013',
      destination: '/sold',
    },
  ])

  const again = updateRemovedListingMap({
    prior,
    current: stillThere,
    removed,
    closingKeys,
    suburbSlugs,
  })
  assert.equal(again.length, 1)
  assert.equal(again[0].slug, '870-reeves-rd-antioch')

  const back = updateRemovedListingMap({
    prior,
    current: prior,
    removed,
    closingKeys,
    suburbSlugs,
  })
  assert.deepEqual(back, [])

  const relisted = updateRemovedListingMap({
    prior: [prior[0]],
    current: [
      {
        ...prior[0],
        compassUrl: 'https://www.compass.com/homedetails/870-Reeves-Rd-Antioch-TN-37013/NEW_pid/',
      },
    ],
    removed,
    closingKeys,
    suburbSlugs,
  })
  assert.deepEqual(relisted, [])
})

test('a trailing-slash Compass URL is the same listing', () => {
  assert.equal(
    normalizeListingUrl('https://www.compass.com/homedetails/Foo/?utm=1#x'),
    normalizeCompassUrl('https://www.compass.com/homedetails/Foo/'),
  )
  const home = {
    address: '10 Oak St',
    city: 'Franklin, TN 37064',
    compassUrl: 'https://www.compass.com/homedetails/10-Oak-St/',
  }
  const next = updateRemovedListingMap({
    prior: [home],
    current: [{ ...home, compassUrl: 'https://www.Compass.com/homedetails/10-Oak-St/?ref=1' }],
    removed: [],
    closingKeys,
    suburbSlugs,
  })
  assert.deepEqual(next, [])
})

test('parsed inventory matches the TypeScript modules', async () => {
  const { listings } = await import('../lib/listings.ts')
  const { soldListings } = await import('../lib/sold-listings.ts')
  const { closings } = await import('../lib/closings-data.ts')
  const { listingSlug, listingDetailSlugs } = await import('../lib/listing-detail.ts')
  const { getAllSuburbSlugs, getSuburbSlugForListing } = await import('../lib/suburbs.ts')

  const parsedActive = listingsArrayFromSource(
    readFileSync(join(root, 'lib/listings.ts'), 'utf8'),
    'listings',
  )
  const parsedSold = listingsArrayFromSource(
    readFileSync(join(root, 'lib/sold-listings.ts'), 'utf8'),
    'soldListings',
  )
  const parsedClosings = listingsArrayFromSource(
    readFileSync(join(root, 'lib/closings-data.ts'), 'utf8'),
    'closings',
  )
  assert.equal(parsedActive.length, listings.length)
  assert.equal(parsedActive[0].address, listings[0].address)
  assert.equal(parsedSold.length, soldListings.length)
  assert.equal(parsedClosings.length, closings.length)

  for (const listing of [...listings, ...soldListings]) {
    assert.equal(listingPathSlug(listing), listingSlug(listing), listing.address)
  }
  const collected = collectListingDetailSlugs(parsedActive, parsedSold)
  assert.deepEqual([...collected].sort(), [...listingDetailSlugs].sort())
  assert.deepEqual([...suburbSlugs].sort(), [...getAllSuburbSlugs()].sort())

  for (const listing of [...listings, ...soldListings, ...closings]) {
    const fromTs = getSuburbSlugForListing(listing.city) ?? null
    assert.equal(buySlugForListingCity(listing.city, suburbSlugs), fromTs, listing.city)
  }
  assert.equal(liveListingSlugsFromRepo(root).size, listingDetailSlugs.size)
})

test('redirect rules skip live slugs, ignore unsafe destinations, and do not duplicate static rules', async () => {
  const { listingDetailSlugs } = await import('../lib/listing-detail.ts')
  const { getSiteUrlCatalog } = await import('../lib/site-urls.ts')
  const live = [...listingDetailSlugs][0]
  assert.ok(live)

  const withLive = legacyRedirects({
    removed: [
      { slug: live, address: '1 Live St', city: 'Nashville, TN 37211', destination: '/sold' },
      {
        slug: '999-gone-rd-antioch',
        address: '999 Gone Rd',
        city: 'Antioch, TN 37013',
        destination: 'https://evil.example/phish',
      },
      {
        slug: '870-reeves-rd-antioch',
        address: '870 Reeves Rd',
        city: 'Antioch, TN 37013',
        destination: '/listings',
      },
    ],
    liveSlugs: listingDetailSlugs,
  })
  const bySource = new Map(withLive.map((rule) => [rule.source, rule.destination]))
  assert.equal(bySource.has(`/listings/${live}`), false)
  assert.equal(bySource.get('/listings/999-gone-rd-antioch'), '/listings')
  assert.equal(bySource.get('/listings/870-reeves-rd-antioch'), '/sold')
  assert.equal(
    withLive.filter((rule) => rule.source === '/listings/870-reeves-rd-antioch').length,
    1,
  )
  for (const rule of withLive) assert.equal(rule.permanent, true)

  const catalog = new Set(getSiteUrlCatalog().map((entry) => entry.path))
  assert.equal(catalog.has(`/listings/${live}`), true)
  const shipped = legacyRedirects()
  for (const rule of shipped) {
    if (!rule.source.startsWith('/listings/')) continue
    assert.equal(catalog.has(rule.source), false, `${rule.source} must stay out of the sitemap`)
    assert.equal(listingDetailSlugs.has(rule.source.slice('/listings/'.length)), false)
  }
  assert.equal(catalog.has('/compare/murfreesboro-tn-smryna-tn'), false)
  assert.equal(catalog.has('/compare/murfreesboro-tn-vs-smyrna-tn'), true)
  assert.equal(catalog.has('/listings/870-reeves-rd-antioch'), false)
  assert.equal(catalog.has('/listings/261-paragon-mills-rd-nashville'), false)
  assert.equal(catalog.has('/listings/1100-gibson-dr-madison'), false)
})

test('a returned listing wins over a static redirect', () => {
  const rules = legacyRedirects({
    liveSlugs: new Set(['870-reeves-rd-antioch']),
    removed: [],
  })
  const sources = rules.map((rule) => rule.source)
  assert.equal(sources.includes('/listings/870-reeves-rd-antioch'), false)
  assert.equal(sources.includes('/listings/8117-hilldale-dr-brentwood'), true)
  assert.equal(new Set(sources).size, sources.length)
})

test('the daily sync records removals and commits the redirect map', () => {
  const sync = readFileSync(join(root, 'scripts/sync-all.sh'), 'utf8')
  const workflow = readFileSync(join(root, '.github/workflows/sync-listings.yml'), 'utf8')
  const fetchAt = sync.indexOf('node scripts/fetch-images.mjs')
  const recordAt = sync.indexOf('node scripts/record-removed-listings.mjs')
  const soldAt = sync.indexOf('node scripts/fetch-sold.mjs')
  assert.ok(fetchAt !== -1 && recordAt > fetchAt && soldAt > recordAt)
  assert.match(sync, /^node scripts\/record-removed-listings\.mjs$/m)
  assert.match(
    workflow,
    /git add lib\/listings\.ts lib\/sold-listings\.ts lib\/removed-listing-redirects\.json/,
  )
  assert.match(workflow, /lib\/removed-listing-redirects\.json/)
  const diff = readFileSync(join(root, 'scripts/listing-sync-diff.mjs'), 'utf8')
  assert.match(diff, /removed-listing-redirects\.json/)
})
