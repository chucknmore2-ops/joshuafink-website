-- joshuafink.com Railway Postgres schema (DOCUMENTATION)
--
-- The autoposter applies the schema at runtime from an INLINED copy in
-- services/autoposter/src/schema.ts (Railway containers cannot read files
-- outside the service's Root Directory). If you change the schema here,
-- mirror the change in schema.ts.
--
-- Apply manually if needed: psql $DATABASE_URL -f db/schema.sql  (idempotent)

CREATE TABLE IF NOT EXISTS post_log (
  id              BIGSERIAL PRIMARY KEY,
  channel         TEXT NOT NULL,
  job_name        TEXT NOT NULL,
  payload_kind    TEXT NOT NULL,
  ref_key         TEXT NOT NULL,
  message_preview TEXT,
  link            TEXT,
  external_post_id TEXT,
  status          TEXT NOT NULL,
  error_message   TEXT,
  dry_run         BOOLEAN NOT NULL DEFAULT FALSE,
  posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_log_dedup
  ON post_log (channel, payload_kind, ref_key, posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_log_recent
  ON post_log (posted_at DESC);

-- GEO (Generative Engine Optimization) visibility tracker. Written by the
-- Vercel cron /api/cron/geo-audit, which creates this table idempotently on
-- first run (lib/geo-db.ts). One row per (run, engine, query): did Joshua
-- surface when an AI answer engine was asked a target Middle TN question.
CREATE TABLE IF NOT EXISTS geo_visibility (
  id              BIGSERIAL PRIMARY KEY,
  run_id          TEXT NOT NULL,           -- ISO timestamp of the run
  engine          TEXT NOT NULL,           -- 'perplexity' | 'openai' | 'claude'
  model           TEXT,
  query_id        TEXT NOT NULL,           -- stable id from lib/geo-queries.ts
  query           TEXT NOT NULL,
  cited           BOOLEAN NOT NULL,        -- brand surfaced (domain cited OR name mentioned)
  cited_domain    BOOLEAN NOT NULL,        -- joshuafink.com in a source URL / prose
  mentioned_name  BOOLEAN NOT NULL,        -- "Joshua Fink" in the answer prose
  domain_rank     INTEGER,                 -- 1-based position of first joshuafink.com source
  answer_preview  TEXT,
  source_urls     TEXT,                    -- JSON array of citation/source URLs
  ok              BOOLEAN NOT NULL,        -- false = engine call failed (excluded from score)
  error_message   TEXT,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_visibility_recent
  ON geo_visibility (checked_at DESC);
