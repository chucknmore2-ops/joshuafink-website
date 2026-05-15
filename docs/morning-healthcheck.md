# Morning healthcheck — setup notes

External freshness monitor for joshuafink.com automation pipelines. Runs
from GitHub Actions on weekday mornings (7am CDT / 8am CST). Pages Chuck
via Gmail SMTP when any pipeline is stale or a check errors.

- Script: [`scripts/morning_healthcheck.py`](../scripts/morning_healthcheck.py)
- Tests: [`scripts/test_morning_healthcheck.py`](../scripts/test_morning_healthcheck.py)
- Workflow: [`.github/workflows/morning_healthcheck.yml`](../.github/workflows/morning_healthcheck.yml)

## What it checks

| Source | Pipeline | Freshness signal | Stale after |
|---|---|---|---|
| Railway | autoposter-listing (FB) | `post_log` MAX(posted_at) where channel=facebook, job_name=listing-spotlight | 4 days |
| Railway | autoposter-stats (FB) | channel=facebook, job_name=content-market-stats | 9 days |
| Railway | autoposter-testimonial (FB) | channel=facebook, job_name=content-testimonial | 9 days |
| Railway | autoposter-tips (FB) | channel=facebook, job_name=content-tips | 9 days |
| Railway | autoposter-engagement (FB) | channel=facebook, job_name=content-engagement | 9 days |
| Vercel | linkedin-post | channel=linkedin (if Railway side ever logs it) | 9 days |
| Vercel | gbp-post | channel=gbp (if Railway side ever logs it) | 9 days |
| GitHub Actions | sync-listings | `git log -1 lib/listings.ts` | 17 days |
| Vercel | site uptime | `GET /api/healthcheck` returns 200 with status:ok | n/a |

Result states:
- `PASS` — fresh signal within threshold
- `STALE` — signal exists but older than threshold → **alert + exit 1**
- `ERROR` — check itself failed (timeout, query error) → **alert + exit 1**
- `GAP` — never-logged channel or skipped check → mentioned in email, **not** a failure
- `MISCONFIG` — required env missing → **alert + exit 2**

## What it does NOT check (documented gaps)

These are listed in every alert email so a green run is never mistaken for full coverage:

- **`/api/cron/indexnow`** — submits URLs to Bing/Yandex, no DB write
- **`/api/cron/agent-briefing`** — sends email + ClickUp task, no DB write
- **`/api/cron/instagram-post`** — currently blocked at Meta Business Suite linkage (see [`IG-SETUP-PLAYBOOK.md`](./IG-SETUP-PLAYBOOK.md))
- **Local content engine** (`content_engine/`, Joshua's Mac with Ollama) — out of GitHub Actions reach
- **US federal holidays** — a holiday on a scheduled day will surface as STALE until the next firing
- **DST drift** — v1 anchors thresholds in days, not local clock time; +/-1h drift acceptable

## Required GitHub secrets

Settings → Secrets and variables → Actions → **Secrets** tab → New repository secret:

| Secret | What it is | Where to get it |
|---|---|---|
| `DATABASE_URL` | Railway Postgres connection string | Reuse the same DSN already configured in Vercel for `/admin`. Copy from Railway → Postgres → Variables → `DATABASE_PUBLIC_URL`. |
| `GMAIL_USER` | Gmail address that sends the alert | Any Gmail account with 2FA enabled |
| `GMAIL_APP_PASSWORD` | 16-character App Password (NOT the real Gmail password) | See "Generate a Gmail App Password" below |
| `ALERT_TO_EMAIL` | Inbox to receive alerts | Typically `chucknmore2@gmail.com` |

Optional repository **variable** (Settings → Secrets and variables → Actions → **Variables** tab):

| Variable | What it is | Default |
|---|---|---|
| `HEALTHCHECK_URL` | Override the pinged URL | `https://joshuafink.com/api/healthcheck` |

### Hardening follow-up (not required for v1)

Provision a **read-only** Postgres role on Railway and put its DSN in
`DATABASE_URL` instead of the full read/write DSN. Quick recipe:

```sql
CREATE ROLE healthcheck_readonly WITH LOGIN PASSWORD '<random>';
GRANT CONNECT ON DATABASE railway TO healthcheck_readonly;
GRANT USAGE ON SCHEMA public TO healthcheck_readonly;
GRANT SELECT ON post_log TO healthcheck_readonly;
```

Then build the DSN from Railway → Postgres → Connect → swap the username
+ password for the new role.

## Generate a Gmail App Password

App Passwords are 16-character codes that bypass 2FA for one specific
application. They land in the same Gmail Sent folder as a normal send.

1. Open [`https://myaccount.google.com/`](https://myaccount.google.com/)
2. **Security** → confirm **2-Step Verification** is ON. (App Passwords
   require 2FA; if it's off, turn it on first.)
3. Scroll to **How you sign in to Google** → click **App passwords**
   (direct: [`https://myaccount.google.com/apppasswords`](https://myaccount.google.com/apppasswords))
4. **App name**: `joshuafink-morning-healthcheck`
5. Click **Create**
6. Copy the 16-char code shown (no spaces needed — Google's UI inserts
   them for readability, the actual value is 16 alphanumeric characters).
7. Paste into the `GMAIL_APP_PASSWORD` secret. The same Gmail address
   goes into `GMAIL_USER`.

If `apppasswords` returns "the setting you're looking for is not
available," the account is either Workspace-restricted or hasn't fully
enabled 2FA. Workaround: use a personal Gmail account dedicated to
sending alerts.

## Manual run to verify

Once all 4 secrets are set:

1. **Actions** tab → **Morning healthcheck** workflow → **Run workflow**
2. Branch: `main`
3. **Send the report even when all checks pass**: pick `true` for the
   first manual run so you receive the email regardless of result.
4. **Run workflow**.

Within ~90 seconds you should see:

- A green checkmark on the run (exit 0 path), OR
- A red X with a "FAIL" alert email in `ALERT_TO_EMAIL`, OR
- An email with subject `[joshuafink healthcheck] OK — all pipelines fresh`
  containing the full report including the documented-gaps section.

The full report is also written to the workflow log under "Run morning
healthcheck" — useful even when no email is sent.

After the first manual verification, switch back to leaving the input
blank for normal cron runs (default `always_email: false` → quiet on
green, alert on fail).

## Cron schedule

Currently: `0 12 * * 1-5` (Mon–Fri 12:00 UTC = 7am CDT / 6am CST).

DST drift is intentional — we anchor in UTC so the wall-clock time
shifts by 1h twice a year. Acceptable for v1.

## Local testing

```bash
# Just run the tests — no DB needed:
python -m pytest scripts/test_morning_healthcheck.py -v

# Run the script against the live DB without sending email:
DATABASE_URL='postgresql://...' python scripts/morning_healthcheck.py --no-email

# Force-send an email locally (useful for testing the SMTP path):
DATABASE_URL='postgresql://...' \
GMAIL_USER='you@gmail.com' \
GMAIL_APP_PASSWORD='xxxxxxxxxxxxxxxx' \
ALERT_TO_EMAIL='you@example.com' \
  python scripts/morning_healthcheck.py --always-email
```

## When a check goes red — triage playbook

1. **Open the alert email** — it lists each failing check with the actual
   age, threshold, and the specific channel/job_name tuple.
2. **Open the workflow run logs** — the full report (including the
   timestamp of the last write) is in the "Run morning healthcheck" step.
3. **Cross-check `/admin`** at [`https://joshuafink.com/admin`](https://joshuafink.com/admin)
   to confirm the dashboard shows the same picture.
4. **If a single Railway autoposter job is stale**: open Railway →
   that service → Deployments → check recent run logs and crash
   counts. Often a 401 from Meta means the token expired.
5. **If all autoposter jobs are stale**: the Railway Postgres or the
   autoposter service as a whole is down. Check Railway dashboard.
6. **If `sync-listings` is stale**: the bi-weekly GitHub Actions cron
   may have failed silently — check `.github/workflows/sync-listings.yml`
   run history.
7. **If site uptime is failing**: open the page in a browser; if it
   loads, the `/api/healthcheck` route may have a regression.

Fix the underlying issue and ship it as a **separate PR** from any
healthcheck infrastructure changes — keeps the monitor change
attributable from the bit-rot fix.
