// Same-day listing events: detection, captions, dedupe keys, and the
// workflow that posts them. These tests never call Buffer or LinkedIn.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listings, listingsSyncedAt } from './listings.ts'
import { buildListingEventPost } from './listing-event-copy.ts'
import {
  LISTING_EVENTS_GAP_MS,
  LISTING_EVENTS_PER_RUN,
  detectListingEvents,
  eventIsComplete,
  listingStateKey,
  type EventChannel,
  reconcileListingState,
  remainingChannelActions,
  snapshotFromListing,
  type ListingSnapshot,
} from './listing-events.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const PHOTO =
  'https://www.compass.com/m/4e0ad91dae272cb8d10ab72fe92e356caa4ea6acda5b71c2fdc9a5e7d5b4f0ef/2048x1536.webp'

function snap(overrides: Partial<ListingSnapshot> = {}): ListingSnapshot {
  return {
    address: '261 Paragon Mills Rd',
    city: 'Nashville, TN 37211 | MLS #3611676',
    price: 349700,
    beds: 3,
    baths: 1,
    sqft: 1014,
    status: 'Active',
    compassUrl: 'https://www.compass.com/homedetails/261-Paragon-Mills-Rd-Nashville-TN-37211/TLH7F_pid/',
    imageUrl: PHOTO,
    seenAt: '2026-10-06T14:53:43.661Z',
    generation: 1,
    ...overrides,
  }
}

test('seeding the current file against itself announces nothing', () => {
  const seeded = listings.map((listing) => snapshotFromListing(listing, listingsSyncedAt, 1))
  assert.deepEqual(detectListingEvents(seeded, seeded), [])
  assert.ok(seeded.length > 0)
})

test('a new Active address is Just Listed and a new Coming Soon address is not', () => {
  const active = detectListingEvents([], [snap()])
  assert.deepEqual(active.map((event) => event.kind), ['just-listed'])
  assert.equal(active[0]?.refKey, 'just-listed:tlh7f')

  const soon = snap({
    address: '10 Soon Ln',
    status: 'Coming Soon',
    compassUrl: 'https://www.compass.com/homedetails/10-Soon-Ln/SOON1_pid/',
  })
  const coming = detectListingEvents([], [soon])
  assert.deepEqual(coming.map((event) => event.kind), ['coming-soon'])
  assert.equal(coming[0]?.refKey, 'coming-soon:soon1')
})

test('a new under-contract home, a sale, and a removal are not events', () => {
  const under = snap({ status: 'Active Under Contract' })
  assert.deepEqual(detectListingEvents([], [under]), [])
  assert.deepEqual(detectListingEvents([snap()], [{ ...snap(), status: 'Sold' }]), [])
  assert.deepEqual(detectListingEvents([snap()], []), [])
  assert.deepEqual(
    detectListingEvents([snap({ price: 360000 })], [snap({ price: 370000 })]),
    [],
  )
})

test('price drop and return to Active are separate events, in that order', () => {
  const previous = snap({
    status: 'Pending',
    price: 360000,
    generation: 4,
    seenAt: '2026-10-01T00:00:00.000Z',
  })
  const current = snap({ status: 'Active', price: 349700 })
  const events = detectListingEvents([previous], [current])
  assert.deepEqual(
    events.map((event) => event.kind),
    ['back-on-market', 'price-improved'],
  )
  assert.equal(events[0]?.refKey, 'back-on-market:tlh7f:g4')
  assert.equal(events[1]?.refKey, 'price-improved:tlh7f:360000-349700')
})

test('a price drop on a home still under contract is not announced', () => {
  const previous = snap({ status: 'Active Under Contract', price: 360000 })
  const current = snap({ status: 'Active Under Contract', price: 349700 })
  assert.deepEqual(detectListingEvents([previous], [current]), [])
})

test('open house posts only when the card text is new', () => {
  const previous = snap()
  const current = snap({ openHouse: 'Open House Sat 1-3' })
  const events = detectListingEvents([previous], [current])
  assert.deepEqual(events.map((event) => event.kind), ['open-house'])
  assert.match(events[0]?.refKey ?? '', /^open-house:tlh7f:open-house-sat-1-3$/)
  assert.deepEqual(detectListingEvents([current], [current]), [])

  const fresh = snap({ openHouse: 'Open House Sat 1-3' })
  const created = detectListingEvents([], [fresh])
  assert.deepEqual(created.map((event) => event.kind), ['just-listed'])
})

test('a changed Compass URL for the same address is not a new listing', () => {
  const previous = snap({ price: 349700 })
  const current = snap({
    compassUrl: 'https://www.compass.com/homedetails/261-Paragon-Mills-Rd-Nashville-TN-37211/NEW99_pid/',
  })
  assert.deepEqual(detectListingEvents([previous], [current]), [])
})

test('pending events keep the old price until they are posted', () => {
  const previous = snap({ price: 360000, generation: 4, seenAt: '2026-10-01T00:00:00.000Z' })
  const current = snap({ price: 349700, seenAt: '2026-10-06T18:00:00.000Z', generation: 1 })
  const key = listingStateKey(current)
  const held = reconcileListingState([previous], [current], new Set([key]), '2026-10-06T18:00:00.000Z')
  assert.equal(held[0]?.price, 360000)
  assert.equal(held[0]?.generation, 4)

  const advanced = reconcileListingState([previous], [current], new Set(), '2026-10-06T18:00:00.000Z')
  assert.equal(advanced[0]?.price, 349700)
  assert.equal(advanced[0]?.generation, 5)
  assert.equal(advanced[0]?.seenAt, '2026-10-06T18:00:00.000Z')

  const same = reconcileListingState([previous], [previous], new Set(), '2026-10-06T18:00:00.000Z')
  assert.equal(same[0]?.generation, 4)
  assert.equal(same[0]?.seenAt, '2026-10-01T00:00:00.000Z')
})

test('a new listing is stored only after its event is no longer pending', () => {
  const added = snap({
    address: '9 New St',
    city: 'Franklin, TN 37064',
    compassUrl: 'https://www.compass.com/homedetails/9-New-St/NEW1_pid/',
  })
  const key = listingStateKey(added)
  assert.equal(reconcileListingState([], [added], new Set([key]), '2026-10-07T00:00:00.000Z').length, 0)
  const saved = reconcileListingState([], [added], new Set(), '2026-10-07T00:00:00.000Z')
  assert.equal(saved.length, 1)
  assert.equal(saved[0]?.generation, 1)
})

test('Facebook is optional and a finished channel is not posted again', () => {
  const skipped = remainingChannelActions({
    alreadyPosted: new Set<EventChannel>(),
    facebookConfigured: false,
  })
  assert.deepEqual(
    skipped.map((item) => item.action),
    ['post', 'skip-no-channel', 'post'],
  )
  assert.equal(eventIsComplete(skipped), false)

  const done = remainingChannelActions({
    alreadyPosted: new Set<EventChannel>(['instagram', 'linkedin']),
    facebookConfigured: false,
  })
  assert.equal(eventIsComplete(done), true)
})

test('each channel links to the listing page with UTM tags, a JPEG, and Compass', () => {
  const event = detectListingEvents([], [snap()])[0]
  assert.ok(event)
  for (const channel of ['instagram', 'facebook', 'linkedin'] as const) {
    const post = buildListingEventPost(event, channel)
    assert.match(post.text, /Just Listed — 261 Paragon Mills Rd, Nashville/)
    assert.match(post.text, /3 bed · 1 bath · 1,014 sq ft/)
    assert.match(post.text, /\$349,700/)
    assert.match(post.text, /Listed with Joshua Fink, Compass\./)
    assert.match(post.text, /Compass/)
    assert.doesNotMatch(post.text, /Parks/)
    assert.match(post.url, /^https:\/\/www\.joshuafink\.com\/listings\/261-paragon-mills-rd-nashville\?/)
    const params = new URL(post.url).searchParams
    assert.equal(params.get('utm_source'), channel)
    assert.equal(params.get('utm_medium'), 'social')
    assert.equal(params.get('utm_campaign'), 'listing')
    assert.equal(params.get('utm_content'), 'just-listed')
    assert.match(post.text, /utm_source=/)
    assert.match(post.imageUrl ?? '', /^https:\/\/www\.joshuafink\.com\/ig-photo\/4e0ad91d.*\.jpg$/)
    assert.doesNotMatch(post.imageUrl ?? '', /\.webp/)
    assert.doesNotMatch(post.url, /compass\.com/)
    if (channel === 'linkedin') assert.doesNotMatch(post.text, /#/)
    else assert.match(post.text, /#JustListed #NashvilleTN #Compass #JoshuaFinkGroup #MiddleTennessee/)
  }
})

test('price, back on market, coming soon, and open house use their own wording', () => {
  const dropped = detectListingEvents(
    [snap({ price: 360000 })],
    [snap({ price: 349700 })],
  )[0]
  assert.ok(dropped)
  const price = buildListingEventPost(dropped, 'facebook')
  assert.match(price.text, /^Price Improved — 261 Paragon Mills Rd, Nashville/)
  assert.match(price.text, /Now \$349,700 · was \$360,000/)
  assert.match(price.text, /#PriceImproved/)
  assert.doesNotMatch(price.text, /#JustListed/)

  const returned = detectListingEvents(
    [snap({ status: 'Active Under Contract' })],
    [snap({ status: 'Active' })],
  )[0]
  assert.ok(returned)
  const back = buildListingEventPost(returned, 'instagram')
  assert.match(back.text, /^Back on Market —/)
  assert.match(back.text, /#BackOnMarket/)
  assert.doesNotMatch(back.text, /#JustListed/)

  const soon = detectListingEvents(
    [],
    [snap({ status: 'Coming Soon', address: '10 Soon Ln', city: 'Franklin, TN 37064', compassUrl: 'https://www.compass.com/homedetails/10-Soon-Ln/SOON1_pid/' })],
  )[0]
  assert.ok(soon)
  const coming = buildListingEventPost(soon, 'linkedin')
  assert.match(coming.text, /^Coming Soon — 10 Soon Ln, Franklin/)
  assert.match(coming.text, /Listed with Joshua Fink, Compass\./)
  assert.doesNotMatch(coming.text, /#/)

  const opened = detectListingEvents([], [snap({ openHouse: 'Open House Sat 1-3' })])
  assert.equal(opened.length, 1)
  const listed = buildListingEventPost(opened[0], 'facebook')
  assert.match(listed.text, /Open House Sat 1-3/)
  assert.match(listed.text, /#JustListed/)

  const onlyOpen = detectListingEvents(
    [snap()],
    [snap({ openHouse: 'Open House Sat 1-3' })],
  )[0]
  assert.ok(onlyOpen)
  const house = buildListingEventPost(onlyOpen, 'instagram')
  assert.match(house.text, /^Open House —/)
  assert.match(house.text, /Open House Sat 1-3/)
  assert.match(house.text, /#OpenHouse/)
  assert.doesNotMatch(house.text, /#JustListed/)
})

test('listing event constants, route, and workflow stay in step', () => {
  assert.equal(LISTING_EVENTS_PER_RUN, 3)
  assert.equal(LISTING_EVENTS_GAP_MS, 30_000)

  const workflow = readFileSync(join(repoRoot, '.github/workflows/listing-events.yml'), 'utf8')
  assert.match(workflow, /"\$posted" -lt 3/)
  assert.match(workflow, /sleep 30/)
  assert.match(workflow, /api\/cron\/listing-events/)
  assert.match(workflow, /preview=1/)
  assert.match(workflow, /PUSHOVER_TOKEN/)
  assert.match(workflow, /title=Listing event post failed/)
  assert.match(workflow, /BUFFER_API_KEY/)
  assert.match(workflow, /BUFFER_IG_CHANNEL_ID/)
  assert.match(workflow, /BUFFER_FB_CHANNEL_ID/)
  assert.match(workflow, /X-Buffer-Api-Key:/)
  assert.match(workflow, /X-Buffer-Ig-Channel-Id:/)
  assert.match(workflow, /X-Buffer-Fb-Channel-Id:/)
  assert.match(workflow, /Facebook skipped: BUFFER_FB_CHANNEL_ID is not set/)
  assert.match(workflow, /seeded/)
  assert.doesNotMatch(workflow, /graph\.facebook\.com/)
  assert.doesNotMatch(workflow, /mailto:/)
  assert.doesNotMatch(workflow, /kind=sold/)
  assert.match(workflow, /cron: '20 14 \* \* \*'/)
  assert.match(workflow, /cron: '20 20 \* \* \*'/)
  assert.match(workflow, /lib\/listings\.ts/)

  const route = readFileSync(join(repoRoot, 'app/api/cron/listing-events/route.ts'), 'utf8')
  assert.match(route, /Facebook skipped: BUFFER_FB_CHANNEL_ID is not set/)
  assert.match(route, /queueBufferImagePost/)
  assert.match(route, /publishLinkedInListingPost/)
  assert.match(route, /skipped: 'seeded'/)
  assert.match(route, /payloadKind: 'listing'/)
  assert.match(route, /refKey: event\.listing\.address/)
  assert.match(route, /jobName: LISTING_EVENTS_JOB/)
  assert.doesNotMatch(route, /graph\.facebook\.com/)
  assert.doesNotMatch(route, /kind === 'sold'/)
  assert.match(route, /Just Sold stays/)
  assert.doesNotMatch(route, /Parks/)

  const linkedin = readFileSync(join(repoRoot, 'app/api/cron/linkedin-post/route.ts'), 'utf8')
  assert.match(linkedin, /kind === 'sold'/)
  assert.match(linkedin, /listing-events/)

  const weekly = readFileSync(join(repoRoot, '.github/workflows/social-autopost.yml'), 'utf8')
  assert.doesNotMatch(weekly, /listing-events/)

  const sync = readFileSync(join(repoRoot, '.github/workflows/sync-listings.yml'), 'utf8')
  assert.match(sync, /listing-events\.yml/)
  assert.match(sync, /gbp-just-listed\.yml/)
})

test('every synced listing records when it was first seen', () => {
  for (const listing of listings) {
    assert.equal(typeof listing.firstSeen, 'string', listing.address)
    assert.equal(Number.isNaN(Date.parse(listing.firstSeen ?? '')), false, listing.address)
  }
})
