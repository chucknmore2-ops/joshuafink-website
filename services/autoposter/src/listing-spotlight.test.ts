import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildSpotlightCaption,
  spotlightHeadline,
  spotlightListingUrl,
} from './listing-spotlight-copy.ts'
import { parseListings, type Listing } from './listings-parse.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const NOW = new Date('2026-10-06T16:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

function listing(overrides: Partial<Listing> = {}): Listing {
  return {
    address: '4127 Edwards Ave',
    city: 'Nashville, TN 37216 | MLS #3319964',
    price: 409900,
    beds: 3,
    baths: 1,
    sqft: 1223,
    status: 'Active',
    compassUrl: 'https://www.compass.com/homedetails/4127-Edwards-Ave-Nashville-TN-37216/THUS9_pid/',
    imageUrl: 'https://www.compass.com/m/example/2048x1536.webp',
    firstSeen: '2026-05-11T12:00:26.000Z',
    ...overrides,
  }
}

test('spotlight links use the listing slug and Facebook UTM tags', () => {
  const url = spotlightListingUrl(listing())
  assert.equal(
    url,
    'https://www.joshuafink.com/listings/4127-edwards-ave-nashville?utm_source=facebook&utm_medium=social&utm_campaign=listing',
  )
  assert.equal(url.includes('compass.com'), false)
})

test('Just Listed is only for a home first seen within 14 days', () => {
  const fresh = listing({
    address: '261 Paragon Mills Rd',
    city: 'Nashville, TN 37211 | MLS #3611676',
    firstSeen: '2026-10-06T15:02:04.000Z',
  })
  const caption = buildSpotlightCaption(fresh, NOW)
  assert.equal(spotlightHeadline(fresh, NOW), 'Just Listed')
  assert.match(caption, /^Just Listed\n/)
  assert.match(caption, /#JustListed\b/)
  assert.match(caption, /261-paragon-mills-rd-nashville/)
  assert.match(caption, /utm_source=facebook/)
  assert.match(caption, /utm_medium=social/)
  assert.match(caption, /utm_campaign=listing/)
  assert.match(caption, /Compass/)
  assert.doesNotMatch(caption, /Parks/)

  const older = listing()
  const featured = buildSpotlightCaption(older, NOW)
  assert.equal(spotlightHeadline(older, NOW), 'Featured listing')
  assert.match(featured, /^Featured listing\n/)
  assert.equal(featured.includes('#JustListed'), false)
  assert.match(featured, /4127-edwards-ave-nashville/)
})

test('status wording replaces Just Listed when the home is not simply Active', () => {
  const coming = listing({ status: 'Coming Soon', firstSeen: new Date(NOW.getTime() - DAY).toISOString() })
  assert.equal(spotlightHeadline(coming, NOW), 'Coming soon')
  const comingCaption = buildSpotlightCaption(coming, NOW)
  assert.match(comingCaption, /^Coming soon\n/)
  assert.match(comingCaption, /#ComingSoon\b/)
  assert.equal(comingCaption.includes('#JustListed'), false)

  const pending = listing({ status: 'Active Under Contract', firstSeen: new Date(NOW.getTime() - DAY).toISOString() })
  assert.equal(spotlightHeadline(pending, NOW), 'Under contract')
  const pendingCaption = buildSpotlightCaption(pending, NOW)
  assert.match(pendingCaption, /^Under contract\n/)
  assert.equal(pendingCaption.includes('#JustListed'), false)

  const open = listing({ status: 'Open House Sunday', firstSeen: '2020-01-01T00:00:00.000Z' })
  assert.equal(spotlightHeadline(open, NOW), 'Open house')
  assert.match(buildSpotlightCaption(open, NOW), /#OpenHouse\b/)
})

test('a home with no firstSeen date is not called Just Listed', () => {
  const home = listing({ firstSeen: undefined })
  assert.equal(spotlightHeadline(home, NOW), 'Featured listing')
  assert.equal(buildSpotlightCaption(home, NOW).includes('#JustListed'), false)
})

test('the live listings file parses firstSeen and the spotlight job posts that page', () => {
  const source = readFileSync(join(repoRoot, 'lib/listings.ts'), 'utf8')
  const parsed = parseListings(source)
  assert.ok(parsed.length > 0)
  for (const home of parsed) {
    assert.equal(typeof home.firstSeen, 'string', home.address)
    if (home.status !== 'Active') continue
    const seen = Date.parse(home.firstSeen ?? '')
    assert.equal(spotlightHeadline(home, new Date(seen + DAY)), 'Just Listed')
    assert.equal(spotlightHeadline(home, new Date(seen + 15 * DAY)), 'Featured listing')
  }

  const job = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'jobs/listing-spotlight.ts'), 'utf8')
  assert.match(job, /spotlightListingUrl/)
  assert.doesNotMatch(job, /link: listing\.compassUrl/)
  assert.doesNotMatch(job, /#JustListed/)
})
