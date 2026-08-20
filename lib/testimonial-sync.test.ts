// The Facebook autoposter must never publish a client testimonial that differs
// from the review the client actually left.
//
// Run: npm test
//
// services/autoposter/src/content/testimonials.ts was hand-maintained and
// drifted: a 2026-08-18 audit found three reviewers republished under INVENTED
// full surnames ("Anthony C." → "Anthony Contaldo", "Joseph C." → "Joseph A.
// Cortez", "Adam S." → "Adam Smith") plus testimonial text carrying sentences
// the clients never wrote — posted publicly, attributed by name, with a Zillow
// link offered as proof that did not corroborate them.
//
// Two invariants, both non-negotiable for a licensed broker:
//   1. Every published testimonial is VERBATIM from lib/reviews.ts.
//   2. No client's last name is ever published.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reviews } from './reviews.ts'
import { testimonials } from '../services/autoposter/src/content/testimonials.ts'

test('every testimonial matches a real review verbatim', () => {
  for (const t of testimonials) {
    const source = reviews.find((r) => r.reviewer === t.reviewer)
    assert.ok(source, `"${t.reviewer}" is not a reviewer in lib/reviews.ts — invented attribution`)
    assert.equal(
      t.text,
      source.text,
      `testimonial text for "${t.reviewer}" does not match the review they actually left`,
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

test('a stated location is never invented — it comes from the review', () => {
  for (const t of testimonials) {
    if (!t.location) continue
    const source = reviews.find((r) => r.reviewer === t.reviewer)!
    assert.ok(
      source.transaction.includes(t.location),
      `location "${t.location}" for "${t.reviewer}" is not in their review's transaction ("${source.transaction}")`,
    )
  }
})
