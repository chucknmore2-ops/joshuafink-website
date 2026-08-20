// The Facebook autoposter must credit clients the same way the website does.
//
// Run: npm test
//
// These are genuine reviews from Zillow and Google Business Profile. The issue
// this guards is PRIVACY, not authenticity: services/autoposter's testimonial
// list was hand-maintained, drifted from lib/reviews.ts, and had come to carry
// clients' full last names plus a different excerpt of the same review than the
// site shows.
//
// Josh's rule: a client's last name is never published. lib/reviews.ts is where
// it is decided how each client is credited and which part of their review is
// quoted, so the autoposter must follow it rather than keep its own copy.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reviews } from './reviews.ts'
import { testimonials } from '../services/autoposter/src/content/testimonials.ts'

test('every testimonial quotes lib/reviews.ts verbatim', () => {
  for (const t of testimonials) {
    const source = reviews.find((r) => r.reviewer === t.reviewer)
    assert.ok(source, `"${t.reviewer}" is not credited in lib/reviews.ts — the site decides how clients are credited`)
    assert.equal(
      t.text,
      source.text,
      `the excerpt published for "${t.reviewer}" differs from the one lib/reviews.ts quotes`,
    )
  }
})

test('no testimonial publishes a full last name', () => {
  // A real surname is a second capitalised word of 2+ letters. Initials
  // ("Adam S.") and handles ("BreezyCraig") are fine; "Verified Buyer" is a
  // platform placeholder, not a person.
  const ALLOWED = new Set(['Verified Buyer'])
  for (const t of testimonials) {
    if (ALLOWED.has(t.reviewer)) continue
    assert.ok(
      !/^[A-Z][a-z]+\s+[A-Z][a-z]{2,}/.test(t.reviewer),
      `"${t.reviewer}" looks like a full name — clients are published as first name + initial only`,
    )
  }
})

test('a stated location comes from the review, not from elsewhere', () => {
  for (const t of testimonials) {
    if (!t.location) continue
    const source = reviews.find((r) => r.reviewer === t.reviewer)!
    assert.ok(
      source.transaction.includes(t.location),
      `location "${t.location}" for "${t.reviewer}" is not in their review's transaction ("${source.transaction}")`,
    )
  }
})
