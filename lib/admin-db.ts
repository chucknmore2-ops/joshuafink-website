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
