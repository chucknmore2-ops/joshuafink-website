// Regression tests for which listings may be promoted on social.
//
// Run: npm test
//
// Both the LinkedIn and Instagram crons published an "Active Under Contract"
// home captioned "just listed", every run, because the selector took the array
// head and never looked at status. These tests defend two invariants:
//
//   1. A listing that is not positively "Active" is NEVER promotable.
//      Unrecognised status strings must fail closed, not open.
//   2. Selection rotates, so one home cannot monopolise the feed.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isPromotable,
  promotableListings,
  pickPromotable,
  pickWeeklyPromotable,
  nextPromotable,
  fallbackPromotables,
} from './promotable-listings.ts'
import type { Listing } from './listings.ts'

const mk = (over: Partial<Listing> = {}): Listing => ({
  address: '1 Test Way',
  city: 'Brentwood, TN 37027',
  price: 750_000,
  status: 'Active',
  compassUrl: 'https://www.compass.com/x',
  imageUrl: 'https://img/x.jpg',
  ...over,
})

test('an Active listing with all media is promotable', () => {
  assert.equal(isPromotable(mk()), true)
})

test('Active Under Contract is NOT promotable — the original bug', () => {
  assert.equal(isPromotable(mk({ status: 'Active Under Contract' })), false)
})

test('status matching ignores case and surrounding whitespace', () => {
  assert.equal(isPromotable(mk({ status: '  active  ' })), true)
  assert.equal(isPromotable(mk({ status: 'ACTIVE' })), true)
})

test('unrecognised statuses fail CLOSED, never open', () => {
  for (const status of ['Pending', 'Coming Soon', 'Sold', 'Withdrawn', 'Active Contingent', '']) {
    assert.equal(isPromotable(mk({ status })), false, `${status} must not be promotable`)
  }
})

test('a listing missing image, price or Compass URL is not promotable', () => {
  assert.equal(isPromotable(mk({ imageUrl: undefined })), false)
  assert.equal(isPromotable(mk({ price: 0 })), false)
  assert.equal(isPromotable(mk({ compassUrl: '' })), false)
})

test('promotableListings filters a mixed pool down to the available ones', () => {
  const pool = [
    mk({ address: 'A', status: 'Active Under Contract' }),
    mk({ address: 'B' }),
    mk({ address: 'C', status: 'Pending' }),
    mk({ address: 'D' }),
  ]
  assert.deepEqual(
    promotableListings(pool).map((l) => l.address),
    ['B', 'D'],
  )
})

test('an empty or fully-unavailable pool yields null rather than throwing', () => {
  assert.equal(pickPromotable(0, new Date('2026-08-19'), []), null)
  assert.equal(
    pickPromotable(0, new Date('2026-08-19'), [mk({ status: 'Active Under Contract' })]),
    null,
  )
})

test('selection rotates across days instead of pinning the array head', () => {
  const pool = [mk({ address: 'A' }), mk({ address: 'B' }), mk({ address: 'C' })]
  const picked = new Set<string>()
  for (let d = 0; d < 6; d++) {
    const day = new Date(Date.UTC(2026, 7, 19 + d))
    picked.add(pickPromotable(0, day, pool)!.address)
  }
  assert.equal(picked.size, 3, 'six consecutive days should cover all three homes')
})

test('a never-promotable listing is skipped by rotation entirely', () => {
  const pool = [mk({ address: 'UNDER', status: 'Active Under Contract' }), mk({ address: 'OK' })]
  for (let d = 0; d < 8; d++) {
    const day = new Date(Date.UTC(2026, 7, 19 + d))
    assert.equal(pickPromotable(0, day, pool)!.address, 'OK')
  }
})

test('the two channels do not feature the same home on a shared day', () => {
  const pool = [mk({ address: 'A' }), mk({ address: 'B' })]
  const day = new Date(Date.UTC(2026, 7, 19))
  assert.notEqual(pickPromotable(0, day, pool)!.address, pickPromotable(1, day, pool)!.address)
})

// ---------------------------------------------------------------------------
// Weekly channels (Instagram Wed, LinkedIn Thu)
// ---------------------------------------------------------------------------

const sevenHomes = () => Array.from({ length: 7 }, (_, i) => mk({ address: `H${i}` }))
// 2026-09-16 is a Wednesday; +1 day is Thursday.
const wednesday = (weeksLater: number) => new Date(Date.UTC(2026, 8, 16 + 7 * weeksLater, 14))
const thursday = (weeksLater: number) => new Date(Date.UTC(2026, 8, 17 + 7 * weeksLater, 14))

test('the daily rotator pins a weekly channel to one home when the pool is 7 (the bug)', () => {
  const pool = sevenHomes()
  const picks = new Set([0, 1, 2, 3].map((w) => pickPromotable(1, wednesday(w), pool)!.address))
  assert.equal(picks.size, 1, 'documents why weekly channels must not use pickPromotable')
})

test('weekly rotation features every home once across seven Wednesdays', () => {
  const pool = sevenHomes()
  const picks = new Set(
    Array.from({ length: 7 }, (_, w) => pickWeeklyPromotable(1, wednesday(w), pool)!.address),
  )
  assert.equal(picks.size, 7)
})

test("LinkedIn's Thursday home differs from Instagram's Wednesday home that week", () => {
  for (const size of [2, 3, 7]) {
    const pool = sevenHomes().slice(0, size)
    for (let w = 0; w < 10; w++) {
      assert.notEqual(
        pickWeeklyPromotable(1, wednesday(w), pool)!.address,
        pickWeeklyPromotable(0, thursday(w), pool)!.address,
        `pool ${size}, week ${w}`,
      )
    }
  }
})

test('nextPromotable wraps to the following Active home', () => {
  const pool = [mk({ address: 'A' }), mk({ address: 'B' }), mk({ address: 'C' })]
  assert.equal(nextPromotable(pool[0], pool)!.address, 'B')
  assert.equal(nextPromotable(pool[2], pool)!.address, 'A')
})

test('nextPromotable skips homes that are not promotable', () => {
  const pool = [
    mk({ address: 'A' }),
    mk({ address: 'UNDER', status: 'Active Under Contract' }),
    mk({ address: 'C' }),
  ]
  assert.equal(nextPromotable(pool[0], pool)!.address, 'C')
})

test('nextPromotable returns null when there is nothing else to fall back to', () => {
  assert.equal(nextPromotable(mk({ address: 'A' }), [mk({ address: 'A' })]), null)
  assert.equal(nextPromotable(mk({ address: 'A' }), []), null)
})

test('fallbackPromotables returns two distinct homes after the current one', () => {
  const pool = [
    mk({ address: 'A' }),
    mk({ address: 'B' }),
    mk({ address: 'C' }),
    mk({ address: 'D' }),
  ]
  assert.deepEqual(
    fallbackPromotables(pool[0], 2, pool).map((l) => l.address),
    ['B', 'C'],
  )
  assert.deepEqual(
    fallbackPromotables(pool[3], 2, pool).map((l) => l.address),
    ['A', 'B'],
  )
})

test('fallbackPromotables stops when the pool has nothing else', () => {
  assert.deepEqual(fallbackPromotables(mk({ address: 'A' }), 2, [mk({ address: 'A' })]), [])
  const two = [mk({ address: 'A' }), mk({ address: 'B' })]
  assert.deepEqual(
    fallbackPromotables(two[0], 2, two).map((l) => l.address),
    ['B'],
  )
})

test('weekly rotation still skips unavailable homes and handles an empty pool', () => {
  assert.equal(pickWeeklyPromotable(0, wednesday(0), []), null)
  const pool = [mk({ address: 'UNDER', status: 'Active Under Contract' }), mk({ address: 'OK' })]
  for (let w = 0; w < 4; w++) {
    assert.equal(pickWeeklyPromotable(1, wednesday(w), pool)!.address, 'OK')
  }
})
