/**
 * GEO visibility audit runner — GitHub Actions edition.
 *
 * Free replacement for the Vercel `geo-audit` cron. Vercel's Hobby plan caps
 * cron jobs at 2 and can't run this job's ~5-minute, 3-engine web-search batch,
 * so the Vercel cron never actually ran. This script does the identical work as
 * app/api/cron/geo-audit/route.ts but standalone on a GitHub Actions runner
 * (free, no cron count / duration limits).
 *
 * It asks each configured answer engine the Middle-TN GEO_QUERIES with live web
 * access, detects whether Joshua surfaced, records every row to the
 * `geo_visibility` table, and pushes the score to Pushover.
 *
 * NOTE: it deliberately does NOT import lib/geo-db (that file is `server-only`
 * and throws outside Next). The insert is replicated here with `pg` directly,
 * kept in sync with lib/geo-db.ts.
 *
 * Env (all via GitHub Secrets in .github/workflows/geo-audit.yml):
 *   >=1 of PERPLEXITY_API_KEY | OPENAI_API_KEY | ANTHROPIC_API_KEY  (engines
 *        run only when their key is present, so this degrades gracefully)
 *   DATABASE_URL     optional — persistence is skipped if absent
 *   PUSHOVER_TOKEN + PUSHOVER_USER  optional — the alert is skipped if absent
 */
import { Pool } from 'pg'
import { BRAND, GEO_QUERIES } from '../lib/geo-queries'
import { askAllEngines, configuredEngines, classifyFailure, FIX_HINT } from '../lib/geo-engines'
import {
  detectBrand,
  computeGeoScore,
  topCompetingSources,
  type GeoResultRow,
} from '../lib/geo-score'

const CONCURRENCY = 3 // queries in flight at once (each fans out to all engines)

// Mirrors lib/geo-db.ts recordGeoRun, minus the `server-only` import.
async function persist(rows: GeoResultRow[]): Promise<number> {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log('[geo] DATABASE_URL not set — skipping persistence.')
    return 0
  }
  const pool = new Pool({
    connectionString: url,
    max: 1,
    ssl: url.includes('railway') ? { rejectUnauthorized: false } : undefined,
  })
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS geo_visibility (
        id              BIGSERIAL PRIMARY KEY,
        run_id          TEXT NOT NULL,
        engine          TEXT NOT NULL,
        model           TEXT,
        query_id        TEXT NOT NULL,
        query           TEXT NOT NULL,
        cited           BOOLEAN NOT NULL,
        cited_domain    BOOLEAN NOT NULL,
        mentioned_name  BOOLEAN NOT NULL,
        domain_rank     INTEGER,
        answer_preview  TEXT,
        source_urls     TEXT,
        ok              BOOLEAN NOT NULL,
        error_message   TEXT,
        checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`)
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_geo_visibility_recent ON geo_visibility (checked_at DESC)`,
    )
    let written = 0
    for (const r of rows) {
      await pool.query(
        `INSERT INTO geo_visibility
           (run_id, engine, model, query_id, query, cited, cited_domain,
            mentioned_name, domain_rank, answer_preview, source_urls, ok, error_message)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          r.runId,
          r.engine,
          r.model,
          r.queryId,
          r.query,
          r.detection.cited,
          r.detection.citedDomain,
          r.detection.mentionedName,
          r.detection.domainRank,
          r.answerPreview.slice(0, 500),
          JSON.stringify(r.sourceUrls.slice(0, 25)),
          r.ok,
          r.errorMessage,
        ],
      )
      written += 1
    }
    return written
  } finally {
    await pool.end()
  }
}

async function pushover(title: string, message: string, priority = 0): Promise<void> {
  const token = process.env.PUSHOVER_TOKEN
  const user = process.env.PUSHOVER_USER
  if (!token || !user) {
    console.log('[geo] Pushover creds absent — skipping phone alert.')
    return
  }
  const res = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token,
      user,
      title,
      message,
      priority: String(priority),
    }).toString(),
  })
  if (!res.ok) console.error('[geo] Pushover failed:', res.status, await res.text())
}

/** Resolves to the process exit code: 0 = healthy run, 1 = an engine gave no data. */
async function main(): Promise<number> {
  const engines = configuredEngines()
  if (engines.length === 0) {
    // Non-zero on purpose: in production all three keys are set, so "no engines"
    // means the Secrets went missing. A silent no-op must not read as success —
    // that is the same failure mode this run's engine-down check exists to catch.
    console.error(
      '[geo] No answer-engine API keys configured (set PERPLEXITY_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY). Nothing to run.',
    )
    return 1
  }
  console.log(`[geo] ${GEO_QUERIES.length} queries × engines: ${engines.join(', ')}`)

  const runId = new Date().toISOString()
  const rows: GeoResultRow[] = []

  // Bounded-concurrency walk over the query list (mirrors the route).
  let cursor = 0
  async function worker(): Promise<void> {
    while (cursor < GEO_QUERIES.length) {
      const q = GEO_QUERIES[cursor++]
      const outputs = await askAllEngines(q.prompt)
      for (const out of outputs) {
        const detection = detectBrand(out.answerText, out.sourceUrls, BRAND)
        rows.push({
          runId,
          engine: out.engine,
          model: out.model,
          queryId: q.id,
          query: q.prompt,
          ok: out.ok,
          errorMessage: out.error,
          detection,
          answerPreview: out.answerText.slice(0, 500),
          sourceUrls: out.sourceUrls,
        })
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, GEO_QUERIES.length) }, worker))

  const score = computeGeoScore(rows)
  const written = await persist(rows)

  // The to-do list: successful checks where Joshua did NOT surface, rolled up by
  // page. Listing one bullet per losing CHECK burned all 5 slots on 2 pages and
  // hid the other ~27 losses; one bullet per page with its loss count ranks the
  // work instead.
  const lossesByPage = new Map<string, number>()
  for (const r of rows) {
    if (!r.ok || r.detection.cited) continue
    const page = GEO_QUERIES.find((q) => q.id === r.queryId)?.targetPath ?? r.query
    lossesByPage.set(page, (lossesByPage.get(page) ?? 0) + 1)
  }
  const gaps = Array.from(lossesByPage, ([page, losses]) => ({ page, losses })).sort(
    (a, b) => b.losses - a.losses || a.page.localeCompare(b.page),
  )

  // Failed calls are excluded from the score, so an engine that times out reads
  // as a low score rather than as no data. Say so out loud.
  const failures = rows.filter((r) => !r.ok)
  const failsByEngine = new Map<string, { count: number; reason: string }>()
  for (const f of failures) {
    const e = failsByEngine.get(f.engine) ?? { count: 0, reason: f.errorMessage ?? 'unknown' }
    e.count += 1
    failsByEngine.set(f.engine, e)
  }
  const failLine = failures.length
    ? `\nnot scored: ${failures.length}/${rows.length} — ` +
      Array.from(failsByEngine, ([e, f]) => `${e} ×${f.count} (${f.reason.slice(0, 60)})`).join(', ')
    : ''

  // An engine whose every call failed contributes nothing and silently drops out
  // of `byEngine` — the run still reports success, the score just quietly covers
  // fewer engines, and a *smaller* denominator can even make the headline % go
  // UP while visibility is unchanged. That is how ChatGPT sat out three runs on
  // an empty balance while this workflow stayed green and the morning
  // healthcheck — which only watches the workflow conclusion — never paged.
  // Failing the run makes that existing healthcheck catch it for free.
  const downEngines = engines.flatMap((name) => {
    const mine = rows.filter((r) => r.engine === name)
    if (mine.some((r) => r.ok)) return []
    // No rows at all counts as down too — a configured engine that produced
    // nothing is the same silent absence of data, just arriving a different way.
    return [{ name, kind: mine.length ? classifyFailure(mine[0].errorMessage) : ('other' as const) }]
  })
  const downLine = downEngines.length
    ? `\n\n🚨 NO DATA AT ALL FROM:\n` +
      downEngines.map((d) => `• ${d.name} — ${FIX_HINT[d.kind]}`).join('\n')
    : ''
  // Only 'credits'/'auth' need Josh to go do something; the rest self-heal, so
  // they fail the run (data is genuinely missing) without buzzing his phone.
  const needsAction = downEngines.some((d) => d.kind === 'credits' || d.kind === 'auth')

  const competitors = topCompetingSources(rows, BRAND)
  const competitorLine = competitors.length
    ? `\n\nCited instead of us:\n` +
      competitors.map((c) => `• ${c.host} (${c.hits})`).join('\n')
    : ''

  const byEngine = Object.entries(score.byEngine)
    .map(([e, s]) => `${e} ${s.score}%`)
    .join(' · ')
  const shown = gaps.slice(0, 5)
  const gapHeader =
    gaps.length > shown.length
      ? `Pages to strengthen (top ${shown.length} of ${gaps.length}):`
      : 'Pages to strengthen:'
  const topGaps = shown.map((g) => `• ${g.page} (${g.losses})`).join('\n')
  const title = downEngines.length
    ? `⚠️ GEO ${score.overall}% — ${downEngines.map((d) => d.name).join(' + ')} DOWN`
    : `GEO ${score.overall}% — cited in ${score.cited}/${score.total} checks`
  const message =
    `${byEngine || 'no engines ran'}\nrows saved: ${written}${failLine}${downLine}\n\n` +
    `${gapHeader}\n${topGaps || '— none, Joshua surfaced everywhere 🎉'}` +
    competitorLine

  console.log(`\n${title}\n${message}\n`)
  for (const f of failures) {
    console.error(`[geo] FAILED ${f.engine} · ${f.queryId}: ${f.errorMessage}`)
  }
  await pushover(title, message, needsAction ? 1 : 0)

  if (downEngines.length) {
    for (const d of downEngines) {
      console.error(`[geo] ENGINE DOWN: ${d.name} (${d.kind}) — ${FIX_HINT[d.kind]}`)
    }
    return 1
  }
  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('[geo] FATAL:', err)
    process.exit(1)
  })
