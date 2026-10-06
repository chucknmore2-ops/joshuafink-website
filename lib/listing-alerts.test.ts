import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  COMPASS_MAILING_ADDRESS,
  applyAlertFields,
  detectListingEvents,
  digestsToSend,
  digestRefKey,
  inviteIsDryRun,
  inviteRefKey,
  listingAlertOptIn,
  renderListingAlertEmail,
  renderListingAlertInvite,
  selectInviteRecipients,
  type AlertFilter,
  type AlertListing,
} from './listing-alerts.ts'

function listing(partial: Partial<AlertListing> & Pick<AlertListing, 'address' | 'price' | 'compassUrl'>): AlertListing {
  return {
    city: 'Nashville, TN 37216',
    status: 'Active',
    path: '/listings/example',
    ...partial,
  }
}

const nashville = listing({
  address: '4127 Edwards Ave',
  price: 409900,
  compassUrl: 'https://www.compass.com/homedetails/4127-Edwards-Ave/',
  path: '/listings/4127-edwards-ave-nashville',
  beds: 3,
  baths: 1,
  sqft: 1223,
  imageUrl: 'https://www.compass.com/m/abc/2048x1536.webp',
})

test('an empty snapshot is a baseline and sends nothing', () => {
  const plan = detectListingEvents([], [nashville])
  assert.equal(plan.baseline, true)
  assert.deepEqual(plan.events, [])
})

test('a new Compass URL is a new listing and a lower price is a price drop', () => {
  const previous = [{ compassUrl: nashville.compassUrl + '?utm=1', price: 409900 }]
  const added = listing({
    address: '100 New St',
    price: 300000,
    city: 'Franklin, TN 37069',
    compassUrl: 'https://www.compass.com/homedetails/100-New-St/',
  })
  const dropped = { ...nashville, price: 389900 }
  const raised = listing({
    address: '200 Up St',
    price: 500000,
    compassUrl: 'https://www.compass.com/homedetails/200-Up-St/',
  })
  const plan = detectListingEvents(
    [...previous, { compassUrl: raised.compassUrl, price: 450000 }],
    [dropped, added, raised],
  )
  assert.equal(plan.baseline, false)
  assert.deepEqual(plan.events.map((event) => event.kind), ['price-drop', 'new'])
  assert.equal(plan.events[0].listing.previousPrice, 409900)
  assert.equal(plan.events[0].refKey.includes(':389900'), true)
})

test('only a checked opt-in with an email is added', () => {
  assert.equal(listingAlertOptIn({ email: 'a@b.com', alert_opt_in: 'yes' }), true)
  assert.equal(listingAlertOptIn({ email: 'a@b.com' }), false)
  assert.equal(listingAlertOptIn({ email: 'a@b.com', alert_opt_in: '' }), false)
  assert.equal(listingAlertOptIn({ email: '', alert_opt_in: 'yes' }), false)
  assert.equal(listingAlertOptIn({ email: 'not-an-email', alert_opt_in: 'on' }), false)
})

test('price range and city land in the sheet budget and suburb columns', () => {
  const lead: Record<string, string> = { price_min: '250000', price_max: '$450,000', alert_city: 'Nashville' }
  applyAlertFields(lead)
  assert.equal(lead.budget, '$250,000–$450,000')
  assert.equal(lead.suburb, 'Nashville')
})

test('filters match city or price and a blank filter matches every listing', () => {
  const events = detectListingEvents(
    [{ compassUrl: 'https://www.compass.com/old/', price: 1 }],
    [nashville],
  ).events
  const syncedAt = '2026-10-07T08:00:00.000Z'
  const all: AlertFilter = { email: 'all@example.com', city: null, priceMin: null, priceMax: null, token: 'tok-all' }
  const nashvilleOnly: AlertFilter = { email: 'nash@example.com', city: 'Nashville', priceMin: 300000, priceMax: 500000, token: 'tok-nash' }
  const franklin: AlertFilter = { email: 'frank@example.com', city: 'Franklin', priceMin: null, priceMax: null, token: 'tok-frank' }
  const tooLow: AlertFilter = { email: 'low@example.com', city: null, priceMin: null, priceMax: 200000, token: 'tok-low' }
  const sent = new Set([digestRefKey(syncedAt, all.email)])
  const digests = digestsToSend([all, nashvilleOnly, franklin, tooLow], events, sent, syncedAt)
  assert.deepEqual(digests.map((digest) => digest.email), ['nash@example.com'])
})

test('the alert email has a one-click unsubscribe and the Compass office address', () => {
  const events = detectListingEvents(
    [{ compassUrl: nashville.compassUrl, price: 450000 }],
    [{ ...nashville, price: 389900 }],
  ).events
  const digest = digestsToSend(
    [{ email: 'Buyer@Example.com', city: null, priceMin: null, priceMax: null, token: 'token-1' }],
    events,
    new Set(),
    'sync-1',
  )[0]
  const email = renderListingAlertEmail(digest)
  assert.match(email.subject, /Price drop/)
  assert.match(email.subject, /\$389,900/)
  assert.match(email.html, /4127 Edwards Ave/)
  assert.match(email.html, /\$450,000/)
  assert.match(email.html, /COMPASS/)
  assert.equal(email.html.toLowerCase().includes('parks'), false)
  assert.match(email.html, new RegExp(COMPASS_MAILING_ADDRESS.street.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(email.html, /Brentwood, TN 37027/)
  assert.match(email.html, /615-551-2727/)
  assert.match(email.html, /TREC #351484/)
  assert.match(email.html, /Unsubscribe from listing alerts/)
  assert.match(email.unsubscribeHref, /token=token-1/)
  assert.equal(email.headers['List-Unsubscribe'], `<${email.unsubscribeHref}>`)
  assert.equal(email.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
})

test('the invite is dry-run unless explicitly disabled and skips people already subscribed', () => {
  assert.equal(inviteIsDryRun(new URLSearchParams()), true)
  assert.equal(inviteIsDryRun(new URLSearchParams('dry_run=1')), true)
  assert.equal(inviteIsDryRun(new URLSearchParams('dry_run=0')), false)
  const recipients = selectInviteRecipients(
    ['Lead@Example.com', 'bad', 'lead@example.com', 'on@example.com'],
    new Set(['on@example.com']),
  )
  assert.deepEqual(recipients, ['lead@example.com'])
  assert.equal(inviteRefKey('Lead@Example.com'), 'invite:lead@example.com')
  const invite = renderListingAlertInvite('invite-token')
  assert.equal(invite.subject, 'Want new listing alerts?')
  assert.match(invite.html, /I will not add you unless you click yes/)
  assert.match(invite.html, /8119 Isabella Lane, Suite 105/)
  assert.match(invite.html, /api\/listing-alerts\/confirm\?token=invite-token/)
  assert.equal(invite.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
  assert.equal(invite.html.toLowerCase().includes('parks'), false)
})

test('the listing alert checkbox is unchecked in the signup form', () => {
  const src = readFileSync('components/ListingAlertsSignup.tsx', 'utf8')
  assert.match(src, /name="alert_opt_in"/)
  assert.equal(src.includes('defaultChecked'), false)
  assert.equal(src.includes('checked={true}'), false)
})
