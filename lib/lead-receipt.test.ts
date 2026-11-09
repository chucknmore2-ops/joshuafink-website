import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  acceptReceipt,
  decoyReceipt,
  leadReceiptMatches,
  newSubmitNonce,
  receiptForLead,
  usableSubmitNonce,
} from './lead-receipt.ts'

test('a receipt matches only the nonce the server accepted', async () => {
  const nonce = newSubmitNonce()
  assert.equal(usableSubmitNonce(nonce), true)
  const ref = await acceptReceipt(nonce)
  assert.equal(await leadReceiptMatches(nonce, { ok: true, ref }), true)
  assert.equal(await leadReceiptMatches(newSubmitNonce(), { ok: true, ref }), false)
  assert.equal(await leadReceiptMatches(nonce, { ok: true, ref: ref.slice(0, -1) + (ref.endsWith('A') ? 'B' : 'A') }), false)
  assert.equal(await leadReceiptMatches('', { ok: true, ref }), false)
  assert.equal(await leadReceiptMatches(nonce, { ok: true }), false)
  assert.equal(await leadReceiptMatches(nonce, null), false)
})

test('a boolean on the body does not decide acceptance', async () => {
  const nonce = newSubmitNonce()
  const ref = await acceptReceipt(nonce)
  assert.equal(await leadReceiptMatches(nonce, { ok: true, accepted: false, ref }), true)
  assert.equal(await leadReceiptMatches(nonce, { ok: true, accepted: true, ref: decoyReceipt() }), false)
})

test('quarantine and acceptance refs are the same shape, and only acceptance verifies', async () => {
  const nonce = newSubmitNonce()
  const accepted = await receiptForLead(nonce, true)
  const blocked = await receiptForLead(nonce, false)
  const missingNonce = await receiptForLead('', true)
  assert.equal(accepted.length, blocked.length)
  assert.equal(accepted.length, missingNonce.length)
  assert.match(accepted, /^[A-Za-z0-9_-]{43}$/)
  assert.match(blocked, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(await leadReceiptMatches(nonce, { ref: accepted }), true)
  assert.equal(await leadReceiptMatches(nonce, { ref: blocked }), false)
  assert.equal(await leadReceiptMatches(nonce, { ref: missingNonce }), false)
  assert.notEqual(accepted, blocked)
})

test('a short or oversized nonce is not usable', () => {
  assert.equal(usableSubmitNonce('short'), false)
  assert.equal(usableSubmitNonce('a'.repeat(65)), false)
  assert.equal(usableSubmitNonce('bad nonce value!!'), false)
  assert.equal(usableSubmitNonce('A'.repeat(16)), true)
})
