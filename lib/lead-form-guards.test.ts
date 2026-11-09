// Every lead form has to carry the same honeypot and mount timestamp.
// A second honeypot input inside a page would overwrite the shared one.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const FORMS = [
  'components/SuburbLeadForm.tsx',
  'app/contact/ContactForm.tsx',
  'app/sell/SellForm.tsx',
  'app/cash-offer/CashOfferForm.tsx',
]

test('every lead form renders the shared honeypot and timestamp', () => {
  for (const file of FORMS) {
    const src = readFileSync(file, 'utf8')
    assert.match(src, /<LeadFormGuards\s*\/>/, `${file} is missing LeadFormGuards`)
  }
})

test('every lead form waits for a Turnstile token, and the widget is not in the layout', () => {
  const layout = readFileSync('app/layout.tsx', 'utf8')
  assert.equal(layout.includes('challenges.cloudflare.com'), false)
  assert.equal(layout.includes('TurnstileWidget'), false)
  const guards = readFileSync('components/LeadFormGuards.tsx', 'utf8')
  assert.match(guards, /<TurnstileWidget\s*\/>/)
  const widget = readFileSync('components/TurnstileWidget.tsx', 'utf8')
  assert.match(widget, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/)
  assert.match(widget, /appearance: 'interaction-only'/)
  assert.match(widget, /script\.async = false/)
  assert.equal(/turnstile\.ready\(/.test(widget), false)
  assert.match(widget, /name="cf-turnstile-response"|TOKEN_FIELD = 'cf-turnstile-response'/)
  assert.match(widget, /width: 0/)
  assert.match(widget, /height: 0/)
  assert.match(widget, /waitForTurnstileToken/)
  assert.match(widget, /turnstileTokenStale/)
  assert.match(widget, /turnstileWaitMs\(slowClient\(\)\)/)
  assert.match(widget, /api\.reset\(slot\.widgetId\)/)
  assert.match(widget, /isExpired/)
  assert.match(widget, /slot\.tokenAt = Date\.now\(\)/)
  assert.match(widget, /'expired-callback'/)
  for (const file of FORMS) {
    const src = readFileSync(file, 'utf8')
    assert.match(src, /ensureTurnstileToken\(form\)/, `${file} does not attach a Turnstile token`)
  }
})

test('the honeypot is off-screen, unlabeled, and not an autofill field name', () => {
  const src = readFileSync('components/LeadFormGuards.tsx', 'utf8')
  const honeypot = readFileSync('lib/honeypot.ts', 'utf8')
  assert.match(honeypot, /HONEYPOT_FIELD = 'hp_confirm'/)
  assert.match(src, /name=\{HONEYPOT_FIELD\}/)
  assert.equal(src.includes('name="website"'), false)
  assert.equal(src.includes('name="url"'), false)
  assert.equal(src.includes('name="email"'), false)
  assert.match(src, /name="_loaded"/)
  assert.match(src, /autoComplete="off"/)
  assert.match(src, /aria-hidden="true"/)
  assert.match(src, /tabIndex=\{-1\}/)
  assert.match(src, /data-1p-ignore="true"/)
  assert.match(src, /data-lpignore="true"/)
  assert.match(src, /data-bwignore="true"/)
  assert.match(src, /data-protonpass-ignore="true"/)
  assert.match(src, /useEffect\(/)
  assert.equal(/value=\{Date\.now\(\)/.test(src), false)
  assert.equal(/<label/.test(src), false)
  assert.match(src, /position: 'absolute'/)
  assert.match(src, /left: '-9999px'/)
})

test('no page adds a second honeypot beside the shared component', () => {
  const pages = [
    'app/buy/page.tsx',
    'app/neighborhoods/page.tsx',
    'app/guide/buyer/page.tsx',
    'app/guide/seller/page.tsx',
    'app/page.tsx',
    'app/sell/page.tsx',
    'app/contact/page.tsx',
    'app/cash-offer/page.tsx',
  ]
  for (const file of pages) {
    const src = readFileSync(file, 'utf8')
    assert.equal(src.includes('name="website"'), false, `${file} duplicates the honeypot`)
    assert.equal(src.includes('name="hp_confirm"'), false, `${file} duplicates the honeypot`)
  }
})
