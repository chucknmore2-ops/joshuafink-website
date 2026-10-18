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
// seconds, several independent signals adding up, an obviously fake phone
// (+7, 79990000000, or 10 zeros in a row), a name that is exactly "test"
// with a blank or "test" message, or more than 3 submissions in the window
// from one IP or one email. Those rows are kept on the sheet and do not
// email or Pushover. A 10-digit US number is never a +7 hit.

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

test('a phone-only lead is clean, and honeypot and speed still quarantine it', () => {
  const phoneOnly = lead({ email: '' })
  assert.equal(classifyLead(phoneOnly).kind, 'clean')

  const bot = classifyLead({ ...phoneOnly, website: 'http://spam.example' })
  assert.equal(bot.kind, 'bot')
  assert.equal(bot.kind === 'bot' ? bot.reason : '', 'honeypot')

  const fast = classifyLead({ ...phoneOnly, _loaded: String(Date.now() - 500) })
  assert.equal(fast.kind, 'spam')
  assert.equal(fast.kind === 'spam' ? fast.reason : '', 'too_fast')
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

test('three submits from one IP stay a normal lead', () => {
  const v = classifyLead(lead(), { recentSubmissions: 3, recentEmailSubmissions: 3 })
  assert.equal(v.kind, 'clean')
})

test('a fourth submit from one IP is quarantined on its own', () => {
  const v = classifyLead(lead(), { recentSubmissions: 4 })
  assert.equal(v.kind, 'spam')
  assert.equal(v.reason, 'ip_rate_limit')
})

test('a fourth submit from one email is quarantined on its own', () => {
  const v = classifyLead(lead(), { recentEmailSubmissions: 4 })
  assert.equal(v.kind, 'spam')
  assert.equal(v.reason, 'email_rate_limit')
})

test('ip and email rate limits are both named when both are over the cap', () => {
  const v = classifyLead(lead(), { recentSubmissions: 4, recentEmailSubmissions: 5 })
  assert.equal(v.kind, 'spam')
  assert.equal(v.reason, 'ip_rate_limit+email_rate_limit')
})

test('a fixable mistake stays a visible error even past the rate cap', () => {
  const v = classifyLead(lead({ name: '' }), { recentSubmissions: 9, recentEmailSubmissions: 9 })
  assert.equal(v.kind, 'invalid')
})

test('one weak signal plus three submits is still only a tag', () => {
  const v = classifyLead(
    lead({ body: 'see https://peskartyhrt.buzz/x' }),
    { recentSubmissions: 3 },
  )
  assert.equal(v.kind, 'suspect')
  assert.equal(v.reason, 'spam_url')
})

test('a scam phrase plus a non-Latin script is enough to quarantine', () => {
  const v = classifyLead(lead({
    body: 'Вам перевод 137698 руб. получить тут',
  }))
  assert.equal(v.kind, 'spam')
})

// ---------------------------------------------------------------------------
// Oct 2026 "Test" / +79990000000 wave. Quarantine the phone and the
// test/blank pair. Do not quarantine a real US number or a real message.
// ---------------------------------------------------------------------------

test('the +79990000000 bot number is quarantined in every stored shape', () => {
  for (const phone of [
    '+79990000000',
    '+7999 0000000',
    '+7 999 000-00-00',
    '+7 (999) 000-00-00',
    '79990000000',
    '7 999 000 00 00',
  ]) {
    const v = classifyLead(lead({
      name: 'Test',
      phone,
      email: 'someone.real@gmail.com',
      body: 'Test',
    }))
    assert.equal(v.kind, 'spam', phone)
    assert.equal(v.kind === 'spam' ? v.reason : '', 'fake_phone', phone)
  }
})

test('any country-code +7 number is quarantined on a US-only site', () => {
  for (const phone of ['+7 495 123 45 67', '+74951234567', '74951234567']) {
    const v = classifyLead(lead({
      name: 'Irina Petrova',
      phone,
      body: 'We are moving to Franklin and would like to see homes.',
    }))
    assert.equal(v.kind, 'spam', phone)
    assert.equal(v.kind === 'spam' ? v.reason : '', 'fake_phone', phone)
  }
})

test('ten or more zeros in a row is an obviously fake phone', () => {
  for (const phone of ['0000000000', '000-000-0000', '+1 000 000 0000', '10000000000', '6150000000000']) {
    const v = classifyLead(lead({ phone, body: 'Please call me about Franklin.' }))
    assert.equal(v.kind, 'spam', phone)
    assert.equal(v.kind === 'spam' ? v.reason : '', 'fake_phone', phone)
  }
})

test('US numbers are not treated as +7 or as a zero-run, including area codes that start with 7', () => {
  for (const phone of [
    '615-555-0142',
    '(615) 551-2727',
    '+1 615 555 0142',
    '1-615-555-0142',
    '731-555-0199', // Jackson, TN
    '770-555-0142', // Atlanta — 10 digits starting with 7
    '+1 (770) 555-0142',
    '6150000000', // seven zeros, under the 10-zero rule
  ]) {
    const v = classifyLead(lead({
      phone,
      body: 'We would like to tour homes in Franklin this weekend.',
    }))
    assert.equal(v.kind, 'clean', phone)
  }
})

test('a name that is exactly test with a blank or test message is quarantined', () => {
  for (const body of ['', '   ', 'Test', ' test ', 'TEST']) {
    const v = classifyLead(lead({
      name: 'Test',
      phone: '615-555-0142',
      email: 'real.person@gmail.com',
      body,
    }))
    assert.equal(v.kind, 'spam', JSON.stringify(body))
    assert.equal(v.kind === 'spam' ? v.reason : '', 'test_submission', JSON.stringify(body))
  }
  const cased = classifyLead(lead({ name: '  TeSt  ', phone: '615-555-0142', body: '' }))
  assert.equal(cased.kind, 'spam')
  assert.equal(cased.kind === 'spam' ? cased.reason : '', 'test_submission')
})

test('test in only the name or only the message still delivers', () => {
  const named = classifyLead(lead({
    name: 'Test',
    phone: '615-555-0142',
    body: 'Hi Joshua, we want to see homes in Brentwood.',
  }))
  assert.equal(named.kind, 'clean')

  const messaged = classifyLead(lead({
    name: 'Sarah Whitfield',
    body: 'test',
  }))
  assert.equal(messaged.kind, 'clean')

  const longerName = classifyLead(lead({
    name: 'Test Smith',
    body: '',
  }))
  assert.equal(longerName.kind, 'clean')

  const punctuated = classifyLead(lead({
    name: 'Test',
    phone: '615-555-0142',
    body: 'Test.',
  }))
  assert.equal(punctuated.kind, 'clean')
})

test('a fake phone wins over the test-name rule and over the rate cap', () => {
  const v = classifyLead(
    lead({ name: 'Test', phone: '+79990000000', body: 'Test' }),
    { recentSubmissions: 8, recentEmailSubmissions: 8 },
  )
  assert.equal(v.kind, 'spam')
  assert.equal(v.reason, 'fake_phone')
})
