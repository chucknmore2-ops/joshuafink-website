import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createMemorySheetLeadStore, useSheetLeadStoreForTests } from '@/lib/sheet-lead-queue.ts'

const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL
const ORIGINAL_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK_URL
const ORIGINAL_SECRET = process.env.CRON_SECRET

after(() => {
  useSheetLeadStoreForTests(undefined)
  if (ORIGINAL_DATABASE_URL === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = ORIGINAL_DATABASE_URL
  if (ORIGINAL_WEBHOOK === undefined) delete process.env.GOOGLE_SHEET_WEBHOOK_URL
  else process.env.GOOGLE_SHEET_WEBHOOK_URL = ORIGINAL_WEBHOOK
  if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = ORIGINAL_SECRET
})

async function call(headers?: Record<string, string>) {
  const { GET } = await import('./route.ts')
  const res = await GET(new Request('https://www.joshuafink.com/api/cron/sheet-lead-backfill', { headers }))
  const json = await res.json()
  return { status: res.status, json }
}

test('backfill refuses a missing or wrong secret', async () => {
  process.env.CRON_SECRET = 'cron-secret'
  delete process.env.DATABASE_URL
  useSheetLeadStoreForTests(undefined)
  const missing = await call()
  assert.equal(missing.status, 401)
  const wrong = await call({ authorization: 'Bearer nope' })
  assert.equal(wrong.status, 401)
})

test('backfill fails closed when CRON_SECRET is unset', async () => {
  delete process.env.CRON_SECRET
  const res = await call({ authorization: 'Bearer cron-secret' })
  assert.equal(res.status, 500)
})

test('backfill reports unconfigured when the queue is off and does not call the sheet', async () => {
  process.env.CRON_SECRET = 'cron-secret'
  process.env.GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/test/exec'
  delete process.env.DATABASE_URL
  useSheetLeadStoreForTests(null)
  const realFetch = globalThis.fetch
  let called = false
  globalThis.fetch = (() => {
    called = true
    throw new Error('sheet should not be called')
  }) as typeof fetch
  try {
    const res = await call({ authorization: 'Bearer cron-secret' })
    assert.equal(res.status, 200)
    assert.equal(res.json.ok, true)
    assert.equal(res.json.configured, false)
    assert.equal(res.json.queueConfigured, false)
    assert.equal(called, false)
  } finally {
    globalThis.fetch = realFetch
  }
})

test('backfill writes a queued lead and a second run does not post it again', async () => {
  process.env.CRON_SECRET = 'cron-secret'
  process.env.GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/test/exec'
  delete process.env.DATABASE_URL
  const store = createMemorySheetLeadStore()
  await store.enqueue({
    id: 'lead-9',
    payload: { lead_id: 'lead-9', name: 'Ada Lovelace', email: 'ada@example.com' },
  })
  useSheetLeadStoreForTests(store)
  const realFetch = globalThis.fetch
  const bodies: string[] = []
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    bodies.push(String(init?.body ?? ''))
    return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }) as typeof fetch
  try {
    const { GET } = await import('./route.ts')
    const first = await GET(new Request('https://www.joshuafink.com/api/cron/sheet-lead-backfill', {
      headers: { authorization: 'Bearer cron-secret' },
    }))
    const firstJson = await first.json()
    assert.equal(first.status, 200)
    assert.equal(firstJson.written, 1)
    assert.equal(JSON.parse(bodies[0]).email, 'ada@example.com')
    assert.equal(JSON.parse(bodies[0]).lead_id, 'lead-9')

    const second = await GET(new Request('https://www.joshuafink.com/api/cron/sheet-lead-backfill', {
      headers: { authorization: 'Bearer cron-secret' },
    }))
    const secondJson = await second.json()
    assert.equal(second.status, 200)
    assert.equal(secondJson.written, 0)
    assert.equal(bodies.length, 1)
  } finally {
    globalThis.fetch = realFetch
    useSheetLeadStoreForTests(undefined)
  }
})
