// Every lead form has to carry the same honeypot and mount timestamp.
// A second `website` input inside a page would overwrite the shared one.

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
  for (const file of FORMS) {
    const src = readFileSync(file, 'utf8')
    assert.match(src, /ensureTurnstileToken\(form\)/, `${file} does not attach a Turnstile token`)
  }
})

test('the honeypot is off-screen, unlabeled, and the timestamp is not a render-time clock', () => {
  const src = readFileSync('components/LeadFormGuards.tsx', 'utf8')
  assert.match(src, /name="website"/)
  assert.match(src, /name="_loaded"/)
  assert.match(src, /autoComplete="off"/)
  assert.match(src, /aria-hidden="true"/)
  assert.match(src, /tabIndex=\{-1\}/)
  assert.match(src, /useEffect\(/)
  assert.equal(/value=\{Date\.now\(\)/.test(src), false)
  assert.equal(/<label/.test(src), false)
})

test('no page adds a second website honeypot beside the shared component', () => {
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
  }
})
