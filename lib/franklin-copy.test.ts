import { test } from 'node:test'
import assert from 'node:assert/strict'
import { suburbs } from './suburbs.ts'

const franklin = suburbs['franklin-tn']
const blob = [
  franklin.description,
  franklin.buyerDescription ?? '',
  ...(franklin.whyBullets ?? []),
  ...(franklin.buyerWhyBullets ?? []),
  ...franklin.faqs.map((f) => `${f.q} ${f.a}`),
  ...(franklin.buyerFaqs ?? []).map((f) => `${f.q} ${f.a}`),
].join('\n')

test('Franklin copy does not place Governors Club in Franklin or claim a weekend seller market', () => {
  assert.doesNotMatch(blob, /Governors Club/)
  assert.doesNotMatch(blob, /first weekend/)
  assert.doesNotMatch(blob, /seller's market/i)
  assert.doesNotMatch(blob, /overwhelming buyer demand/)
  assert.match(blob, /83,454/)
  assert.match(blob, /90,226/)
  assert.match(blob, /\$862,929/)
  assert.match(blob, /Redfin, as of October 5, 2026/)
  assert.match(blob, /median days on market is 49/)
  assert.match(blob, /Westhaven/)
  assert.match(blob, /Cool Springs/)
})

test('Brentwood still owns the Governors Club mention', () => {
  const brentwood = [
    suburbs['brentwood-tn'].description,
    ...suburbs['brentwood-tn'].faqs.map((f) => f.a),
  ].join('\n')
  assert.match(brentwood, /Governors Club/)
})
