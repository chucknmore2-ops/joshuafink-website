// Pure detection + scoring logic for the GEO visibility tracker.
//
// Engine-agnostic on purpose: every answer engine (Perplexity, OpenAI, Claude)
// returns a different JSON shape, so detection works off two normalized inputs —
// the answer prose and the list of source/citation URLs — both of which the
// engine adapters extract. No network, no DB; trivially unit-testable.

import type { BrandIdentity } from './geo-queries';

export interface Detection {
  /** Brand surfaced at all (domain cited OR name mentioned). The headline signal. */
  cited: boolean;
  /** joshuafink.com appeared in a source/citation URL or was named in the prose. */
  citedDomain: boolean;
  /** A name variant ("Joshua Fink") appeared in the answer prose. */
  mentionedName: boolean;
  /** 1-based position of the first joshuafink.com source URL, or null. */
  domainRank: number | null;
}

/** Lowercased, www-stripped hostname, or null if the string isn't a URL. */
export function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Pull every http(s) URL out of an arbitrary value (object, array, string).
 * Used to harvest citations/sources from each engine's response without
 * depending on that engine's exact field names — robust to API shape drift.
 */
export function extractUrls(value: unknown): string[] {
  const json = typeof value === 'string' ? value : safeStringify(value);
  const matches = json.match(/https?:\/\/[^\s"'<>)\]}\\]+/gi) ?? [];
  const cleaned = matches.map((u) => u.replace(/[.,;:]+$/, '')); // trim trailing punctuation
  return Array.from(new Set(cleaned));
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

/** Decide whether the brand surfaced in one engine answer. */
export function detectBrand(
  answerText: string,
  sourceUrls: string[],
  brand: BrandIdentity,
): Detection {
  const text = (answerText || '').toLowerCase();
  const domain = brand.domain.toLowerCase().replace(/^www\./, '');

  let domainRank: number | null = null;
  sourceUrls.forEach((url, i) => {
    if (domainRank !== null) return;
    const host = hostnameOf(url);
    if (host && (host === domain || host.endsWith('.' + domain))) {
      domainRank = i + 1;
    }
  });

  // The domain can also be named directly in prose ("check joshuafink.com")
  // without a formal citation — count that too.
  const domainInText = text.includes(domain);
  const citedDomain = domainRank !== null || domainInText;

  const mentionedName = brand.nameVariants.some((n) =>
    text.includes(n.toLowerCase()),
  );

  return {
    cited: citedDomain || mentionedName,
    citedDomain,
    mentionedName,
    domainRank,
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/** One stored measurement: did the brand surface for (engine, query) right now. */
export interface GeoResultRow {
  runId: string;
  engine: string;
  model: string | null;
  queryId: string;
  query: string;
  ok: boolean; // false when the engine call itself failed (excluded from score)
  errorMessage: string | null;
  detection: Detection;
  answerPreview: string;
  sourceUrls: string[];
}

export interface GeoScore {
  /** 0–100: share of successful (engine, query) checks where the brand surfaced. */
  overall: number;
  total: number;
  cited: number;
  byEngine: Record<string, { cited: number; total: number; score: number }>;
}

/**
 * The "GEO score": percent of successful checks where Joshua surfaced. Failed
 * engine calls (ok=false) are excluded so an outage can't tank or inflate it.
 */
export function computeGeoScore(rows: Pick<GeoResultRow, 'engine' | 'ok' | 'detection'>[]): GeoScore {
  const considered = rows.filter((r) => r.ok);
  const total = considered.length;
  const cited = considered.filter((r) => r.detection.cited).length;

  const byEngine: GeoScore['byEngine'] = {};
  for (const r of considered) {
    const b = (byEngine[r.engine] ??= { cited: 0, total: 0, score: 0 });
    b.total += 1;
    if (r.detection.cited) b.cited += 1;
  }
  for (const key of Object.keys(byEngine)) {
    const b = byEngine[key];
    b.score = b.total ? Math.round((100 * b.cited) / b.total) : 0;
  }

  return {
    overall: total ? Math.round((100 * cited) / total) : 0,
    total,
    cited,
    byEngine,
  };
}
