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
delete process.env.PUSHOVER_TOKEN
delete process.env.PUSHOVER_USER
delete process.env.RESEND_API_KEY
delete process.env.SENDGRID_API_KEY

const realFetch = globalThis.fetch
after(() => {
  globalThis.fetch = realFetch
})

// The route also fires best-effort localhost webhooks; only the sheet URL gets
// the scripted body, everything else gets an inert 200.
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
