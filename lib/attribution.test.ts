import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ATTRIBUTION_TTL_MS,
  LEAD_ATTRIBUTION_FIELDS,
  blankLeadAttribution,
  captureAttribution,
  deriveTrafficSource,
  ensureLeadAttribution,
  getAttribution,
  nextStored,
  touchFromUrl,
  toLeadFields,
  type StoredAttribution,
} from './attribution.ts'

const FORMS = [
  'components/SuburbLeadForm.tsx',
  'app/sell/SellForm.tsx',
  'app/contact/ContactForm.tsx',
  'app/cash-offer/CashOfferForm.tsx',
]

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, String(value))
    },
    removeItem: (key) => {
      map.delete(key)
    },
    clear: () => {
      map.clear()
    },
    key: () => null,
    get length() {
      return map.size
    },
  }
}

function installBrowser() {
  let href = 'https://www.joshuafink.com/'
  let referrer = ''
  let cookie = ''
  const win = {
    location: {
      get href() {
        return href
      },
      set href(value: string) {
        href = value
      },
      get hostname() {
        return new URL(href).hostname
      },
      get protocol() {
        return new URL(href).protocol
      },
    },
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    document: {
      get referrer() {
        return referrer
      },
      set referrer(value: string) {
        referrer = value
      },
      get cookie() {
        return cookie
      },
      set cookie(value: string) {
        const pair = value.split(';')[0]
        const eq = pair.indexOf('=')
        const name = pair.slice(0, eq).trim()
        const encoded = pair.slice(eq + 1)
        const kept = cookie
          .split(';')
          .map((part) => part.trim())
          .filter((part) => part && !part.startsWith(`${name}=`))
        kept.push(`${name}=${encoded}`)
        cookie = kept.join('; ')
      },
    },
  }
  globalThis.window = win as unknown as Window & typeof globalThis
  return {
    win,
    setHref: (value: string) => {
      href = value
    },
    setReferrer: (value: string) => {
      referrer = value
    },
  }
}

test('first touch sticks, last touch moves, and page_url is the submit page', () => {
  const browser = installBrowser()
  browser.setHref(
    'https://www.joshuafink.com/blog/post?utm_source=newsletter&utm_medium=email&utm_campaign=spring&gclid=click-1',
  )
  browser.setReferrer('https://news.example/')
  captureAttribution()

  // Client-side navigation keeps the original external referrer and must
  // not replace the landing page.
  browser.setHref('https://www.joshuafink.com/contact')
  browser.setReferrer('https://news.example/')
  const fields = getAttribution()

  assert.equal(fields.utm_source, 'newsletter')
  assert.equal(fields.utm_medium, 'email')
  assert.equal(fields.utm_campaign, 'spring')
  assert.equal(fields.gclid, 'click-1')
  assert.equal(fields.traffic_source, 'newsletter')
  assert.equal(fields.landing_page, 'https://www.joshuafink.com/blog/post?utm_source=newsletter&utm_medium=email&utm_campaign=spring&gclid=click-1')
  assert.equal(fields.referrer, 'https://news.example/')
  assert.equal(fields.last_utm_source, 'newsletter')
  assert.equal(fields.page_url, 'https://www.joshuafink.com/contact')
  assert.equal(browser.win.localStorage.getItem('jf_attr_v1') !== null, true)
  assert.match(browser.win.document.cookie, /jf_attr=/)
})

test('a later session with a new campaign updates last touch only', () => {
  const browser = installBrowser()
  browser.setHref('https://www.joshuafink.com/?utm_source=newsletter')
  browser.setReferrer('')
  captureAttribution()

  browser.win.sessionStorage.removeItem('jf_attr_session')
  browser.setHref('https://www.joshuafink.com/cash-offer?utm_source=google&utm_medium=cpc&gclid=abc&fbclid=')
  browser.setReferrer('https://www.google.com/')
  const fields = getAttribution()

  assert.equal(fields.utm_source, 'newsletter')
  assert.equal(fields.gclid, '')
  assert.equal(fields.last_utm_source, 'google')
  assert.equal(fields.last_utm_medium, 'cpc')
  assert.equal(fields.last_gclid, 'abc')
  assert.equal(fields.last_referrer, 'https://www.google.com/')
  assert.equal(fields.last_landing_page, 'https://www.joshuafink.com/cash-offer?utm_source=google&utm_medium=cpc&gclid=abc&fbclid=')
  assert.equal(fields.traffic_source, 'newsletter')
})

test('a new session from an external site without parameters still moves last touch', () => {
  const browser = installBrowser()
  browser.setHref('https://www.joshuafink.com/')
  captureAttribution()
  browser.win.sessionStorage.removeItem('jf_attr_session')
  browser.setHref('https://www.joshuafink.com/sell')
  browser.setReferrer('https://www.google.com/search?q=sell+my+house')
  const fields = getAttribution()
  assert.equal(fields.landing_page, 'https://www.joshuafink.com/')
  assert.equal(fields.traffic_source, 'direct')
  assert.equal(fields.last_landing_page, 'https://www.joshuafink.com/sell')
  assert.equal(fields.last_referrer, 'https://www.google.com/search?q=sell+my+house')
})

test('the 90-day window expiring starts a new first touch', () => {
  const browser = installBrowser()
  browser.setHref('https://www.joshuafink.com/?utm_source=old')
  captureAttribution(1_000)
  browser.win.sessionStorage.removeItem('jf_attr_session')
  browser.setHref('https://www.joshuafink.com/?utm_source=new')
  captureAttribution(1_000 + ATTRIBUTION_TTL_MS + 1)
  const stored = JSON.parse(browser.win.localStorage.getItem('jf_attr_v1') || '{}') as StoredAttribution
  assert.equal(stored.first.utm_source, 'new')
  assert.equal(stored.last.utm_source, 'new')
})

test('a cleared localStorage falls back to the 90-day cookie', () => {
  const browser = installBrowser()
  browser.setHref('https://www.joshuafink.com/?utm_source=cookie-source&utm_medium=cpc')
  captureAttribution()
  browser.win.localStorage.removeItem('jf_attr_v1')
  browser.setHref('https://www.joshuafink.com/contact')
  const fields = getAttribution()
  assert.equal(fields.utm_source, 'cookie-source')
  assert.equal(fields.utm_medium, 'cpc')
  assert.equal(fields.page_url, 'https://www.joshuafink.com/contact')
})

test('the previous sessionStorage record seeds first touch', () => {
  const browser = installBrowser()
  browser.win.sessionStorage.setItem(
    'jf_attribution',
    JSON.stringify({
      traffic_source: 'linkedin',
      landing_page: 'https://www.joshuafink.com/blog/post?utm_source=linkedin&utm_medium=auto',
      referrer: 'https://www.linkedin.com/',
    }),
  )
  browser.setHref('https://www.joshuafink.com/contact')
  browser.setReferrer('')
  const fields = getAttribution()
  assert.equal(fields.utm_source, 'linkedin')
  assert.equal(fields.utm_medium, 'auto')
  assert.equal(fields.landing_page, 'https://www.joshuafink.com/blog/post?utm_source=linkedin&utm_medium=auto')
  assert.equal(fields.referrer, 'https://www.linkedin.com/')
  assert.equal(fields.page_url, 'https://www.joshuafink.com/contact')
  assert.equal(fields.traffic_source, 'linkedin')
})

test('click ids name the channel when utm_source is absent', () => {
  assert.equal(
    deriveTrafficSource({
      utm_source: '',
      gclid: 'abc',
      gbraid: '',
      wbraid: '',
      fbclid: '',
      referrer: '',
    }),
    'google',
  )
  assert.equal(
    deriveTrafficSource({
      utm_source: '',
      gclid: '',
      gbraid: '',
      wbraid: 'w',
      fbclid: 'f',
      referrer: '',
    }),
    'google',
  )
  assert.equal(
    deriveTrafficSource({
      utm_source: '',
      gclid: '',
      gbraid: '',
      wbraid: '',
      fbclid: 'f',
      referrer: 'https://m.facebook.com/',
    }),
    'facebook',
  )
  assert.equal(
    deriveTrafficSource(
      {
        utm_source: '',
        gclid: '',
        gbraid: '',
        wbraid: '',
        fbclid: '',
        referrer: 'https://www.joshuafink.com/buy',
      },
      'www.joshuafink.com',
    ),
    'direct',
  )
})

test('nextStored does not let an in-site page view replace last touch', () => {
  const current = touchFromUrl('https://www.joshuafink.com/?utm_source=newsletter', 'https://news.example/')
  const stored: StoredAttribution = { v: 1, first_seen: 5, first: current, last: current }
  const internal = touchFromUrl('https://www.joshuafink.com/contact', 'https://news.example/')
  const next = nextStored(stored, internal, { freshSession: false, now: 10, host: 'www.joshuafink.com' })
  assert.equal(next.first.landing_page, current.landing_page)
  assert.equal(next.last.landing_page, current.landing_page)
  const fields = toLeadFields(next, 'https://www.joshuafink.com/contact', 'www.joshuafink.com')
  assert.equal(fields.page_url, 'https://www.joshuafink.com/contact')
  assert.equal(fields.last_utm_source, 'newsletter')
})

test('ensureLeadAttribution fills an empty no-JS submit and does not overwrite first touch', () => {
  const lead: Record<string, string> = { name: 'Ada' }
  ensureLeadAttribution(
    lead,
    'https://www.joshuafink.com/cash-offer?utm_source=google&utm_medium=cpc&gclid=CLICK123',
  )
  assert.equal(lead.page_url, 'https://www.joshuafink.com/cash-offer?utm_source=google&utm_medium=cpc&gclid=CLICK123')
  assert.equal(lead.utm_source, 'google')
  assert.equal(lead.utm_medium, 'cpc')
  assert.equal(lead.gclid, 'CLICK123')
  assert.equal(lead.traffic_source, 'google')
  assert.equal(lead.landing_page, lead.page_url)
  assert.equal(lead.last_utm_source, 'google')
  assert.equal(lead.last_gclid, 'CLICK123')

  const captured: Record<string, string> = {
    name: 'Ada',
    utm_source: 'newsletter',
    page_url: 'https://www.joshuafink.com/contact',
    landing_page: 'https://www.joshuafink.com/blog?utm_source=newsletter',
    traffic_source: 'newsletter',
    last_landing_page: 'https://www.joshuafink.com/blog?utm_source=newsletter',
  }
  ensureLeadAttribution(captured, 'https://www.joshuafink.com/contact?utm_source=google&gclid=nope')
  assert.equal(captured.utm_source, 'newsletter')
  assert.equal(captured.traffic_source, 'newsletter')
  assert.equal(captured.gclid, undefined)
  assert.equal(captured.last_landing_page, 'https://www.joshuafink.com/blog?utm_source=newsletter')
})

test('a direct healthcheck-shaped lead is not labeled direct', () => {
  const lead: Record<string, string> = { name: 'SYSTEM TEST' }
  ensureLeadAttribution(lead, null)
  assert.equal(lead.traffic_source, undefined)
  assert.equal(lead.page_url, undefined)
})

test('getAttribution outside a browser returns empty fields', () => {
  const holder = globalThis as { window?: Window }
  const previous = holder.window
  holder.window = undefined
  try {
    const fields = getAttribution()
    assert.deepEqual(fields, blankLeadAttribution())
    for (const key of LEAD_ATTRIBUTION_FIELDS) assert.equal(fields[key], '')
  } finally {
    holder.window = previous
  }
})

test('every lead form submits the captured attribution', () => {
  for (const file of FORMS) {
    const src = readFileSync(file, 'utf8')
    assert.match(src, /getAttribution\(\)/, file)
    assert.match(src, /captureAttribution\(\)/, file)
  }
  const layout = readFileSync('app/layout.tsx', 'utf8')
  assert.match(layout, /AttributionCapture/)
  assert.match(layout, /@vercel\/analytics\/next/)
  assert.match(layout, /<Analytics \/>/)
})
