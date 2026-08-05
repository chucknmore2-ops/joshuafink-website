// Regression tests for /compare canonicalization.
//
// Run: npm test
//
// Both directions of every pair are built with mirrored content. They used to
// self-canonicalize, which shipped each comparison as two duplicate pages
// competing with each other. These tests pin the invariant that fixed it:
// a pair and its reverse must always agree on ONE canonical URL.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalPairSlug, FEATURED_PAIRS, getAllPairSlugsForBuild, parsePairSlug } from './compare.ts'

const reverse = (slug: string) => {
  const [a, b] = slug.split('-vs-')
  return `${b}-vs-${a}`
}

test('every built pair agrees with its reverse on one canonical', () => {
  // The core invariant. Covers all ~50 generated routes, both directions.
  for (const slug of getAllPairSlugsForBuild()) {
    assert.equal(
      canonicalPairSlug(slug),
      canonicalPairSlug(reverse(slug)),
      `${slug} and ${reverse(slug)} must canonicalize together`,
    )
  }
})

test('the canonical is always itself a valid, resolvable pair', () => {
  for (const slug of getAllPairSlugsForBuild()) {
    const c = canonicalPairSlug(slug)
    assert.notEqual(parsePairSlug(c), null, `${c} must parse`)
  }
})

test('canonicalization is idempotent', () => {
  for (const slug of getAllPairSlugsForBuild()) {
    const once = canonicalPairSlug(slug)
    assert.equal(canonicalPairSlug(once), once, `${slug} must be stable`)
  }
})

test('featured pairs canonicalize to their curated order', () => {
  for (const [a, b] of FEATURED_PAIRS) {
    assert.equal(canonicalPairSlug(`${a}-vs-${b}`), `${a}-vs-${b}`)
    assert.equal(canonicalPairSlug(`${b}-vs-${a}`), `${a}-vs-${b}`)
  }
})

test('non-featured pairs canonicalize to higher median price first', () => {
  // la-vergne vs franklin is not a featured pair; Franklin is far pricier.
  const c = canonicalPairSlug('la-vergne-tn-vs-franklin-tn')
  assert.equal(c, 'franklin-tn-vs-la-vergne-tn')
  assert.equal(canonicalPairSlug('franklin-tn-vs-la-vergne-tn'), c)
})

test('an unparseable slug is returned untouched', () => {
  // generateMetadata bails before this, but the helper must not throw.
  assert.equal(canonicalPairSlug('nonsense'), 'nonsense')
  assert.equal(canonicalPairSlug('not-a-place-vs-also-not'), 'not-a-place-vs-also-not')
})
