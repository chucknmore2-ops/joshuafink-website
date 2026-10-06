# Automation — environment variables & setup

Scheduled automation for joshuafink.com. This doc is the one-stop reference for the env vars each job needs and the one-time setup for social auth.

## Summary

| Job | Where | Schedule (UTC) | Schedule (CT) | Env vars required |
|---|---|---|---|---|
| IndexNow submission | Vercel Cron | `0 2 * * *` (daily) | 9pm daily | `CRON_SECRET` |
| Google Business Profile post | GitHub Actions `social-autopost.yml` | `0 14 * * 2` (Tue) | 9am Tuesdays | `CRON_SECRET`, `GBP_*` (5 vars). Unchanged weekly rotator. Logs `job_name=gbp-post`. |
| **Just Listed GBP** | GitHub Actions `gbp-just-listed.yml` | when `lib/listings.ts` reaches main, plus `20 14 * * *` and `20 20 * * *` | after the Compass sync deploy, and ~9:20am / ~3:20pm CT | `CRON_SECRET`, `GBP_*`, `DATABASE_URL` (dedupe). Failure alert: `PUSHOVER_TOKEN` / `PUSHOVER_USER`. Logs `job_name=gbp-just-listed`, not `gbp-post`. |
| LinkedIn post | Vercel Cron | `0 14 * * 4` (Thu) | 9am Thursdays | `CRON_SECRET`, `LINKEDIN_*` (2 vars) |
| Instagram post | GitHub Actions `social-autopost.yml` | `0 14 * * 3` (Wed) | 9am Wednesdays | `CRON_SECRET`, `BUFFER_API_KEY`, `BUFFER_IG_CHANNEL_ID` (GitHub secrets). Graph stays off (`IG_AUTOPOST=buffer`). |
| **Monthly market update** (LinkedIn + GBP; Facebook via Railway) | GitHub Actions + Railway autoposter | when the GNAR snapshot merges | typically the 6th–8th | `CRON_SECRET`, `DATABASE_URL` (post_log read), plus the `LINKEDIN_*` / `GBP_*` vars above. Facebook uses the autoposter's Page token, not Vercel. |
| Compass listings sync | GitHub Actions | `0 8 * * *` (daily) | 3am CT | None (uses Playwright against public page) |

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
IG_BUSINESS_ACCOUNT_ID   = unused by the live path (Graph leftovers; do not point autopost back at Graph)
IG_ACCESS_TOKEN          = unused by the live path (Graph leftovers)
```

Facebook Page credentials stay on the Railway autoposter only. Do not add
`FB_PAGE_ID` or `FB_PAGE_TOKEN` to Vercel. The site does not read them.

Instagram does not use the Graph vars above. Social Autopost reads GitHub
secrets `BUFFER_API_KEY` and `BUFFER_IG_CHANNEL_ID` and forwards them to
`/api/cron/instagram-post`. `IG_AUTOPOST=buffer` queues with
`schedulingType: automatic`. `IG_AUTOPOST=live` is retired and soft-skips.

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

### 4. Monthly market update — automatic, from GNAR's published numbers

`scripts/fetch-gnar.ts` reads last month's `marketMonthlyStats` from Greater Nashville REALTORS®'s public Sanity dataset, checks every field (present, in range, category sums), computes the residential year-over-year change from the prior-year record, and copies months of supply from the matching press release when that release exists. It does not estimate a missing figure.

`.github/workflows/fetch-gnar-snapshot.yml` runs that script at 15:00 UTC on the 3rd–12th of each month (and whenever you run it by hand). GNAR usually publishes around the 6th–8th. Through the 8th it waits if the stats are in but the release is not, so months of supply can be included. From the 9th it publishes the validated stats anyway and omits months of supply.

A new month is committed by opening an auto-merging pull request (main rejects a direct push). `lib/blog.ts` renders `/blog/middle-tennessee-market-update-<month>-<year>` from that entry, so the post goes live with the merge. `.github/workflows/monthly-market-update.yml` then waits until the production blog is serving those figures and posts them to LinkedIn and Google Business. Facebook is published by the Railway autoposter (`services/autoposter`, every 5 minutes). It fetches `/api/market-update/facebook` and writes one `post_log` row for `(facebook, monthly-market-update, YYYY-MM)`. A month that was already posted is skipped.

**If the month is already in `lib/market-snapshot.ts`, the run does nothing.**

**If validation fails, or the numbers still are not published on the 10th, nothing is written.** The workflow fails and sends a Pushover alert. The morning healthcheck still pages if the Facebook post itself is older than 42 days (`facebook` / `monthly-market-update`).

**To publish a month by hand** (the fetcher is down, or you are correcting a figure): add one object at the top of `marketSnapshots` from the template in `lib/market-snapshot.ts` and commit to main. The social workflow runs on that push. Do not invent a number the report does not state.

**Preview before publishing:**

```bash
curl 'https://www.joshuafink.com/api/market-update/facebook'
curl -H "Authorization: Bearer $CRON_SECRET" \
  'https://www.joshuafink.com/api/cron/linkedin-post?kind=market&preview=1'
```

The Facebook URL is the copy the autoposter posts. It does not publish.
`?preview=1` on LinkedIn composes the copy and hands it back without posting.

> **Note on Facebook.** Listing spotlight and the monthly market post both run on Railway (`services/autoposter`). The Page token is a Railway variable. The site never calls Graph for the Page feed.

### 5. GitHub Actions — listings sync

Settings → Actions → General → **Workflow permissions** → **Read and write permissions** → **Save**.

No other config needed. Workflow runs every day at 08:00 UTC (3am CT). Manual dispatch also available from the **Actions** tab.

### 6. Just Listed on Google Business — automatic

When Compass sync adds an **Active** or **Coming Soon** home that was not already on the site, [`.github/workflows/gbp-just-listed.yml`](../.github/workflows/gbp-just-listed.yml) publishes one Google Business post for it. The Tuesday rotator is a different job and is not involved.

**What starts a post.** The workflow runs when `lib/listings.ts` changes on main, when the listings sync dispatches it after the PR merges, and on a backstop schedule at 14:20 and 20:20 UTC. It waits until production `/listings` is serving that sync, then calls `GET /api/cron/gbp-post?kind=new-listings`.

**How soon after Compass.** The site learns about a Compass listing on the next daily sync (08:00 UTC). After that PR merges and Vercel deploys, the post goes out in the same run — usually within a few minutes of the deploy, not on the following Tuesday. A listing that appears on Compass just after 08:00 UTC waits for the next morning's sync. The 14:20 and 20:20 runs catch a merge whose push trigger did not fire.

**Copy.** "Just Listed" for Active, "Coming Soon" when `Listing.status` matches Coming Soon. City, beds / baths / sq ft / price, and Joshua Fink at Compass. The summary does not include the phone number or a raw URL, and the boilerplate does not mention Parks. The button is LEARN_MORE to the on-site listing page (with UTM) when that page exists, otherwise the Compass URL.

**No flood on launch.** The seven homes in `lib/listings.ts` on 2026-10-06 are a baseline in `app/api/cron/gbp-post/just-listed.ts` and are not auto-posted. 261 Paragon Mills is not in that list. Each run posts at most 3 homes, one request at a time, 65 seconds apart. A home is skipped when `post_log` already has a successful `gbp-just-listed` row, or a successful manual `gbp-on-demand` listing row, for that address. If the database cannot be read, the route posts nothing.

**Preview (does not publish):**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  'https://www.joshuafink.com/api/cron/gbp-post?kind=new-listings&preview=1'
curl -H "Authorization: Bearer $CRON_SECRET" \
  'https://www.joshuafink.com/api/cron/gbp-post?kind=listing&address=4127+Edwards&preview=1'
```

A real failure sends a Pushover alert. It does not send email. A run with nothing new exits green.

---

## How to verify each job

| Job | Verify |
|---|---|
| IndexNow | Vercel → Logs → filter `indexnow` → last entry shows `{submitted: 65+, status: 200}` |
| GBP | google.com/search?q=Joshua+Fink+Group+Compass → Google Business panel shows the latest post within ~15 min; or Vercel Logs filter `gbp-post` |
| LinkedIn | linkedin.com/in/joshuafinkgroup → latest post visible; or Vercel Logs filter `linkedin-post` |
| Monthly market update | github.com/.../actions → "Fetch GNAR market snapshot" green, then "Monthly Market Update" green with each channel posted or `already_posted`; the post is at `/blog/middle-tennessee-market-update-<month>-<year>` |
| Listings sync | github.com/.../actions → "Sync Compass Listings" green; new commit `chore: daily listing sync from Compass` on main |
| Just Listed GBP | github.com/.../actions → "GBP Just Listed" green with `posted: true` or `none_pending`. Does not run on Tuesdays as part of Social Autopost. |

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
