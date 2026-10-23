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
/**
 * One Apps Script round trip, not the contact form's 6s channel cap.
 * A healthy append often takes several seconds (the script cold-starts,
 * follows Google's redirect, then scans the lead_id column). The old
 * backfill cap of 12s, split into 6s tries, aborted that call, called it
 * an outage, and never started the next queued row.
 */
export const SHEET_BACKFILL_ATTEMPT_MS = 20_000
/**
 * After a contact's own append confirms quickly, write one queued row
 * before the response returns. A slow append skips this so the contact
 * function stays inside its 30s limit. This does not send email or Pushover.
 */
export const SHEET_OPPORTUNISTIC_DRAIN_MS = 8_000
export const SHEET_OPPORTUNISTIC_DRAIN_LEADS = 1
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
  // 404 is Google's front door, not the Apps Script (the script answers
  // HTTP 200 JSON even when it throws). One queued payload returned 404
  // after two others in the same run had already appended, and treating
  // that as a sheet-wide failure left the rest of the queue untried.
  // Other 4xx still means this deployment is the wrong target.
  if (input.httpStatus === 404) return { transient: false, scope: 'row' }
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

  const now = options.now ?? Date.now
  const started = now()
  const store = options.store === undefined ? currentSheetLeadStore() : options.store
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
    now,
    budgetMs: options.budgetMs,
    timeoutMs: options.timeoutMs,
    maxAttempts: options.maxAttempts,
    backoffBaseMs: options.backoffBaseMs,
  })

  if (result.ok) {
    console.log(`Google Sheet: logged lead for ${options.lead.name || 'Unknown'}`)
    const elapsed = now() - started
    if (store && elapsed < SHEET_OPPORTUNISTIC_DRAIN_MS) {
      try {
        const drained = await backfillSheetLeads({
          webhookUrl: options.webhookUrl,
          secret: options.secret,
          store,
          budgetMs: SHEET_OPPORTUNISTIC_DRAIN_MS,
          maxLeads: SHEET_OPPORTUNISTIC_DRAIN_LEADS,
          now,
          sleep: options.sleep,
          fetchImpl: options.fetchImpl,
          maxAttempts: 1,
          backoffBaseMs: options.backoffBaseMs,
        })
        if (drained.written > 0) {
          console.log(`Google Sheet: drained ${drained.written} queued lead on a confirmed contact`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('Google Sheet: opportunistic drain failed:', redactSheetDetail(message))
      }
    }
    return {
      channel: 'sheet',
      configured: true,
      ok: true,
      ...(result.duplicate ? { detail: 'duplicate lead_id' } : {}),
    }
  }

  console.error('Google Sheet: script did not confirm the row:', result.detail)
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
  /** Why the last row did not confirm. Null when every claimed row was written. */
  detail: string | null
  remaining: { queued: number; failed: number } | null
}

/** Strip anything that could be a connection string or a lead field echoed by a script error. */
export function redactSheetDetail(detail: string): string {
  return detail
    .replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://redacted')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone]')
    .slice(0, 240)
}

/**
 * How long the next queued lead may spend talking to Apps Script.
 * One attempt: two short tries inside a 12s cap both die before a slow
 * append returns, and the job then looks like it drained nothing.
 */
export function sheetBackfillLeadBudget(remainingMs: number): { budgetMs: number; timeoutMs: number } {
  const budgetMs = Math.max(0, Math.min(SHEET_BACKFILL_ATTEMPT_MS, remainingMs))
  return { budgetMs, timeoutMs: budgetMs }
}

/**
 * Stop the batch only when another row would fail the same way for a
 * reason retrying will not fix (bad secret, HTML instead of the script,
 * rate limit, or an HTTP error other than 404). HTTP 404 is classified
 * as one row. A timeout or a dropped socket is one call. The contact
 * route's longer budget often confirms that same lead a moment later,
 * and the other queued rows were never tried.
 */
export function sheetFailureStopsBackfill(input: { scope: 'global' | 'row' | 'ok'; detail?: string }): boolean {
  if (input.scope !== 'global') return false
  const detail = input.detail || ''
  if (detail === 'timeout') return false
  if (/econnreset|socket hang up|fetch failed|network error|the operation was aborted/i.test(detail)) return false
  return true
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
  let detail: string | null = null
  let processed = 0
  // Transient failures may be retried once after the other rows. A second
  // claim of the same id means every other row has been tried too, and
  // spinning would only burn the budget (or, in tests, the lead cap).
  const transientTries = new Map<string, number>()
  // An HTTP 404 stays claimed until this run ends. Releasing it immediately
  // would claim it again, spend the fail limit, and mark a flaky Google
  // response as failed before the other rows were written.
  const held404: { id: string; error: string }[] = []

  try {
  while (processed < maxLeads) {
    if (budgetMs - (now() - started) < 1_000) break
    const claimed = await options.store.claim(1)
    if (claimed.length === 0) break
    const row = claimed[0]
    if ((transientTries.get(row.id) ?? 0) >= 2) {
      await options.store.release(row.id, detail || 'already tried this run')
      break
    }
    processed += 1

    if (!row.payload) {
      const failure = 'queued payload was unreadable'
      await options.store.markFailed(row.id, failure)
      failed += 1
      detail = failure
      continue
    }

    const remaining = budgetMs - (now() - started)
    const leadBudget = sheetBackfillLeadBudget(remaining)
    const result = await postSheetPayload({
      url: options.webhookUrl,
      // The queue id is the lead_id the script dedupes on. A retry that
      // timed out after the row landed comes back duplicate and is not appended.
      payload: { ...row.payload, lead_id: row.id },
      secret: options.secret,
      fetchImpl: options.fetchImpl,
      sleep: options.sleep,
      now,
      budgetMs: leadBudget.budgetMs,
      timeoutMs: options.timeoutMs ?? leadBudget.timeoutMs,
      maxAttempts: options.maxAttempts ?? 1,
      backoffBaseMs: options.backoffBaseMs,
    })

    if (result.ok) {
      await options.store.markWritten(row.id)
      written += 1
      continue
    }

    const failure = redactSheetDetail(result.detail || 'sheet write failed')
    detail = failure
    // The id is the queue key, not the lead's name or email.
    console.error(`sheet backfill: ${row.id} not confirmed (${failure})`)

    if (sheetFailureStopsBackfill({ scope: result.scope, detail: result.detail })) {
      await options.store.release(row.id, failure)
      released += 1
      stopped = true
      break
    }
    if (result.scope === 'global') {
      transientTries.set(row.id, (transientTries.get(row.id) ?? 0) + 1)
      await options.store.release(row.id, failure)
      released += 1
      continue
    }
    if (result.detail === 'HTTP 404' && row.attempts < SHEET_ROW_FAIL_LIMIT) {
      held404.push({ id: row.id, error: failure })
      continue
    }
    if (row.attempts < SHEET_ROW_FAIL_LIMIT) {
      await options.store.release(row.id, failure)
      released += 1
      continue
    }
    await options.store.markFailed(row.id, failure)
    failed += 1
  }
  } finally {
    for (const item of held404) {
      await options.store.release(item.id, item.error)
      released += 1
    }
  }

  const remainingCounts = await options.store.counts()
  return { written, failed, released, stopped, detail, remaining: remainingCounts }
}
