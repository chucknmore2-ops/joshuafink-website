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
