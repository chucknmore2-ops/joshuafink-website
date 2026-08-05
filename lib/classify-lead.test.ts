// Regression tests for lead classification.
//
// Run: npm test
//
// This logic has silently discarded real leads four separate times. Every case
// in the first block below is a message shape that WAS being thrown away behind
// a fake success screen. They are here so it cannot happen a fifth time.
//
// The invariant these tests defend: only the honeypot may discard a lead.
// A shape heuristic may tag one, never drop it.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyLead } from './classify-lead.ts'

const lead = (over: Record<string, string> = {}) => ({
  name: 'Sarah Whitfield',
  phone: '615-555-0142',
  email: 'sarah@example.com',
  ...over,
})

// ---------------------------------------------------------------------------
// Real leads that were previously dropped. None of these may ever return 'bot'.
// ---------------------------------------------------------------------------

test('a pasted listing link is delivered, not dropped', () => {
  // The exact shape that motivated this fix: a buyer asking about one house.
  const v = classifyLead(lead({
    body: 'Is this one still available? https://www.zillow.com/homedetails/123-Main-St-Franklin-TN-37064/12345678_zpid/',
  }))
  assert.notEqual(v.kind, 'bot')
  assert.equal(v.kind, 'clean', 'a URL is no longer counted as a gibberish token')
})

test('a seller pasting their listing URL as the address is delivered', () => {
  const v = classifyLead(lead({
    source: 'cash-offer',
    property_address: 'https://www.redfin.com/TN/Nashville/456-Oak-St/home/98765',
  }))
  assert.notEqual(v.kind, 'bot')
  assert.equal(v.kind, 'suspect')
  assert.equal(v.reason, 'url_in_field')
})

test('short real inquiries are clean', () => {
  for (const body of ['Still available?', 'Interested!', 'Showing tomorrow?']) {
    const v = classifyLead(lead({ body }))
    assert.equal(v.kind, 'clean', `"${body}" must be delivered`)
  }
})

test('a long single-token surname is delivered', () => {
  // A real "Konstantinopoulos" was dropped by the old rule.
  const v = classifyLead(lead({ name: 'Konstantinopoulos' }))
  assert.equal(v.kind, 'clean')
})

test('a hyphenated surname is tagged but still delivered', () => {
  // Internal caps trip the heuristic — that is precisely why it must not drop.
  const v = classifyLead(lead({ name: 'McDonald-McCarthy' }))
  assert.notEqual(v.kind, 'bot')
  assert.equal(v.kind, 'suspect')
})

test('a dotted gmail address is delivered', () => {
  const v = classifyLead(lead({ email: 'j.o.h.n.smith@gmail.com' }))
  assert.notEqual(v.kind, 'bot')
  assert.equal(v.kind, 'suspect')
})

test('an email address in the message body is not gibberish', () => {
  const v = classifyLead(lead({ body: 'Please reach me at a.very.long.address@somelongdomain.com' }))
  assert.equal(v.kind, 'clean')
})

// ---------------------------------------------------------------------------
// The honeypot is the only rule allowed to discard.
// ---------------------------------------------------------------------------

test('honeypot is the only path to bot', () => {
  assert.equal(classifyLead(lead({ website: 'http://spam.example' })).kind, 'bot')
})

test('no heuristic returns bot', () => {
  const shapes: Record<string, string>[] = [
    { body: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },       // gibberish_body
    { name: 'xKJhsdfKJHsdfKJH' },                          // random_name
    { email: 'x@mailinator.com' },                         // disposable_email
    { phone: '5555555555' },                               // phone_repeated
    { phone: '1234567890' },                               // phone_sequential
    { name: 'https://spam.example/x' },                    // url_in_field
  ]
  for (const s of shapes) {
    const v = classifyLead(lead(s))
    assert.notEqual(v.kind, 'bot', `${JSON.stringify(s)} must not be discarded`)
  }
})

// ---------------------------------------------------------------------------
// Fixable mistakes get a visible error, never a fake success.
// ---------------------------------------------------------------------------

test('a missing name is a correctable error, not a silent drop', () => {
  const v = classifyLead(lead({ name: '' }))
  assert.equal(v.kind, 'invalid')
  assert.match(v.kind === 'invalid' ? v.message : '', /name/i)
})

test('an incomplete phone is a correctable error', () => {
  const v = classifyLead(lead({ phone: '615551' }))
  assert.equal(v.kind, 'invalid')
  assert.equal(v.reason, 'phone_too_short')
})

test('a blank phone is fine when an email is given', () => {
  assert.equal(classifyLead(lead({ phone: '' })).kind, 'clean')
})

test('a cash-offer with no address is a correctable error', () => {
  const v = classifyLead(lead({ source: 'cash-offer', property_address: '' }))
  assert.equal(v.kind, 'invalid')
  assert.equal(v.reason, 'address_too_short')
})

test('the address rule only applies to cash-offer leads', () => {
  assert.equal(classifyLead(lead({ source: 'contact', property_address: '' })).kind, 'clean')
})

// ---------------------------------------------------------------------------
// Genuine junk is still caught — just tagged rather than vanished.
// ---------------------------------------------------------------------------

test('real gibberish is still flagged', () => {
  const v = classifyLead(lead({ body: 'asdkjhasdkjhasdkjhaskdjhaskjdhaskjdh' }))
  assert.equal(v.kind, 'suspect')
  assert.equal(v.reason, 'gibberish_body')
})

test('an ordinary lead is clean', () => {
  const v = classifyLead(lead({ body: 'Hi Joshua, we are relocating to Franklin in the spring and would love to talk.' }))
  assert.equal(v.kind, 'clean')
})
