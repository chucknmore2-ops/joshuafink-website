// post_log writes for the listing-video job. Same table the admin page reads.
// A missing database refuses to publish; it does not throw out of the seed
// path, which the caller treats as a warning when nothing is eligible.

import { Pool } from 'pg'
import { LISTING_VIDEO_JOB, LISTING_VIDEO_KIND, LISTING_VIDEO_SEED_JOB } from './listing-video'

export function createListingVideoPool(databaseUrl: string): Pool {
  return new Pool({
    connectionString: databaseUrl,
    max: 1,
    ssl: databaseUrl.includes('railway') ? { rejectUnauthorized: false } : undefined,
  })
}

export interface ListingVideoLogRow {
  channel: string
  jobName: string
  refKey: string
  messagePreview?: string | null
  link?: string | null
  externalPostId?: string | null
  status: 'posted' | 'failed' | 'dry_run'
  errorMessage?: string | null
}

export async function postedListingVideoChannels(
  pool: Pool,
): Promise<Map<string, Set<string>>> {
  const result = await pool.query<{ ref_key: string; channel: string }>(
    `SELECT ref_key, channel
       FROM post_log
      WHERE job_name = $1
        AND payload_kind = $2
        AND status = 'posted'`,
    [LISTING_VIDEO_JOB, LISTING_VIDEO_KIND],
  )
  const map = new Map<string, Set<string>>()
  for (const row of result.rows) {
    const set = map.get(row.ref_key) ?? new Set<string>()
    set.add(row.channel)
    map.set(row.ref_key, set)
  }
  return map
}

export async function logListingVideo(pool: Pool, row: ListingVideoLogRow): Promise<void> {
  await pool.query(
    `INSERT INTO post_log
       (channel, job_name, payload_kind, ref_key, message_preview, link,
        external_post_id, status, error_message, dry_run)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      row.channel,
      row.jobName,
      LISTING_VIDEO_KIND,
      row.refKey,
      row.messagePreview ?? null,
      row.link ?? null,
      row.externalPostId ?? null,
      row.status,
      row.errorMessage ? row.errorMessage.slice(0, 500) : null,
      row.status === 'dry_run',
    ],
  )
}

/** One launch-seed row per channel. Existing rows are left alone. */
export async function seedListingVideoRow(
  pool: Pool,
  channel: string,
  refKey: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO post_log
       (channel, job_name, payload_kind, ref_key, message_preview, link,
        external_post_id, status, error_message, dry_run)
     SELECT $1, $2, $3, $4, $5, NULL, NULL, 'posted', NULL, false
      WHERE NOT EXISTS (
        SELECT 1 FROM post_log
         WHERE channel = $1
           AND job_name = $2
           AND ref_key = $4
           AND status = 'posted'
      )`,
    [
      channel,
      LISTING_VIDEO_SEED_JOB,
      LISTING_VIDEO_KIND,
      refKey,
      'Launch seed 2026-10-06. Not published.',
    ],
  )
}
