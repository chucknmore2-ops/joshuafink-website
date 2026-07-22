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
//   - Claude (Messages + web_search)  — claude.ai
//
// Raw fetch is used uniformly across all three providers on purpose: this is a
// multi-provider abstraction with no shared SDK, and a single transport keeps
// the adapters parallel. The Claude request shape (model id, web_search tool
// version, x-api-key + anthropic-version headers) follows the Anthropic docs.

import { extractUrls } from './geo-score';

export interface EngineOutput {
  engine: string;
  ok: boolean;
  model: string | null;
  answerText: string;
  sourceUrls: string[];
  error: string | null;
}

const TIMEOUT_MS = 45_000;

// Default Claude model is the flagship (what a claude.ai user actually gets);
// override to a cheaper model (e.g. claude-haiku-4-5) for a low-cost daily run.
const CLAUDE_MODEL = process.env.GEO_CLAUDE_MODEL || 'claude-opus-4-8';
const OPENAI_MODEL = process.env.GEO_OPENAI_MODEL || 'gpt-4o';
const PERPLEXITY_MODEL = process.env.GEO_PERPLEXITY_MODEL || 'sonar';

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
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
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

// ── Claude (Messages API + web_search) ──────────────────────────────────────
async function runClaude(query: string): Promise<EngineOutput> {
  const key = process.env.ANTHROPIC_API_KEY!;
  const data = (await postJson(
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    {
      model: CLAUDE_MODEL,
      // Web search runs a server-side loop (multiple server_tool_use rounds that
      // count against max_tokens). 1024 could be exhausted mid-search, truncating
      // the answer text we detect on — give it real headroom. Non-streaming, so
      // stay well under the SDK/HTTP timeout. web_search_20260209 is the current
      // tool version and is supported on Opus 4.8.
      max_tokens: 4096,
      messages: [{ role: 'user', content: query }],
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
    },
  )) as any;
  const answerText: string = Array.isArray(data?.content)
    ? data.content
        .filter((b: any) => b?.type === 'text')
        .map((b: any) => b?.text ?? '')
        .join(' ')
        .trim()
    : '';
  // Citations + web_search_tool_result URLs are scattered through content blocks;
  // sweep the whole response.
  const sourceUrls = extractUrls(data);
  return { engine: 'claude', ok: true, model: CLAUDE_MODEL, answerText, sourceUrls, error: null };
}

interface EngineDef {
  name: string;
  envKey: string;
  run: (query: string) => Promise<EngineOutput>;
}

const ENGINES: EngineDef[] = [
  { name: 'perplexity', envKey: 'PERPLEXITY_API_KEY', run: runPerplexity },
  { name: 'openai', envKey: 'OPENAI_API_KEY', run: runOpenAI },
  { name: 'claude', envKey: 'ANTHROPIC_API_KEY', run: runClaude },
];

/** Engines that have an API key configured this run. */
export function configuredEngines(): string[] {
  return ENGINES.filter((e) => process.env[e.envKey]).map((e) => e.name);
}

/**
 * Ask every configured engine one query. Each engine resolves to an
 * EngineOutput — `ok:false` with an error string on failure, never a throw.
 */
export async function askAllEngines(query: string): Promise<EngineOutput[]> {
  const active = ENGINES.filter((e) => process.env[e.envKey]);
  return Promise.all(
    active.map(async (e): Promise<EngineOutput> => {
      try {
        return await e.run(query);
      } catch (err) {
        return {
          engine: e.name,
          ok: false,
          model: null,
          answerText: '',
          sourceUrls: [],
          error: (err as Error).message?.slice(0, 240) ?? 'unknown error',
        };
      }
    }),
  );
}
