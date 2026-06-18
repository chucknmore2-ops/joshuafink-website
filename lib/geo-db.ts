import 'server-only';
import { Pool } from 'pg';
import type { GeoResultRow } from './geo-score';

// Postgres layer for the GEO visibility tracker. Mirrors the fail-soft pooling
// pattern in lib/admin-db.ts: no DATABASE_URL → silent no-op; query errors are
// swallowed and logged so a logging failure never breaks the cron. The table is
// created idempotently on first write (the Vercel side has no migration runner).

declare global {
  // eslint-disable-next-line no-var
  var __jf_geo_pool: Pool | undefined;
}

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!global.__jf_geo_pool) {
    global.__jf_geo_pool = new Pool({
      connectionString: url,
      max: 1,
      ssl: url.includes('railway') ? { rejectUnauthorized: false } : undefined,
    });
  }
  return global.__jf_geo_pool;
}

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS geo_visibility (
    id              BIGSERIAL PRIMARY KEY,
    run_id          TEXT NOT NULL,
    engine          TEXT NOT NULL,
    model           TEXT,
    query_id        TEXT NOT NULL,
    query           TEXT NOT NULL,
    cited           BOOLEAN NOT NULL,
    cited_domain    BOOLEAN NOT NULL,
    mentioned_name  BOOLEAN NOT NULL,
    domain_rank     INTEGER,
    answer_preview  TEXT,
    source_urls     TEXT,
    ok              BOOLEAN NOT NULL,
    error_message   TEXT,
    checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

const CREATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_geo_visibility_recent
    ON geo_visibility (checked_at DESC)`;

/** Persist one run's measurements. Returns rows written (0 if DB unconfigured). */
export async function recordGeoRun(rows: GeoResultRow[]): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  try {
    await pool.query(CREATE_TABLE);
    await pool.query(CREATE_INDEX);
    let written = 0;
    for (const r of rows) {
      await pool.query(
        `INSERT INTO geo_visibility
           (run_id, engine, model, query_id, query, cited, cited_domain,
            mentioned_name, domain_rank, answer_preview, source_urls, ok, error_message)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          r.runId,
          r.engine,
          r.model,
          r.queryId,
          r.query,
          r.detection.cited,
          r.detection.citedDomain,
          r.detection.mentionedName,
          r.detection.domainRank,
          r.answerPreview.slice(0, 500),
          JSON.stringify(r.sourceUrls.slice(0, 25)),
          r.ok,
          r.errorMessage,
        ],
      );
      written += 1;
    }
    return written;
  } catch (err) {
    console.error('[geo-db] recordGeoRun failed:', (err as Error).message);
    return 0;
  }
}

export interface GeoTrendPoint {
  run_id: string;
  checked_at: string;
  total: number;
  cited: number;
  score: number;
}

/** GEO score per run over the last `limit` runs — for trending the metric. */
export async function geoScoreTrend(limit = 30): Promise<GeoTrendPoint[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const r = await pool.query<GeoTrendPoint>(
      `SELECT run_id,
              MAX(checked_at)::text                                   AS checked_at,
              COUNT(*) FILTER (WHERE ok)::int                          AS total,
              COUNT(*) FILTER (WHERE ok AND cited)::int                AS cited,
              ROUND(100.0 * COUNT(*) FILTER (WHERE ok AND cited)
                    / NULLIF(COUNT(*) FILTER (WHERE ok), 0))::int      AS score
         FROM geo_visibility
        GROUP BY run_id
        ORDER BY MAX(checked_at) DESC
        LIMIT $1`,
      [limit],
    );
    return r.rows;
  } catch (err) {
    console.error('[geo-db] geoScoreTrend failed:', (err as Error).message);
    return [];
  }
}
