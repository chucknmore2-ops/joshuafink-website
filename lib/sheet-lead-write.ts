import { randomUUID } from 'crypto'
import { TURNSTILE_FIELD } from './turnstile'
import {
  currentSheetLeadStore,
  type SheetLeadStore,
} from './sheet-lead-queue'

// The contact route's maxDuration is 30s, and Turnstile may already have
// used a few seconds. Three attempts at the 6s channel timeout, plus this
// backoff, stay inside what is left. Backfill has its own longer budget on
// /api/cron/sheet-lead-backfill (maxDuration 60).
export const SHEET_WRITE_BUDGET_MS = 18_000
export const SHEET_BACKFILL_BUDGET_MS = 45_000
export const SHEET_MAX_ATTEMPTS = 3
export const SHEET_BACKOFF_BASE_MS = 200
export const SHEET_BACKOFF_CAP_MS = 1_000
/** A row the script itself rejects (not an outage) is failed after this many claims. */
export const SHEET_ROW_FAIL_LIMIT = 3

const MIN_ATTEMPT_MS = 250
const RETRY_HTTP = new Set([408, 429, 500, 502, 503, 504])

export type SheetChannelResult = {
  channel: 'sheet'
  configured: boolean
  ok: boolean
  detail?: string
  queued?: boolean
}

export type SheetPostResult = {
  ok: boolean
  attempts: number
  detail?: string
  duplicate?: boolean
  /** global = the sheet (or the deployment) is unhealthy; row = this payload. */
  scope: 'ok' | 'global' | 'row'
}

const skip = (detail?: string): SheetChannelResult => ({
  channel: 'sheet',
  configured: false,
  ok: false,
  ...(detail ? { detail } : {}),
})

function timeoutCapMs(): number {
  const configured = Number(process.env.LEAD_CHANNEL_TIMEOUT_MS || '')
  return configured > 0 ? configured : 6_000
}

function backoffBaseMs(): number {
  const configured = Number(process.env.SHEET_RETRY_BASE_MS || '')
  return configured >= 0 && process.env.SHEET_RETRY_BASE_MS !== undefined && process.env.SHEET_RETRY_BASE_MS !== ''
    ? configured
    : SHEET_BACKOFF_BASE_MS
}

export function sheetBackoffMs(failedAttempts: number, base = SHEET_BACKOFF_BASE_MS): number {
  const exponent = Math.max(0, failedAttempts - 1)
  return Math.min(SHEET_BACKOFF_CAP_MS, base * 2 ** exponent)
}

export function classifySheetFailure(input: {
  httpStatus?: number
  detail: string
  nonJson?: boolean
}): { transient: boolean; scope: 'global' | 'row' } {
  if (input.nonJson) return { transient: false, scope: 'global' }
  if (input.httpStatus !== undefined && RETRY_HTTP.has(input.httpStatus)) {
    return { transient: true, scope: 'global' }
  }
  if (input.httpStatus !== undefined && input.httpStatus >= 400 && input.httpStatus < 500) {
    return { transient: false, scope: 'global' }
  }
  if (/bad secret/i.test(input.detail)) return { transient: false, scope: 'global' }
  if (/timeout|temporar|unavailable|rate limit|quota|backend error|internal error|service spreadsheets|try again|econnreset|socket hang up|network/i.test(input.detail)) {
    return { transient: true, scope: 'global' }
  }
  return { transient: false, scope: 'row' }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function fetchWithBudget(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetchImpl(url, { ...init, signal: ctrl.signal })
  } catch (err) {
    if (ctrl.signal.aborted) throw new Error('timeout')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export function buildSheetPayload(
  lead: Record<string, string>,
  options: {
    blockedReason?: string
    testMode?: boolean
    leadId?: string
    receivedAt?: string
  } = {},
): Record<string, string> {
  const clean = Object.fromEntries(
    Object.entries(lead).filter(([key]) => !key.startsWith('_') && key !== 'website' && key !== TURNSTILE_FIELD && key !== 'secret'),
  )
  return {
    ...clean,
    lead_id: options.leadId || randomUUID(),
    lead_type: lead.subject || lead.lead_type || '',
    received_at: options.receivedAt || new Date().toISOString(),
    ...(options.blockedReason ? { blocked_reason: options.blockedReason, status: 'spam' } : {}),
    ...(options.testMode ? { system_test: 'true' } : {}),
  }
}

function withSecret(payload: Record<string, string>, secret: string): Record<string, string> {
  if (!secret) return payload
  return { ...payload, secret }
}

export async function postSheetPayload(options: {
  url: string
  payload: Record<string, string>
  secret?: string
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  now?: () => number
  budgetMs?: number
  timeoutMs?: number
  maxAttempts?: number
  backoffBaseMs?: number
}): Promise<SheetPostResult> {
  const fetchImpl = options.fetchImpl ?? fetch
  const sleep = options.sleep ?? defaultSleep
  const now = options.now ?? Date.now
  const budgetMs = options.budgetMs ?? SHEET_WRITE_BUDGET_MS
  const perAttemptCap = options.timeoutMs ?? timeoutCapMs()
  const maxAttempts = options.maxAttempts ?? SHEET_MAX_ATTEMPTS
  const base = options.backoffBaseMs ?? backoffBaseMs()
  const started = now()
  const body = JSON.stringify(withSecret(options.payload, options.secret || ''))

  let lastDetail = 'sheet write failed'
  let lastScope: 'global' | 'row' = 'global'
  let attempts = 0

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const remaining = budgetMs - (now() - started)
    if (remaining < MIN_ATTEMPT_MS) break
    attempts = attempt
    const timeoutMs = Math.min(perAttemptCap, remaining)
    let retry = false
    try {
      const res = await fetchWithBudget(options.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        redirect: 'follow',
      }, timeoutMs, fetchImpl)
      if (!res.ok) {
        lastDetail = `HTTP ${res.status}`
        const classified = classifySheetFailure({ httpStatus: res.status, detail: lastDetail })
        lastScope = classified.scope
        retry = classified.transient
      } else {
        const data = await res.json().catch(() => null) as { ok?: unknown; error?: unknown; duplicate?: unknown } | null
        if (data && data.ok === true) {
          return {
            ok: true,
            attempts,
            duplicate: data.duplicate === true,
            scope: 'ok',
          }
        }
        lastDetail = data
          ? String(data.error || 'script reported ok:false')
          : 'non-JSON response (broken deployment?)'
        const classified = classifySheetFailure({ detail: lastDetail, nonJson: !data })
        lastScope = classified.scope
        retry = classified.transient
      }
    } catch (err) {
      lastDetail = err instanceof Error && err.message === 'timeout' ? 'timeout' : String(err)
      lastScope = 'global'
      retry = true
    }

    if (!retry || attempt === maxAttempts) break
    const delay = sheetBackoffMs(attempt, base)
    if (now() - started + delay + MIN_ATTEMPT_MS > budgetMs) break
    await sleep(delay)
  }

  return { ok: false, attempts, detail: lastDetail, scope: lastScope }
}

export async function deliverSheetLead(options: {
  lead: Record<string, string>
  blockedReason?: string
  testMode?: boolean
  webhookUrl: string
  secret?: string
  store?: SheetLeadStore | null
  leadId?: string
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  now?: () => number
  budgetMs?: number
  timeoutMs?: number
  maxAttempts?: number
  backoffBaseMs?: number
}): Promise<SheetChannelResult> {
  if (!options.webhookUrl) {
    console.log('Google Sheet: skipping — GOOGLE_SHEET_WEBHOOK_URL not set')
    return skip()
  }

  const payload = buildSheetPayload(options.lead, {
    blockedReason: options.blockedReason,
    testMode: options.testMode,
    leadId: options.leadId,
  })
  const result = await postSheetPayload({
    url: options.webhookUrl,
    payload,
    secret: options.secret,
    fetchImpl: options.fetchImpl,
    sleep: options.sleep,
    now: options.now,
    budgetMs: options.budgetMs,
    timeoutMs: options.timeoutMs,
    maxAttempts: options.maxAttempts,
    backoffBaseMs: options.backoffBaseMs,
  })

  if (result.ok) {
    console.log(`Google Sheet: logged lead for ${options.lead.name || 'Unknown'}`)
    return {
      channel: 'sheet',
      configured: true,
      ok: true,
      ...(result.duplicate ? { detail: 'duplicate lead_id' } : {}),
    }
  }

  console.error('Google Sheet: script did not confirm the row:', result.detail)
  const store = options.store === undefined ? currentSheetLeadStore() : options.store
  let queued = false
  if (store) {
    queued = await store.enqueue({ id: payload.lead_id, payload })
  }
  if (queued) {
    console.error(`Google Sheet: queued lead for ${options.lead.name || 'Unknown'} after ${result.detail}`)
    return {
      channel: 'sheet',
      configured: true,
      ok: false,
      queued: true,
      detail: `queued: ${result.detail}`,
    }
  }
  return { channel: 'sheet', configured: true, ok: false, detail: result.detail }
}

export type SheetBackfillReport = {
  written: number
  failed: number
  released: number
  stopped: boolean
  remaining: { queued: number; failed: number } | null
}

export async function backfillSheetLeads(options: {
  webhookUrl: string
  secret?: string
  store: SheetLeadStore
  budgetMs?: number
  maxLeads?: number
  now?: () => number
  sleep?: (ms: number) => Promise<void>
  fetchImpl?: typeof fetch
  timeoutMs?: number
  maxAttempts?: number
  backoffBaseMs?: number
}): Promise<SheetBackfillReport> {
  const now = options.now ?? Date.now
  const budgetMs = options.budgetMs ?? SHEET_BACKFILL_BUDGET_MS
  const maxLeads = options.maxLeads ?? 20
  const started = now()
  let written = 0
  let failed = 0
  let released = 0
  let stopped = false
  let processed = 0

  while (processed < maxLeads) {
    if (budgetMs - (now() - started) < 1_000) break
    const claimed = await options.store.claim(1)
    if (claimed.length === 0) break
    const row = claimed[0]
    processed += 1

    if (!row.payload) {
      await options.store.markFailed(row.id, 'queued payload was unreadable')
      failed += 1
      continue
    }

    const remaining = budgetMs - (now() - started)
    const result = await postSheetPayload({
      url: options.webhookUrl,
      payload: { ...row.payload, lead_id: row.id },
      secret: options.secret,
      fetchImpl: options.fetchImpl,
      sleep: options.sleep,
      now,
      budgetMs: Math.min(12_000, remaining),
      timeoutMs: options.timeoutMs,
      maxAttempts: options.maxAttempts,
      backoffBaseMs: options.backoffBaseMs,
    })

    if (result.ok) {
      await options.store.markWritten(row.id)
      written += 1
      continue
    }

    const detail = result.detail || 'sheet write failed'
    if (result.scope === 'global') {
      await options.store.release(row.id, detail)
      released += 1
      stopped = true
      break
    }
    if (row.attempts >= SHEET_ROW_FAIL_LIMIT) {
      await options.store.markFailed(row.id, detail)
      failed += 1
    } else {
      await options.store.release(row.id, detail)
      released += 1
    }
  }

  const remaining = await options.store.counts()
  return { written, failed, released, stopped, remaining }
}
