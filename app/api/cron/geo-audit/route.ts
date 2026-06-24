import { NextResponse } from 'next/server';
import { BRAND, GEO_QUERIES } from '@/lib/geo-queries';
import { askAllEngines, configuredEngines } from '@/lib/geo-engines';
import { detectBrand, computeGeoScore, type GeoResultRow } from '@/lib/geo-score';
import { recordGeoRun } from '@/lib/geo-db';

export const dynamic = 'force-dynamic';
// Web-search calls take a few seconds each; give the batch room.
export const maxDuration = 300;

// GEO visibility tracker — the "GEO score" + daily-task engine.
//
// Asks each configured answer engine (Perplexity / OpenAI / Claude) the target
// Middle TN questions WITH live web access, detects whether Joshua surfaced
// (joshuafink.com cited or "Joshua Fink" named), records every result, and
// returns the score. The questions we lose are the daily to-do list: each one
// names the exact page to strengthen for AI answers.
//
// Required env:
//   CRON_SECRET     — shared across /api/cron/* (auth)
// At least one of (engine is skipped if its key is absent):
//   PERPLEXITY_API_KEY · OPENAI_API_KEY · ANTHROPIC_API_KEY
// Optional model overrides: GEO_CLAUDE_MODEL · GEO_OPENAI_MODEL · GEO_PERPLEXITY_MODEL

const CONCURRENCY = 3; // queries in flight at once (each fans out to all engines)

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'geo-audit cron not configured (missing CRON_SECRET)' },
      { status: 500 },
    );
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const engines = configuredEngines();
  if (engines.length === 0) {
    // Not an error — the pipeline is built; it just needs an API key to run.
    return NextResponse.json({
      ran: false,
      reason: 'no answer-engine API keys configured (set PERPLEXITY_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)',
    });
  }

  const runId = new Date().toISOString();
  const rows: GeoResultRow[] = [];

  // Bounded-concurrency walk over the query list.
  let cursor = 0;
  async function worker() {
    while (cursor < GEO_QUERIES.length) {
      const q = GEO_QUERIES[cursor++];
      const outputs = await askAllEngines(q.prompt);
      for (const out of outputs) {
        const detection = detectBrand(out.answerText, out.sourceUrls, BRAND);
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
        });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, GEO_QUERIES.length) }, worker));

  const score = computeGeoScore(rows);
  const written = await recordGeoRun(rows);

  // The to-do list: successful checks where Joshua did NOT surface, with the
  // page to strengthen — this is what makes the score actionable.
  const gaps = rows
    .filter((r) => r.ok && !r.detection.cited)
    .map((r) => ({
      engine: r.engine,
      query: r.query,
      fix: GEO_QUERIES.find((q) => q.id === r.queryId)?.targetPath ?? null,
    }));

  return NextResponse.json({
    ran: true,
    runId,
    engines,
    geoScore: score.overall,
    byEngine: score.byEngine,
    checks: score.total,
    surfaced: score.cited,
    rowsWritten: written,
    gaps,
    at: runId,
  });
}
