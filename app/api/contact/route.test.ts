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
delete process.env.SENDGRID_API_KEY

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

test('the healthcheck lead emails an "ignore" subject and tags the sheet row', async () => {
  // The daily test must not pose as a real lead: the email to Joshua still
  // sends (delivery proof) but under a test-only subject, and the sheet row
  // carries the system_test tag that files it into the "System" tab.
  const captured: { url: string; body: string }[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    captured.push({ url, body: String(init?.body ?? '') })
    if (url.includes('script.google.com')) {
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('{}', { status: 200 })
  }) as typeof fetch

  // activeEmailProvider() reads env per call, so the key can be set here
  // despite route.ts already being imported.
  process.env.RESEND_API_KEY = 're_test_key'
  try {
    const { POST } = await import('./route.ts')
    const res = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-healthcheck-secret': 'test-cron-secret',
        },
        // Mirrors scripts/morning_healthcheck.py: no email, so no auto-reply —
        // the one Resend call below is the lead email to Joshua.
        body: JSON.stringify({
          name: 'SYSTEM TEST — morning healthcheck',
          lead_type: 'system-test',
          source: 'morning-healthcheck',
          body: 'Automated daily test of the lead delivery channels.',
        }),
      })
    )
    assert.equal(res.status, 200)

    const emails = captured.filter((c) => c.url.includes('api.resend.com'))
    assert.equal(emails.length, 1)
    const subject = JSON.parse(emails[0].body).subject
    assert.equal(subject, '🩺 Daily lead-channel test — ignore')
    assert.doesNotMatch(subject, /New Lead/)

    const sheetCall = captured.find((c) => c.url.includes('script.google.com'))
    assert.ok(sheetCall)
    assert.equal(JSON.parse(sheetCall.body).system_test, 'true')
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
