import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createMemorySheetLeadStore } from './sheet-lead-queue.ts'
import {
  SHEET_BACKFILL_ATTEMPT_MS,
  SHEET_BACKFILL_BUDGET_MS,
  SHEET_ROW_FAIL_LIMIT,
  SHEET_WRITE_BUDGET_MS,
  backfillSheetLeads,
  buildSheetPayload,
  classifySheetFailure,
  deliverSheetLead,
  postSheetPayload,
  redactSheetDetail,
  sheetBackoffMs,
  sheetBackfillLeadBudget,
  sheetFailureStopsBackfill,
} from './sheet-lead-write.ts'

const URL = 'https://script.google.com/macros/s/test-deployment/exec'

test('backoff doubles and stays short', () => {
  assert.equal(sheetBackoffMs(1, 200), 200)
  assert.equal(sheetBackoffMs(2, 200), 400)
  assert.equal(sheetBackoffMs(3, 200), 800)
  assert.equal(sheetBackoffMs(8, 200), 1000)
})

test('permanent script errors are not retried; spreadsheet and 503 errors are', () => {
  assert.deepEqual(classifySheetFailure({ detail: 'bad secret' }), { transient: false, scope: 'global' })
  assert.deepEqual(classifySheetFailure({ detail: 'non-JSON response (broken deployment?)', nonJson: true }), {
    transient: false,
    scope: 'global',
  })
  assert.deepEqual(classifySheetFailure({ httpStatus: 503, detail: 'HTTP 503' }), { transient: true, scope: 'global' })
  assert.deepEqual(classifySheetFailure({ httpStatus: 429, detail: 'HTTP 429' }), { transient: true, scope: 'global' })
  assert.deepEqual(classifySheetFailure({ httpStatus: 404, detail: 'HTTP 404' }), { transient: false, scope: 'global' })
  assert.deepEqual(classifySheetFailure({ detail: 'Exception: Service Spreadsheets failed' }), {
    transient: true,
    scope: 'global',
  })
  assert.deepEqual(classifySheetFailure({ detail: 'Exception: The cell value is invalid' }), {
    transient: false,
    scope: 'row',
  })
})

test('a transient failure is retried and then accepted, with one lead id', async () => {
  const bodies: string[] = []
  const sleeps: number[] = []
  let calls = 0
  const result = await postSheetPayload({
    url: URL,
    payload: { lead_id: 'lead-1', name: 'Ada' },
    secret: 's3cret',
    backoffBaseMs: 200,
    timeoutMs: 1000,
    budgetMs: 10_000,
    now: () => 0,
    sleep: async (ms) => { sleeps.push(ms) },
    fetchImpl: (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1
      bodies.push(String(init?.body ?? ''))
      if (calls === 1) return new Response('upstream', { status: 503 })
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }) as typeof fetch,
  })
  assert.equal(result.ok, true)
  assert.equal(result.attempts, 2)
  assert.deepEqual(sleeps, [200])
  assert.equal(bodies.length, 2)
  const first = JSON.parse(bodies[0])
  const second = JSON.parse(bodies[1])
  assert.equal(first.lead_id, 'lead-1')
  assert.equal(second.lead_id, 'lead-1')
  assert.equal(first.secret, 's3cret')
  assert.equal(second.secret, 's3cret')
})

test('a bad secret is one attempt and is not treated as success', async () => {
  let calls = 0
  const result = await postSheetPayload({
    url: URL,
    payload: { lead_id: 'lead-2', name: 'Ada' },
    backoffBaseMs: 200,
    now: () => 0,
    sleep: async () => { throw new Error('should not sleep') },
    fetchImpl: (async () => {
      calls += 1
      return new Response('{"ok":false,"error":"bad secret"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch,
  })
  assert.equal(result.ok, false)
  assert.equal(result.scope, 'global')
  assert.equal(calls, 1)
  assert.match(result.detail || '', /bad secret/)
})

test('retries stop before the time budget would be exceeded', async () => {
  let t = 0
  let calls = 0
  const result = await postSheetPayload({
    url: URL,
    payload: { lead_id: 'lead-3', name: 'Ada' },
    budgetMs: 12_000,
    timeoutMs: 6_000,
    backoffBaseMs: 200,
    maxAttempts: 3,
    now: () => t,
    sleep: async (ms) => { t += ms },
    fetchImpl: (async () => {
      calls += 1
      t += 8_000
      return new Response('{"ok":false,"error":"Service Spreadsheets failed"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch,
  })
  assert.equal(result.ok, false)
  assert.equal(result.scope, 'global')
  assert.equal(calls, 2)
})

test('a duplicate lead_id from the script counts as written and is not queued', async () => {
  const store = createMemorySheetLeadStore()
  const result = await deliverSheetLead({
    lead: { name: 'Ada Lovelace', email: 'ada@example.com', subject: 'buy' },
    webhookUrl: URL,
    secret: 's3cret',
    store,
    leadId: 'lead-dup',
    fetchImpl: (async () => new Response('{"ok":true,"duplicate":true}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch,
  })
  assert.equal(result.ok, true)
  assert.equal(result.detail, 'duplicate lead_id')
  assert.equal((await store.counts())?.queued, 0)
})

test('a failed write is queued without the webhook secret, and email fields are kept', async () => {
  const store = createMemorySheetLeadStore()
  const posted: string[] = []
  const result = await deliverSheetLead({
    lead: {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '615-555-0100',
      subject: 'sell',
      website: 'http://spam.example',
      secret: 'visitor-secret',
      _loaded: '123',
    },
    blockedReason: 'honeypot',
    webhookUrl: URL,
    secret: 'server-secret',
    store,
    leadId: 'lead-q',
    backoffBaseMs: 0,
    maxAttempts: 2,
    now: () => 0,
    sleep: async () => undefined,
    fetchImpl: (async (_input: RequestInfo | URL, init?: RequestInit) => {
      posted.push(String(init?.body ?? ''))
      return new Response('upstream', { status: 503 })
    }) as typeof fetch,
  })
  assert.equal(result.ok, false)
  assert.equal(result.queued, true)
  assert.match(result.detail || '', /^queued: HTTP 503/)
  assert.equal(posted.length, 2)
  const sent = JSON.parse(posted[0])
  assert.equal(sent.secret, 'server-secret')
  assert.equal(sent.email, 'ada@example.com')
  assert.equal(sent.blocked_reason, 'honeypot')
  assert.equal(sent.lead_id, 'lead-q')
  assert.equal('website' in sent, false)
  const saved = store.saved('lead-q')
  assert.ok(saved)
  assert.equal(saved.email, 'ada@example.com')
  assert.equal(saved.phone, '615-555-0100')
  assert.equal(saved.blocked_reason, 'honeypot')
  assert.equal('secret' in saved, false)
  assert.equal((await store.counts())?.queued, 1)
})

test('buildSheetPayload keeps one received_at and does not keep the honeypot', () => {
  const payload = buildSheetPayload(
    { name: 'Ada', email: 'ada@example.com', website: 'x', _loaded: '1', subject: 'buy' },
    { leadId: 'fixed', receivedAt: '2026-10-22T00:00:00.000Z', testMode: true },
  )
  assert.equal(payload.lead_id, 'fixed')
  assert.equal(payload.received_at, '2026-10-22T00:00:00.000Z')
  assert.equal(payload.system_test, 'true')
  assert.equal(payload.lead_type, 'buy')
  assert.equal('website' in payload, false)
  assert.equal('secret' in payload, false)
})

test('backfill writes a queued lead once and will not claim it again', async () => {
  const store = createMemorySheetLeadStore()
  await store.enqueue({
    id: 'lead-1',
    payload: { lead_id: 'lead-1', name: 'Ada', email: 'ada@example.com' },
  })
  let posts = 0
  const fetchImpl = (async () => {
    posts += 1
    return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }) as typeof fetch
  const first = await backfillSheetLeads({
    webhookUrl: URL,
    store,
    fetchImpl,
    now: () => 0,
    sleep: async () => undefined,
    budgetMs: 10_000,
  })
  assert.equal(first.written, 1)
  assert.equal(first.detail, null)
  assert.equal(posts, 1)
  assert.equal(first.remaining?.queued, 0)
  const second = await backfillSheetLeads({
    webhookUrl: URL,
    store,
    fetchImpl,
    now: () => 0,
    sleep: async () => undefined,
    budgetMs: 10_000,
  })
  assert.equal(second.written, 0)
  assert.equal(posts, 1)
})

test('a sheet outage releases the row and does not start the next one', async () => {
  const store = createMemorySheetLeadStore()
  await store.enqueue({ id: 'a', payload: { lead_id: 'a', name: 'A', email: 'a@example.com' } })
  await store.enqueue({ id: 'b', payload: { lead_id: 'b', name: 'B', email: 'b@example.com' } })
  let posts = 0
  const report = await backfillSheetLeads({
    webhookUrl: URL,
    store,
    maxAttempts: 1,
    backoffBaseMs: 0,
    now: () => 0,
    sleep: async () => undefined,
    budgetMs: 10_000,
    fetchImpl: (async () => {
      posts += 1
      return new Response('no', { status: 503 })
    }) as typeof fetch,
  })
  assert.equal(posts, 1)
  assert.equal(report.stopped, true)
  assert.equal(report.written, 0)
  assert.equal(report.detail, 'HTTP 503')
  assert.equal(report.remaining?.queued, 2)
  assert.equal(report.remaining?.failed, 0)
})

test('a timeout puts that row back and still writes the next one', async () => {
  const store = createMemorySheetLeadStore()
  await store.enqueue({ id: 'slow', payload: { lead_id: 'slow', name: 'Slow', email: 'slow@example.com' } })
  await store.enqueue({ id: 'next', payload: { lead_id: 'next', name: 'Next', email: 'next@example.com' } })
  const posted: string[] = []
  const report = await backfillSheetLeads({
    webhookUrl: URL,
    store,
    now: () => 0,
    sleep: async () => undefined,
    budgetMs: 45_000,
    fetchImpl: (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? '')) as { lead_id: string }
      posted.push(body.lead_id)
      if (body.lead_id === 'slow') throw new Error('timeout')
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }) as typeof fetch,
  })
  assert.deepEqual(posted, ['slow', 'next', 'slow'])
  assert.equal(report.written, 1)
  assert.equal(report.released, 2)
  assert.equal(report.failed, 0)
  assert.equal(report.stopped, false)
  assert.equal(report.detail, 'timeout')
  assert.equal(report.remaining?.queued, 1)
  assert.ok(posted.filter((id) => id === 'slow').length < 3)
})

test('a timed-out write that actually landed is marked written on the duplicate reply', async () => {
  const store = createMemorySheetLeadStore()
  await store.enqueue({ id: 'landed', payload: { lead_id: 'landed', name: 'Ada', email: 'ada@example.com' } })
  let calls = 0
  const fetchImpl = (async () => {
    calls += 1
    if (calls === 1) throw new Error('timeout')
    return new Response('{"ok":true,"duplicate":true}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch
  const report = await backfillSheetLeads({
    webhookUrl: URL,
    store,
    fetchImpl,
    now: () => 0,
    sleep: async () => undefined,
    budgetMs: 45_000,
  })
  // Nothing else is queued, so the same run retries the row. The script's
  // duplicate answer means the timed-out attempt had already appended it.
  assert.equal(report.written, 1)
  assert.equal(report.released, 1)
  assert.equal(report.detail, 'timeout')
  assert.equal(report.remaining?.queued, 0)
  assert.equal(calls, 2)
})

test('backfill gives each lead one Apps Script-sized attempt', () => {
  const plan = sheetBackfillLeadBudget(SHEET_BACKFILL_BUDGET_MS)
  assert.equal(plan.budgetMs, SHEET_BACKFILL_ATTEMPT_MS)
  assert.equal(plan.timeoutMs, SHEET_BACKFILL_ATTEMPT_MS)
  assert.ok(SHEET_BACKFILL_ATTEMPT_MS >= 20_000)
  assert.ok(SHEET_BACKFILL_ATTEMPT_MS < SHEET_BACKFILL_BUDGET_MS)
  assert.equal(sheetBackfillLeadBudget(5_000).timeoutMs, 5_000)
  assert.equal(sheetFailureStopsBackfill({ scope: 'global', detail: 'timeout' }), false)
  assert.equal(sheetFailureStopsBackfill({ scope: 'global', detail: 'TypeError: fetch failed' }), false)
  assert.equal(sheetFailureStopsBackfill({ scope: 'global', detail: 'HTTP 503' }), true)
  assert.equal(sheetFailureStopsBackfill({ scope: 'global', detail: 'bad secret' }), true)
  assert.equal(sheetFailureStopsBackfill({ scope: 'global', detail: 'non-JSON response (broken deployment?)' }), true)
  assert.equal(sheetFailureStopsBackfill({ scope: 'row', detail: 'timeout' }), false)
  assert.equal(redactSheetDetail('failed for ada@example.com at 615-555-0100 postgres://user:pw@host/db'), 'failed for [email] at [phone] postgres://redacted')
})

test('a duplicate response during backfill marks the lead written', async () => {
  const store = createMemorySheetLeadStore()
  await store.enqueue({ id: 'dup', payload: { lead_id: 'dup', name: 'Ada', email: 'ada@example.com' } })
  const report = await backfillSheetLeads({
    webhookUrl: URL,
    secret: 's3cret',
    store,
    now: () => 0,
    sleep: async () => undefined,
    fetchImpl: (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? ''))
      assert.equal(body.lead_id, 'dup')
      assert.equal(body.secret, 's3cret')
      assert.equal('secret' in (store.saved('dup') || {}), false)
      return new Response('{"ok":true,"duplicate":true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch,
  })
  assert.equal(report.written, 1)
  assert.equal(report.remaining?.queued, 0)
})

test('a row the script rejects is failed after the limit and does not block the next row', async () => {
  const store = createMemorySheetLeadStore()
  await store.enqueue({ id: 'bad', payload: { lead_id: 'bad', name: 'Bad', email: 'bad@example.com' } })
  await store.enqueue({ id: 'good', payload: { lead_id: 'good', name: 'Good', email: 'good@example.com' } })
  const posted: string[] = []
  const report = await backfillSheetLeads({
    webhookUrl: URL,
    store,
    maxAttempts: 1,
    now: () => 0,
    sleep: async () => undefined,
    budgetMs: 10_000,
    fetchImpl: (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? '')) as { lead_id: string }
      posted.push(body.lead_id)
      if (body.lead_id === 'bad') {
        return new Response('{"ok":false,"error":"Exception: The cell value is invalid"}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }) as typeof fetch,
  })
  assert.equal(report.written, 1)
  assert.equal(report.failed, 1)
  assert.equal(posted.filter((id) => id === 'bad').length, SHEET_ROW_FAIL_LIMIT)
  assert.ok(posted.includes('good'))
  assert.ok(posted.indexOf('good') < posted.lastIndexOf('bad'))
  const counts = await store.counts()
  assert.equal(counts?.failed, 1)
  assert.equal(counts?.queued, 0)
})

test('two claims do not return the same pending lead, and a stale claim can be retried', async () => {
  let t = 1_000
  const store = createMemorySheetLeadStore(() => t)
  await store.enqueue({ id: 'only', payload: { lead_id: 'only', name: 'Ada', email: 'ada@example.com' } })
  const first = await store.claim(5)
  assert.equal(first.length, 1)
  assert.equal(first[0].attempts, 1)
  const second = await store.claim(5)
  assert.equal(second.length, 0)
  t += 11 * 60 * 1000
  const third = await store.claim(5)
  assert.equal(third.length, 1)
  assert.equal(third[0].id, 'only')
  assert.equal(third[0].attempts, 2)
})

test('retry and backfill budgets fit the route time limits and do not add a Vercel cron', () => {
  const contact = readFileSync('app/api/contact/route.ts', 'utf8')
  const backfill = readFileSync('app/api/cron/sheet-lead-backfill/route.ts', 'utf8')
  const vercel = readFileSync('vercel.json', 'utf8')
  const workflow = readFileSync('.github/workflows/sheet-lead-backfill.yml', 'utf8')
  const contactLimit = Number(contact.match(/export const maxDuration = (\d+)/)?.[1])
  const backfillLimit = Number(backfill.match(/export const maxDuration = (\d+)/)?.[1])
  assert.equal(contactLimit, 30)
  assert.ok(SHEET_WRITE_BUDGET_MS <= contactLimit * 1000 - 8_000)
  assert.equal(backfillLimit, 60)
  assert.ok(SHEET_BACKFILL_BUDGET_MS <= backfillLimit * 1000 - 10_000)
  assert.equal(vercel.includes('sheet-lead-backfill'), false)
  assert.match(workflow, /CRON_SECRET/)
  assert.match(workflow, /api\/cron\/sheet-lead-backfill/)
  assert.match(workflow, /wrote 0 of/)
  assert.equal(backfill.includes('sendPushover'), false)
  assert.equal(backfill.includes('forwardToJoshua'), false)
  assert.equal(backfill.includes('sendAutoReply'), false)
  assert.equal(backfill.includes('Resend'), false)
  const parallel = contact.slice(contact.indexOf('await Promise.all(['), contact.indexOf('await Promise.all([') + 700)
  assert.match(parallel, /forwardToJoshua/)
  assert.match(parallel, /pushToSheet/)
  assert.match(parallel, /sendPushover/)
})
