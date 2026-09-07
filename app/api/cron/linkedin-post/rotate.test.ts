// LinkedIn weekly rotator: next slot comes from the last successful post,
// not ISO-week parity. Same blog slug must not fire twice in a row when a
// listing is due (2026-09-07 briefing).
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  nextLinkedInWeeklySlot,
  pickWeeklyLinkedIn,
} from './rotate.ts'

const blog = (slug = 'buying-a-house-before-the-end-of-the-year-middle-tennessee') => ({
  kind: 'blog' as const,
  refKey: slug,
})
const listing = (slug = '1113-linn-cv-ct-gallatin') => ({
  kind: 'listing' as const,
  refKey: slug,
})

test('after a successful blog, the next weekly slot is a featured listing', () => {
  assert.equal(
    nextLinkedInWeeklySlot({ kind: 'blog', refKey: 'year-end-close' }, 36),
    'listing',
  )
})

test('after a successful listing, the next weekly slot is a blog', () => {
  assert.equal(
    nextLinkedInWeeklySlot({ kind: 'listing', refKey: 'some-home' }, 36),
    'blog',
  )
})

test('ISO-week parity is only a seed when nothing has posted yet', () => {
  // Week 36 is even — historical rule would pick blog. Two fires in that
  // week used to both pick blog; once a success is logged, parity is ignored.
  assert.equal(nextLinkedInWeeklySlot(null, 36), 'blog')
  assert.equal(nextLinkedInWeeklySlot(null, 37), 'listing')
})

test('a failed or on-demand kind is not treated as the last weekly slot', () => {
  assert.equal(nextLinkedInWeeklySlot({ kind: 'testimonial', refKey: 'lindsay-d' }, 36), 'blog')
  assert.equal(nextLinkedInWeeklySlot({ kind: 'sold', refKey: '1901-new-bristol' }, 37), 'listing')
  assert.equal(nextLinkedInWeeklySlot({ kind: 'none', refKey: 'no-payload' }, 36), 'blog')
})

test('same ISO week no longer double-fires the latest blog after a success', () => {
  const week = 36 // even — old rotator would pick blog both times
  const first = pickWeeklyLinkedIn({
    last: null,
    weekNumber: week,
    buildBlog: () => blog(),
    buildListing: () => listing(),
  })
  assert.equal(first?.kind, 'blog')
  assert.equal(first?.refKey, blog().refKey)

  const second = pickWeeklyLinkedIn({
    last: first,
    weekNumber: week,
    buildBlog: () => blog(),
    buildListing: () => listing(),
  })
  assert.equal(second?.kind, 'listing')
  assert.notEqual(second?.refKey, first?.refKey)
})

test('when a listing is due, the same blog slug is not used as a fallback', () => {
  const lastBlog = blog()
  const picked = pickWeeklyLinkedIn({
    last: lastBlog,
    weekNumber: 36,
    buildBlog: (exclude) => (exclude === lastBlog.refKey ? null : blog()),
    buildListing: () => null,
  })
  assert.equal(picked, null)
})

test('when a listing is due and unavailable, an older blog may still post', () => {
  const lastBlog = blog()
  const older = blog('nashville-housing-market-forecast-2026')
  const picked = pickWeeklyLinkedIn({
    last: lastBlog,
    weekNumber: 36,
    buildBlog: (exclude) => (exclude === lastBlog.refKey ? older : lastBlog),
    buildListing: () => null,
  })
  assert.deepEqual(picked, older)
})

test('a listing success followed by a blog success is the normal alternation', () => {
  const picked = pickWeeklyLinkedIn({
    last: listing(),
    weekNumber: 36,
    buildBlog: () => blog(),
    buildListing: () => listing(),
  })
  assert.deepEqual(picked, blog())
})
