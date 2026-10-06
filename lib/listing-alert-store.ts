import { randomBytes } from 'crypto'
import { Pool } from 'pg'
import {
  isPlausibleEmail,
  parseOptionalPrice,
  type AlertFilter,
  type SeenListing,
} from './listing-alerts'

// Subscriber list and the last Compass snapshot. Created on first use, same
// pattern as lib/geo-db.ts. Missing DATABASE_URL is a no-op so a lead still
// delivers when the list cannot be saved.

declare global {
  // eslint-disable-next-line no-var
  var __jf_alert_pool: Pool | undefined
  // eslint-disable-next-line no-var
  var __jf_alert_schema: Promise<void> | undefined
}

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (!global.__jf_alert_pool) {
    global.__jf_alert_pool = new Pool({
      connectionString: url,
      max: 1,
      ssl: url.includes('railway') ? { rejectUnauthorized: false } : undefined,
    })
  }
  return global.__jf_alert_pool
}

const CREATE_SUBSCRIBERS = `
  CREATE TABLE IF NOT EXISTS listing_alert_subscribers (
    email TEXT PRIMARY KEY,
    city TEXT,
    price_min INTEGER,
    price_max INTEGER,
    unsubscribe_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
  )`

const CREATE_TOKEN_INDEX = `
  CREATE UNIQUE INDEX IF NOT EXISTS listing_alert_subscribers_token
    ON listing_alert_subscribers (unsubscribe_token)`

const CREATE_STATE = `
  CREATE TABLE IF NOT EXISTS listing_alert_state (
    compass_url TEXT PRIMARY KEY,
    price INTEGER NOT NULL,
    address TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`

function newToken(): string {
  return randomBytes(24).toString('base64url')
}

async function ensureSchema(pool: Pool): Promise<void> {
  if (!global.__jf_alert_schema) {
    global.__jf_alert_schema = (async () => {
      await pool.query(CREATE_SUBSCRIBERS)
      await pool.query(CREATE_TOKEN_INDEX)
      await pool.query(CREATE_STATE)
    })().catch((err) => {
      global.__jf_alert_schema = undefined
      throw err
    })
  }
  await global.__jf_alert_schema
}

export async function subscribeFromLead(
  lead: Record<string, string>,
): Promise<{ ok: boolean; detail?: string }> {
  const email = (lead.email || '').trim().toLowerCase()
  if (!isPlausibleEmail(email)) return { ok: false, detail: 'missing email' }
  const pool = getPool()
  if (!pool) return { ok: false, detail: 'DATABASE_URL is not set' }
  const city = (lead.suburb || lead.alert_city || '').trim() || null
  const priceMin = parseOptionalPrice(lead.price_min)
  const priceMax = parseOptionalPrice(lead.price_max)
  try {
    await ensureSchema(pool)
    await pool.query(
      `INSERT INTO listing_alert_subscribers
         (email, city, price_min, price_max, unsubscribe_token, status, source, unsubscribed_at)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, NULL)
       ON CONFLICT (email) DO UPDATE SET
         city = EXCLUDED.city,
         price_min = EXCLUDED.price_min,
         price_max = EXCLUDED.price_max,
         status = 'active',
         source = EXCLUDED.source,
         unsubscribed_at = NULL`,
      [email, city, priceMin, priceMax, newToken(), (lead.source || 'listing-alerts').slice(0, 80)],
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

export async function listActiveSubscribers(): Promise<AlertFilter[] | null> {
  const pool = getPool()
  if (!pool) return null
  try {
    await ensureSchema(pool)
    const result = await pool.query<{
      email: string
      city: string | null
      price_min: number | null
      price_max: number | null
      unsubscribe_token: string
    }>(
      `SELECT email, city, price_min, price_max, unsubscribe_token
         FROM listing_alert_subscribers
        WHERE status = 'active' AND unsubscribed_at IS NULL`,
    )
    return result.rows.map((row) => ({
      email: row.email,
      city: row.city,
      priceMin: row.price_min,
      priceMax: row.price_max,
      token: row.unsubscribe_token,
    }))
  } catch (err) {
    console.error('[listing-alerts] list subscribers failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function loadAlertState(): Promise<SeenListing[] | null> {
  const pool = getPool()
  if (!pool) return null
  try {
    await ensureSchema(pool)
    const result = await pool.query<{ compass_url: string; price: number }>(
      `SELECT compass_url, price FROM listing_alert_state`,
    )
    return result.rows.map((row) => ({ compassUrl: row.compass_url, price: row.price }))
  } catch (err) {
    console.error('[listing-alerts] load state failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function saveAlertState(
  rows: readonly { compassUrl: string; price: number; address?: string }[],
): Promise<boolean> {
  const pool = getPool()
  if (!pool) return false
  try {
    await ensureSchema(pool)
  } catch (err) {
    console.error('[listing-alerts] save state failed:', err instanceof Error ? err.message : err)
    return false
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM listing_alert_state')
    for (const row of rows) {
      if (!row.compassUrl || !(row.price > 0)) continue
      await client.query(
        `INSERT INTO listing_alert_state (compass_url, price, address)
         VALUES ($1, $2, $3)`,
        [row.compassUrl, row.price, row.address ?? null],
      )
    }
    await client.query('COMMIT')
    return true
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined)
    console.error('[listing-alerts] save state failed:', err instanceof Error ? err.message : err)
    return false
  } finally {
    client.release()
  }
}

/** null means the database could not be read. Callers must not send in that case. */
export async function postedAlertRefs(refKeys: readonly string[]): Promise<Set<string> | null> {
  const pool = getPool()
  if (!pool) return null
  if (refKeys.length === 0) return new Set()
  try {
    const result = await pool.query<{ ref_key: string }>(
      `SELECT ref_key
         FROM post_log
        WHERE channel = 'email'
          AND job_name = 'listing-alerts'
          AND status = 'posted'
          AND ref_key = ANY($1::text[])`,
      [refKeys],
    )
    return new Set(result.rows.map((row) => row.ref_key))
  } catch (err) {
    console.error('[listing-alerts] post_log read failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function logAlertSend(row: {
  refKey: string
  payloadKind: string
  status: 'posted' | 'failed' | 'dry_run'
  messagePreview?: string
  link?: string
  errorMessage?: string
  dryRun?: boolean
}): Promise<boolean> {
  const pool = getPool()
  if (!pool) return false
  try {
    await pool.query(
      `INSERT INTO post_log
         (channel, job_name, payload_kind, ref_key, message_preview, link,
          external_post_id, status, error_message, dry_run)
       VALUES ('email', 'listing-alerts', $1, $2, $3, $4, NULL, $5, $6, $7)`,
      [
        row.payloadKind,
        row.refKey,
        row.messagePreview ?? null,
        row.link ?? null,
        row.status,
        row.errorMessage ?? null,
        Boolean(row.dryRun),
      ],
    )
    return true
  } catch (err) {
    console.error('[listing-alerts] post_log write failed:', err instanceof Error ? err.message : err)
    return false
  }
}

async function setStatusByToken(
  token: string,
  status: 'active' | 'unsubscribed',
): Promise<'ok' | 'missing' | 'unavailable'> {
  const trimmed = token.trim()
  if (!trimmed) return 'missing'
  const pool = getPool()
  if (!pool) return 'unavailable'
  try {
    await ensureSchema(pool)
    const result = await pool.query(
      status === 'active'
        ? `UPDATE listing_alert_subscribers
              SET status = 'active', unsubscribed_at = NULL
            WHERE unsubscribe_token = $1`
        : `UPDATE listing_alert_subscribers
              SET status = 'unsubscribed', unsubscribed_at = NOW()
            WHERE unsubscribe_token = $1`,
      [trimmed],
    )
    return (result.rowCount ?? 0) > 0 ? 'ok' : 'missing'
  } catch (err) {
    console.error('[listing-alerts] token update failed:', err instanceof Error ? err.message : err)
    return 'unavailable'
  }
}

export function confirmAlertToken(token: string): Promise<'ok' | 'missing' | 'unavailable'> {
  return setStatusByToken(token, 'active')
}

export function unsubscribeAlertToken(token: string): Promise<'ok' | 'missing' | 'unavailable'> {
  return setStatusByToken(token, 'unsubscribed')
}

/** Pending invite row. Skips people who are already active or unsubscribed. */
export async function ensureInviteToken(
  email: string,
): Promise<{ token: string } | { skip: string } | null> {
  const normalized = email.trim().toLowerCase()
  if (!isPlausibleEmail(normalized)) return { skip: 'invalid email' }
  const pool = getPool()
  if (!pool) return null
  try {
    await ensureSchema(pool)
    const existing = await pool.query<{ unsubscribe_token: string; status: string }>(
      `SELECT unsubscribe_token, status FROM listing_alert_subscribers WHERE email = $1`,
      [normalized],
    )
    const row = existing.rows[0]
    if (row?.status === 'active') return { skip: 'already subscribed' }
    if (row?.status === 'unsubscribed') return { skip: 'unsubscribed' }
    if (row?.unsubscribe_token) return { token: row.unsubscribe_token }
    const token = newToken()
    await pool.query(
      `INSERT INTO listing_alert_subscribers
         (email, unsubscribe_token, status, source)
       VALUES ($1, $2, 'pending', 'invite')`,
      [normalized, token],
    )
    return { token }
  } catch (err) {
    console.error('[listing-alerts] invite token failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function activeSubscriberEmails(): Promise<Set<string> | null> {
  const subscribers = await listActiveSubscribers()
  if (!subscribers) return null
  return new Set(subscribers.map((sub) => sub.email.toLowerCase()))
}
