// Retry / failure classification for GEO answer-engine calls.
//
// Run: npm test
//
// Weekly GEO was dropping Perplexity on request_rate_limit_exceeded (HTTP 429)
// because retries fired immediately at concurrency 3. These pin the classifier
// (credits must win over a 429) and the backoff schedule.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyFailure,
  GEO_QUERY_CONCURRENCY,
  nextRetryDelayMs,
  parseRetryAfterMs,
  rateLimitDelayMs,
} from './geo-engines.ts'

test('default query concurrency is 1 so Perplexity is not triple-fired', () => {
  assert.equal(GEO_QUERY_CONCURRENCY, 1)
})

test('insufficient_quota on HTTP 429 is credits, not rate-limit', () => {
  assert.equal(classifyFailure('HTTP 429: {"error":{"code":"insufficient_quota"}}'), 'credits')
})

test('request_rate_limit_exceeded is rate-limit', () => {
  assert.equal(
    classifyFailure('HTTP 429: {"error":{"type":"request_rate_limit_exceeded"}}'),
    'rate-limit',
  )
})

test('HTTP 429 alone is rate-limit', () => {
  assert.equal(classifyFailure('HTTP 429: too many requests'), 'rate-limit')
})

test('HTTP 401 is auth', () => {
  assert.equal(classifyFailure('HTTP 401: invalid_api_key'), 'auth')
})

test('rate-limit backoff grows exponentially and caps', () => {
  const noJitter = () => 0
  assert.equal(rateLimitDelayMs(1, noJitter), 2_000)
  assert.equal(rateLimitDelayMs(2, noJitter), 4_000)
  assert.equal(rateLimitDelayMs(3, noJitter), 8_000)
  assert.equal(rateLimitDelayMs(4, noJitter), 16_000)
  assert.equal(rateLimitDelayMs(5, noJitter), 20_000)
})

test('rate-limit backoff jitter is at most 50%', () => {
  const full = () => 0.999
  const d = rateLimitDelayMs(1, full)
  assert.ok(d >= 2_000)
  assert.ok(d < 2_000 + 1_000)
})

test('nextRetryDelayMs does not retry credits or auth', () => {
  assert.equal(nextRetryDelayMs('credits', 1), null)
  assert.equal(nextRetryDelayMs('auth', 1), null)
})

test('nextRetryDelayMs retries rate-limit up to four attempts', () => {
  assert.equal(nextRetryDelayMs('rate-limit', 1, { random: () => 0 }), 2_000)
  assert.equal(nextRetryDelayMs('rate-limit', 3, { random: () => 0 }), 8_000)
  assert.equal(nextRetryDelayMs('rate-limit', 4, { random: () => 0 }), null)
})

test('nextRetryDelayMs retries timeout/other once immediately', () => {
  assert.equal(nextRetryDelayMs('timeout', 1), 0)
  assert.equal(nextRetryDelayMs('timeout', 2), null)
  assert.equal(nextRetryDelayMs('other', 1), 0)
  assert.equal(nextRetryDelayMs('other', 2), null)
})

test('parseRetryAfterMs reads seconds from the error suffix', () => {
  assert.equal(parseRetryAfterMs('HTTP 429: busy retry-after=5'), 5_000)
  assert.equal(parseRetryAfterMs('HTTP 429: no hint'), null)
})

test('nextRetryDelayMs honors a longer Retry-After, capped', () => {
  assert.equal(
    nextRetryDelayMs('rate-limit', 1, { random: () => 0, retryAfterMs: 10_000 }),
    10_000,
  )
  assert.equal(
    nextRetryDelayMs('rate-limit', 1, { random: () => 0, retryAfterMs: 120_000 }),
    20_000,
  )
})
