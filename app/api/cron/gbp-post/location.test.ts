// GBP v4 localPosts parent. These tests never call Google. Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeGbpLocationId } from './location.ts'

const ACCOUNT = 'accounts/123456789012345'
const LOCATION = '987654321'
const FULL = `${ACCOUNT}/locations/${LOCATION}`

test('composes accounts/.../locations/... when GBP_LOCATION_ID is the v1 name', () => {
  assert.equal(
    normalizeGbpLocationId(`locations/${LOCATION}`, ACCOUNT),
    FULL,
  )
})

test('leaves an already-full v4 parent unchanged', () => {
  assert.equal(normalizeGbpLocationId(FULL, ACCOUNT), FULL)
  assert.equal(normalizeGbpLocationId(FULL, 'accounts/999'), FULL)
  assert.equal(normalizeGbpLocationId(FULL, null), FULL)
})

test('prefixes a bare location number with the account', () => {
  assert.equal(normalizeGbpLocationId(LOCATION, ACCOUNT), FULL)
  assert.equal(normalizeGbpLocationId(LOCATION, '123456789012345'), FULL)
})

test('prefixes a bare location number with locations/ when no account is set', () => {
  assert.equal(normalizeGbpLocationId(LOCATION, undefined), `locations/${LOCATION}`)
  assert.equal(normalizeGbpLocationId(LOCATION, '  '), `locations/${LOCATION}`)
})

test('keeps a v1 location name when GBP_ACCOUNT_ID is missing', () => {
  assert.equal(
    normalizeGbpLocationId(`locations/${LOCATION}`, undefined),
    `locations/${LOCATION}`,
  )
})

test('trims whitespace and does not double-prefix accounts/', () => {
  assert.equal(
    normalizeGbpLocationId(`  locations/${LOCATION}  `, `  ${ACCOUNT}  `),
    FULL,
  )
  assert.equal(
    normalizeGbpLocationId(`locations/${LOCATION}`, ACCOUNT),
    FULL,
  )
  assert.equal(normalizeGbpLocationId(FULL, ACCOUNT).startsWith('accounts/accounts/'), false)
})
