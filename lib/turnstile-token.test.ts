import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TURNSTILE_REFRESH_AFTER_MS,
  TURNSTILE_WAIT_MOBILE_MS,
  TURNSTILE_WAIT_MS,
  isSlowTurnstileClient,
  turnstileTokenStale,
  turnstileWaitMs,
  waitForTurnstileToken,
} from './turnstile-token.ts'

test('phones wait longer than desktops before a token counts as missing', () => {
  assert.equal(turnstileWaitMs(false), TURNSTILE_WAIT_MS)
  assert.equal(turnstileWaitMs(true), TURNSTILE_WAIT_MOBILE_MS)
  assert.ok(TURNSTILE_WAIT_MOBILE_MS > TURNSTILE_WAIT_MS)
  assert.equal(isSlowTurnstileClient({ coarsePointer: false, narrowViewport: false, userAgent: 'Mozilla/5.0' }), false)
  assert.equal(isSlowTurnstileClient({ coarsePointer: true, narrowViewport: false, userAgent: '' }), true)
  assert.equal(isSlowTurnstileClient({ coarsePointer: false, narrowViewport: true, userAgent: '' }), true)
  assert.equal(isSlowTurnstileClient({
    coarsePointer: false,
    narrowViewport: false,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  }), true)
})

test('a fresh token is kept and a missing, expired, or aging token is refreshed', () => {
  const now = 1_700_000_000_000
  assert.equal(turnstileTokenStale({ token: '', issuedAt: now, now, expired: false }), true)
  assert.equal(turnstileTokenStale({ token: 'tok', issuedAt: null, now, expired: false }), true)
  assert.equal(turnstileTokenStale({ token: 'tok', issuedAt: now, now, expired: true }), true)
  assert.equal(turnstileTokenStale({
    token: 'tok',
    issuedAt: now - TURNSTILE_REFRESH_AFTER_MS,
    now,
    expired: false,
  }), true)
  assert.equal(turnstileTokenStale({
    token: 'tok',
    issuedAt: now - TURNSTILE_REFRESH_AFTER_MS + 1,
    now,
    expired: false,
  }), false)
})

test('submit resets a stale token and waits for the replacement', async () => {
  let token = 'expired-token'
  let issued = true
  let resets = 0
  let clock = 0
  const result = await waitForTurnstileToken({
    readToken: () => token,
    stale: (value) => value === 'expired-token' || !issued,
    refresh: () => {
      resets += 1
      token = ''
      issued = false
    },
    shouldRefresh: true,
    waitMs: 200,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms
      if (clock >= 100) {
        token = 'fresh-token'
        issued = true
      }
    },
  })
  assert.equal(result, 'fresh-token')
  assert.equal(resets, 1)
})

test('a fresh token is returned without a reset', async () => {
  let resets = 0
  const result = await waitForTurnstileToken({
    readToken: () => 'fresh-token',
    stale: () => false,
    refresh: () => {
      resets += 1
    },
    shouldRefresh: false,
    waitMs: 4_000,
    now: () => 0,
    sleep: async () => {
      throw new Error('should not wait')
    },
  })
  assert.equal(result, 'fresh-token')
  assert.equal(resets, 0)
})

test('a token that never arrives is treated as missing when the wait ends', async () => {
  let clock = 0
  let resets = 0
  const result = await waitForTurnstileToken({
    readToken: () => '',
    stale: () => true,
    refresh: () => {
      resets += 1
    },
    shouldRefresh: true,
    waitMs: 100,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms
    },
  })
  assert.equal(result, '')
  assert.equal(resets, 1)
  assert.ok(clock >= 100)
})
