import "server-only";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __jf_admin_pool: Pool | undefined;
}

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!global.__jf_admin_pool) {
    global.__jf_admin_pool = new Pool({
      connectionString: url,
      max: 1,
      ssl: url.includes("railway") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return global.__jf_admin_pool;
}

export interface PostLogRow {
  id: number;
  channel: string;
  job_name: string;
  payload_kind: string;
  ref_key: string;
  message_preview: string | null;
  link: string | null;
  external_post_id: string | null;
  status: "posted" | "failed" | "dry_run";
  error_message: string | null;
  dry_run: boolean;
  posted_at: string;
}

export async function recentPosts(limit = 50): Promise<PostLogRow[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const r = await pool.query<PostLogRow>(
      `SELECT id, channel, job_name, payload_kind, ref_key, message_preview,
              link, external_post_id, status, error_message, dry_run, posted_at
         FROM post_log
        ORDER BY posted_at DESC
        LIMIT $1`,
      [limit]
    );
    return r.rows;
  } catch {
    return [];
  }
}

export interface LastPostByListing {
  ref_key: string;
  channel: string;
  posted_at: string;
  status: string;
}

export async function lastPostPerListing(): Promise<LastPostByListing[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const r = await pool.query<LastPostByListing>(
      `SELECT DISTINCT ON (channel, ref_key)
              ref_key, channel, posted_at::text AS posted_at, status
         FROM post_log
        WHERE payload_kind = 'listing' AND status IN ('posted', 'dry_run')
        ORDER BY channel, ref_key, posted_at DESC`
    );
    return r.rows;
  } catch {
    return [];
  }
}

export interface ActivityCounts {
  posted_7d: number;
  failed_7d: number;
  dry_run_7d: number;
}

export async function activityCounts(): Promise<ActivityCounts> {
  const pool = getPool();
  if (!pool) return { posted_7d: 0, failed_7d: 0, dry_run_7d: 0 };
  try {
    const r = await pool.query<ActivityCounts>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'posted'   AND posted_at > NOW() - INTERVAL '7 days')::int  AS posted_7d,
         COUNT(*) FILTER (WHERE status = 'failed'   AND posted_at > NOW() - INTERVAL '7 days')::int  AS failed_7d,
         COUNT(*) FILTER (WHERE status = 'dry_run' AND posted_at > NOW() - INTERVAL '7 days')::int  AS dry_run_7d
       FROM post_log`
    );
    return r.rows[0] ?? { posted_7d: 0, failed_7d: 0, dry_run_7d: 0 };
  } catch {
    return { posted_7d: 0, failed_7d: 0, dry_run_7d: 0 };
  }
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export interface LastSuccessfulPost {
  payload_kind: string;
  ref_key: string;
  posted_at: string;
}

// Most recent *successful* row for a channel/job. Used by the LinkedIn
// weekly rotator so the next slot is "the other type" rather than
// `isoWeekNumber() % 2` (which re-fired the same blog twice in one week).
// Failures, dry_runs, and other jobs (monthly-market-update) are ignored.
/** True when this channel/job already has a successful row for `refKey`. */
export async function hasPostedRef(opts: {
  channel: string;
  jobName: string;
  refKey: string;
}): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  try {
    const r = await pool.query(
      `SELECT 1
         FROM post_log
        WHERE channel = $1
          AND job_name = $2
          AND ref_key = $3
          AND status = 'posted'
        LIMIT 1`,
      [opts.channel, opts.jobName, opts.refKey]
    );
    return (r.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Whether this listing was already announced on Google Business as a
 * Just Listed / Coming Soon post.
 *
 * Counts a successful row for job `gbp-just-listed`, or for the manual
 * on-demand job `gbp-on-demand` with payload_kind `listing`. The weekly
 * rotator (`gbp-post`) is intentionally ignored: a featured-listing week
 * is not a new-listing announcement, and a Just Listed post must not
 * satisfy the weekly freshness check either.
 *
 * Returns null when the database cannot be read. Callers that auto-post
 * must treat null as "do not post" so a missing DATABASE_URL cannot
 * republish the same home on every run.
 */
export async function gbpJustListedAnnounced(refKey: string): Promise<boolean | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const r = await pool.query(
      `SELECT 1
         FROM post_log
        WHERE channel = 'gbp'
          AND ref_key = $1
          AND status = 'posted'
          AND (
            job_name = 'gbp-just-listed'
            OR (job_name = 'gbp-on-demand' AND payload_kind = 'listing')
          )
        LIMIT 1`,
      [refKey]
    );
    return (r.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("[admin-db] gbpJustListedAnnounced failed:", (err as Error).message);
    return null;
  }
}

export async function lastSuccessfulPost(opts: {
  channel: string;
  jobName: string;
  payloadKinds?: readonly string[];
}): Promise<LastSuccessfulPost | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const kinds = opts.payloadKinds;
    const r =
      kinds && kinds.length
        ? await pool.query<LastSuccessfulPost>(
            `SELECT payload_kind, ref_key, posted_at::text AS posted_at
               FROM post_log
              WHERE channel = $1
                AND job_name = $2
                AND status = 'posted'
                AND payload_kind = ANY($3::text[])
              ORDER BY posted_at DESC
              LIMIT 1`,
            [opts.channel, opts.jobName, kinds]
          )
        : await pool.query<LastSuccessfulPost>(
            `SELECT payload_kind, ref_key, posted_at::text AS posted_at
               FROM post_log
              WHERE channel = $1
                AND job_name = $2
                AND status = 'posted'
              ORDER BY posted_at DESC
              LIMIT 1`,
            [opts.channel, opts.jobName]
          );
    return r.rows[0] ?? null;
  } catch {
    return null;
  }
}

export interface LogPostRow {
  channel: string;
  jobName: string;
  payloadKind: string;
  refKey: string;
  messagePreview?: string | null;
  link?: string | null;
  externalPostId?: string | null;
  status: "posted" | "failed" | "dry_run";
  errorMessage?: string | null;
  dryRun?: boolean;
}

// Write one row to post_log. Used by the Vercel-side cron routes
// (linkedin-post, gbp-post) so their activity shows up in /admin and is
// monitored by scripts/morning_healthcheck.py. Schema mirrors the
// Railway-side `services/autoposter/src/db.ts` logPost helper.
//
// Designed to never break the calling cron: missing DATABASE_URL silently
// no-ops, query errors are swallowed and logged. The upstream post has
// already succeeded by the time we get here; a logging failure should not
// cause Vercel to report the cron as failed.
export async function logPost(row: LogPostRow): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO post_log
         (channel, job_name, payload_kind, ref_key, message_preview, link,
          external_post_id, status, error_message, dry_run)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        row.channel,
        row.jobName,
        row.payloadKind,
        row.refKey,
        row.messagePreview ?? null,
        row.link ?? null,
        row.externalPostId ?? null,
        row.status,
        row.errorMessage ?? null,
        Boolean(row.dryRun),
      ]
    );
  } catch (err) {
    // Never poison the cron — the post already happened upstream.
    console.error("[admin-db] logPost failed:", (err as Error).message);
  }
}

export interface ListingStateRecord {
  listingKey: string;
  address: string;
  city: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  status: string;
  openHouse: string | null;
  compassUrl: string;
  imageUrl: string | null;
  seenAt: string;
  generation: number;
}

const LISTING_STATE_SQL = `
CREATE TABLE IF NOT EXISTS listing_state (
  listing_key TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  beds INTEGER,
  baths DOUBLE PRECISION,
  sqft INTEGER,
  status TEXT NOT NULL,
  open_house TEXT,
  compass_url TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  seen_at TIMESTAMPTZ NOT NULL,
  generation INTEGER NOT NULL DEFAULT 1
)`;

function isoTimestamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

/**
 * Previous price and status for each home. Null when the database cannot
 * be read — callers must not post in that case. An empty array means the
 * table exists and has not been seeded yet.
 */
export async function readListingState(): Promise<ListingStateRecord[] | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    await pool.query(LISTING_STATE_SQL);
    const r = await pool.query<{
      listing_key: string;
      address: string;
      city: string;
      price: number;
      beds: number | null;
      baths: number | null;
      sqft: number | null;
      status: string;
      open_house: string | null;
      compass_url: string;
      image_url: string | null;
      seen_at: Date | string;
      generation: number;
    }>(
      `SELECT listing_key, address, city, price, beds, baths, sqft, status,
              open_house, compass_url, image_url, seen_at, generation
         FROM listing_state
        ORDER BY address`
    );
    return r.rows.map((row) => ({
      listingKey: row.listing_key,
      address: row.address,
      city: row.city,
      price: Number(row.price),
      beds: row.beds == null ? null : Number(row.beds),
      baths: row.baths == null ? null : Number(row.baths),
      sqft: row.sqft == null ? null : Number(row.sqft),
      status: row.status,
      openHouse: row.open_house,
      compassUrl: row.compass_url,
      imageUrl: row.image_url,
      seenAt: isoTimestamp(row.seen_at),
      generation: Number(row.generation) || 1,
    }));
  } catch (err) {
    console.error("[admin-db] readListingState failed:", (err as Error).message);
    return null;
  }
}

/** Replace the stored snapshot. Null when the write did not commit. */
export async function replaceListingState(rows: ListingStateRecord[]): Promise<boolean | null> {
  const pool = getPool();
  if (!pool) return null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(LISTING_STATE_SQL);
    await client.query("DELETE FROM listing_state");
    for (const row of rows) {
      await client.query(
        `INSERT INTO listing_state
           (listing_key, address, city, price, beds, baths, sqft, status,
            open_house, compass_url, image_url, seen_at, generation)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          row.listingKey,
          row.address,
          row.city,
          row.price,
          row.beds,
          row.baths,
          row.sqft,
          row.status,
          row.openHouse,
          row.compassUrl,
          row.imageUrl,
          row.seenAt,
          row.generation,
        ]
      );
    }
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("[admin-db] replaceListingState failed:", (err as Error).message);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Channels that already have a successful listing-events row for this
 * ref key. Null when post_log cannot be read.
 */
export async function postedEventChannels(refKey: string): Promise<Set<string> | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const r = await pool.query<{ channel: string }>(
      `SELECT DISTINCT channel
         FROM post_log
        WHERE job_name = 'listing-events'
          AND ref_key = $1
          AND status = 'posted'`,
      [refKey]
    );
    return new Set(r.rows.map((row) => row.channel));
  } catch (err) {
    console.error("[admin-db] postedEventChannels failed:", (err as Error).message);
    return null;
  }
}
