# Automation — environment variables & setup

Three Vercel Cron jobs + one GitHub Actions job run on a schedule for joshuafink.com. This doc is the one-stop reference for the env vars each needs + the one-time setup for social auth.

## Summary

| Job | Where | Schedule (UTC) | Schedule (CT) | Env vars required |
|---|---|---|---|---|
| IndexNow submission | Vercel Cron | `0 2 * * *` (daily) | 9pm daily | `CRON_SECRET` |
| Google Business Profile post | Vercel Cron | `0 14 * * 2` (Tue) | 9am Tuesdays | `CRON_SECRET`, `GBP_*` (5 vars) |
| LinkedIn post | Vercel Cron | `0 14 * * 4` (Thu) | 9am Thursdays | `CRON_SECRET`, `LINKEDIN_*` (2 vars) |
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

### 4. GitHub Actions — listings sync

Settings → Actions → General → **Workflow permissions** → **Read and write permissions** → **Save**.

No other config needed. Workflow runs every Monday at 08:00 UTC (3am CT). Manual dispatch also available from the **Actions** tab.

---

## How to verify each job

| Job | Verify |
|---|---|
| IndexNow | Vercel → Logs → filter `indexnow` → last entry shows `{submitted: 65+, status: 200}` |
| GBP | google.com/search?q=Joshua+Fink+Group+Compass → Google Business panel shows the latest post within ~15 min; or Vercel Logs filter `gbp-post` |
| LinkedIn | linkedin.com/in/joshuafinkgroup → latest post visible; or Vercel Logs filter `linkedin-post` |
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
