import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isFranklinBuyerPageReview, reviews } from './reviews.ts'

// The Franklin buyer page may only surface quotes that already live in
// lib/reviews.ts. These identities are the Brentwood buyer quotes from
// January 2024, November 2021, and September 2020, plus the Thompson's
// Station quotes from March 2022 and August 2020 — including both Brentwood
// buyers dated November 2021.
const EXPECTED = [
  ['Macallan1794', 'January 2024', 'Bought a home in Brentwood, TN'],
  ['BreezyCraig', 'March 2022', 'Bought a home in Thompsons Station, TN'],
  ['Joseph C.', 'November 2021', 'Bought a home in Brentwood, TN'],
  ['Adam S.', 'November 2021', 'Bought a home in Brentwood, TN'],
  ['Brian K.', 'September 2020', 'Bought a home in Brentwood, TN'],
  ['Bonnie O.', 'August 2020', 'Bought and sold a home in Thompsons Station, TN'],
] as const

test('Franklin buyer page quotes are existing reviews, verbatim', () => {
  const picked = reviews.filter(isFranklinBuyerPageReview)
  assert.deepEqual(
    picked.map((r) => [r.reviewer, r.date, r.transaction]),
    EXPECTED,
  )
  for (const review of picked) {
    const source = reviews.find((r) => r.reviewer === review.reviewer && r.date === review.date)
    assert.equal(review, source)
    assert.equal(review.text, source?.text)
    assert.equal(review.rating, 5)
  }
})

test('Franklin buyer page reuses ReviewStrip and does not add Review schema', () => {
  const page = readFileSync(new URL('../app/buy/[suburb]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /slug === 'franklin-tn' && \(/)
  assert.match(page, /<ReviewStrip/)
  assert.match(page, /variant="light"/)
  assert.match(page, /filter=\{isFranklinBuyerPageReview\}/)
  assert.match(page, /limit=\{reviews\.length\}/)
  assert.doesNotMatch(page, /Parks/)
  assert.equal(page.includes("'@type': 'Review'"), false)
  assert.equal(page.split("'@type': 'AggregateRating'").length - 1, 1)
})
