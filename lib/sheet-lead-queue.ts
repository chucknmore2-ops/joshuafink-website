import { Pool } from 'pg'

// Durable copy of a lead whose Google Sheet append did not confirm.
// Same Railway Postgres as listing alerts and /admin (DATABASE_URL). No new
// store: Vercel Hobby has no KV, and this database is already on the project.
// Missing DATABASE_URL is a no-op so a lead still notifies by email and
// Pushover; /api/healthcheck reports the queue as not configured.

declare global {
  // eslint-disable-next-line no-var
  var __jf_sheet_lead_pool: Pool | undefined
  // eslint-disable-next-line no-var
  var __jf_sheet_lead_schema: Promise<void> | undefined
}

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS sheet_lead_queue (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    written_at TIMESTAMPTZ
  )`

const CREATE_INDEX = `
  CREATE INDEX IF NOT EXISTS sheet_lead_queue_claim
    ON sheet_lead_queue (status, attempts, created_at)`

/** Reclaim a claim whose function died after taking the row and before marking it. */
export const SHEET_CLAIM_STALE_MS = 10 * 60 * 1000

export type SheetQueueCounts = {
  queued: number
  failed: number
}

export type ClaimedSheetLead = {
  id: string
  payload: Record<string, string> | null
  attempts: number
}

export type SheetLeadStore = {
  enqueue(row: { id: string; payload: Record<string, string> }): Promise<boolean>
  claim(limit: number): Promise<ClaimedSheetLead[]>
  markWritten(id: string): Promise<void>
  /** Back to pending so a later backfill tries again. Does not clear attempts. */
  release(id: string, error: string): Promise<void>
  markFailed(id: string, error: string): Promise<void>
  counts(): Promise<SheetQueueCounts | null>
}

export type MemorySheetLeadStore = SheetLeadStore & {
  saved(id: string): Record<string, string> | undefined
}

type MemoryRow = {
  id: string
  payload: Record<string, string>
  status: 'pending' | 'writing' | 'written' | 'failed'
  attempts: number
  lastError: string | null
  createdAt: number
  claimedAt: number | null
  seq: number
}

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (!global.__jf_sheet_lead_pool) {
    global.__jf_sheet_lead_pool = new Pool({
      connectionString: url,
      max: 1,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 1_000,
      allowExitOnIdle: true,
      ssl: url.includes('railway') ? { rejectUnauthorized: false } : undefined,
    })
  }
  return global.__jf_sheet_lead_pool
}

function safeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://redacted').slice(0, 500)
}

function clip(error: string): string {
  return error.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://redacted').slice(0, 500)
}

export function payloadFromStored(id: string, value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const out: Record<string, string> = {}
  const entries = Object.entries(value as Record<string, unknown>)
  for (let i = 0; i < entries.length; i++) {
    const key = entries[i][0]
    const raw = entries[i][1]
    if (key === 'secret') continue
    if (typeof raw === 'string') out[key] = raw
    else if (raw != null && typeof raw !== 'object') out[key] = String(raw)
  }
  if (!out.lead_id && !id) return null
  out.lead_id = id || out.lead_id
  return out
}

async function ensureSchema(pool: Pool): Promise<void> {
  if (!global.__jf_sheet_lead_schema) {
    global.__jf_sheet_lead_schema = (async () => {
      await pool.query(CREATE_TABLE)
      await pool.query(CREATE_INDEX)
    })().catch((err) => {
      global.__jf_sheet_lead_schema = undefined
      throw err
    })
  }
  await global.__jf_sheet_lead_schema
}

function pgStore(pool: Pool): SheetLeadStore {
  return {
    async enqueue(row) {
      try {
        await ensureSchema(pool)
        const stored: Record<string, string> = { ...row.payload, lead_id: row.id }
        delete stored.secret
        await pool.query(
          `INSERT INTO sheet_lead_queue (id, payload)
           VALUES ($1, $2::jsonb)
           ON CONFLICT (id) DO NOTHING`,
          [row.id, JSON.stringify(stored)],
        )
        return true
      } catch (err) {
        console.error('sheet lead queue insert failed:', safeError(err))
        return false
      }
    },

    async claim(limit) {
      await ensureSchema(pool)
      const result = await pool.query<{ id: string; payload: unknown; attempts: number }>(
        `WITH picked AS (
           SELECT id
             FROM sheet_lead_queue
            WHERE status = 'pending'
               OR (status = 'writing' AND claimed_at < NOW() - INTERVAL '10 minutes')
            ORDER BY attempts, created_at
            LIMIT $1
            FOR UPDATE SKIP LOCKED
         )
         UPDATE sheet_lead_queue AS q
            SET status = 'writing',
                claimed_at = NOW(),
                attempts = q.attempts + 1,
                updated_at = NOW()
           FROM picked
          WHERE q.id = picked.id
         RETURNING q.id, q.payload, q.attempts`,
        [limit],
      )
      return result.rows.map((row) => ({
        id: row.id,
        payload: payloadFromStored(row.id, row.payload),
        attempts: Number(row.attempts),
      }))
    },

    async markWritten(id) {
      await pool.query(
        `UPDATE sheet_lead_queue
            SET status = 'written',
                written_at = NOW(),
                updated_at = NOW(),
                last_error = NULL,
                claimed_at = NULL
          WHERE id = $1 AND status = 'writing'`,
        [id],
      )
    },

    async release(id, error) {
      await pool.query(
        `UPDATE sheet_lead_queue
            SET status = 'pending',
                last_error = $2,
                updated_at = NOW(),
                claimed_at = NULL
          WHERE id = $1 AND status = 'writing'`,
        [id, clip(error)],
      )
    },

    async markFailed(id, error) {
      await pool.query(
        `UPDATE sheet_lead_queue
            SET status = 'failed',
                last_error = $2,
                updated_at = NOW(),
                claimed_at = NULL
          WHERE id = $1 AND status = 'writing'`,
        [id, clip(error)],
      )
    },

    async counts() {
      return countSheetLeadQueue()
    },
  }
}

const TEST_STORE = Symbol.for('jf.sheetLeadTestStore')

type GlobalWithSheetStore = typeof globalThis & { [TEST_STORE]?: SheetLeadStore | null }

/** Test hook. Pass undefined to use Postgres (or nothing, when DATABASE_URL is unset). */
export function useSheetLeadStoreForTests(store: SheetLeadStore | null | undefined): void {
  const g = globalThis as GlobalWithSheetStore
  if (store === undefined) delete g[TEST_STORE]
  else g[TEST_STORE] = store
}

export function currentSheetLeadStore(): SheetLeadStore | null {
  const g = globalThis as GlobalWithSheetStore
  // Symbol.for is shared even if this module was loaded twice (route vs test).
  if (TEST_STORE in g) return g[TEST_STORE] ?? null
  const pool = getPool()
  if (!pool) return null
  return pgStore(pool)
}

/**
 * Public healthcheck count. Does not create the table: a quiet site with no
 * failed writes reports zeros. null means the database could not be read.
 * queued = not yet confirmed in the sheet. failed = gave up on a row the
 * script rejected (an outage stays queued and is retried).
 */
export async function countSheetLeadQueue(): Promise<SheetQueueCounts | null> {
  const pool = getPool()
  if (!pool) return null
  const client = await pool.connect()
  let committed = false
  try {
    await client.query('BEGIN')
    await client.query("SET LOCAL statement_timeout = '2s'")
    const exists = await client.query<{ rel: string | null }>(
      `SELECT to_regclass('public.sheet_lead_queue') AS rel`,
    )
    if (!exists.rows[0]?.rel) {
      await client.query('COMMIT')
      committed = true
      return { queued: 0, failed: 0 }
    }
    const result = await client.query<{ queued: number; failed: number }>(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('pending', 'writing'))::int AS queued,
         COUNT(*) FILTER (WHERE status = 'failed')::int AS failed
         FROM sheet_lead_queue`,
    )
    await client.query('COMMIT')
    committed = true
    return {
      queued: Number(result.rows[0]?.queued ?? 0),
      failed: Number(result.rows[0]?.failed ?? 0),
    }
  } catch (err) {
    console.error('sheet lead queue count failed:', safeError(err))
    return null
  } finally {
    if (!committed) await client.query('ROLLBACK').catch(() => undefined)
    client.release()
  }
}

export function createMemorySheetLeadStore(now: () => number = Date.now): MemorySheetLeadStore {
  const rows = new Map<string, MemoryRow>()
  let seq = 0

  function eligible(row: MemoryRow): boolean {
    if (row.status === 'pending') return true
    if (row.status !== 'writing') return false
    return (row.claimedAt ?? 0) < now() - SHEET_CLAIM_STALE_MS
  }

  return {
    async enqueue(row) {
      if (!rows.has(row.id)) {
        const payload: Record<string, string> = { ...row.payload, lead_id: row.id }
        delete payload.secret
        rows.set(row.id, {
          id: row.id,
          payload,
          status: 'pending',
          attempts: 0,
          lastError: null,
          createdAt: now(),
          claimedAt: null,
          seq: seq++,
        })
      }
      return true
    },

    async claim(limit) {
      const picked: MemoryRow[] = []
      rows.forEach((row) => {
        if (eligible(row)) picked.push(row)
      })
      picked.sort((a, b) => a.attempts - b.attempts || a.createdAt - b.createdAt || a.seq - b.seq)
      return picked.slice(0, limit).map((row) => {
        row.status = 'writing'
        row.attempts += 1
        row.claimedAt = now()
        return {
          id: row.id,
          payload: { ...row.payload },
          attempts: row.attempts,
        }
      })
    },

    async markWritten(id) {
      const row = rows.get(id)
      if (row && row.status === 'writing') {
        row.status = 'written'
        row.claimedAt = null
        row.lastError = null
      }
    },

    async release(id, error) {
      const row = rows.get(id)
      if (row && row.status === 'writing') {
        row.status = 'pending'
        row.lastError = clip(error)
        row.claimedAt = null
      }
    },

    async markFailed(id, error) {
      const row = rows.get(id)
      if (row && row.status === 'writing') {
        row.status = 'failed'
        row.lastError = clip(error)
        row.claimedAt = null
      }
    },

    async counts() {
      let queued = 0
      let failed = 0
      rows.forEach((row) => {
        if (row.status === 'pending' || row.status === 'writing') queued += 1
        else if (row.status === 'failed') failed += 1
      })
      return { queued, failed }
    },

    saved(id) {
      const row = rows.get(id)
      return row ? { ...row.payload } : undefined
    },
  }
}
