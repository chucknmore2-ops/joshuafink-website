// Sheet-channel delivery reporting for /api/contact.
//
// Run: npm test
//
// The Google Apps Script behind the Sheet answers HTTP 200 for every outcome —
// its own failures arrive as {ok:false, error:...}, and a broken deployment
// serves a 200 "Authorization required" HTML page. These tests pin that
// pushToSheet believes the response BODY, not the status code: a dead sheet
// must report as a failed channel (so the daily test lead pages on it), never
// as "delivered". Exercised through the exported POST handler in healthcheck
// mode, which returns the per-channel results — Next.js forbids exporting
// pushToSheet itself from a route file.

import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

// Env is read at module load in route.ts, so it must be set before the first
// dynamic import below. The sheet is deliberately the ONLY configured channel:
// whether it succeeded decides the whole response (200 vs 502).
process.env.GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/test-deployment/exec'
process.env.CRON_SECRET = 'test-cron-secret'
// Keep the per-channel fetch timeout short so the hung-channel test below
// finishes in milliseconds instead of the production ~6s.
process.env.LEAD_CHANNEL_TIMEOUT_MS = '250'
delete process.env.SHEET_WEBHOOK_SECRET
delete process.env.CLICKUP_API_TOKEN
delete process.env.CLICKUP_LEADS_LIST_ID
delete process.env.CLICKUP_LEADS_ENABLED
delete process.env.PUSHOVER_TOKEN
delete process.env.PUSHOVER_USER
delete process.env.RESEND_API_KEY

const realFetch = globalThis.fetch
after(() => {
  globalThis.fetch = realFetch
})

// The route also fires best-effort n8n / FlipIntel webhooks, but only when
// the base is a non-loopback URL. Localhost defaults are skipped so they
// cannot hang the function; the mock still returns an inert 200 for any
// other URL that does fire.
function mockFetch(sheetBody: string, contentType: string) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).includes('script.google.com')) {
      return new Response(sheetBody, { status: 200, headers: { 'Content-Type': contentType } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch
}

async function submitLead() {
  const { POST } = await import('./route.ts')
  const res = await POST(
    new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-healthcheck-secret': 'test-cron-secret',
      },
      body: JSON.stringify({
        name: 'Route Test Lead',
        email: 'lead@example.com',
        body: 'Checking that sheet delivery is reported truthfully.',
        source: 'route-test',
      }),
    })
  )
  const json = await res.json()
  const sheet = json.channels.find((c: { channel: string }) => c.channel === 'sheet')
  return { status: res.status, sheet }
}

test('an HTTP 200 {ok:false} from the Apps Script marks the sheet channel failed', async () => {
  mockFetch('{"ok":false,"error":"bad secret"}', 'application/json')
  const { status, sheet } = await submitLead()
  assert.equal(sheet.configured, true)
  assert.equal(sheet.ok, false)
  assert.match(sheet.detail, /bad secret/)
  // Sheet is the only configured channel, so the fake green would have shown a
  // success screen — the route must instead report the delivery failure.
  assert.equal(status, 502)
})

test('a 200 HTML page (broken deployment / auth screen) marks the sheet channel failed', async () => {
  mockFetch('<!DOCTYPE html><html><body>Authorization required</body></html>', 'text/html')
  const { status, sheet } = await submitLead()
  assert.equal(sheet.ok, false)
  assert.match(sheet.detail, /non-JSON/)
  assert.equal(status, 502)
})

test('a 200 {ok:true} still counts as delivered', async () => {
  mockFetch('{"ok":true}', 'application/json')
  const { status, sheet } = await submitLead()
  assert.equal(sheet.ok, true)
  assert.equal(status, 200)
})

test('the healthcheck lead skips Resend, tags the sheet row, and still pings Pushover', async () => {
  // The daily test must not email Joshua (CI/chat is the alert path), but
  // Pushover is a real alert — Josh does not want that channel silenced.
  // The sheet row carries the system_test tag that files it into the
  // "System" tab. The joshua-email channel still reports as configured so
  // a missing RESEND_API_KEY pages.
  const captured: { url: string; body: string }[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    captured.push({ url, body: String(init?.body ?? '') })
    if (url.includes('script.google.com')) {
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.includes('api.pushover.net')) {
      return new Response('{"status":1}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch

  // activeEmailProvider() / sendPushover read env per call, so these can be
  // set here despite route.ts already being imported.
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.PUSHOVER_TOKEN = 'po_test_token'
  process.env.PUSHOVER_USER = 'po_test_user'
  try {
    const { POST } = await import('./route.ts')
    const res = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-healthcheck-secret': 'test-cron-secret',
        },
        // Mirrors scripts/morning_healthcheck.py: no email field, so no auto-reply.
        body: JSON.stringify({
          name: 'SYSTEM TEST — morning healthcheck',
          lead_type: 'system-test',
          source: 'morning-healthcheck',
          body: 'Automated daily test of the lead delivery channels.',
        }),
      })
    )
    assert.equal(res.status, 200)
    const json = await res.json()
    const joshuaEmail = json.channels.find((c: { channel: string }) => c.channel === 'joshua-email')
    assert.equal(joshuaEmail.configured, true)
    assert.equal(joshuaEmail.ok, true)
    assert.match(joshuaEmail.detail, /skipped/)
    const pushover = json.channels.find((c: { channel: string }) => c.channel === 'pushover')
    assert.equal(pushover.configured, true)
    assert.equal(pushover.ok, true)

    const emails = captured.filter((c) => c.url.includes('api.resend.com'))
    assert.equal(emails.length, 0)

    const sheetCall = captured.find((c) => c.url.includes('script.google.com'))
    assert.ok(sheetCall)
    assert.equal(JSON.parse(sheetCall.body).system_test, 'true')

    const pushCall = captured.find((c) => c.url.includes('api.pushover.net'))
    assert.ok(pushCall)
    const pushBody = new URLSearchParams(pushCall.body)
    assert.equal(pushBody.get('priority'), '1')
    assert.equal(pushBody.get('sound'), 'cashregister')
    assert.notEqual(pushBody.get('priority'), '-2')
  } finally {
    delete process.env.RESEND_API_KEY
    delete process.env.PUSHOVER_TOKEN
    delete process.env.PUSHOVER_USER
  }
})

test('a real visitor lead still emails Joshua a New Lead subject', async () => {
  const captured: { url: string; body: string }[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    captured.push({ url, body: String(init?.body ?? '') })
    if (url.includes('script.google.com')) {
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.includes('api.resend.com')) {
      return new Response('{"id":"email-1"}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch

  process.env.RESEND_API_KEY = 're_test_key'
  try {
    const { POST } = await import('./route.ts')
    const res = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          body: 'I would like to sell my home in Franklin.',
          source: 'contact-form',
        }),
      })
    )
    assert.equal(res.status, 200)

    const emails = captured.filter((c) => c.url.includes('api.resend.com'))
    assert.ok(emails.length >= 1, 'expected at least the Joshua lead email')
    const subjects = emails.map((e) => JSON.parse(e.body).subject as string)
    assert.ok(subjects.some((s) => /New Lead/.test(s)), `subjects: ${subjects.join(' | ')}`)
    assert.equal(subjects.some((s) => /lead-channel test/i.test(s)), false)
  } finally {
    delete process.env.RESEND_API_KEY
  }
})

test('a hung sheet call is aborted and reported as a failed channel, not a hang', async () => {
  // The sheet fetch never resolves on its own — like the real fetch, it only
  // rejects when the route's AbortController fires. Without the timeout this
  // submit would hang until Vercel's hard cutoff.
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes('script.google.com')) {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
      })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch
  const { status, sheet } = await submitLead()
  assert.equal(sheet.configured, true)
  assert.equal(sheet.ok, false)
  assert.match(sheet.detail, /timeout/)
  assert.equal(status, 502)
})

test('a native form POST (urlencoded) is accepted without consuming the body twice', async () => {
  mockFetch('{"ok":true}', 'application/json')
  const { POST } = await import('./route.ts')
  const res = await POST(
    new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-healthcheck-secret': 'test-cron-secret',
      },
      body: 'name=Jane+Doe&email=jane%40example.com&body=Hello+from+a+no-JS+submit',
    })
  )
  assert.equal(res.status, 200)
  const json = await res.json()
  assert.equal(json.ok, true)
})

test('localhost webhook defaults are not fetched', async () => {
  const urls: string[] = []
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    urls.push(String(input))
    if (String(input).includes('script.google.com')) {
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch

  const { status, sheet } = await submitLead()
  assert.equal(status, 200)
  assert.equal(sheet.ok, true)
  assert.equal(
    urls.some((u) => /localhost|127\.0\.0\.1/.test(u)),
    false,
    `loopback webhook was fetched: ${urls.join(', ')}`,
  )
})

test('ClickUp lead tasks stay unconfigured unless CLICKUP_LEADS_ENABLED=true', async () => {
  // Token + research-board list ID must not be enough — that is the path that
  // used to dump website leads onto 901415978281.
  process.env.CLICKUP_API_TOKEN = 'pk_test_token'
  process.env.CLICKUP_LEADS_LIST_ID = '901415978281'
  delete process.env.CLICKUP_LEADS_ENABLED
  const urls: string[] = []
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      urls.push(String(input))
      if (String(input).includes('script.google.com')) {
        return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('{}', { status: 200 })
    }) as typeof fetch

    const { POST } = await import('./route.ts')
    const res = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-healthcheck-secret': 'test-cron-secret',
        },
        body: JSON.stringify({
          name: 'Route Test Lead',
          email: 'lead@example.com',
          body: 'Checking that ClickUp is off by default.',
          source: 'route-test',
        }),
      })
    )
    assert.equal(res.status, 200)
    const json = await res.json()
    const clickup = json.channels.find((c: { channel: string }) => c.channel === 'clickup')
    assert.equal(clickup.configured, false)
    assert.match(clickup.detail, /CLICKUP_LEADS_ENABLED/)
    assert.equal(
      urls.some((u) => u.includes('api.clickup.com')),
      false,
      `ClickUp was fetched: ${urls.join(', ')}`,
    )
  } finally {
    delete process.env.CLICKUP_API_TOKEN
    delete process.env.CLICKUP_LEADS_LIST_ID
    delete process.env.CLICKUP_LEADS_ENABLED
  }
})

test('CLICKUP_LEADS_ENABLED=true with token and list ID does create a task', async () => {
  process.env.CLICKUP_LEADS_ENABLED = 'true'
  process.env.CLICKUP_API_TOKEN = 'pk_test_token'
  process.env.CLICKUP_LEADS_LIST_ID = 'dedicated-leads-list'
  const urls: string[] = []
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      urls.push(url)
      if (url.includes('script.google.com')) {
        return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.includes('api.clickup.com')) {
        return new Response('{"id":"task-1"}', { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('{}', { status: 200 })
    }) as typeof fetch

    const { POST } = await import('./route.ts')
    const res = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-healthcheck-secret': 'test-cron-secret',
        },
        body: JSON.stringify({
          name: 'Route Test Lead',
          email: 'lead@example.com',
          body: 'Checking the ClickUp opt-in path.',
          source: 'route-test',
        }),
      })
    )
    assert.equal(res.status, 200)
    const json = await res.json()
    const clickup = json.channels.find((c: { channel: string }) => c.channel === 'clickup')
    assert.equal(clickup.configured, true)
    assert.equal(clickup.ok, true)
    assert.ok(urls.some((u) => u.includes('api.clickup.com/api/v2/list/dedicated-leads-list/task')))
    assert.equal(urls.some((u) => u.includes('901415978281')), false)
  } finally {
    delete process.env.CLICKUP_API_TOKEN
    delete process.env.CLICKUP_LEADS_LIST_ID
    delete process.env.CLICKUP_LEADS_ENABLED
  }
})

test('attribution fields reach the sheet, the lead email, and ClickUp without dropping existing fields', async () => {
  const captured: { url: string; body: string }[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    captured.push({ url, body: String(init?.body ?? '') })
    if (url.includes('script.google.com')) {
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.includes('api.resend.com')) {
      return new Response('{"id":"email-1"}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.includes('api.clickup.com')) {
      return new Response('{"id":"task-attr"}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch

  process.env.RESEND_API_KEY = 're_test_key'
  process.env.CLICKUP_LEADS_ENABLED = 'true'
  process.env.CLICKUP_API_TOKEN = 'pk_test_token'
  process.env.CLICKUP_LEADS_LIST_ID = 'dedicated-leads-list'
  try {
    const { POST } = await import('./route.ts')
    const res = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
        body: JSON.stringify({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          phone: '615-555-0100',
          body: 'We want to sell in Franklin.',
          source: 'contact-page',
          subject: 'sell',
          website: '',
          traffic_source: 'newsletter',
          landing_page: 'https://www.joshuafink.com/blog/post?utm_source=newsletter',
          referrer: 'https://news.example/',
          utm_source: 'newsletter',
          utm_medium: 'email',
          utm_campaign: 'spring',
          utm_term: '',
          utm_content: 'hero',
          gclid: '',
          gbraid: '',
          wbraid: '',
          fbclid: '',
          last_utm_source: 'google',
          last_utm_medium: 'cpc',
          last_utm_campaign: 'brand',
          last_utm_term: '',
          last_utm_content: '',
          last_gclid: 'click-9',
          last_gbraid: '',
          last_wbraid: '',
          last_fbclid: '',
          last_referrer: 'https://www.google.com/',
          last_landing_page: 'https://www.joshuafink.com/?utm_source=google&gclid=click-9',
          page_url: 'https://www.joshuafink.com/contact',
        }),
      })
    )
    assert.equal(res.status, 200)

    const sheetCall = captured.find((c) => c.url.includes('script.google.com'))
    assert.ok(sheetCall)
    const sheet = JSON.parse(sheetCall.body)
    assert.equal(sheet.name, 'Ada Lovelace')
    assert.equal(sheet.email, 'ada@example.com')
    assert.equal(sheet.phone, '615-555-0100')
    assert.equal(sheet.source, 'contact-page')
    assert.equal(sheet.body, 'We want to sell in Franklin.')
    assert.equal(sheet.lead_type, 'sell')
    assert.equal(typeof sheet.received_at, 'string')
    assert.equal(sheet.utm_source, 'newsletter')
    assert.equal(sheet.utm_medium, 'email')
    assert.equal(sheet.utm_campaign, 'spring')
    assert.equal(sheet.utm_content, 'hero')
    assert.equal(sheet.utm_term, '')
    assert.equal(sheet.gclid, '')
    assert.equal(sheet.last_utm_source, 'google')
    assert.equal(sheet.last_gclid, 'click-9')
    assert.equal(sheet.last_landing_page, 'https://www.joshuafink.com/?utm_source=google&gclid=click-9')
    assert.equal(sheet.page_url, 'https://www.joshuafink.com/contact')
    assert.equal(sheet.traffic_source, 'newsletter')
    assert.equal(sheet.landing_page, 'https://www.joshuafink.com/blog/post?utm_source=newsletter')
    assert.equal(sheet.referrer, 'https://news.example/')
    assert.equal('website' in sheet, false)
    assert.equal('secret' in sheet, false)

    const emails = captured.filter((c) => c.url.includes('api.resend.com'))
    const leadEmail = emails.map((e) => JSON.parse(e.body)).find((e) => /New Lead/.test(e.subject))
    assert.ok(leadEmail)
    assert.match(leadEmail.html, /utm_source/)
    assert.match(leadEmail.html, /newsletter/)
    assert.match(leadEmail.html, /page_url/)
    assert.match(leadEmail.html, /https:\/\/www\.joshuafink\.com\/contact/)
    assert.match(leadEmail.html, /last_gclid/)
    assert.match(leadEmail.html, /click-9/)
    assert.equal(leadEmail.html.includes('>last_utm_term<'), false)
    assert.match(leadEmail.html, />name</)
    assert.match(leadEmail.html, /Ada Lovelace/)

    const clickup = captured.find((c) => c.url.includes('api.clickup.com'))
    assert.ok(clickup)
    const task = JSON.parse(clickup.body)
    assert.match(task.markdown_content, /Traffic source/)
    assert.match(task.markdown_content, /newsletter/)
    assert.match(task.markdown_content, /Last UTM/)
    assert.match(task.markdown_content, /Submitted from/)
    assert.match(task.markdown_content, /Ada Lovelace/)
  } finally {
    delete process.env.RESEND_API_KEY
    delete process.env.CLICKUP_API_TOKEN
    delete process.env.CLICKUP_LEADS_LIST_ID
    delete process.env.CLICKUP_LEADS_ENABLED
  }
})

test('a no-JS submit picks campaign parameters off the Referer without overwriting a captured source', async () => {
  const captured: { body: string }[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes('script.google.com')) {
      captured.push({ body: String(init?.body ?? '') })
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch

  const { POST } = await import('./route.ts')
  const first = await POST(
    new NextRequest('https://www.joshuafink.com/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        referer: 'https://www.joshuafink.com/cash-offer?utm_source=google&utm_medium=cpc&gclid=CLICK123',
        'x-forwarded-for': '203.0.113.11',
      },
      body: 'name=Jane+Doe&email=jane%40example.com&phone=6155550100&source=cash-offer&property_address=123+Main+St',
    })
  )
  assert.equal(first.status, 200)
  const filled = JSON.parse(captured[0].body)
  assert.equal(filled.name, 'Jane Doe')
  assert.equal(filled.source, 'cash-offer')
  assert.equal(filled.utm_source, 'google')
  assert.equal(filled.utm_medium, 'cpc')
  assert.equal(filled.gclid, 'CLICK123')
  assert.equal(filled.traffic_source, 'google')
  assert.equal(filled.page_url, 'https://www.joshuafink.com/cash-offer?utm_source=google&utm_medium=cpc&gclid=CLICK123')
  assert.equal(filled.landing_page, filled.page_url)
  assert.equal(filled.last_gclid, 'CLICK123')

  const second = await POST(
    new NextRequest('https://www.joshuafink.com/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        referer: 'https://www.joshuafink.com/contact?utm_source=google&gclid=nope',
        'x-forwarded-for': '203.0.113.11',
      },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane@example.com',
        source: 'contact-page',
        utm_source: 'newsletter',
        traffic_source: 'newsletter',
        landing_page: 'https://www.joshuafink.com/blog?utm_source=newsletter',
        page_url: 'https://www.joshuafink.com/contact',
        last_landing_page: 'https://www.joshuafink.com/blog?utm_source=newsletter',
      }),
    })
  )
  assert.equal(second.status, 200)
  const kept = JSON.parse(captured[1].body)
  assert.equal(kept.utm_source, 'newsletter')
  assert.equal(kept.traffic_source, 'newsletter')
  assert.equal(kept.page_url, 'https://www.joshuafink.com/contact')
  assert.equal(kept.gclid || '', '')
})

test('the buyer-lead webhook keeps its original fields and gains attribution', async () => {
  const captured: { url: string; body: string }[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    captured.push({ url, body: String(init?.body ?? '') })
    if (url.includes('script.google.com')) {
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch

  process.env.BUYER_LEAD_WEBHOOK_BASE = 'https://buyer.example.test'
  try {
    const { POST } = await import('./route.ts')
    const res = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.12' },
        body: JSON.stringify({
          name: 'Buyer Pat',
          email: 'pat@example.com',
          phone: '615-555-0199',
          subject: 'buy',
          body: 'Looking in Brentwood.',
          source: 'buy-hub',
          utm_source: 'facebook',
          utm_medium: 'paid',
          fbclid: 'fb-1',
          page_url: 'https://www.joshuafink.com/buy',
          landing_page: 'https://www.joshuafink.com/?fbclid=fb-1',
          traffic_source: 'facebook',
        }),
      })
    )
    assert.equal(res.status, 200)
    const hook = captured.find((c) => c.url === 'https://buyer.example.test/buyer-lead')
    assert.ok(hook)
    const payload = JSON.parse(hook.body)
    assert.equal(payload.name, 'Buyer Pat')
    assert.equal(payload.phone, '615-555-0199')
    assert.equal(payload.email, 'pat@example.com')
    assert.equal(payload.subject, 'buy')
    assert.equal(payload.body, 'Looking in Brentwood.')
    assert.equal(payload.source, 'buy-hub')
    assert.equal(payload.utm_source, 'facebook')
    assert.equal(payload.utm_medium, 'paid')
    assert.equal(payload.fbclid, 'fb-1')
    assert.equal(payload.page_url, 'https://www.joshuafink.com/buy')
    assert.equal(payload.traffic_source, 'facebook')
  } finally {
    delete process.env.BUYER_LEAD_WEBHOOK_BASE
  }
})

// ---------------------------------------------------------------------------
// Quarantine: high-confidence spam is sheet-only. A real lead still fans out
// to email, Pushover, and the sheet. Bots always see { ok: true }.
// ---------------------------------------------------------------------------

const SCREENSHOT_SPAM = {
  name: 'kicchooge',
  phone: '85211936711',
  email: 'stephaniehodges3187@smaqt.com',
  body: 'Вам перевод 137698 руб. получить тут https://peskartyhrt.buzz/ycSMkSil SVWVE268274NFDAW',
  lead_type: 'general',
  source: 'homepage',
  traffic_source: 'direct',
  landing_page: 'https://www.joshuafink.com/',
  page_url: 'https://www.joshuafink.com/',
  gclid: 'should-survive-quarantine',
  utm_source: 'direct-test',
  submit: '',
  _loaded: String(Date.now() - 60_000),
}

function mockDeliveryChannels() {
  const captured: { url: string; body: string }[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    captured.push({ url, body: String(init?.body ?? '') })
    if (url.includes('script.google.com')) {
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.includes('api.resend.com')) {
      return new Response('{"id":"email-1"}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.includes('api.pushover.net')) {
      return new Response('{"status":1}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch
  return captured
}

async function postContact(body: Record<string, string>, ip: string) {
  const { POST } = await import('./route.ts')
  const res = await POST(
    new NextRequest('https://www.joshuafink.com/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(body),
    })
  )
  const json = await res.json()
  return { status: res.status, json }
}

test('the screenshot spam is quarantined: sheet only, success response, attribution kept', async () => {
  const captured = mockDeliveryChannels()
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.PUSHOVER_TOKEN = 'po_test_token'
  process.env.PUSHOVER_USER = 'po_test_user'
  try {
    const { status, json } = await postContact(SCREENSHOT_SPAM, '203.0.113.50')
    assert.equal(status, 200)
    assert.deepEqual(json, { ok: true })

    assert.equal(captured.some((c) => c.url.includes('api.resend.com')), false)
    assert.equal(captured.some((c) => c.url.includes('api.pushover.net')), false)

    const sheetCall = captured.find((c) => c.url.includes('script.google.com'))
    assert.ok(sheetCall)
    const sheet = JSON.parse(sheetCall.body)
    assert.match(sheet.blocked_reason, /non_latin/)
    assert.match(sheet.blocked_reason, /spam_phrase/)
    assert.match(sheet.blocked_reason, /spam_url/)
    assert.equal(sheet.status, 'spam')
    assert.equal(sheet.lead_type, 'general')
    assert.equal(sheet.source, 'homepage')
    assert.equal(sheet.name, 'kicchooge')
    assert.equal(sheet.phone, '85211936711')
    assert.equal(sheet.email, 'stephaniehodges3187@smaqt.com')
    assert.equal(sheet.traffic_source, 'direct')
    assert.equal(sheet.landing_page, 'https://www.joshuafink.com/')
    assert.equal(sheet.page_url, 'https://www.joshuafink.com/')
    assert.equal(sheet.gclid, 'should-survive-quarantine')
    assert.equal(sheet.utm_source, 'direct-test')
    assert.equal('_loaded' in sheet, false)
    assert.equal('website' in sheet, false)
  } finally {
    delete process.env.RESEND_API_KEY
    delete process.env.PUSHOVER_TOKEN
    delete process.env.PUSHOVER_USER
  }
})

test('a honeypot hit is quarantined with no email or Pushover', async () => {
  const captured = mockDeliveryChannels()
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.PUSHOVER_TOKEN = 'po_test_token'
  process.env.PUSHOVER_USER = 'po_test_user'
  try {
    const { status, json } = await postContact({
      name: 'Sarah Whitfield',
      phone: '615-555-0142',
      email: 'sarah@example.com',
      body: 'We want to sell in Brentwood.',
      source: 'contact-page',
      website: 'http://spam.example',
      traffic_source: 'google',
      gclid: 'real-click',
      _loaded: String(Date.now() - 20_000),
    }, '203.0.113.51')
    assert.equal(status, 200)
    assert.deepEqual(json, { ok: true })
    assert.equal(captured.some((c) => c.url.includes('api.resend.com')), false)
    assert.equal(captured.some((c) => c.url.includes('api.pushover.net')), false)
    const sheet = JSON.parse(captured.find((c) => c.url.includes('script.google.com'))!.body)
    assert.equal(sheet.blocked_reason, 'honeypot')
    assert.equal(sheet.status, 'spam')
    assert.equal(sheet.traffic_source, 'google')
    assert.equal(sheet.gclid, 'real-click')
    assert.equal(sheet.body, 'We want to sell in Brentwood.')
    assert.equal('website' in sheet, false)
  } finally {
    delete process.env.RESEND_API_KEY
    delete process.env.PUSHOVER_TOKEN
    delete process.env.PUSHOVER_USER
  }
})

test('a too-fast submit is quarantined with no email or Pushover', async () => {
  const captured = mockDeliveryChannels()
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.PUSHOVER_TOKEN = 'po_test_token'
  process.env.PUSHOVER_USER = 'po_test_user'
  try {
    const { status, json } = await postContact({
      name: 'Sarah Whitfield',
      phone: '615-555-0142',
      email: 'sarah@example.com',
      body: 'Hi Joshua, we would like a valuation on our Franklin home.',
      source: 'sell-page',
      landing_page: 'https://www.joshuafink.com/sell',
      page_url: 'https://www.joshuafink.com/sell',
      _loaded: String(Date.now() - 400),
    }, '203.0.113.52')
    assert.equal(status, 200)
    assert.deepEqual(json, { ok: true })
    assert.equal(captured.some((c) => c.url.includes('api.resend.com')), false)
    assert.equal(captured.some((c) => c.url.includes('api.pushover.net')), false)
    const sheet = JSON.parse(captured.find((c) => c.url.includes('script.google.com'))!.body)
    assert.equal(sheet.blocked_reason, 'too_fast')
    assert.equal(sheet.status, 'spam')
    assert.equal(sheet.landing_page, 'https://www.joshuafink.com/sell')
    assert.equal(sheet.page_url, 'https://www.joshuafink.com/sell')
  } finally {
    delete process.env.RESEND_API_KEY
    delete process.env.PUSHOVER_TOKEN
    delete process.env.PUSHOVER_USER
  }
})

test('a real lead with a Zillow link still emails, pushes, and logs to the CRM sheet', async () => {
  const captured = mockDeliveryChannels()
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.PUSHOVER_TOKEN = 'po_test_token'
  process.env.PUSHOVER_USER = 'po_test_user'
  try {
    const { status, json } = await postContact({
      name: 'Sarah Whitfield',
      phone: '615-555-0142',
      email: 'sarah@example.com',
      body: 'Is this one still available? https://www.zillow.com/homedetails/123-Main-St-Franklin-TN-37064/12345678_zpid/',
      lead_type: 'buyer',
      source: 'listing',
      traffic_source: 'google',
      landing_page: 'https://www.joshuafink.com/?gclid=click-z',
      page_url: 'https://www.joshuafink.com/listings/123-main',
      gclid: 'click-z',
      _loaded: String(Date.now() - 45_000),
    }, '203.0.113.53')
    assert.equal(status, 200)
    assert.equal(json.ok, true)

    const emails = captured.filter((c) => c.url.includes('api.resend.com')).map((c) => JSON.parse(c.body))
    assert.ok(emails.some((e) => /New Lead/.test(e.subject)))
    assert.ok(captured.some((c) => c.url.includes('api.pushover.net')))

    const sheet = JSON.parse(captured.find((c) => c.url.includes('script.google.com'))!.body)
    assert.equal(sheet.blocked_reason, undefined)
    assert.equal(sheet.status, undefined)
    assert.equal(sheet.suspected_spam || '', '')
    assert.equal(sheet.name, 'Sarah Whitfield')
    assert.equal(sheet.lead_type, 'buyer')
    assert.equal(sheet.traffic_source, 'google')
    assert.equal(sheet.gclid, 'click-z')
    assert.equal(sheet.landing_page, 'https://www.joshuafink.com/?gclid=click-z')
    assert.equal(sheet.page_url, 'https://www.joshuafink.com/listings/123-main')
    assert.match(sheet.body, /zillow\.com/)
  } finally {
    delete process.env.RESEND_API_KEY
    delete process.env.PUSHOVER_TOKEN
    delete process.env.PUSHOVER_USER
  }
})

test('a real lead with an international name still emails, pushes, and logs', async () => {
  const captured = mockDeliveryChannels()
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.PUSHOVER_TOKEN = 'po_test_token'
  process.env.PUSHOVER_USER = 'po_test_user'
  try {
    const { status, json } = await postContact({
      name: 'Nguyễn Thị Lan',
      phone: '615-555-0199',
      email: 'lan.nguyen@example.com',
      body: 'We are relocating to Franklin and would like to see homes near Ravenwood.',
      lead_type: 'buyer',
      source: 'homepage',
      traffic_source: 'facebook',
      fbclid: 'fb-intl',
      landing_page: 'https://www.joshuafink.com/?fbclid=fb-intl',
      page_url: 'https://www.joshuafink.com/',
      _loaded: String(Date.now() - 25_000),
    }, '203.0.113.54')
    assert.equal(status, 200)
    assert.equal(json.ok, true)

    const emails = captured.filter((c) => c.url.includes('api.resend.com')).map((c) => JSON.parse(c.body))
    const leadEmail = emails.find((e) => /New Lead/.test(e.subject))
    assert.ok(leadEmail)
    assert.match(leadEmail.subject, /Nguyễn Thị Lan/)
    assert.ok(captured.some((c) => c.url.includes('api.pushover.net')))

    const sheet = JSON.parse(captured.find((c) => c.url.includes('script.google.com'))!.body)
    assert.equal(sheet.blocked_reason, undefined)
    assert.equal(sheet.name, 'Nguyễn Thị Lan')
    assert.equal(sheet.traffic_source, 'facebook')
    assert.equal(sheet.fbclid, 'fb-intl')
    assert.equal(sheet.page_url, 'https://www.joshuafink.com/')
    assert.equal(sheet.landing_page, 'https://www.joshuafink.com/?fbclid=fb-intl')
    assert.equal(sheet.suspected_spam || '', '')
  } finally {
    delete process.env.RESEND_API_KEY
    delete process.env.PUSHOVER_TOKEN
    delete process.env.PUSHOVER_USER
  }
})

test('more than 12 submits in a minute from one IP are told to call', async () => {
  mockFetch('{"ok":true}', 'application/json')
  const { POST } = await import('./route.ts')
  let lastStatus = 0
  for (let i = 0; i < 13; i++) {
    const res = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.99',
        },
        body: JSON.stringify({
          name: 'Flood Test',
          email: 'flood@example.com',
          body: 'Just checking the rate limit.',
          _loaded: String(Date.now() - 30_000),
        }),
      })
    )
    lastStatus = res.status
  }
  assert.equal(lastStatus, 429)
})
