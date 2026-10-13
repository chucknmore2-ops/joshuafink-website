import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectListingEvents, type ListingSnapshot } from './listing-events.ts'
import { GOOGLE_REVIEW_URL } from './reviews.ts'
import {
  newlySoldFlips,
  readyToTextReviewMessage,
  SOLD_FLIP_PUSHOVER_TITLE,
  soldFlipPushoverMessage,
  type SoldFlipListing,
} from './sold-flip.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function home(overrides: Partial<SoldFlipListing> = {}): SoldFlipListing {
  return {
    address: '10 Oak St',
    city: 'Franklin, TN 37064',
    status: 'Active',
    compassUrl: 'https://www.compass.com/homedetails/10-Oak-St-Franklin-TN-37064/ABC_pid/',
    ...overrides,
  }
}

test('a listing that leaves active and lands in sold is one flip', () => {
  const prior = home()
  const sold = home({ status: 'Sold' })
  const flips = newlySoldFlips([prior], [], [], [sold])
  assert.equal(flips.length, 1)
  assert.equal(flips[0].address, '10 Oak St')
  assert.equal(flips[0].status, 'Sold')
})

test('an active status that flips to Sold on the active file is a flip', () => {
  const prior = home()
  const next = home({ status: 'Sold' })
  const flips = newlySoldFlips([prior], [next], [], [])
  assert.equal(flips.length, 1)
})

test('historical sold inventory and withdrawn listings do not page', () => {
  const alreadySold = home({ status: 'Sold', address: '1 Old Rd' })
  const withdrawn = home({ address: '2 Gone Ln', compassUrl: 'https://www.compass.com/homedetails/2/DEF_pid/' })
  const stillActive = home({ address: '3 Stay Ct', compassUrl: 'https://www.compass.com/homedetails/3/GHI_pid/' })
  const flips = newlySoldFlips(
    [alreadySold, withdrawn, stillActive],
    [stillActive],
    [alreadySold],
    [alreadySold],
  )
  assert.deepEqual(flips, [])
})

test('a Compass URL change still matches on address, and a repeat sold file does not double-alert', () => {
  const prior = home()
  const sold = home({
    status: 'Closed',
    compassUrl: 'https://www.compass.com/homedetails/10-Oak-St/NEW_pid/?x=1',
  })
  assert.equal(newlySoldFlips([prior], [], [], [sold]).length, 1)
  assert.equal(newlySoldFlips([prior], [], [sold], [sold]).length, 0)
})

test('the Pushover draft is for Josh to text, with the write-review link and no client send', () => {
  const message = soldFlipPushoverMessage(home({ status: 'Sold' }))
  assert.equal(SOLD_FLIP_PUSHOVER_TITLE, 'Just sold — text a review ask')
  assert.match(message, /flipped to Sold/)
  assert.match(message, /Nothing was texted or emailed to the client/)
  assert.match(message, /\[First name\]/)
  assert.match(message, /10 Oak St in Franklin, TN 37064/)
  assert.match(message, new RegExp(GOOGLE_REVIEW_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.equal(readyToTextReviewMessage(home()), message.split('\n').at(-1))
  assert.doesNotMatch(message, /maps\.app\.goo\.gl/)
  assert.doesNotMatch(message, /twilio|sendSms|messages\.create/i)
})

test('a sold flip is not a public listing event', () => {
  const snap = (status: string): ListingSnapshot => ({
    address: '10 Oak St',
    city: 'Franklin, TN 37064',
    price: 900000,
    status,
    compassUrl: 'https://www.compass.com/homedetails/10-Oak-St/ABC_pid/',
    imageUrl: 'https://example.com/a.jpg',
    seenAt: '2026-10-06T14:53:43.661Z',
    generation: 1,
  })
  assert.deepEqual(detectListingEvents([snap('Active')], [snap('Sold')]), [])
})

test('the Compass sync notifies Josh and does not text the client', () => {
  const sync = readFileSync(join(repoRoot, 'scripts/sync-all.sh'), 'utf8')
  const workflow = readFileSync(join(repoRoot, '.github/workflows/sync-listings.yml'), 'utf8')
  const script = readFileSync(join(repoRoot, 'scripts/notify-sold-flips.ts'), 'utf8')
  assert.match(sync, /notify-sold-flips/)
  assert.match(workflow, /PUSHOVER_TOKEN/)
  assert.match(workflow, /PUSHOVER_USER/)
  assert.match(script, /soldFlipPushoverMessage/)
  assert.match(script, /api\.pushover\.net\/1\/messages\.json/)
  assert.match(script, /Phone alert skipped/)
  assert.doesNotMatch(script, /twilio|messages\.create|sms:/i)
  assert.doesNotMatch(workflow, /kind=sold/)
})
