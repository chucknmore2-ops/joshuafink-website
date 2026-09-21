# joshuafink.com — operator handoff

Written for whoever runs this site next (Josh, or a bot that is not Claude).
Every command here is copy-paste runnable from the repo root. Env vars are named,
never printed. Last verified **2026-09-21**.

---

## 0. Do these first (dated)

| When | What | How |
|---|---|---|
| **Open** | **Instagram cannot publish.** Run 35628788322 (2026-09-21) created containers on the Joshua Fink Group Page and every one stayed `IN_PROGRESS` with Meta's generic "still being processed" status. Hosting and the Page swap are not the cause. The cron now reports token type, scopes, and a status probe. If that still says generic `IN_PROGRESS`, the next step is App Review — [Runbook 4](#runbook-4--instagram-didnt-post). | [Runbook 4](#runbook-4--instagram-didnt-post) |
| Housekeeping | Retired keys still in Vercel: `SLACK_BOT_TOKEN`, `MONDAY_BOARD_ID`, `SENDGRID_API_KEY`, `CLICKUP_API_TOKEN`. Nothing reads them. | Vercel → Settings → Environment Variables → delete |
| Housekeeping | ~30 open PRs from the bot account are queued up. | `gh pr list`, then merge or close |

**Recently closed — do not redo** (verified 2026-09-18):

- `SYNC_PAT` was rotated 09-16 and the sync has been green since. The next
  expiry alert will arrive on its own, 14 days out, as a red `SYNC_PAT expiry`
  job.
- The Google Sheet 404 was fixed 09-16. The daily test lead has reported
  `joshua-email, sheet, pushover` ever since.
- LinkedIn is **healthy** — it posted 09-14 and the Thursday 09-17 run
  succeeded. (An earlier note here called it dead; that came from misreading
  `vercel env ls` output, which does not tell you a token's age. Judge channel
  health from `post_log` freshness in the healthcheck report instead.)

---

## 1. Stack

| Piece | Where | Notes |
|---|---|---|
| Site | Next.js App Router, deployed on **Vercel** | Project `joshuafink-website`, org `chucknmore2-7257s-projects` |
| Repo | `chucknmore2-ops/joshuafink-website` on GitHub | **Public.** Assume anything in the code can be read by anyone. |
| Prod URL | https://www.joshuafink.com | apex redirects to `www` |
| Database | **Railway** Postgres | `post_log` (autoposter history) + `geo_visibility` (GEO audit). Read via `DATABASE_URL`. |
| Facebook poster | Railway service (separate from this repo) | `docs/railway-autoposter-runbook.md` |
| Admin dashboard | https://www.joshuafink.com/admin | Password in `ADMIN_PASSWORD`. Shows post history, listings, channel health, GEO trend. |

**Local commands**

```bash
npm ci                # install
npm test              # node --test: lead classifier, contact route, email, rotation, LinkedIn OAuth
npm run typecheck     # tsc --noEmit
npm run build         # next build — what the `build` status check runs
npm run healthcheck   # scripts/morning_healthcheck.py against prod (needs DATABASE_URL, CRON_SECRET)
```

CI on every PR: `build`, `validate` (schema), `lighthouse`, Vercel preview.
`build` is the only required check; branch protection blocks direct pushes to `main`.

---

## 2. The lead flow (the part that earns money)

Every form on the site POSTs to **`/api/contact`** (`app/api/contact/route.ts`).
Do not build a second endpoint.

```
form (SuburbLeadForm / SellForm / ContactForm / CashOfferForm)
  → POST /api/contact
  → lib/classify-lead.ts      clean | suspect | invalid | bot
  → 4 channels IN PARALLEL:   email (Resend) · Pushover · Google Sheet · ClickUp (off)
  → best-effort webhooks:     n8n · FlipIntel cash-offer · buyer-lead   (skipped if localhost)
  → delivery check:           did ANY channel succeed?
      yes → 200, success screen
      no  → emergency Pushover → if that works, 200; else 502 telling the visitor to call
```

**Classification rules that must not be broken** (`lib/classify-lead.ts`):

- **Only the honeypot may drop a lead.** A hidden `website` field; bots fill it.
  Dropped leads still get logged to the sheet's **Blocked** tab, and the visitor
  still sees success so bots don't retry.
- `invalid` = something the human can fix (no name, 4-digit phone, cash-offer
  with no address). Returns a **visible** 400 so they can correct it. Never silent.
- `suspect` = a shape heuristic fired. **Delivered anyway**, tagged
  `suspected_spam` so Joshua can judge. This logic silently ate real leads four
  separate times; the tests in `lib/classify-lead.test.ts` exist to stop a fifth.
- There is **no server-side "must provide phone or email" rule**, on purpose: the
  daily healthcheck's test lead has neither. That check lives in the browser
  (`lib/lead-form.ts`).

**Channel notes**

- **Email** — Resend only (`RESEND_API_KEY`), from `leads@send.joshuafink.com`.
  The `send.` subdomain is deliberate: the root domain's SPF belongs to
  Microsoft 365 and must not be edited. SendGrid was removed 2026-09-15.
  Real form submissions email Joshua. The weekday SYSTEM TEST lead does **not**
  send a Resend message (CI/chat is the alert path); the healthcheck still
  requires `RESEND_API_KEY` to be set or that check fails as unconfigured.
- **Pushover** — `PUSHOVER_TOKEN` / `PUSHOVER_USER`. This is both the new-lead
  phone alert and the emergency last resort. See landmine #2.
- **Google Sheet** — Apps Script web app at `GOOGLE_SHEET_WEBHOOK_URL`. Tabs:
  **CRM** (real leads), **Blocked** (honeypot), **System** (daily test lead).
  The script answers HTTP 200 for everything, so the route believes the *body*,
  not the status. See `docs/google-sheet-lead-log.md`.
- **ClickUp** — OFF. Skipped unless `CLICKUP_LEADS_ENABLED=true` *and*
  `CLICKUP_API_TOKEN` *and* `CLICKUP_LEADS_LIST_ID` are set. Never point it at
  list `901415978281`; that is the agents' board, not a lead list.
- **FlipIntel cash-offer webhook** — `CASH_OFFER_WEBHOOK_BASE`; the route appends
  `/cash-offer`. This is what marks a postcard owner as responded so FlipIntel
  stops mailing them. A loopback/localhost base is skipped silently.

---

## 3. Env vars (names only)

**Vercel** (Settings → Environment Variables; changes need a redeploy):

```
RESEND_API_KEY  EMAIL_FROM  GOOGLE_SHEET_WEBHOOK_URL  SHEET_WEBHOOK_SECRET
PUSHOVER_TOKEN  PUSHOVER_USER  CRON_SECRET  ADMIN_PASSWORD  DATABASE_URL
NEXT_PUBLIC_GA_ID  LEAD_CHANNEL_TIMEOUT_MS
N8N_WEBHOOK_BASE  CASH_OFFER_WEBHOOK_BASE  BUYER_LEAD_WEBHOOK_BASE
IG_BUSINESS_ACCOUNT_ID  IG_ACCESS_TOKEN
LINKEDIN_CLIENT_ID  LINKEDIN_CLIENT_SECRET  LINKEDIN_REDIRECT_URI
LINKEDIN_ACCESS_TOKEN  LINKEDIN_AUTHOR_URN  LINKEDIN_TOKEN_EXPIRES_AT_MS
GBP_CLIENT_ID  GBP_CLIENT_SECRET  GBP_REFRESH_TOKEN  GBP_ACCOUNT_ID  GBP_LOCATION_ID
ANTHROPIC_API_KEY  OPENAI_API_KEY  PERPLEXITY_API_KEY
```

**GitHub Actions secrets** (`gh secret list`):

```
SYNC_PAT  CRON_SECRET  DATABASE_URL  ALERT_TO_EMAIL  GMAIL_USER  GMAIL_APP_PASSWORD
PUSHOVER_TOKEN  PUSHOVER_USER  ANTHROPIC_API_KEY  OPENAI_API_KEY  PERPLEXITY_API_KEY
```

`CRON_SECRET` exists in **both** and they must match, or the healthcheck's test
lead comes back without per-channel results.

---

## 4. What runs on a schedule

| Job | When (UTC) | Where | Proof it ran |
|---|---|---|---|
| Sync Compass listings | daily 08:00 | `.github/workflows/sync-listings.yml` | a merged `chore: daily listing sync` PR |
| SYNC_PAT expiry guard | with the sync | same workflow, separate job | red run ≤14 days before expiry |
| Morning healthcheck | Mon–Fri 12:00 | `morning_healthcheck.yml` | CI red on failure; email only if `always_email=true` |
| Daily tasks push | Mon–Fri 12:00 | `daily-tasks-pushover.yml` | phone push |
| GBP post | Tue 14:00 | `social-autopost.yml` | `post_log` row, channel `gbp` |
| Instagram post | Wed 14:00 | `social-autopost.yml` | `post_log` row, channel `instagram` |
| LinkedIn post | Thu 14:00 | `social-autopost.yml` | `post_log` row, channel `linkedin` |
| GEO audit | Mon 13:00 | `geo-audit.yml` | `geo_visibility` rows, /admin GEO card |
| Monthly market update | 5th, 14:00 | `monthly-market-update.yml` | `post_log`, job `monthly-market-update` |
| IndexNow | daily 02:00 | Vercel cron → `/api/cron/indexnow` | Vercel function logs only |
| Agent briefing | Mon 12:00 | Vercel cron → `/api/cron/agent-briefing` | email to `chucknmore2@gmail.com` |

Run any GitHub workflow by hand:

```bash
gh workflow run sync-listings.yml
gh workflow run morning_healthcheck.yml   # silent; add -f always_email=true to smoke-test SMTP
gh run list -L 5            # check results
```

---

## 5. Runbooks

### Runbook 1 — rotate SYNC_PAT

The sync opens its PR with this token. `secrets.SYNC_PAT || secrets.GITHUB_TOKEN`
only falls back when the secret is **empty**, so an expired token is not
automatically survivable (the workflow now detects rejection at run time and
falls back, but the PR then waits for manual approval).

1. github.com → Settings → Developer settings → Personal access tokens →
   **Fine-grained tokens** → Generate new token.
2. Resource owner **chucknmore2-ops**; Repository access → only
   `joshuafink-website`; Permissions → **Contents: Read and write** and
   **Pull requests: Read and write**. Expiry: 1 year.
3. Save it in the repo:
   ```bash
   gh secret set SYNC_PAT   # paste the token when prompted
   ```
4. Confirm:
   ```bash
   gh workflow run sync-listings.yml && sleep 60 && gh run list --workflow=sync-listings.yml -L 1
   ```
   Expected: both jobs green. The `SYNC_PAT expiry` job prints
   `SYNC_PAT expires <date> (<n> days left).`

### Runbook 2 — Google Sheet returns 404

Symptom: healthcheck says `test lead FAILED on configured channel(s): sheet(HTTP 404)`.
Leads are **not** lost (email + Pushover still deliver), but no CRM rows are written.

1. Open the lead sheet → Extensions → **Apps Script**.
2. Deploy → **Manage deployments**. If the web app deployment is gone, create one:
   **Deploy → New deployment → Web app**, Execute as **Me**, Access **Anyone**.
3. Copy the `/exec` URL into Vercel as `GOOGLE_SHEET_WEBHOOK_URL`, then redeploy
   (Vercel → Deployments → ⋯ → Redeploy). Env changes need a deploy.
4. Confirm: `gh workflow run morning_healthcheck.yml` (no email by default),
   then open the run log and confirm `test lead delivered on all N configured
   channel(s)`. Use `-f always_email=true` only if you need the SMTP smoke test.

### Runbook 3 — re-authorise LinkedIn

Tokens last ~60 days.

1. Visit https://www.joshuafink.com/api/linkedin/auth and approve.
2. The callback returns a `vercelEnv` block. Copy **all three** into Vercel
   (Production): `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_TOKEN_EXPIRES_AT_MS`,
   `LINKEDIN_AUTHOR_URN`.
3. Redeploy, then verify: `gh workflow run social-autopost.yml` (Thursday's
   endpoint) or wait for Thursday. `/admin` → Channel health shows days left.

The expiry var is what arms the 7-day early warning; without it /admin shows
"Expiry unknown".

### Runbook 4 — Instagram didn't post

**Current state (2026-09-21): publishing is blocked in Meta, not in the image host.**
GitHub Actions run [35628788322](https://github.com/chucknmore2-ops/joshuafink-website/actions/runs/35628788322)
returned HTTP 502. Meta created three containers
(`18093626942390586`, `18093627071390586`, `18093627155390586`) and every one
stayed `status_code=IN_PROGRESS` with status
`In Progress: Media is still being processed.` That sentence is Meta's generic
processing line. A download failure, bad aspect ratio, or expired container
comes back as `ERROR` with a different `status` (and sometimes `status_code_ex`).

Hypotheses, checked against that run and the public image URL:

| Hypothesis | Result |
|---|---|
| Wrong Facebook Page | **Rejected.** `pageName` Joshua Fink Group, `pageId` 111457913523107, `swapped` true, `reason` matched `instagram_business_account`. |
| Publish calls used the User token | **Rejected for the calls themselves.** `swapped: true` means Graph was called with the Page `access_token` from `/me/accounts`. The log said `tokenKind: user` because that field named the env token, not the token that was sent. The cron now logs `tokenKind: page` after a swap, and `envTokenKind` for `IG_ACCESS_TOKEN` (`user`, `page`, or `system_user` from `debug_token`). |
| `image_url` not fetchable, or wrong Content-Type | **Rejected.** `https://www.joshuafink.com/ig-photo/{hash}.jpg` returns HTTP 200, `Content-Type: image/jpeg`, no redirect. The 2026-09-21 walnut photo is a baseline JPEG, 1200×800 (aspect 1.5, inside 4:5–1.91:1), 197766 bytes, including for `facebookexternalhit`. |
| Resumable / file upload instead of `image_url` | **Not an image API.** Meta's content publishing docs (checked 2026-09-21) limit `upload_type=resumable` and `rupload.facebook.com` to video (`REELS`, `VIDEO`, `STORIES`). Image containers require `image_url`. There is no alternate upload path to ship. |
| `IG_BUSINESS_ACCOUNT_ID` mismatch | **Rejected for this run.** The Page was chosen because its `instagram_business_account` id matched the env id, and the container was created on that id. |
| App missing publish capability (Advanced Access), showing up only as eternal `IN_PROGRESS` | **Open, and the one that matches the evidence.** Container create succeeds (the token can call `POST /{ig-id}/media`) and processing never leaves the generic status, on three different JPEGs, with the right Page. That is what Standard Access looks like for a System User: the async publisher does not run for a caller who is not an app admin/developer/tester. |

What the cron does now (so the next 502 is the diagnosis, not another guess):

- Polls `status_code` and `status`, then one probe for `status_code_ex`. If Graph says that field does not exist, the `(#100)` message is stored as `probeError` and does not wipe `status_code`.
- `cache: 'no-store'` / `fetchCache = 'force-no-store'` on Graph reads, and `Cache-Control: no-store` on the cron response. Next 14 can otherwise cache the first `IN_PROGRESS` GET.
- Calls `debug_token` and logs scope **names**, expiry (`0` = never), and `envTokenKind`. The token value is never logged.
- If the Page-token container stays on the generic processing status, it creates **one** comparison container with the unswapped env token (20s). If that reaches `FINISHED`, it publishes. If both stay generic, the JSON `hint` points here.

`IG_ACCESS_TOKEN` in Vercel is a sensitive secret, so it cannot be read back to debug from a laptop. Read the cron JSON instead. Do not paste the token into a file, a log, or a PR.

**If the next run's `hint` still says both tokens stayed IN_PROGRESS, this is the Meta UI step. Do this as Josh (app admin), in order:**

1. Open [developers.facebook.com/apps](https://developers.facebook.com/apps) and select the app whose token is in `IG_ACCESS_TOKEN` (the cron JSON's scopes tell you which permissions that token carries).
2. Left nav → **App Review** → **Permissions and Features**. Find `instagram_content_publish`. If Access level is **Standard**, click **Request Advanced Access** (the permission may be listed as `instagram_content_publishing` in the review form). Also confirm `instagram_basic` and `pages_read_engagement` are on the same request. Use case to describe: this website's server publishes the Joshua Fink Group listing photo to the Instagram professional account linked to the Facebook Page, on a schedule. No other people's accounts.
3. Because this token is a **System User** granted in Business Manager, the same screen must show Advanced Access for **one of** `ads_read` or `ads_management`. Meta's content-publishing docs require that when the Page role comes from Business Manager. If the cron JSON has `missingBusinessManagerAdsScope: true`, this step is required, not optional.
4. [business.facebook.com/settings](https://business.facebook.com/settings) → **Users** → **System users** → the user that owns the token → **Assign assets** → Page **Joshua Fink Group** → enable **Create content** (or full **Manage**). Save.
5. Still on that system user, **Generate token**. Select this app. Check `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, and `ads_read` (or `ads_management`). Set expiration to **Never**. Copy the token once into Vercel → `IG_ACCESS_TOKEN` (Production). **Redeploy** — env edits do not apply to the running deployment.
6. App mode: if the app is still in **Development**, system users cannot publish even with the right boxes checked. Either finish App Review and switch the app to **Live**, or (only for a one-off test) add the Facebook user who owns the Page as an app **Administrator** under App roles → Roles and generate a User token for that person instead of the system user.

After the redeploy, `gh workflow run social-autopost.yml -f channel=instagram-post`. Success is HTTP 200 with `posted: true`. Another generic `IN_PROGRESS` with `missingScopes: []` and `missingBusinessManagerAdsScope: false` means App Review has not granted Advanced Access yet — wait for the review email, do not keep dispatching (each run creates containers; the cap is 400 containers / 24h).

A real media error looks different: `status_code` `ERROR` and a `status` that names the download, the aspect ratio, or the file type. Fix that specific thing. Token rejection at *create* time is HTTP 400/401 in `errorMessage`, not `IN_PROGRESS`.

### Runbook 5 — listings are stale on the site

`lib/listings.ts` and `lib/sold-listings.ts` are **generated**. Never hand-edit;
the next sync overwrites you.

1. `gh workflow run sync-listings.yml`
2. If it opens a PR that doesn't merge: `gh pr list` → the sync PR is waiting on
   `build`, usually because it was opened by the bot rather than the PAT
   (approval gate). Approve the workflow run, or fix `SYNC_PAT` (Runbook 1).
3. A wrong price or photo is wrong **on Compass** — fix it there.

### Runbook 6 — deploy and rollback

Deploys are automatic on merge to `main`.

```bash
git checkout -b fix/thing origin/main   # never commit to main directly
# …changes…
npm test && npm run typecheck && npm run build
gh pr create --base main --fill
gh pr checks <n> --watch && gh pr merge <n> --squash --delete-branch
```

Rollback: Vercel → Deployments → pick the last good one → **Promote to
Production**. Then revert the commit (`git revert <sha>`) so the code matches.

---

## 6. Landmines

1. **The FlipIntel cash-offer webhook has no auth.** Anyone who finds the Railway
   URL can POST to it and stop mail going to a real lead. Don't publish it.
2. **The site's Pushover app may be the retired wally project's app.** Deleting
   that Pushover application would kill new-lead alerts *and* the emergency
   fallback. Create a new application and swap `PUSHOVER_TOKEN` **before**
   deleting anything in Pushover.
3. **Never POST to the FlipIntel webhook to "test" it.** Every POST alerts Josh
   and can move a real lead's deal stage.
4. **`lib/listings.ts` / `lib/sold-listings.ts` are generated.** Hand edits are
   silently overwritten nightly.
5. **Only the honeypot may drop a lead.** Any new "this looks like spam" rule
   must tag (`suspect`), not discard. This has cost real leads four times.
6. **The repo is public.** No secrets, internal URLs, or client details in code,
   comments, or commit messages.
7. **A Pushover/Resend 200 means accepted, not delivered.** The only proof the
   phone actually buzzes is a real buzz.
8. **The healthcheck runs weekdays only.** A Saturday failure isn't seen until
   Monday. That's why the PAT guard warns 14 days out.
9. **Vercel env changes need a redeploy** to take effect.
10. **Don't re-enable ClickUp lead tasks** without a dedicated Leads list. The old
    default board is executed by an automation agent.

---

## 7. Where things are documented

| Topic | File |
|---|---|
| Lead sheet + Apps Script | `docs/google-sheet-lead-log.md` |
| Healthcheck internals | `docs/morning-healthcheck.md` |
| Facebook poster (Railway) | `docs/railway-autoposter-runbook.md` |
| GEO / AI-visibility tracking | `docs/geo-tracker.md` |
| Automation inventory | `docs/automation.md` |
| Email provider swap | `docs/email-provider-swap.md` |
| Channels not yet live | `docs/unblock-channels-checklist.md` |
| Weekly operating checklist | `FIRST_30_DAYS.md` |

**Listing tour videos:** `tourVideos` in `lib/listing-detail.ts` maps a listing
slug to a YouTube video ID, and the page renders the embed plus VideoObject
schema automatically. A finished 107 Overlook Trail tour exists but is not
uploaded. Once it's on YouTube:

```ts
export const tourVideos: Record<string, string> = {
  '107-overlook-trail-<city>': 'YOUTUBE_VIDEO_ID',
}
```

Use the exact slug from the listing URL, open a PR, and the embed appears.
