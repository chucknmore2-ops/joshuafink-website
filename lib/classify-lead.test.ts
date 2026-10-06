// Regression tests for lead classification.
//
// Run: npm test
//
// This logic has silently discarded real leads four separate times. Every case
// in the first block below is a message shape that WAS being thrown away behind
// a fake success screen. They are here so it cannot happen a fifth time.
//
// A single weak signal may tag a lead. It must not quarantine one.
// Quarantine (kind 'spam' or 'bot') is honeypot, a submit faster than 3
// seconds, or several independent signals adding up. Those rows are kept
// on the sheet and do not email or Pushover.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyLead } from './classify-lead.ts'

const lead = (over: Record<string, string> = {}) => ({
  name: 'Sarah Whitfield',
  phone: '615-555-0142',
  email: 'sarah@example.com',
  // A normal human waited. Tests that care about timing override this.
  _loaded: String(Date.now() - 30_000),
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

test('honeypot is quarantined as a bot', () => {
  const v = classifyLead(lead({ website: 'http://spam.example' }))
  assert.equal(v.kind, 'bot')
  assert.equal(v.reason, 'honeypot')
})

test('no single heuristic quarantines a lead', () => {
  const shapes: Record<string, string>[] = [
    { body: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },       // gibberish_body
    { name: 'xKJhsdfKJHsdfKJH' },                          // random_name
    { email: 'x@mailinator.com' },                         // disposable_email
    { phone: '5555555555' },                               // phone_repeated
    { phone: '1234567890' },                               // phone_sequential
    { name: 'https://spam.example/x' },                    // url_in_field
    { body: 'see https://peskartyhrt.buzz/ycSMkSil' },     // one untrusted link
    { phone: '85211936711' },                              // non-US phone alone
    { body: 'Здравствуйте, мы ищем дом в Franklin.' },     // another script, no scam phrase
  ]
  for (const s of shapes) {
    const v = classifyLead(lead(s))
    assert.notEqual(v.kind, 'bot', `${JSON.stringify(s)} must not be a honeypot hit`)
    assert.notEqual(v.kind, 'spam', `${JSON.stringify(s)} must not be quarantined`)
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

test('city cash-offer pages (source cash-offer-<city>) get the same address rule', () => {
  const v = classifyLead(lead({ source: 'cash-offer-franklin-tn', property_address: '' }))
  assert.equal(v.kind, 'invalid')
  assert.equal(v.reason, 'address_too_short')
  assert.equal(
    classifyLead(lead({ source: 'cash-offer-franklin-tn', property_address: '123 Main St, Franklin' })).kind,
    'clean',
  )
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

// ---------------------------------------------------------------------------
// The 2026-10-06 spam wave. Quarantine the combination. Do not quarantine
// a real person who only trips one of the same checks.
// ---------------------------------------------------------------------------

const SCREENSHOT_SPAM = {
  name: 'kicchooge',
  phone: '85211936711',
  email: 'stephaniehodges3187@smaqt.com',
  body: 'Вам перевод 137698 руб. получить тут https://peskartyhrt.buzz/ycSMkSil SVWVE268274NFDAW',
  lead_type: 'general',
  source: 'homepage',
  traffic_source: 'direct',
  page_url: 'https://www.joshuafink.com/',
  landing_page: 'https://www.joshuafink.com/',
  submit: '',
}

test('the screenshot spam lead is quarantined', () => {
  const v = classifyLead(lead(SCREENSHOT_SPAM))
  assert.equal(v.kind, 'spam')
  assert.match(v.reason, /non_latin/)
  assert.match(v.reason, /spam_phrase/)
  assert.match(v.reason, /spam_url/)
  assert.match(v.reason, /non_us_phone/)
})

test('the same spam is still quarantined when the bot omits the timestamp', () => {
  const v = classifyLead(lead({ ...SCREENSHOT_SPAM, _loaded: '' }))
  assert.equal(v.kind, 'spam')
})

test('a submit faster than 3 seconds is quarantined', () => {
  const now = 1_800_000_000_000
  const v = classifyLead(
    lead({
      body: 'Hi Joshua, we would like to sell our home in Franklin.',
      _loaded: String(now - 800),
    }),
    { now },
  )
  assert.equal(v.kind, 'spam')
  assert.equal(v.reason, 'too_fast')
})

test('a submit at exactly 3 seconds is not too fast', () => {
  const now = 1_800_000_000_000
  const v = classifyLead(lead({ _loaded: String(now - 3000) }), { now })
  assert.equal(v.kind, 'clean')
})

test('a missing timestamp does not quarantine or tag a normal lead', () => {
  const v = classifyLead(lead({ _loaded: '' }))
  assert.equal(v.kind, 'clean')
})

test('a build-time timestamp hours old is not treated as too fast', () => {
  const now = 1_800_000_000_000
  const v = classifyLead(
    lead({ _loaded: String(now - 5 * 24 * 60 * 60 * 1000) }),
    { now },
  )
  assert.equal(v.kind, 'clean')
})

test('a clock a few seconds ahead of the server is not too fast', () => {
  const now = 1_800_000_000_000
  const v = classifyLead(lead({ _loaded: String(now + 5_000) }), { now })
  assert.equal(v.kind, 'clean')
})

test('a realtor.com link in an otherwise normal message is clean', () => {
  const v = classifyLead(lead({
    body: 'Can we tour this weekend? https://www.realtor.com/realestateandhomes-detail/10-Main-St_Franklin_TN_37064_M12345-67890',
  }))
  assert.equal(v.kind, 'clean')
})

test('international names are clean', () => {
  for (const name of ['Nguyễn Thị Lan', 'José García', 'Søren Kjærgaard', 'Priya Sharma']) {
    const v = classifyLead(lead({
      name,
      body: 'We are moving to Franklin next month and would like to see homes.',
    }))
    assert.equal(v.kind, 'clean', name)
  }
})

test('an international name plus one listing link is clean', () => {
  const v = classifyLead(lead({
    name: 'Nguyễn Thị Lan',
    phone: '+44 7911 123456',
    body: 'Is this still available? https://www.zillow.com/homedetails/123-Main-St-Franklin-TN-37064/12345678_zpid/',
  }))
  assert.equal(v.kind, 'clean')
})

test('a message in Cyrillic without a scam phrase is delivered and tagged', () => {
  const v = classifyLead(lead({
    name: 'Irina Petrova',
    body: 'Здравствуйте, мы переезжаем в Franklin и ищем дом.',
  }))
  assert.equal(v.kind, 'suspect')
  assert.match(v.reason, /non_latin/)
})

test('one untrusted link is tagged, not quarantined', () => {
  const v = classifyLead(lead({ body: 'Look at this https://peskartyhrt.buzz/ycSMkSil' }))
  assert.equal(v.kind, 'suspect')
  assert.equal(v.reason, 'spam_url')
})

test('a non-US phone alone is still a normal lead', () => {
  const v = classifyLead(lead({ phone: '85211936711' }))
  assert.equal(v.kind, 'clean')
})

test('five submits from one IP tag a normal lead and do not quarantine it', () => {
  const v = classifyLead(lead(), { recentSubmissions: 5 })
  assert.equal(v.kind, 'suspect')
  assert.equal(v.reason, 'rate_limit')
})

test('repeated submits do not quarantine a lead that also has one weak signal', () => {
  const v = classifyLead(
    lead({ body: 'see https://peskartyhrt.buzz/x' }),
    { recentSubmissions: 6 },
  )
  assert.notEqual(v.kind, 'spam')
  assert.equal(v.kind, 'suspect')
})

test('a scam phrase plus a non-Latin script is enough to quarantine', () => {
  const v = classifyLead(lead({
    body: 'Вам перевод 137698 руб. получить тут',
  }))
  assert.equal(v.kind, 'spam')
})
