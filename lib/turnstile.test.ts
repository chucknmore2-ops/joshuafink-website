// Unit tests for the Turnstile siteverify helper.
//
// Uses Cloudflare's documented dummy keys and the dummy token
// XXXX.DUMMY.TOKEN.XXXX. The live siteverify endpoint is not called: CI must
// not depend on Cloudflare being reachable, and a dummy secret rejects any
// token other than the dummy one. The mocked bodies are the JSON shapes from
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TURNSTILE_DUMMY_TOKEN,
  TURNSTILE_SITEVERIFY_URL,
  TURNSTILE_TEST_SECRET_FAIL,
  TURNSTILE_TEST_SECRET_PASS,
  TURNSTILE_TEST_SECRET_SPENT,
  TURNSTILE_TEST_SITEKEY_INVISIBLE_PASS,
  TURNSTILE_TEST_SITEKEY_PASS,
  verifyTurnstile,
} from './turnstile.ts'

function configuredEnv(secret: string, siteKey = TURNSTILE_TEST_SITEKEY_INVISIBLE_PASS) {
  return {
    TURNSTILE_SECRET_KEY: secret,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: siteKey,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('a documented always-pass secret accepts the dummy token', async () => {
  let calls = 0
  const outcome = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    remoteIp: '203.0.113.10',
    env: configuredEnv(TURNSTILE_TEST_SECRET_PASS),
    fetchImpl: (async (url, init) => {
      calls += 1
      assert.equal(String(url), TURNSTILE_SITEVERIFY_URL)
      const sent = JSON.parse(String(init?.body))
      assert.equal(sent.secret, TURNSTILE_TEST_SECRET_PASS)
      assert.equal(sent.response, TURNSTILE_DUMMY_TOKEN)
      assert.equal(sent.remoteip, '203.0.113.10')
      return jsonResponse({
        success: true,
        challenge_ts: '2022-02-28T15:14:30.096Z',
        hostname: 'localhost',
        'error-codes': [],
        action: 'test',
        cdata: 'test-data',
      })
    }) as typeof fetch,
  })
  assert.equal(calls, 1)
  assert.deepEqual(outcome, { ok: true, skipped: false, failOpen: false })
})

test('a documented always-fail secret rejects the token', async () => {
  const outcome = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: configuredEnv(TURNSTILE_TEST_SECRET_FAIL, TURNSTILE_TEST_SITEKEY_PASS),
    fetchImpl: (async () => jsonResponse({
      success: false,
      'error-codes': ['invalid-input-response'],
    })) as typeof fetch,
  })
  assert.deepEqual(outcome, { ok: false, reason: 'turnstile_failed' })
})

test('a documented spent-token secret is a hard failure', async () => {
  const outcome = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: configuredEnv(TURNSTILE_TEST_SECRET_SPENT),
    fetchImpl: (async () => jsonResponse({
      success: false,
      'error-codes': ['timeout-or-duplicate'],
    })) as typeof fetch,
  })
  assert.deepEqual(outcome, { ok: false, reason: 'turnstile_failed' })
})

test('a missing token fails closed and does not call siteverify', async () => {
  let calls = 0
  const outcome = await verifyTurnstile({
    token: '   ',
    env: configuredEnv(TURNSTILE_TEST_SECRET_PASS),
    fetchImpl: (async () => {
      calls += 1
      return jsonResponse({ success: true })
    }) as typeof fetch,
  })
  assert.equal(calls, 0)
  assert.deepEqual(outcome, { ok: false, reason: 'turnstile_failed' })
})

test('unset keys skip verification even when a token is present', async () => {
  let calls = 0
  const fetchImpl = (async () => {
    calls += 1
    return jsonResponse({ success: false, 'error-codes': ['invalid-input-response'] })
  }) as typeof fetch

  const neither = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: {},
    fetchImpl,
  })
  const secretOnly = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: { TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET_PASS },
    fetchImpl,
  })
  const siteOnly = await verifyTurnstile({
    token: '',
    env: { NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITEKEY_INVISIBLE_PASS },
    fetchImpl,
  })
  const blank = await verifyTurnstile({
    token: '',
    env: { TURNSTILE_SECRET_KEY: '  ', NEXT_PUBLIC_TURNSTILE_SITE_KEY: '  ' },
    fetchImpl,
  })

  assert.equal(calls, 0)
  assert.deepEqual(neither, { ok: true, skipped: true })
  assert.deepEqual(secretOnly, { ok: true, skipped: true })
  assert.deepEqual(siteOnly, { ok: true, skipped: true })
  assert.deepEqual(blank, { ok: true, skipped: true })
})

test('a siteverify network error fails open', async () => {
  const outcome = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: configuredEnv(TURNSTILE_TEST_SECRET_PASS),
    fetchImpl: (async () => {
      throw new Error('network down')
    }) as typeof fetch,
  })
  assert.deepEqual(outcome, { ok: true, skipped: false, failOpen: true })
})

test('a siteverify timeout fails open', async () => {
  const outcome = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: configuredEnv(TURNSTILE_TEST_SECRET_PASS),
    timeoutMs: 20,
    fetchImpl: ((_url, init) => new Promise((_resolve, reject) => {
      const signal = init?.signal
      if (!signal) return
      if (signal.aborted) {
        reject(new Error('aborted'))
        return
      }
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    })) as typeof fetch,
  })
  assert.deepEqual(outcome, { ok: true, skipped: false, failOpen: true })
})

test('a Cloudflare HTTP or internal error fails open', async () => {
  const http = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: configuredEnv(TURNSTILE_TEST_SECRET_PASS),
    fetchImpl: (async () => jsonResponse({ success: false }, 500)) as typeof fetch,
  })
  const internal = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: configuredEnv(TURNSTILE_TEST_SECRET_PASS),
    fetchImpl: (async () => jsonResponse({
      success: false,
      'error-codes': ['internal-error'],
    })) as typeof fetch,
  })
  const badSecret = await verifyTurnstile({
    token: TURNSTILE_DUMMY_TOKEN,
    env: configuredEnv('not-a-real-secret'),
    fetchImpl: (async () => jsonResponse({
      success: false,
      'error-codes': ['invalid-input-secret'],
    })) as typeof fetch,
  })
  assert.deepEqual(http, { ok: true, skipped: false, failOpen: true })
  assert.deepEqual(internal, { ok: true, skipped: false, failOpen: true })
  assert.deepEqual(badSecret, { ok: true, skipped: false, failOpen: true })
})
