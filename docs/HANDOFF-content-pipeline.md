# JoshuaFink Content Pipeline — End-to-End Plan

**Goal:** Get joshuafink.com to first-page Google rankings (long-form SEO + Local Pack via GBP), running on Railway, hands-off, monitored via ClickUp. No more "openclaw said it works" surprises.

**Status:** Phase 0 (discovery) complete. Phase 1A is the next concrete step.

---

## What we have today (the inventory)

### ✅ Working
- **`scripts/sync-all.sh`** — Mon+Thu 7am syncs Compass MLS listings → website → Vercel deploys. Don't touch.
- **`lib/blog.ts`** — 29 published blog posts with full schema markup (BlogPosting / metadata / OG). The Next.js blog UI works.
- **Railway `Joshua Fink Group` project** — Postgres provisioned, FB Page token + Anthropic API key already set on `services/autoposter` service.

### ⏸️ Built but stalled
- **`feature/railway-autoposter-phase-1` branch** — Facebook autoposter, 5 jobs (`listing-spotlight`, `content-market-stats`, `content-testimonial`, `content-tips`, `content-engagement`). TypeScript, Postgres-backed dedup, DRY_RUN mode. Never merged. Railway has 1 of 5 cron services deployed with no schedule set.
- **`content_engine/`** — blog draft generator. Uses Ollama (llama3.1:8b) + Brave Search. Generated 81 drafts Apr 9–16, then keyword queue went empty. Has been firing daily with zero output for ~30 days.
- **`content_engine_cash_offer/`** — same architecture, also empty queue.
- **`scripts/gbp_post.py`** — Google Business Profile poster. OAuth set up, never scheduled.

### ❌ Doesn't exist
- Instagram posting
- LinkedIn posting
- Content engine → blog publish loop (drafts sit in `output/drafts/` forever)
- Cross-system status reporting (no ClickUp tasks, no Slack alerts)

---

## Architecture target

```
                  ┌─────────────────────────────────────────┐
                  │  Railway: Joshua Fink Group project     │
                  └─────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼────────────────────────────┐
        ▼                           ▼                            ▼
┌────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│  Postgres      │◀────────│  content-engine │         │  autoposter      │
│  (shared DB)   │         │  (cron, M-F 5am)│         │  (5 cron services│
│                │         │                 │         │   FB+IG+LI+GBP)  │
│  - keywords    │         │ Anthropic       │         │                  │
│  - articles    │         │ Sonnet 4.6      │         │ FB token (have)  │
│  - post_log    │◀────────│ commits .md →   │         │ IG via Meta API  │
│  - clickup_log │         │ joshuafink.com  │         │ LinkedIn (Ayrshr)│
└────────────────┘         │ blog → Vercel   │         │ GBP (own OAuth)  │
                           └────────┬────────┘         └────────┬─────────┘
                                    │                           │
                                    │   ┌───────────────────────┘
                                    ▼   ▼
                          ┌──────────────────────────┐
                          │  ClickUp tasks (status)  │
                          │  Joshua Fink space       │
                          └──────────────────────────┘
```

---

## Phased plan

### Phase 1A — Finish the Facebook autoposter (1 day)

The `feature/railway-autoposter-phase-1` branch is 7 commits ahead of `main` and 34 commits behind. Rebase, resolve any conflicts, merge.

1. Rebase `feature/railway-autoposter-phase-1` onto current `main`
2. Run `npm install` + `npm run typecheck` locally to verify it still builds
3. Test one job with `AUTOPOSTER_DRY_RUN=1 npm start -- listing-spotlight`
4. PR + merge
5. **In Railway dashboard**: clone the existing `services/autoposter` Railway service 4 times. Each duplicate gets a different cron schedule + start command. Per the existing README:

   | Service name              | Cron (UTC, CDT-correct) | Start command                          |
   | ------------------------- | ----------------------- | -------------------------------------- |
   | `autoposter-listing`      | `0 14 * * 1,3,5`        | `npm start -- listing-spotlight`       |
   | `autoposter-stats`        | `0 15 * * 2`            | `npm start -- content-market-stats`    |
   | `autoposter-testimonial`  | `0 15 * * 3`            | `npm start -- content-testimonial`     |
   | `autoposter-tips`         | `0 15 * * 4`            | `npm start -- content-tips`            |
   | `autoposter-engagement`   | `0 15 * * 5`            | `npm start -- content-engagement`      |

6. Verify one cron fires with `AUTOPOSTER_DRY_RUN=1` first — read `post_log` table in Postgres to confirm.
7. Flip `AUTOPOSTER_DRY_RUN=0` on all 5 services. Done.

**Status reporting:** every job writes to `post_log` (already designed).

### Phase 1B — Add Instagram channel (~half day)

Meta's Graph API allows IG posting via the same Page token if the IG Business account is linked to the FB Page. Requires posting an image URL (text-only doesn't work on IG).

1. Confirm Joshua Fink IG is linked to the FB Page (`/me?fields=instagram_business_account` via Graph API)
2. Add `src/channels/instagram.ts` that wraps `POST /{ig-user-id}/media` then `/media_publish`
3. For each existing content job (`market-stats`, `tips`, etc.), add an image source:
   - **Option A:** Reuse a pool of branded images from `public/` (simplest, ship today)
   - **Option B:** Generate per-post images via Claude + an image-gen API (better, later)
4. Update jobs to post to both FB *and* IG when applicable. (`listing-spotlight` already has listing photos — easy IG fit.)

### Phase 1C — Add LinkedIn channel (~half day)

LinkedIn's direct API for Company Page posting is gatekept — they often reject solo-broker apps. **Go with Ayrshare ($29/mo)**:

1. Josh signs up for Ayrshare → connects LinkedIn → gets API key
2. Add `src/channels/linkedin.ts` that wraps `POST https://api.ayrshare.com/api/post` with `platforms: ['linkedin']`
3. LinkedIn is monthly cadence, not weekly — too many posts hurts you there. Probably just `listing-spotlight` (Fri) and `content-tips` (Thu).

### Phase 1D — Add GBP channel (~half day)

GBP **is** the highest-leverage local-SEO signal. The existing `scripts/gbp_post.py` has working OAuth — but it's Python and the autoposter is TypeScript. Two choices:

**Option A (recommended):** Port the GBP API calls into a TS `src/channels/gbp.ts`. Keep `gbp_post.py` around as reference. ~2 hours.
**Option B:** Schedule `gbp_post.py` as a separate Railway service (Python runtime). Different stack but works.

Go with A. One service, one runtime, one log stream.

### Phase 2A — Switch content engine to Anthropic Sonnet 4.6 (half day)

Current state: `content_engine/main.py` calls Ollama (`http://localhost:11434`) — won't work on Railway, quality is mediocre anyway.

1. In `content_engine/engine/writer.py`, swap `ollama.chat()` → `anthropic.messages.create()` using Sonnet 4.6
2. Prompts already exist in `content_engine/prompts/`, just need the API call shape changed
3. Add `ANTHROPIC_API_KEY` to env (already set on `services/autoposter`, just reference)
4. Test locally with `python content_engine/main.py --stats` then `--batch 1`

### Phase 2B — Move keyword queue to Postgres (half day)

Currently a SQLite `content_engine/data/keywords.db`. Move to a `keywords` table in the shared Railway Postgres so the cron service is stateless.

Schema:
```sql
CREATE TABLE keywords (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'queued',  -- queued | drafted | published | rejected
  drafted_at TIMESTAMPTZ,
  article_id TEXT,
  rejected_reason TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 2C — Schema markup generator (half day)

For each generated article, output JSON-LD blocks:

- `BlogPosting` (article schema)
- `LocalBusiness` (Joshua Fink Group)
- `BreadcrumbList` (Home → Blog → Article)
- `FAQPage` if the article has a FAQ section (most should)

Inject into the markdown frontmatter or as a generated `.ts` block. Next.js's `app/blog/[slug]/page.tsx` already renders structured data — verify it picks up our additions.

### Phase 2D — Auto-publish loop + refill queue (1 day)

1. **Decide blog source-of-truth shape.** Currently `lib/blog.ts` is a giant TypeScript array (29 entries). Options:
   - **A:** Append to `lib/blog.ts` (string manipulation, fragile)
   - **B (recommended):** Refactor `lib/blog.ts` to read from `content/posts/*.md` using `gray-matter` + frontmatter. Then auto-publish = `git add content/posts/new-post.md && git commit && git push`. Vercel auto-deploys.
2. Build the publish step in content_engine: when article quality score ≥ 8.5, run the markdown commit. Score 7.0–8.4 → ClickUp task for Josh to review.
3. Refill keyword queue. Initial seed:
   - 30 buyer-side long-tails ("best neighborhoods in Brentwood for families", etc.)
   - 30 seller-side ("how to sell your home fast in Franklin TN")
   - 30 local-info ("Nashville vs Brentwood cost of living")
   - 30 cash-offer focused (consolidate from cashoffer-engine queue)
4. Schedule Railway cron: M-F 5am CT (`0 11 * * 1-5` UTC, like flipintel).

### Phase 3 — ClickUp integration (~half day)

1. Get Josh's ClickUp workspace + Joshua Fink space + list IDs
2. Add `src/clickup.ts` (autoposter) and `engine/clickup.py` (content_engine) that POST tasks
3. Wire status reporting:
   - **Daily rollup task** (per project) — green if everything worked, red if any failure
   - **Failure tasks** — high priority, with logs
   - **Review tasks** — drafts at score 7.0–8.4 needing approval

### Phase 4 — Cutover (1 hour)

1. Disable local `com.joshuafink.content-engine` + `com.joshuafink.cashoffer-engine` plists (Railway owns it now)
2. Verify next morning's Railway run fires green
3. Archive disabled plists to `~/Library/LaunchAgents/.disabled/`

### Phase 5 (lower priority) — Republish backlog

`content_engine/output/approved/` has 10 articles that passed quality checks but were never published. Quick win: walk through them, decide keep/skip, batch-publish through the new auto-publish loop.

---

## Open decisions for Josh

1. **GBP through Ayrshare or direct (Option A in 1D)?** — I'm recommending direct (port to TS).
2. **Blog source-of-truth refactor (Option B in 2D)?** — I'm recommending `content/posts/*.md` files because lib/blog.ts string manipulation is fragile.
3. **ClickUp list to use** — Josh, drop me the space/list IDs when you're ready (or I can list via ClickUp MCP).
4. **Ayrshare timing** — sign up now so we can wire LinkedIn in Phase 1C, or postpone LinkedIn until everything else is shipped?

---

## Cost / runtime estimate

| Item | Cost / mo |
| --- | --- |
| Railway hobby plan | ~$5 (already paying for FlipIntel) |
| Anthropic Sonnet 4.6 for ~90 articles/month | ~$5–10 |
| Ayrshare Business tier (FB+IG+LinkedIn — or just LinkedIn if going direct elsewhere) | $29 |
| **Total new spend** | **~$40/mo** |

Time-to-ship: **Phase 1A in 1 day, full pipeline (Phases 1–4) in 5–7 focused days.**
