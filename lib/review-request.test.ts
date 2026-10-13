// Google review asks should hit the write-a-review URL and fire a GA event.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const link = readFileSync('components/ReviewRequestLink.tsx', 'utf8')
const cta = readFileSync('components/GoogleReviewCTA.tsx', 'utf8')
const strip = readFileSync('components/ReviewStrip.tsx', 'utf8')
const page = readFileSync('app/review/page.tsx', 'utf8')

test('review request link uses the write-a-review URL and a review_request event', () => {
  assert.match(link, /GOOGLE_REVIEW_URL/)
  assert.match(link, /review_request/)
  assert.doesNotMatch(link, /maps\.app\.goo\.gl/)
  assert.doesNotMatch(link, /zillow\.com/)
})

test('the review button and the review strip both ask for a Google review', () => {
  assert.match(cta, /ReviewRequestLink/)
  assert.match(cta, /Leave a Google Review/)
  assert.match(strip, /Leave a Google review/)
  assert.match(strip, /review-strip-request/)
  assert.match(page, /review-page-request/)
})
