# GEO visibility tracker

Measures **Generative Engine Optimization** — whether AI answer engines
(ChatGPT/Perplexity/Claude) surface Joshua when Middle TN buyers and sellers ask
them for an agent, a home value, a cash offer, etc. It's the GEO equivalent of
rank tracking: a number you can trend, plus a punch list of which pages to
strengthen.

Why it matters: AI answer engines are increasingly the first touchpoint, and
ChatGPT Search runs on Bing's index — which the IndexNow fix (PR #116) now feeds.

## How it works

Daily Vercel cron `GET /api/cron/geo-audit` →
1. asks each **configured** engine the 15 target prompts in `lib/geo-queries.ts`, **with live web search**;
2. detects whether Joshua surfaced — `joshuafink.com` cited in a source, or "Joshua Fink" named in the answer (`lib/geo-score.ts`, pure + engine-agnostic);
3. writes one row per (run, engine, query) to the `geo_visibility` table (`lib/geo-db.ts`, created idempotently);
4. returns the **GEO score** (% of checks where Joshua surfaced) and the **gaps** (questions we lost + the page to fix).

The score excludes failed engine calls, so an outage can't skew it.

## Turning it on (it's key-gated — does nothing until a key is set)

Set **at least one** answer-engine key in Vercel env, plus the shared cron secret:

| Env var | Engine | Notes |
|---|---|---|
| `PERPLEXITY_API_KEY` | Perplexity (Sonar) | **Cheapest** — best starting point for a daily run |
| `OPENAI_API_KEY` | ChatGPT (Responses + web_search) | |
| `ANTHROPIC_API_KEY` | Claude (Messages + web_search) | |
| `CRON_SECRET` | — | already set for the other `/api/cron/*` routes |

Optional model overrides: `GEO_PERPLEXITY_MODEL` (default `sonar`), `GEO_OPENAI_MODEL` (default `gpt-4o`), `GEO_CLAUDE_MODEL` (default `claude-opus-4-8` — set to `claude-haiku-4-5` to cut cost).

**Cost:** ~15 queries × N engines web-search calls per run, daily (`0 13 * * *` UTC = 8am CT). To trim: start with **Perplexity only** (cheapest), or change the schedule in `vercel.json` to weekly (`0 13 * * 1`).

## Reading the result

`GET /api/cron/geo-audit` (with `Authorization: Bearer $CRON_SECRET`) returns:
```json
{ "geoScore": 40, "byEngine": { "perplexity": { "score": 53, ... } },
  "checks": 15, "surfaced": 6,
  "gaps": [ { "engine": "perplexity", "query": "Who is the best agent in Franklin, TN?", "fix": "/buy/franklin" } ] }
```
`gaps` is the to-do list — each lost question names the page to strengthen
(more sourced stats, FAQ schema, entity/NAP consistency). Trend the score over
runs via `geoScoreTrend()` in `lib/geo-db.ts`.

## Next steps (not built yet)
- Surface the score + trend on `/admin`.
- Fold the GEO score into the morning healthcheck email.
- Add an alert when the score drops week-over-week.
