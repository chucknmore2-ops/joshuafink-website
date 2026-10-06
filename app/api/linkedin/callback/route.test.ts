// LinkedIn OAuth state (CSRF) handling.
//
// Run: npm test
//
// /api/linkedin/auth sets a one-shot nonce cookie; /api/linkedin/callback must
// refuse to exchange a code unless LinkedIn echoed that same nonce back. These
// tests pin that a forged or stale callback never reaches LinkedIn's token
// endpoint, and that a genuine one returns every value the cron needs.

import { test, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

process.env.LINKEDIN_CLIENT_ID = 'client-id'
process.env.LINKEDIN_CLIENT_SECRET = 'client-secret'
process.env.LINKEDIN_REDIRECT_URI = 'https://www.joshuafink.com/api/linkedin/callback'

const realFetch = globalThis.fetch
let fetched: string[] = []
beforeEach(() => {
  fetched = []
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    fetched.push(url)
    if (url.includes('/oauth/v2/accessToken')) {
      return Response.json({ access_token: 'live-token', expires_in: 5_184_000 })
    }
    if (url.includes('/v2/userinfo')) {
      return Response.json({ sub: 'AbC123', name: 'Joshua Fink' })
    }
    return new Response('{}', { status: 404 })
  }) as typeof fetch
})
after(() => {
  globalThis.fetch = realFetch
})

function callback(query: string, cookie?: string) {
  return new NextRequest(`https://www.joshuafink.com/api/linkedin/callback?${query}`, {
    headers: cookie ? { cookie } : {},
  })
}

test('auth sets a state cookie matching the state sent to LinkedIn', async () => {
  const { GET } = await import('../auth/route.ts')
  const res = await GET()
  const state = new URL(res.headers.get('location')!).searchParams.get('state')
  assert.ok(state)
  const cookie = res.cookies.get('li_oauth_state')
  assert.equal(cookie?.value, state)
  assert.equal(cookie?.httpOnly, true)
  assert.equal(cookie?.sameSite, 'lax')
})

test('a callback whose state does not match the cookie is rejected before any token exchange', async () => {
  const { GET } = await import('./route.ts')
  const res = await GET(callback('code=attacker-code&state=forged', 'li_oauth_state=real-nonce'))
  assert.equal(res.status, 400)
  assert.deepEqual(fetched, [])
})

test('a callback with no state cookie (expired or never started here) is rejected', async () => {
  const { GET } = await import('./route.ts')
  const res = await GET(callback('code=some-code&state=real-nonce'))
  assert.equal(res.status, 400)
  assert.deepEqual(fetched, [])
})

test('a matching callback returns token, expiry and author URN, uncached, and clears the nonce', async () => {
  const { GET } = await import('./route.ts')
  const before = Date.now()
  const res = await GET(callback('code=good-code&state=real-nonce', 'li_oauth_state=real-nonce'))
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('cache-control'), 'no-store')
  const body = await res.json()
  assert.equal(body.vercelEnv.LINKEDIN_ACCESS_TOKEN, 'live-token')
  assert.equal(body.vercelEnv.LINKEDIN_AUTHOR_URN, 'urn:li:person:AbC123')
  const expiresAt = Number(body.vercelEnv.LINKEDIN_TOKEN_EXPIRES_AT_MS)
  assert.ok(expiresAt >= before + 5_184_000_000 && expiresAt <= Date.now() + 5_184_000_000)
  assert.equal(res.cookies.get('li_oauth_state')?.value, '')
})
