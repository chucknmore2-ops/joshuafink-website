// Provider selection for outbound email.
//
// Run: npm test
//
// These tests pin which provider lib/send-email.ts picks, and pin the one
// behaviour every caller depends on: sending must never throw, because email
// is one lead-delivery channel among several and a mail outage must not fail
// a lead.

import { test } from 'node:test'
import assert from 'node:assert/strict'

async function withEnv<T>(vars: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const saved: Record<string, string | undefined> = {}
  for (const k of Object.keys(vars)) {
    saved[k] = process.env[k]
    if (vars[k] === undefined) delete process.env[k]
    else process.env[k] = vars[k]
  }
  try {
    return await fn()
  } finally {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  }
}

// Imported fresh inside each case so module-level env reads cannot leak.
async function provider() {
  const m = await import('./send-email.ts')
  return m.activeEmailProvider()
}

test('Resend is used when its key is set', async () => {
  await withEnv({ RESEND_API_KEY: 're_test' }, async () => {
    assert.equal(await provider(), 'resend')
  })
})

test('a leftover SENDGRID_API_KEY no longer selects a provider', async () => {
  // SendGrid support was removed; a stale key in Vercel must not resurrect it.
  await withEnv({ RESEND_API_KEY: undefined, SENDGRID_API_KEY: 'SG.test' }, async () => {
    assert.equal(await provider(), 'none')
  })
})

test('reports none when no key is configured', async () => {
  await withEnv({ RESEND_API_KEY: undefined }, async () => {
    assert.equal(await provider(), 'none')
  })
})

test('Resend omits reply_to when the lead gave no email', async () => {
  const bodies: string[] = []
  const original = globalThis.fetch
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    bodies.push(String(init?.body ?? ''))
    return new Response('{"id":"email-1"}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }) as typeof fetch
  try {
    await withEnv({ RESEND_API_KEY: 're_test' }, async () => {
      const { sendEmail } = await import('./send-email.ts')
      const omitted = await sendEmail({
        to: 'joshua@joshuafink.com',
        fromName: 'joshuafink.com Lead',
        subject: 'New Lead',
        html: '<p>phone only</p>',
      })
      assert.equal(omitted.ok, true)
      const blank = await sendEmail({
        to: 'joshua@joshuafink.com',
        fromName: 'joshuafink.com Lead',
        subject: 'New Lead',
        html: '<p>blank reply-to</p>',
        replyTo: { email: '   ', name: 'Sam Rivera' },
      })
      assert.equal(blank.ok, true)
    })
  } finally {
    globalThis.fetch = original
  }
  assert.equal(bodies.length, 2)
  for (const body of bodies) {
    const parsed = JSON.parse(body) as Record<string, unknown>
    assert.equal('reply_to' in parsed, false)
    assert.equal(parsed.to instanceof Array ? parsed.to[0] : '', 'joshua@joshuafink.com')
  }
})

test('sending with no provider resolves — it must never throw at a lead', async () => {
  await withEnv({ RESEND_API_KEY: undefined }, async () => {
    const { sendEmail } = await import('./send-email.ts')
    const res = await sendEmail({
      to: 'someone@example.com',
      fromName: 'Test',
      subject: 'x',
      html: '<p>x</p>',
    })
    assert.equal(res.ok, false)
    assert.equal(res.provider, 'none')
    assert.match(res.detail ?? '', /no email provider/i)
  })
})
