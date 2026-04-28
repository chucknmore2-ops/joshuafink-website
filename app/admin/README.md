# /admin dashboard

Internal dashboard for joshuafink.com automation. Reads from the Railway
Postgres `post_log` table populated by `services/autoposter`.

Hosted on Vercel like the rest of the site, so no second deploy.

## Setup (one-time, in Vercel)

1. **Make Railway Postgres reachable from Vercel.**
   In Railway → Postgres service → **Settings** → **Networking** →
   toggle on **Public Networking**. Copy the public connection string
   (looks like `postgresql://postgres:...@viaduct.proxy.rlwy.net:.../railway`).

2. **Add env vars in Vercel** → Project Settings → Environment Variables.
   Apply to **Production**, **Preview**, and **Development**:

   | Variable | Value |
   | -------- | ----- |
   | `DATABASE_URL` | the public Railway Postgres connection string from step 1 |
   | `ADMIN_PASSWORD` | a random password (e.g. `openssl rand -base64 32`) |

3. **Redeploy** so the new env vars take effect.

4. **Visit** `https://www.joshuafink.com/admin`. Browser will prompt for
   credentials. Username can be anything; password is `ADMIN_PASSWORD`.

## What it shows

- 7-day stats (posted / dry-run / failed counts)
- Upcoming schedule (next 7 cron job firings across Railway + Vercel Cron)
- Listings table with "last FB post" age per listing
- Recent activity (last 50 rows of `post_log`)
- Channel health (LinkedIn token expiry countdown, GBP/IG/YT pending status)

## What's missing (intentional for v1)

- No "send a post now" button — keeps the surface read-only until we
  trust the autoposter loop end-to-end.
- No content drafts queue — added in Phase 1.5 once the content engine
  ships and produces auto-published posts.
- No live editing of cron schedules — schedules live in `services/autoposter`
  Railway service settings; this dashboard reflects them but doesn't
  manage them.
