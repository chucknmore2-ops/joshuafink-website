import assert from 'node:assert/strict'
import test from 'node:test'
import { inListingWindow } from './schedule.ts'

test('listing window is Monday, Wednesday, and Friday just after 14:00 UTC', () => {
  assert.equal(inListingWindow(new Date('2026-09-28T14:00:00Z')), true) // Monday
  assert.equal(inListingWindow(new Date('2026-09-30T14:05:00Z')), true) // Wednesday
  assert.equal(inListingWindow(new Date('2026-10-02T14:19:00Z')), true) // Friday
  assert.equal(inListingWindow(new Date('2026-09-30T14:20:00Z')), false)
  assert.equal(inListingWindow(new Date('2026-09-29T14:00:00Z')), false) // Tuesday
  assert.equal(inListingWindow(new Date('2026-09-30T13:59:00Z')), false)
})
