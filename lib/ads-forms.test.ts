// Submits the lead forms and click-to-call links the way a visitor does.
// generate_lead and the Google Ads conversion fire only after a successful
// submit. Validation errors, HTTP failures, and a missing gtag send nothing.
// Ads env vars unset → no conversion event.

import { test, before, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { MISSING_CONTACT_MESSAGE } from './lead-form.ts'

// tsx compiles JSX with the classic runtime because tsconfig uses
// "jsx": "preserve". The app itself is built with Next's automatic runtime.
const reactGlobal = globalThis as typeof globalThis & { React: typeof React }
reactGlobal.React = React

delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
delete process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL
delete process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'https://www.joshuafink.com/contact',
  pretendToBeVisual: true,
})

const win = dom.window
globalThis.window = win as unknown as Window & typeof globalThis
globalThis.document = win.document
globalThis.FormData = win.FormData
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
Object.defineProperty(globalThis, 'navigator', {
  value: win.navigator,
  configurable: true,
  writable: true,
})
win.HTMLElement.prototype.scrollIntoView = () => {}

const ADS_ID = 'AW-123456789'
const LEAD_LABEL = 'leadLabel1'
const CALL_LABEL = 'callLabel1'
const PII = {
  name: 'Jane Q Public',
  email: 'jane.q.public@example.com',
  phone: '615-555-0199',
  address: '123 Secret Hollow Rd',
}

type GtagCall = unknown[]
type Root = ReturnType<typeof import('react-dom/client').createRoot>

let createRoot: typeof import('react-dom/client').createRoot
let CashOfferForm: typeof import('../app/cash-offer/CashOfferForm.tsx').default
let SuburbLeadForm: typeof import('../components/SuburbLeadForm.tsx').default
let SellForm: typeof import('../app/sell/SellForm.tsx').default
let ContactForm: typeof import('../app/contact/ContactForm.tsx').default
let TrackedTelLink: typeof import('../components/TrackedTelLink.tsx').default

const originalFetch = globalThis.fetch

before(async () => {
  const [client, cash, suburb, sell, contact, tel] = await Promise.all([
    import('react-dom/client'),
    import('../app/cash-offer/CashOfferForm.tsx'),
    import('../components/SuburbLeadForm.tsx'),
    import('../app/sell/SellForm.tsx'),
    import('../app/contact/ContactForm.tsx'),
    import('../components/TrackedTelLink.tsx'),
  ])
  createRoot = client.createRoot
  CashOfferForm = cash.default
  SuburbLeadForm = suburb.default
  SellForm = sell.default
  ContactForm = contact.default
  TrackedTelLink = tel.default
})

afterEach(() => {
  delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  delete process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL
  delete process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL
  globalThis.fetch = originalFetch
  delete (win as unknown as { gtag?: unknown }).gtag
})

function installGtag(): GtagCall[] {
  const calls: GtagCall[] = []
  ;(win as unknown as { gtag: (...args: unknown[]) => void }).gtag = (...args) => {
    calls.push(args)
  }
  return calls
}

function setAds(on: boolean): void {
  if (!on) return
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = ADS_ID
  process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL = LEAD_LABEL
}

function mockFetch(result: 'ok' | 'blocked' | 'network'): { count: () => number } {
  let n = 0
  globalThis.fetch = (async () => {
    n += 1
    if (result === 'network') throw new Error('offline')
    if (result === 'blocked') {
      return new Response(JSON.stringify({ error: 'Blocked lead' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch
  return { count: () => n }
}

async function mount(element: React.ReactElement): Promise<Root> {
  document.body.innerHTML = '<div id="root"></div>'
  const container = document.getElementById('root')
  assert.ok(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(element)
  })
  return root
}

async function unmount(root: Root): Promise<void> {
  await act(async () => {
    root.unmount()
  })
}

function setField(name: string, value: string): void {
  const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)
  assert.ok(el, `missing field ${name}`)
  el.value = value
}

function fillLead(fields: Array<'name' | 'email' | 'phone' | 'address' | 'body'>): void {
  if (fields.includes('name')) setField('name', PII.name)
  if (fields.includes('email')) setField('email', PII.email)
  if (fields.includes('phone')) setField('phone', PII.phone)
  if (fields.includes('address')) setField('property_address', PII.address)
  if (fields.includes('body')) setField('body', 'Looking in Franklin.')
}

async function submitForm(): Promise<void> {
  const form = document.querySelector('form')
  assert.ok(form)
  await act(async () => {
    form.requestSubmit()
    await new Promise((resolve) => setTimeout(resolve, 30))
  })
}

function assertNoPii(calls: GtagCall[]): void {
  const blob = JSON.stringify(calls)
  for (const value of Object.values(PII)) {
    assert.equal(blob.includes(value), false, `gtag payload included ${value}`)
  }
}

function telLink(href: string, label: string, cta?: string) {
  const props = {
    href,
    children: label,
    ...(cta ? { 'data-cta': cta } : {}),
  } as React.ComponentProps<typeof TrackedTelLink>
  return React.createElement(TrackedTelLink, props)
}

function assertNoLeadOrConversion(calls: GtagCall[]): void {
  const names = calls.map((call) => call[1])
  assert.equal(names.includes('generate_lead'), false)
  assert.equal(names.includes('conversion'), false)
}

function assertConversion(calls: GtagCall[], label: string): void {
  const conversions = calls.filter((call) => call[1] === 'conversion')
  assert.equal(conversions.length, 1)
  assert.deepEqual(conversions[0], [
    'event',
    'conversion',
    { send_to: `${ADS_ID}/${label}`, value: 1, currency: 'USD' },
  ])
}

type LeadCase = {
  name: string
  element: () => React.ReactElement
  fill: () => void
  successText: string
  category: string
  label: string
  invalid: () => void
}

function cases(): LeadCase[] {
  return [
    {
      name: 'CashOfferForm',
      element: () => React.createElement(CashOfferForm),
      fill: () => fillLead(['name', 'email', 'phone', 'address']),
      successText: 'We Got It!',
      category: 'cash_offer',
      label: 'cash_offer',
      invalid: () => {},
    },
    {
      name: 'SellForm',
      element: () => React.createElement(SellForm),
      fill: () => fillLead(['name', 'email', 'phone', 'address']),
      successText: 'Request Sent!',
      category: 'lead_form',
      label: 'sell_valuation_form',
      invalid: () => fillLead(['name', 'address']),
    },
    {
      name: 'ContactForm',
      element: () => React.createElement(ContactForm),
      fill: () => fillLead(['name', 'email', 'phone', 'body']),
      successText: 'Message Sent!',
      category: 'lead_form',
      label: 'contact-page',
      invalid: () => fillLead(['name', 'body']),
    },
    {
      name: 'SuburbLeadForm',
      element: () =>
        React.createElement(
          SuburbLeadForm,
          {
            successTitle: 'Suburb received',
            successMessage: 'Thanks.',
            resetLabel: 'Again',
          } as React.ComponentProps<typeof SuburbLeadForm>,
          React.createElement('input', { name: 'name' }),
          React.createElement('input', { name: 'phone' }),
          React.createElement('input', { name: 'email' }),
          React.createElement('input', { name: 'property_address' }),
          React.createElement('input', { type: 'hidden', name: 'source', value: 'suburb-page' }),
          React.createElement('button', { type: 'submit' }, 'Send'),
        ),
      fill: () => fillLead(['name', 'email', 'phone', 'address']),
      successText: 'Suburb received',
      category: 'lead_form',
      label: 'suburb-page',
      invalid: () => fillLead(['name', 'address']),
    },
  ]
}

for (const lead of [
  'CashOfferForm',
  'SellForm',
  'ContactForm',
  'SuburbLeadForm',
] as const) {
  test(`${lead} fires generate_lead and the Ads conversion only on a successful submit`, async () => {
    const spec = cases().find((item) => item.name === lead)
    if (!spec) throw new Error(`missing case ${lead}`)

    setAds(true)
    const calls = installGtag()
    const fetchMock = mockFetch('ok')
    const root = await mount(spec.element())
    spec.fill()
    await submitForm()
    assert.equal(fetchMock.count(), 1)
    assert.match(document.body.textContent || '', new RegExp(spec.successText))
    assert.deepEqual(
      calls.map((call) => call[1]),
      ['generate_lead', 'conversion'],
    )
    assert.deepEqual(calls[0], [
      'event',
      'generate_lead',
      { event_category: spec.category, event_label: spec.label, value: 1 },
    ])
    assertConversion(calls, LEAD_LABEL)
    assertNoPii(calls)
    await unmount(root)

    const blocked = installGtag()
    const blockedFetch = mockFetch('blocked')
    const blockedRoot = await mount(spec.element())
    spec.fill()
    await submitForm()
    assert.equal(blockedFetch.count(), 1)
    assert.match(document.body.textContent || '', /Blocked lead/)
    assertNoLeadOrConversion(blocked)
    assert.equal(blocked.some((call) => call[1] === 'lead_form_error'), true)
    await unmount(blockedRoot)

    const down = installGtag()
    mockFetch('network')
    const downRoot = await mount(spec.element())
    spec.fill()
    await submitForm()
    assert.match(document.body.textContent || '', /Network error/)
    assertNoLeadOrConversion(down)
    assert.equal(down.some((call) => call[1] === 'lead_form_error'), true)
    await unmount(downRoot)

    const invalidCalls = installGtag()
    const invalidFetch = mockFetch('ok')
    const invalidRoot = await mount(spec.element())
    spec.invalid()
    await submitForm()
    assert.equal(invalidFetch.count(), 0)
    assert.equal(document.body.textContent?.includes(spec.successText), false)
    assertNoLeadOrConversion(invalidCalls)
    await unmount(invalidRoot)
  })

  test(`${lead} records generate_lead but no Ads conversion when the env vars are unset`, async () => {
    const spec = cases().find((item) => item.name === lead)
    if (!spec) throw new Error(`missing case ${lead}`)
    const calls = installGtag()
    mockFetch('ok')
    const root = await mount(spec.element())
    spec.fill()
    await submitForm()
    assert.deepEqual(
      calls.map((call) => call[1]),
      ['generate_lead'],
    )
    assertNoPii(calls)
    await unmount(root)
  })

  test(`${lead} fires nothing when gtag is missing, even if the Ads env vars are set`, async () => {
    const spec = cases().find((item) => item.name === lead)
    if (!spec) throw new Error(`missing case ${lead}`)
    setAds(true)
    mockFetch('ok')
    const root = await mount(spec.element())
    spec.fill()
    await submitForm()
    assert.equal(typeof (win as unknown as { gtag?: unknown }).gtag, 'undefined')
    assert.match(document.body.textContent || '', new RegExp(spec.successText))
    await unmount(root)
  })
}

test('a SellForm validation error does not fire generate_lead or a conversion', async () => {
  setAds(true)
  const calls = installGtag()
  const fetchMock = mockFetch('ok')
  const sell = await mount(React.createElement(SellForm))
  fillLead(['name', 'address'])
  await submitForm()
  assert.equal(fetchMock.count(), 0)
  assert.match(document.body.textContent || '', new RegExp(MISSING_CONTACT_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assertNoLeadOrConversion(calls)
  assert.equal(calls.some((call) => {
    const payload = call[2] as { error_type?: string }
    return call[1] === 'lead_form_error' && payload.error_type === 'missing_contact'
  }), true)
  await unmount(sell)
})

test('a tel: click fires call_click and, only when the call label is set, a separate conversion', async () => {
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = ADS_ID
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL = CALL_LABEL
  process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL = LEAD_LABEL
  const calls = installGtag()
  const root = await mount(telLink('tel:6155512727', 'Call', 'nav-call'))
  const link = document.querySelector('a')
  assert.ok(link)
  link.addEventListener('click', (event) => event.preventDefault())
  await act(async () => {
    link.click()
  })
  assert.deepEqual(
    calls.map((call) => call[1]),
    ['call_click', 'conversion'],
  )
  assert.deepEqual(calls[0], [
    'event',
    'call_click',
    { event_category: 'engagement', event_label: 'nav-call' },
  ])
  assertConversion(calls, CALL_LABEL)
  assert.equal(JSON.stringify(calls[1]).includes('6155512727'), false)
  assert.equal(JSON.stringify(calls).includes(LEAD_LABEL), false)
  await unmount(root)
})

test('a tel: click does not fire an Ads conversion when the call label is unset', async () => {
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = ADS_ID
  process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL = LEAD_LABEL
  const calls = installGtag()
  const root = await mount(telLink('tel:6155512727', 'Call', 'nav-call'))
  const link = document.querySelector('a')
  assert.ok(link)
  link.addEventListener('click', (event) => event.preventDefault())
  await act(async () => {
    link.click()
  })
  assert.deepEqual(
    calls.map((call) => call[1]),
    ['call_click'],
  )
  await unmount(root)
})

test('an sms: click does not fire the call conversion', async () => {
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = ADS_ID
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL = CALL_LABEL
  const calls = installGtag()
  const root = await mount(telLink('sms:6155512727', 'Text', 'nav-text'))
  const link = document.querySelector('a')
  assert.ok(link)
  link.addEventListener('click', (event) => event.preventDefault())
  await act(async () => {
    link.click()
  })
  assert.deepEqual(calls.map((call) => call[1]), ['text_click'])
  await unmount(root)
})

test('nothing fires for a tel: click when gtag and the Ads env vars are unset', async () => {
  const root = await mount(telLink('tel:6155512727', 'Call'))
  const link = document.querySelector('a')
  assert.ok(link)
  link.addEventListener('click', (event) => event.preventDefault())
  await act(async () => {
    link.click()
  })
  assert.equal(typeof (win as unknown as { gtag?: unknown }).gtag, 'undefined')
  await unmount(root)
})
