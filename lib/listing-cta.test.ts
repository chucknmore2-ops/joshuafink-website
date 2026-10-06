import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listingCtaKind, listingStatusLabel } from './listing-cta.ts'

test('active listings ask for a showing', () => {
  assert.equal(listingCtaKind('Active'), 'showing')
  assert.equal(listingCtaKind('Open House'), 'showing')
})

test('coming soon asks to be notified when the home is live', () => {
  assert.equal(listingCtaKind('Coming Soon'), 'coming-soon')
})

test('under contract points at similar homes, including the MLS active-under-contract label', () => {
  assert.equal(listingCtaKind('Active Under Contract'), 'under-contract')
  assert.equal(listingCtaKind('Pending'), 'under-contract')
  assert.equal(listingStatusLabel('Active Under Contract'), 'Under Contract')
})

test('sold stays a sold follow-up', () => {
  assert.equal(listingCtaKind('Sold'), 'sold')
  assert.equal(listingCtaKind('Closed'), 'sold')
})
