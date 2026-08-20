// Provider selection for outbound email.
//
// Run: npm test
//
// The point of lib/send-email.ts is that swapping providers is a single env
// var. These tests pin that contract, and pin the one behaviour every caller
// depends on: sending must never throw, because email is one lead-delivery
// channel among several and a mail outage must not fail a lead.

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

test('Resend wins when both keys are present — that is the cutover', async () => {
  await withEnv({ RESEND_API_KEY: 're_test', SENDGRID_API_KEY: 'SG.test' }, async () => {
    assert.equal(await provider(), 'resend')
  })
})

test('falls back to SendGrid when only that key is set', async () => {
  await withEnv({ RESEND_API_KEY: undefined, SENDGRID_API_KEY: 'SG.test' }, async () => {
    assert.equal(await provider(), 'sendgrid')
  })
})

test('reports none when neither key is configured', async () => {
  await withEnv({ RESEND_API_KEY: undefined, SENDGRID_API_KEY: undefined }, async () => {
    assert.equal(await provider(), 'none')
  })
})

test('sending with no provider resolves — it must never throw at a lead', async () => {
  await withEnv({ RESEND_API_KEY: undefined, SENDGRID_API_KEY: undefined }, async () => {
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
