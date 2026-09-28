# GEO visibility tracker

Measures **Generative Engine Optimization** — whether AI answer engines
(ChatGPT/Perplexity/Grok) surface Joshua when Middle TN buyers and sellers ask
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
| `XAI_API_KEY` | Grok (`grok-4.3`, Responses + `web_search`) | Live web search is on. Unset skips Grok with a warning and does not fail the run. |
| `CRON_SECRET` | — | already set for the other `/api/cron/*` routes |

The weekly job is GitHub Actions `geo-audit.yml` (Mondays 13:00 UTC, `workflow_dispatch` kept). Add `XAI_API_KEY` as an Actions secret before a manual run will include Grok. The same key can live in Vercel env for `/api/cron/geo-audit`.

Claude (Anthropic) was removed 2026-09-28. `ANTHROPIC_API_KEY` and `GEO_CLAUDE_MODEL` are ignored. Historical `geo_visibility` rows with `engine = claude` stay in the database; new runs do not write them.

Optional model overrides: `GEO_PERPLEXITY_MODEL` (default `sonar`), `GEO_OPENAI_MODEL` (default `gpt-4o`), `GEO_GROK_MODEL` (default `grok-4.3`). `grok-4.3` is the current cheaper general model ($1.25 / $2.50 per 1M tokens). `grok-4.5`, `grok-4.6`, and `grok-4.7` are the expensive tier ($2 / $6) and are not the default.

**Cost:** ~15 queries × N engines web-search calls per run, daily (`0 13 * * *` UTC = 8am CT). To trim: start with **Perplexity only** (cheapest), or change the schedule in `vercel.json` to weekly (`0 13 * * 1`).

## Reading the result

`GET /api/cron/geo-audit` (with `Authorization: Bearer $CRON_SECRET`) returns:
```json
{ "geoScore": 40, "byEngine": { "perplexity": { "score": 53, ... } },
  "checks": 15, "surfaced": 6,
  "notScored": 2, "failures": [ { "engine": "perplexity", "queryId": "agent-franklin", "error": "timeout after 90s" } ],
  "gaps": [ { "page": "/buy/franklin-tn", "losses": 4 } ],
  "citedInstead": [ { "host": "zillow.com", "hits": 28 } ] }
```
`gaps` is the to-do list, deduped by page — the loss count ranks which page to
strengthen (more sourced stats, FAQ schema, entity/NAP consistency).
`citedInstead` is the off-site half: the domains the engines cite when we don't
surface, i.e. the profiles and "best agent" listicles worth getting onto.
`notScored` counts engine calls that errored — those are excluded from the
score, so a high number means the score is under-reporting, not that visibility
dropped. Trend the score over runs via `geoScoreTrend()` in `lib/geo-db.ts`.

## Next steps (not built yet)
- Surface the score + trend on `/admin`.
- Fold the GEO score into the morning healthcheck email.
- Add an alert when the score drops week-over-week.
