# Railway autoposter runbook

Version-controlled checklist for every Railway service that posts to a
social channel for Joshua Fink Group. If Railway is ever wiped, audited,
or rebuilt from scratch, this doc is the authoritative configuration so
the live setup can be reproduced exactly.

The [morning healthcheck](./morning-healthcheck.md) monitors freshness
on the Postgres `post_log` table; this doc tells you what writes there.

---

## The five Railway services

All five deploy from the **`feature/railway-autoposter-phase-1`** branch
of this repo, **Root Directory: `services/autoposter`**. They share the
same code; the per-service `JOB_NAME` env var picks which job runs.

| Service name | `JOB_NAME` value | Cron Schedule (UTC) | Equivalent CT | Status as of 2026-05-15 |
|---|---|---|---|---|
| `autoposter-listing` | `listing-spotlight` | `0 14 * * 1,3,5` | Mon/Wed/Fri 9:00am | Created, deployed, **posting**. Last successful post 2026-06-10; went STALE after (no `posted` row for Fri 06-12 / Mon 06-15). Open Cron Runs → Run Now and read the log to see the cause (token `(#200)`/`(#190)`, `DRY RUN`, or nothing-eligible). |
| `autoposter-stats` | `content-market-stats` | `0 15 * * 2` | Tue 10:00am | **Not yet created** |
| `autoposter-testimonial` | `content-testimonial` | `0 15 * * 3` | Wed 10:00am | **Not yet created** |
| `autoposter-tips` | `content-tips` | `0 15 * * 4` | Thu 10:00am | **Not yet created** |
| `autoposter-engagement` | `content-engagement` | `0 15 * * 5` | Fri 10:00am | **Not yet created** |

> If you redeploy from main without setting `JOB_NAME`, the service runs
> `npm start -- help` (per the fallback in `services/autoposter/railway.json`:
> `npm start -- ${JOB_NAME:-help}`) and prints the CLI help — no harm,
> but no post either.

## Required environment variables

These live in the **Variables tab** of each Railway service. Some are
shared across all five (use Project Shared Variables when possible);
others are per-service.

### Per-service (must be set on each clone)

| Variable | Value | Notes |
|---|---|---|
| `JOB_NAME` | one of the values in the table above | Picks which job the service runs |

### Project-shared (set once, reference from each service)

| Variable | Value | Where it comes from |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` reference | Auto-set by Railway when Postgres is provisioned in the same project |
| `FB_PAGE_ID` | the 15-digit numeric ID of Joshua Fink Group FB Page | `~/.facebook_tokens` on Chuck's Mac, or Facebook → Page → About → Page Transparency |
| `FB_PAGE_TOKEN` | long-lived **Page** Access Token (NOT a User token) | Derive from a User token via Graph API Explorer → GET `/me/accounts` → copy the `access_token` field from the Joshua Fink Group entry. Must include scopes `pages_manage_posts` + `pages_read_engagement`. |
| `AUTOPOSTER_DRY_RUN` | `0` for production posting, `1` to preview without posting | A `dry_run=1` value writes a `dry_run` row to `post_log` and prints the would-be caption. **The morning healthcheck counts only `status='posted'` rows as fresh** (`scripts/morning_healthcheck.py` → `_fetch_last_post_per_channel_job`), so a `dry_run` row does **not** clear a STALE alert — only a real post does. If a service is left on `DRY_RUN=1`, the alert will keep firing. |
| `LISTING_COOLDOWN_DAYS` | `7` | The autoposter SQL-queries `post_log` to skip listings posted within this window |

## How `post_log` writes prove the pipeline is alive

Every job that *attempts* a post — success or failure — writes one row to
`post_log` (see `services/autoposter/src/db.ts` `logPost()`). One exception:
`listing-spotlight` writes **no row** when every active listing is already on
cooldown (`LISTING_COOLDOWN_DAYS`, default 7) — it logs `Nothing to post —
exiting clean.` and exits. That path can surface as STALE with no `failed`
row to explain it, so when triaging a STALE with no error in the log, check
whether the listing inventory is small enough that everything is on cooldown.
Schema:

```sql
CREATE TABLE post_log (
  id              BIGSERIAL PRIMARY KEY,
  channel         TEXT NOT NULL,           -- 'facebook' for these 5
  job_name        TEXT NOT NULL,           -- matches JOB_NAME (e.g. 'listing-spotlight')
  payload_kind    TEXT NOT NULL,           -- 'listing' for spotlight; 'market-stats', 'testimonial', 'tip', 'engagement' otherwise
  ref_key         TEXT NOT NULL,           -- dedup key (e.g. address slug, tip ID)
  message_preview TEXT,                    -- first ~200 chars of the post body
  link            TEXT,                    -- outgoing URL (Compass listing, blog post)
  external_post_id TEXT,                   -- Facebook post ID returned from Graph API
  status          TEXT NOT NULL,           -- 'posted' | 'failed' | 'dry_run'
  error_message   TEXT,                    -- when status='failed'
  dry_run         BOOLEAN NOT NULL DEFAULT FALSE,
  posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The Vercel-side LinkedIn + GBP routes write to the same table since PR #67
(channels `linkedin` and `gbp`). The autoposter dashboard at /admin reads
all four channels uniformly.

## Cron Schedule field — where to set it

Railway → service → **Settings tab** → scroll past "Custom Start Command"
(greyed out — locked by `railway.json`) to **Cron Schedule** field.
Paste the UTC cron string from the table above. Click **Deploy** at top
to apply. Status badge on the service card will show
"Next in N days" — that's how you know it saved.

## Manual one-off run — for verification

Each Railway cron service has a **Cron Runs tab** with a **"Run Now"**
button. Use it after any config change to verify the service fires
correctly without waiting for the next scheduled time.

Successful run log signature (look for these lines, in order):

```
Starting job: <JOB_NAME>
Schema applied (idempotent).
Loaded N listings from disk           (listing-spotlight only)
Selected: <something>
--- PREVIEW ---
<post body>
---------------
Posted to FB. external_post_id: 111457913523107_…
Job complete: <JOB_NAME>
```

If the line right before `Job complete:` says `ERROR Post failed:`
something, the service started but the upstream call broke. Most common
failures:

| Error string | Cause | Fix |
|---|---|---|
| `(#190) Malformed access token` | Token has trailing whitespace, wrong type, or is for the wrong app | Re-derive the Page token via Graph Explorer `/me/accounts` |
| `(#200) ...requires both pages_read_engagement and pages_manage_posts...` | Token is missing required scopes — usually you copied a Page Token derived without the right grant flow | Use the `/me/accounts` workaround in `docs/morning-healthcheck.md` triage section |
| `(#10) ...permission denied` | The Meta App is not approved for posting on behalf of this Page | Joshua needs to grant the app admin access to the FB Page via Meta Business Suite |
| `DRY RUN — no API call made.` | `AUTOPOSTER_DRY_RUN=1` is still set | Variables tab → set `AUTOPOSTER_DRY_RUN=0` → Save → redeploy |

## Adding the 4 missing services

When the FB token issue is resolved on `autoposter-listing` and we're
ready to fan out to all 5 channels:

1. Railway → project canvas → right-click `autoposter-listing` service → **Duplicate** (or "Clone")
2. Name the clone (e.g. `autoposter-stats`)
3. **Variables tab** on the clone → change `JOB_NAME` to the new job name (table above)
4. **Settings tab** → set the new Cron Schedule (table above)
5. Click **Deploy** at top to apply
6. **Cron Runs tab** → Run Now → verify it logs to `post_log` correctly
7. Repeat for each of the 4 missing jobs

The shared variables (`DATABASE_URL`, `FB_PAGE_ID`, `FB_PAGE_TOKEN`,
`AUTOPOSTER_DRY_RUN`, `LISTING_COOLDOWN_DAYS`) auto-inherit if they
reference Project Shared Variables. If they were set directly on the
original service, you'll need to copy them onto each clone.

After all five exist and have written at least one row each, the morning
healthcheck flips the four `[GAP]` rows
(`autoposter-stats / testimonial / tips / engagement`) to `[OK]`
freshness checks. No monitor-side code change needed.

## Why the cron isn't pinned in `railway.json`

You might expect the cron schedule to live in `services/autoposter/railway.json`
alongside the start command — but Railway's `cronSchedule` field is
per-service, and all five services share the same `railway.json`. Pinning
a single cron in code would force all five services to fire at the same
time (or none would, depending on Railway's precedence behavior).

The proper version-controlled fix is one config file per service —
`railway-listing.json`, `railway-stats.json`, etc. — and a
`RAILWAY_CONFIG_PATH` env var per Railway service pointing at the right
file. That refactor is a follow-up PR worth doing once all five services
exist and are stable. Until then, this runbook + the dashboard fields
are the source of truth.

## Related docs

- [Morning healthcheck](./morning-healthcheck.md) — what we monitor and how to read alerts
- [Handoff content pipeline](./HANDOFF-content-pipeline.md) — broader pipeline strategy
- [IG setup playbook](./IG-SETUP-PLAYBOOK.md) — the IG channel (separate from these 5 FB jobs)
- `services/autoposter/README.md` (on `feature/railway-autoposter-phase-1` branch) — service code internals
