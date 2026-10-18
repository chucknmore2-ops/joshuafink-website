import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recordEmailSubmission, recordIpSubmission } from './lead-rate-limit.ts'

const T0 = 1_800_000_000_000

test('the 13th submit inside a minute is the flood cap', () => {
  const ip = '198.51.100.10'
  let last = { flooded: false, recent: 0 }
  for (let i = 0; i < 13; i++) last = recordIpSubmission(ip, T0 + i)
  assert.equal(last.flooded, true)
  assert.equal(last.recent, 13)
})

test('twelve submits inside a minute are under the flood cap', () => {
  const ip = '198.51.100.11'
  let last = { flooded: false, recent: 0 }
  for (let i = 0; i < 12; i++) last = recordIpSubmission(ip, T0 + i)
  assert.equal(last.flooded, false)
  assert.equal(last.recent, 12)
})

test('a hit just outside the flood minute still counts toward the 10-minute window', () => {
  const ip = '198.51.100.12'
  for (let i = 0; i < 12; i++) recordIpSubmission(ip, T0)
  const later = recordIpSubmission(ip, T0 + 61_000)
  assert.equal(later.flooded, false)
  assert.equal(later.recent, 13)
})

test('hits older than 10 minutes drop out of the IP count', () => {
  const ip = '198.51.100.13'
  recordIpSubmission(ip, T0)
  recordIpSubmission(ip, T0 + 1_000)
  const later = recordIpSubmission(ip, T0 + 10 * 60_000 + 1_000)
  assert.equal(later.flooded, false)
  assert.equal(later.recent, 1)
})

test('email counting is case-insensitive and ignores a blank address', () => {
  const now = T0 + 20_000
  assert.equal(recordEmailSubmission('', now), 0)
  assert.equal(recordEmailSubmission('   ', now), 0)
  assert.equal(recordEmailSubmission('not-an-email', now), 0)
  assert.equal(recordEmailSubmission('Person@Example.com', now), 1)
  assert.equal(recordEmailSubmission('person@example.com', now + 1), 2)
  // A different address does not share the bucket.
  assert.equal(recordEmailSubmission('other@example.com', now + 2), 1)
})
