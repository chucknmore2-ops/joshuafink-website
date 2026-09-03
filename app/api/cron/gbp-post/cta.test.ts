// CALL CTA must not send a url (Google rejects tel: as INVALID_ARGUMENT).
// LEARN_MORE must still send an https url.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CALL_CTA,
  gbpCreatePayload,
  serializeCallToAction,
} from './cta.ts'

test('ISO week 36 is the even-week review slot (the 2026-09-01 failure)', () => {
  // odd  week                → Brentwood market update (Aug 25 week 35 succeeded)
  // even week, (week/2)%4=2  → client review          (Sep 1 week 36 400'd)
  const week = 36
  assert.equal(week % 2, 0)
  assert.equal(Math.floor(week / 2) % 4, 2)
  assert.equal(35 % 2, 1)
})

test('CALL CTA builder omits url — no tel: on the review-week button', () => {
  assert.equal(CALL_CTA.actionType, 'CALL')
  assert.equal('url' in CALL_CTA, false)

  const serialized = serializeCallToAction(CALL_CTA)
  assert.deepEqual(serialized, { actionType: 'CALL' })
  assert.equal('url' in serialized, false)

  const payload = gbpCreatePayload({
    summary: '⭐ What clients say about Joshua Fink Group',
    cta: CALL_CTA,
  })
  assert.deepEqual(payload.callToAction, { actionType: 'CALL' })
  const json = JSON.stringify(payload)
  assert.equal(json.includes('url'), false)
  assert.equal(json.includes('tel:'), false)
  assert.equal(json.includes('6155512727'), false)
})

test('LEARN_MORE CTA still includes an https url', () => {
  const cta = {
    actionType: 'LEARN_MORE' as const,
    url: 'https://www.joshuafink.com/sell/brentwood-tn',
  }
  const serialized = serializeCallToAction(cta)
  assert.deepEqual(serialized, cta)

  const payload = gbpCreatePayload({
    summary: '📊 Brentwood, TN Market Update',
    cta,
  })
  assert.deepEqual(payload.callToAction, cta)
  assert.match((payload.callToAction as { url: string }).url, /^https:\/\//)
})

test('create-payload skips an empty cta.url so CALL cannot regress', () => {
  const leaked = serializeCallToAction({
    actionType: 'LEARN_MORE',
    url: '',
  })
  assert.deepEqual(leaked, { actionType: 'LEARN_MORE' })
  assert.equal('url' in leaked, false)
})
