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
import { isPromotable, promotableListings, pickPromotable } from './promotable-listings.ts'
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
