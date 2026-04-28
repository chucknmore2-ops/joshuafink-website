# services/autoposter

Railway-hosted social autoposter for joshuafink.com. Phase 1 covers the
five Facebook jobs that currently run on OpenClaw cron.

| Job name (CLI arg)        | Schedule (CT)    | Source                          |
| ------------------------- | ---------------- | ------------------------------- |
| `listing-spotlight`       | Mon/Wed/Fri 9am  | `lib/listings.ts`               |
| `content-market-stats`    | Tue 10am         | `src/content/market-stats.ts`   |
| `content-testimonial`     | Wed 10am         | `src/content/testimonials.ts`   |
| `content-tips`            | Thu 10am         | `src/content/tips.ts`           |
| `content-engagement`      | Fri 10am         | `src/content/engagement.ts`     |

Every send writes a row to `post_log` (Postgres). Listing dedup is a
SQL query over `post_log` with a `LISTING_COOLDOWN_DAYS` window
(default 7).

## Local dev

```bash
cd services/autoposter
npm install
cp .env.example .env       # then fill in DATABASE_URL + FB_PAGE_*
npm run migrate            # apply ../db/schema.sql
AUTOPOSTER_DRY_RUN=1 npm start -- listing-spotlight
```

`AUTOPOSTER_DRY_RUN=1` writes a `dry_run` row to `post_log` and
prints the would-be caption — no Facebook API call.

## Railway setup (VS Code extension)

This service is one Railway service inside a repo that may host other
services later (`services/listings-sync`, `services/walkthrough-gen`,
etc.). Each Railway service points at a different `Root Directory`.

1. **Create the project**
   - Open the Railway VS Code extension → **New Project**.
   - Choose **Deploy from GitHub** → `chucknmore2-ops/joshuafink-website`.
   - Skip auto-deploying the root for now (we'll add services manually).

2. **Add Postgres**
   - In the project canvas: **+ New** → **Database** → **PostgreSQL**.
   - Railway provisions it and exposes `DATABASE_URL` as a service-wide variable.

3. **Add the autoposter service**
   - **+ New** → **GitHub Repo** → pick the same repo.
   - In the service settings:
     - **Service name:** `autoposter`
     - **Root Directory:** `services/autoposter`
     - **Watch Paths:** `services/autoposter/**`, `lib/listings.ts`, `db/schema.sql`
   - Railway will detect Node + Nixpacks and use `npm start` from `package.json`.

4. **Wire env vars**

   On the `autoposter` service → **Variables**:

   | Variable               | Value                                       |
   | ---------------------- | ------------------------------------------- |
   | `DATABASE_URL`         | `${{Postgres.DATABASE_URL}}` (reference)    |
   | `FB_PAGE_ID`           | from `~/.facebook_tokens` on the Mac        |
   | `FB_PAGE_TOKEN`        | from `~/.facebook_tokens` on the Mac        |
   | `AUTOPOSTER_DRY_RUN`   | `1` for the first deploy                    |
   | `LISTING_COOLDOWN_DAYS`| `7`                                         |

5. **Apply the schema**

   In Railway shell for the `autoposter` service (or local with `DATABASE_URL`
   pointing at the Railway DB):

   ```bash
   npm run migrate
   ```

6. **Add the 5 cron triggers**

   Railway → service → **Settings** → **Cron Schedule** is per-service and
   only allows one expression. So either:

   - **Option A (one service, multi-job dispatcher — Phase 1.5):**
     keep one service and run a small dispatcher cron (e.g. every 5 min)
     that decides which job is due. Skipping for now to stay close to the
     OpenClaw schedule.

   - **Option B (recommended): clone the service 5 times.**
     Right-click the `autoposter` service → **Duplicate** for each cron job.
     Each duplicate gets:
       - **Service name:** e.g. `autoposter-listing`, `autoposter-stats`, etc.
       - **Cron Schedule** (UTC; CT 9am ≈ 14:00 UTC CDT, 10am ≈ 15:00 UTC CDT):

         | Service name              | Cron expression (UTC)  | Job arg                |
         | ------------------------- | ---------------------- | ---------------------- |
         | `autoposter-listing`      | `0 14 * * 1,3,5`       | `listing-spotlight`    |
         | `autoposter-stats`        | `0 15 * * 2`           | `content-market-stats` |
         | `autoposter-testimonial`  | `0 15 * * 3`           | `content-testimonial`  |
         | `autoposter-tips`         | `0 15 * * 4`           | `content-tips`         |
         | `autoposter-engagement`   | `0 15 * * 5`           | `content-engagement`   |

       - In **Settings → Custom Start Command:**
         `npm start -- <job arg from table>`
       - All 5 share the same env (link to the same Postgres + FB env group).

      > ⚠️ Daylight Saving: those UTC offsets are CDT-correct (March–November).
      > After the November DST transition shift each cron back 1 hour
      > (e.g. `0 14` → `0 15` for the 9am CT job).

7. **First run check**

   With `AUTOPOSTER_DRY_RUN=1`, manually trigger one of the cron services
   (Railway service → **Deploy** → **Restart** runs the start command). Then:

   ```sql
   SELECT job_name, ref_key, status, dry_run, posted_at
   FROM post_log
   ORDER BY posted_at DESC LIMIT 10;
   ```

   You should see a `dry_run = true` row. The container logs print the
   exact caption that would have gone out.

8. **Cutover**

   - Set `AUTOPOSTER_DRY_RUN=0` on all 5 services.
   - Disable the matching OpenClaw cron entries
     (`~/.openclaw/cron/jobs.json` — flip `enabled: false` on the 5 IDs
     listed in `memory/project_railway_autoposter.md`).
   - Watch `post_log` for one full week of posts.

## Files / responsibilities

```
services/autoposter/
├── src/
│   ├── index.ts                  # CLI dispatcher: tsx src/index.ts <job>
│   ├── env.ts                    # required env reader
│   ├── log.ts                    # tiny timestamped logger
│   ├── db.ts                     # pg pool + recentlyPosted/logPost
│   ├── migrate.ts                # apply ../db/schema.sql
│   ├── listings.ts               # parse ../../lib/listings.ts
│   ├── channels/
│   │   └── facebook.ts           # Graph API POST helper
│   ├── jobs/
│   │   ├── listing-spotlight.ts  # picks a listing, posts to FB
│   │   └── content-rotator.ts    # rotates content kinds
│   └── content/
│       ├── market-stats.ts
│       ├── testimonials.ts
│       ├── tips.ts
│       └── engagement.ts
├── package.json
├── tsconfig.json
├── railway.json
└── .env.example
```
