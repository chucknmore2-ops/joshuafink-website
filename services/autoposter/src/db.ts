import pg from "pg";
import { env } from "./env.ts";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes("railway.app")
    ? { rejectUnauthorized: false }
    : undefined,
});

export async function recentlyPosted(opts: {
  channel: string;
  payloadKind: string;
  refKey: string;
  withinDays: number;
}): Promise<boolean> {
  const r = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM post_log
       WHERE channel = $1
         AND payload_kind = $2
         AND ref_key = $3
         AND status = 'posted'
         AND posted_at > NOW() - ($4 || ' days')::interval
     ) AS exists`,
    [opts.channel, opts.payloadKind, opts.refKey, opts.withinDays]
  );
  return r.rows[0]?.exists ?? false;
}

export async function logPost(row: {
  channel: string;
  jobName: string;
  payloadKind: string;
  refKey: string;
  messagePreview?: string;
  link?: string | null;
  externalPostId?: string | null;
  status: "posted" | "failed" | "dry_run";
  errorMessage?: string | null;
  dryRun: boolean;
}) {
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
      row.dryRun,
    ]
  );
}
