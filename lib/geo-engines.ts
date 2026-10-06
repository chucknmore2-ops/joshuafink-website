// Answer-engine adapters for the GEO visibility tracker.
//
// Each adapter asks one consumer AI answer engine a question *with live web
// access* and returns a normalized { answerText, sourceUrls } so the pure
// detector in geo-score.ts can decide whether Joshua surfaced. Every engine is
// independently gated on its API key and fails soft — a missing key or a bad
// response skips that engine for this run, it never throws into the cron.
//
// Engines chosen because they're what Middle TN consumers actually use, and
// because ChatGPT Search runs on Bing (which our IndexNow fix now feeds):
//   - Perplexity (Sonar)      — purpose-built web answer engine, returns citations
//   - OpenAI (Responses + web_search) — ChatGPT's engine
//   - xAI Grok (Responses + web_search) — grok.com / X
//
// Claude (Anthropic Messages API) was removed 2026-09-28 with the weekly
// agent briefing. Do not call api.anthropic.com from here. ANTHROPIC_API_KEY
// is unused; a leftover value must not start a Claude engine.
//
// Raw fetch is used uniformly across providers on purpose: this is a
// multi-provider abstraction with no shared SDK, and a single transport keeps
// the adapters parallel.

import { extractUrls } from './geo-score';

export interface EngineOutput {
  engine: string;
  ok: boolean;
  model: string | null;
  answerText: string;
  sourceUrls: string[];
  error: string | null;
}

// Web-search calls can run well past a short abort. A failed call is excluded
// from the score, so the timeout has to be long enough that a slow Perplexity
// or OpenAI response is still scored.
const TIMEOUT_MS = 90_000;
// Timeout / 5xx: one immediate retry. Rate limits get more attempts below.
const ATTEMPTS = 2;
// Perplexity (and others) return request_rate_limit_exceeded as HTTP 429.
// Immediate retries just re-hit the same window; back off instead.
const RATE_LIMIT_ATTEMPTS = 4;
const RATE_LIMIT_BASE_MS = 2_000;
const RATE_LIMIT_CAP_MS = 20_000;

// Queries in flight at once (each fans out to all configured engines). 3 made
// Perplexity 429 on the weekly run; 1 keeps one Sonar call at a time.
export const GEO_QUERY_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.GEO_CONCURRENCY ?? '1', 10) || 1,
);

const OPENAI_MODEL = process.env.GEO_OPENAI_MODEL || 'gpt-4o';
const PERPLEXITY_MODEL = process.env.GEO_PERPLEXITY_MODEL || 'sonar';

// grok-4.3 is a current general model at $1.25 / $2.50 per 1M tokens.
// grok-4.5, grok-4.6, and grok-4.7 are the expensive tier ($2 / $6).
// Read per call so GEO_GROK_MODEL matches the other GEO_*_MODEL overrides.
function grokModel(): string {
  return process.env.GEO_GROK_MODEL || 'grok-4.3';
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* non-JSON error body */
    }
    if (!res.ok) {
      const retryAfter = res.headers.get('retry-after');
      const hint = retryAfter ? ` retry-after=${retryAfter}` : '';
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}${hint}`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

// ── Perplexity (Sonar) ──────────────────────────────────────────────────────
async function runPerplexity(query: string): Promise<EngineOutput> {
  const key = process.env.PERPLEXITY_API_KEY!;
  const data = (await postJson(
    'https://api.perplexity.ai/chat/completions',
    { Authorization: `Bearer ${key}` },
    { model: PERPLEXITY_MODEL, messages: [{ role: 'user', content: query }] },
  )) as any;
  const answerText: string = data?.choices?.[0]?.message?.content ?? '';
  // Perplexity returns a top-level `citations` (and/or `search_results`) array;
  // also sweep the whole payload so we don't depend on the exact field.
  const cited: string[] = Array.isArray(data?.citations) ? data.citations : [];
  const sourceUrls = Array.from(new Set([...cited, ...extractUrls(data)]));
  return { engine: 'perplexity', ok: true, model: PERPLEXITY_MODEL, answerText, sourceUrls, error: null };
}

// ── OpenAI (Responses API + web_search) ─────────────────────────────────────
async function runOpenAI(query: string): Promise<EngineOutput> {
  const key = process.env.OPENAI_API_KEY!;
  const data = (await postJson(
    'https://api.openai.com/v1/responses',
    { Authorization: `Bearer ${key}` },
    { model: OPENAI_MODEL, tools: [{ type: 'web_search' }], input: query },
  )) as any;
  // `output_text` is the convenience aggregate; fall back to walking output blocks.
  let answerText: string = data?.output_text ?? '';
  if (!answerText && Array.isArray(data?.output)) {
    answerText = data.output
      .flatMap((o: any) => (Array.isArray(o?.content) ? o.content : []))
      .map((c: any) => c?.text ?? '')
      .join(' ')
      .trim();
  }
  const sourceUrls = extractUrls(data); // citations live in output[].content[].annotations[].url
  return { engine: 'openai', ok: true, model: OPENAI_MODEL, answerText, sourceUrls, error: null };
}

// ── xAI Grok (Responses API + web_search) ───────────────────────────────────
// OpenAI-compatible base https://api.x.ai/v1. Live search is the Responses
// `web_search` tool. Chat completions accept that tool and then ignore it, so
// this adapter does not call /v1/chat/completions.
async function runGrok(query: string): Promise<EngineOutput> {
  const key = process.env.XAI_API_KEY!;
  const model = grokModel();
  const data = (await postJson(
    'https://api.x.ai/v1/responses',
    { Authorization: `Bearer ${key}` },
    {
      model,
      input: [{ role: 'user', content: query }],
      tools: [{ type: 'web_search' }],
    },
  )) as any;
  // Same shape as OpenAI Responses. `output_text` is optional on xAI; the
  // documented payload puts prose on output[].content[].text. `citations` is
  // the full URL list the agent opened.
  let answerText: string = data?.output_text ?? '';
  if (!answerText && Array.isArray(data?.output)) {
    answerText = data.output
      .flatMap((o: any) => (Array.isArray(o?.content) ? o.content : []))
      .map((c: any) => c?.text ?? '')
      .join(' ')
      .trim();
  }
  const cited: string[] = Array.isArray(data?.citations)
    ? data.citations.filter((u: unknown) => typeof u === 'string')
    : [];
  const sourceUrls = Array.from(new Set([...cited, ...extractUrls(data)]));
  return { engine: 'grok', ok: true, model, answerText, sourceUrls, error: null };
}

interface EngineDef {
  name: string;
  envKey: string;
  run: (query: string) => Promise<EngineOutput>;
}

const ENGINES: EngineDef[] = [
  { name: 'perplexity', envKey: 'PERPLEXITY_API_KEY', run: runPerplexity },
  { name: 'openai', envKey: 'OPENAI_API_KEY', run: runOpenAI },
  { name: 'grok', envKey: 'XAI_API_KEY', run: runGrok },
];

/** Engines that have an API key configured this run. */
export function configuredEngines(): string[] {
  // A missing Grok key skips that engine only. Perplexity and OpenAI already
  // drop out the same way (filter below) without a log line; Grok warns so a
  // weekly run that forgot XAI_API_KEY is visible and still succeeds.
  if (!process.env.XAI_API_KEY) {
    console.warn('[geo] XAI_API_KEY unset — skipping grok engine');
  }
  return ENGINES.filter((e) => process.env[e.envKey]).map((e) => e.name);
}

/** Human-readable failure reason (an aborted fetch just says "aborted"). */
/**
 * Why a call failed, in the only terms that change what we do about it:
 * 'credits' and 'auth' stay dead until someone tops up or rotates a key and will
 * never self-heal, while 'rate-limit' and 'timeout' usually clear by next run.
 *
 * Order matters — OpenAI reports an exhausted balance as HTTP **429** with
 * `insufficient_quota`, the same status code as a genuine rate limit, so the
 * credits test must run before the rate-limit test or a dead balance reads as
 * transient. That exact collision is what let ChatGPT sit out three whole runs
 * on an empty balance while the workflow still reported success.
 */
export type FailureKind = 'credits' | 'auth' | 'rate-limit' | 'timeout' | 'other';

export function classifyFailure(msg: string | null | undefined): FailureKind {
  const m = (msg ?? '').toLowerCase();
  if (
    /insufficient_quota|no credits remaining|credit balance|billing|payment required|http 402/.test(m)
  )
    return 'credits';
  if (/http 401|http 403|invalid_api_key|invalid x-api-key|authentication_error/.test(m))
    return 'auth';
  if (/rate.?limit|http 429/.test(m)) return 'rate-limit';
  if (/timeout/.test(m)) return 'timeout';
  return 'other';
}

/** What a human has to actually go do, per failure kind. */
export const FIX_HINT: Record<FailureKind, string> = {
  credits: 'top up the API balance',
  auth: 'the API key is rejected — rotate it in repo Secrets',
  'rate-limit': 'rate-limited after retries — usually clears by next run',
  timeout: 'every call timed out — check the model/timeout settings',
  other: 'see the workflow log',
};

function reasonOf(err: unknown): string {
  const e = err as Error;
  if (e?.name === 'AbortError' || /abort/i.test(e?.message ?? '')) {
    return `timeout after ${TIMEOUT_MS / 1000}s`;
  }
  return e?.message?.slice(0, 240) || 'unknown error';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Numeric `Retry-After` seconds from the suffix appended to the HTTP error. */
export function parseRetryAfterMs(msg: string): number | null {
  const m = /retry-after[=:\s]+(\d+(?:\.\d+)?)/i.exec(msg);
  if (!m) return null;
  const seconds = Number(m[1]);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.round(seconds * 1000);
}

/** Exponential backoff with up to 50% additive jitter. `failedAttempt` is 1-based. */
export function rateLimitDelayMs(failedAttempt: number, random: () => number = Math.random): number {
  const exp = Math.min(RATE_LIMIT_CAP_MS, RATE_LIMIT_BASE_MS * 2 ** Math.max(0, failedAttempt - 1));
  const jitter = Math.floor(Math.max(0, Math.min(1, random())) * exp * 0.5);
  return exp + jitter;
}

export type RetryDelayOpts = {
  random?: () => number;
  retryAfterMs?: number | null;
};

/**
 * Ms to wait before the next try, or null to stop.
 * Credits/auth never self-heal. Rate limits back off; timeout/other retry once immediately.
 */
export function nextRetryDelayMs(
  kind: FailureKind,
  failedAttempt: number,
  opts: RetryDelayOpts = {},
): number | null {
  if (kind === 'credits' || kind === 'auth') return null;
  const maxAttempts = kind === 'rate-limit' ? RATE_LIMIT_ATTEMPTS : ATTEMPTS;
  if (failedAttempt >= maxAttempts) return null;
  if (kind !== 'rate-limit') return 0;
  const computed = rateLimitDelayMs(failedAttempt, opts.random);
  const hinted = opts.retryAfterMs;
  if (hinted != null && hinted > 0) {
    return Math.min(RATE_LIMIT_CAP_MS, Math.max(computed, hinted));
  }
  return computed;
}

/**
 * Ask every configured engine one query. Each engine resolves to an
 * EngineOutput — `ok:false` with an error string on failure, never a throw.
 * Transient failures retry; 429s wait with exponential backoff + jitter.
 */
export async function askAllEngines(query: string): Promise<EngineOutput[]> {
  const active = ENGINES.filter((e) => process.env[e.envKey]);
  return Promise.all(
    active.map(async (e): Promise<EngineOutput> => {
      let lastErr: unknown;
      for (let attempt = 1; ; attempt++) {
        try {
          return await e.run(query);
        } catch (err) {
          lastErr = err;
          const reason = reasonOf(err);
          const kind = classifyFailure(reason);
          const delay = nextRetryDelayMs(kind, attempt, { retryAfterMs: parseRetryAfterMs(reason) });
          if (delay == null) break;
          const wait = delay > 0 ? ` in ${delay}ms` : '';
          console.warn(`[geo] ${e.name} attempt ${attempt} failed (${reason}) — retrying${wait}`);
          if (delay > 0) await sleep(delay);
        }
      }
      return {
        engine: e.name,
        ok: false,
        model: null,
        answerText: '',
        sourceUrls: [],
        error: reasonOf(lastErr),
      };
    }),
  );
}
