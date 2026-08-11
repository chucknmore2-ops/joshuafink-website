# Automation — environment variables & setup

Three Vercel Cron jobs + one GitHub Actions job run on a schedule for joshuafink.com. This doc is the one-stop reference for the env vars each needs + the one-time setup for social auth.

## Summary

| Job | Where | Schedule (UTC) | Schedule (CT) | Env vars required |
|---|---|---|---|---|
| IndexNow submission | Vercel Cron | `0 2 * * *` (daily) | 9pm daily | `CRON_SECRET` |
| Google Business Profile post | Vercel Cron | `0 14 * * 2` (Tue) | 9am Tuesdays | `CRON_SECRET`, `GBP_*` (5 vars) |
| LinkedIn post | Vercel Cron | `0 14 * * 4` (Thu) | 9am Thursdays | `CRON_SECRET`, `LINKEDIN_*` (2 vars) |
| Instagram post | Vercel Cron | `0 14 * * 3` (Wed) | 9am Wednesdays | `CRON_SECRET`, `IG_BUSINESS_ACCOUNT_ID`, `IG_ACCESS_TOKEN` |
| **Monthly market update** (FB + LinkedIn + GBP) | GitHub Actions | `0 14 5 * *` (5th) | 9am on the 5th | `CRON_SECRET`, `FB_PAGE_ID`, `FB_PAGE_TOKEN`, plus the `LINKEDIN_*` / `GBP_*` vars above |
| Compass listings sync | GitHub Actions | `0 8 * * 1` (Mon) | 3am Mondays | None (uses Playwright against public page) |

## Vercel env vars

Set at **Vercel → project → Settings → Environment Variables**, check all three environments (Production, Preview, Development).

```
CRON_SECRET              = <any strong random string, e.g. `openssl rand -hex 32`>
NEXT_PUBLIC_GA_ID        = G-XXXXXXXXXX           (optional — analytics)
GBP_CLIENT_ID            = <from Google Cloud Console>
GBP_CLIENT_SECRET        = <from Google Cloud Console>
GBP_REFRESH_TOKEN        = <from OAuth flow — see below>
GBP_ACCOUNT_ID           = accounts/123456789012345
GBP_LOCATION_ID          = accounts/123456789012345/locations/987654321
LINKEDIN_CLIENT_ID       = <from LinkedIn Developer app>
LINKEDIN_CLIENT_SECRET   = <from LinkedIn Developer app>
LINKEDIN_REDIRECT_URI    = https://joshuafink.com/api/linkedin/callback
LINKEDIN_ACCESS_TOKEN    = <from /api/linkedin/callback response>
LINKEDIN_AUTHOR_URN      = urn:li:person:XXXXXXXX (from /api/linkedin/callback response)
IG_BUSINESS_ACCOUNT_ID   = <17-digit IG Business account ID, from Meta Business Suite>
IG_ACCESS_TOKEN          = <Page access token w/ instagram_basic + instagram_content_publish scopes>
FB_PAGE_ID               = <numeric Facebook Page ID — same value Railway's autoposter uses>
FB_PAGE_TOKEN            = <Page access token w/ pages_manage_posts — same value as Railway>
```

---

## One-time setup

### 1. CRON_SECRET

```bash
openssl rand -hex 32
```

Paste the output into Vercel as `CRON_SECRET`. Done.

### 2. Google Business Profile — OAuth flow (one-time)

You need a refresh_token with the `https://www.googleapis.com/auth/business.manage` scope. Steps:

1. Create a Google Cloud project (if you don't have one): console.cloud.google.com → **New project** → "joshuafink-gbp"
2. Enable **Google My Business API** + **My Business Business Information API** + **My Business Account Management API**
3. APIs & Services → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID** → Application type: Desktop → Name: "joshuafink-gbp". Copy the client ID + secret into Vercel as `GBP_CLIENT_ID` / `GBP_CLIENT_SECRET`.
4. **One-shot auth + Vercel env printer** — this repo ships a helper that does steps 4+5 for you. It uses your existing OAuth client file at `~/.openclaw/credentials/google-business-oauth.json`, runs the loopback OAuth flow in your browser, saves a fresh refresh_token, discovers your account + location IDs, and prints all 5 Vercel env var values ready to paste.

   ```bash
   pip install google-auth google-auth-oauthlib requests
   python scripts/google_business_auth.py
   ```

   Output looks like:
   ```
   ============================================================
     Vercel env vars — paste these into Settings → Environment Variables
   ============================================================
   GBP_CLIENT_ID=165423...
   GBP_CLIENT_SECRET=GOCSPX-...
   GBP_REFRESH_TOKEN=1//01X...
   GBP_ACCOUNT_ID=accounts/123456789012345
   GBP_LOCATION_ID=accounts/123456789012345/locations/987654321
   ============================================================
   ```

5. **Publish your OAuth app** (one-time, avoids the 7-day refresh-token expiry). Google Cloud Console → APIs & Services → **OAuth consent screen** → **Publish App**. No verification needed as long as you only use internal scopes.

6. Paste the 5 env vars into Vercel → Settings → Environment Variables (check all three environments), **Redeploy**, then test:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://joshuafink.com/api/cron/gbp-post
   ```
   Expected: `{"posted": true, "week": N, "rotator": 0..4, ...}` and a new post visible in the GBP panel on Google search within ~15 min.

   > **If the refresh token expires again:** just re-run `python scripts/google_business_auth.py` — it prints fresh values.

### 3. LinkedIn — OAuth flow (one-time, repeat every ~60 days)

1. Create a LinkedIn Developer app at developer.linkedin.com (sign in as Joshua). Products → enable **Share on LinkedIn** + **Sign In with LinkedIn using OpenID Connect**.
2. Auth → add redirect URL: `https://joshuafink.com/api/linkedin/callback`
3. Copy Client ID + Client Secret → Vercel as `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`.
4. Set `LINKEDIN_REDIRECT_URI = https://joshuafink.com/api/linkedin/callback` in Vercel.
5. Redeploy (Vercel dashboard → Deployments → latest → ⋯ → Redeploy) so the env vars take effect.
6. Visit https://joshuafink.com/api/linkedin/auth in Chrome (signed into Joshua's LinkedIn). Approve the app.
7. You'll land on `/api/linkedin/callback` which shows a JSON payload:

   ```json
   {
     "access_token": "AQU...",
     "expires_in": 5183999,
     "profile": { "sub": "abc123XYZ", ... },
     ...
   }
   ```

8. Copy the `access_token` value → Vercel `LINKEDIN_ACCESS_TOKEN`.
9. Build the URN: `urn:li:person:${profile.sub}` → Vercel `LINKEDIN_AUTHOR_URN`.
10. Redeploy.
11. Test: `curl -H "Authorization: Bearer $CRON_SECRET" https://joshuafink.com/api/cron/linkedin-post`. Expected: `{"posted": true, "postId": "urn:li:ugcPost:...", ...}`.

**Re-authenticate every ~60 days.** LinkedIn access tokens expire. The cron will return 502 with hint `"LINKEDIN_ACCESS_TOKEN may have expired"` when this happens — just redo steps 6–10.

### 4. Monthly market update — the two-minute job that has to happen by hand

Everything else on this page runs unattended. This one has a deliberate human gate, because nobody should auto-publish market numbers nobody checked.

**Once a month, after the Greater Nashville REALTORS® report lands (first few days of the following month):**

1. Open `lib/market-snapshot.ts`. There's a filled-in template in the header comment.
2. Add one object to the top of `marketSnapshots` — median sale price, YoY change, average days on market, closed sales, active listings, months of supply, the report's name and publish date, plus 2–4 plain-language `takeaways` in Joshua's voice.
3. Commit and let it deploy.

That's it. From those numbers:

- **The site** gets a new blog post at `/blog/middle-tennessee-market-update-<month>-<year>` — `lib/blog.ts` renders one post per snapshot, so it's live the moment the commit deploys.
- **Facebook, LinkedIn and Google Business** all get the post on the 5th at 9am CT, via `.github/workflows/monthly-market-update.yml`.

Every channel reads the same `lib/market-snapshot.ts`, so the website and the socials can't quote different medians.

**If the numbers aren't entered, nothing is published.** Each endpoint returns `{"posted": false, "skipped": "no_snapshot"}` and the workflow stays green with a warning — it will never recycle last month's figures. The morning healthcheck is what pages you if a whole month gets skipped (35-day threshold on `facebook` / `monthly-market-update`).

**If the report lands after the 5th:** add the numbers, then Actions tab → **Monthly Market Update** → **Run workflow**.

**Preview before publishing:**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  'https://www.joshuafink.com/api/cron/facebook-post?preview=1'
curl -H "Authorization: Bearer $CRON_SECRET" \
  'https://www.joshuafink.com/api/cron/linkedin-post?kind=market&preview=1'
```

`?preview=1` composes the copy and hands it back without touching Facebook or LinkedIn.

> **Note on Facebook.** Only the *listing spotlight* posts run on Railway (`services/autoposter`, M/W/F). The four Railway content services — `autoposter-stats`, `-testimonial`, `-tips`, `-engagement` — were listed in the schedule for months but never actually created in Railway, which is why the healthcheck reported them as permanent `[GAP]`s. `/api/cron/facebook-post` replaces the market-stats one; the other three are simply gone from the schedule.

### 5. GitHub Actions — listings sync

Settings → Actions → General → **Workflow permissions** → **Read and write permissions** → **Save**.

No other config needed. Workflow runs every Monday at 08:00 UTC (3am CT). Manual dispatch also available from the **Actions** tab.

---

## How to verify each job

| Job | Verify |
|---|---|
| IndexNow | Vercel → Logs → filter `indexnow` → last entry shows `{submitted: 65+, status: 200}` |
| GBP | google.com/search?q=Joshua+Fink+Group+Compass → Google Business panel shows the latest post within ~15 min; or Vercel Logs filter `gbp-post` |
| LinkedIn | linkedin.com/in/joshuafinkgroup → latest post visible; or Vercel Logs filter `linkedin-post` |
| Monthly market update | github.com/.../actions → "Monthly Market Update" green **and** the log shows `✅ ... posted` rather than `⏭️ ... skipped`; the post is visible on all three channels and at `/blog/middle-tennessee-market-update-<month>-<year>` |
| Listings sync | github.com/.../actions → "Sync Compass Listings" green; new commit `chore: bi-weekly listing sync from Compass` on main |

## What to do if a cron silently fails

Every `/api/cron/*` route writes to `console.error` on failure and returns non-2xx. Vercel captures these in **Logs**. Set up a log drain or an email notification (Vercel → project → Settings → Log Drains) if you want proactive alerts.

## Rotator schedule (reference)

**GBP posts** rotate through 5 types by ISO week number:

| `week % 5` | Content |
|---|---|
| 0 | Featured listing |
| 1 | Market update (rotates through 5 suburbs) |
| 2 | Buyer/seller/investor tip |
| 3 | Client review |
| 4 | Latest blog post |

**LinkedIn posts** rotate weekly:

| `week % 2` | Content |
|---|---|
| 0 | Latest blog post |
| 1 | Featured listing |

Edit the `pickPost` / `pickPayload` functions in the route files to change the cadence or add new content types.
