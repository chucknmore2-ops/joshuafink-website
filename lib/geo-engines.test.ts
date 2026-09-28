// Retry / failure classification for GEO answer-engine calls.
//
// Run: npm test
//
// Weekly GEO was dropping Perplexity on request_rate_limit_exceeded (HTTP 429)
// because retries fired immediately at concurrency 3. These pin the classifier
// (credits must win over a 429) and the backoff schedule.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  askAllEngines,
  classifyFailure,
  configuredEngines,
  GEO_QUERY_CONCURRENCY,
  nextRetryDelayMs,
  parseRetryAfterMs,
  rateLimitDelayMs,
} from './geo-engines.ts'

test('default query concurrency is 1 so Perplexity is not triple-fired', () => {
  assert.equal(GEO_QUERY_CONCURRENCY, 1)
})

test('insufficient_quota on HTTP 429 is credits, not rate-limit', () => {
  assert.equal(classifyFailure('HTTP 429: {"error":{"code":"insufficient_quota"}}'), 'credits')
})

test('request_rate_limit_exceeded is rate-limit', () => {
  assert.equal(
    classifyFailure('HTTP 429: {"error":{"type":"request_rate_limit_exceeded"}}'),
    'rate-limit',
  )
})

test('HTTP 429 alone is rate-limit', () => {
  assert.equal(classifyFailure('HTTP 429: too many requests'), 'rate-limit')
})

test('HTTP 401 is auth', () => {
  assert.equal(classifyFailure('HTTP 401: invalid_api_key'), 'auth')
})

test('rate-limit backoff grows exponentially and caps', () => {
  const noJitter = () => 0
  assert.equal(rateLimitDelayMs(1, noJitter), 2_000)
  assert.equal(rateLimitDelayMs(2, noJitter), 4_000)
  assert.equal(rateLimitDelayMs(3, noJitter), 8_000)
  assert.equal(rateLimitDelayMs(4, noJitter), 16_000)
  assert.equal(rateLimitDelayMs(5, noJitter), 20_000)
})

test('rate-limit backoff jitter is at most 50%', () => {
  const full = () => 0.999
  const d = rateLimitDelayMs(1, full)
  assert.ok(d >= 2_000)
  assert.ok(d < 2_000 + 1_000)
})

test('nextRetryDelayMs does not retry credits or auth', () => {
  assert.equal(nextRetryDelayMs('credits', 1), null)
  assert.equal(nextRetryDelayMs('auth', 1), null)
})

test('nextRetryDelayMs retries rate-limit up to four attempts', () => {
  assert.equal(nextRetryDelayMs('rate-limit', 1, { random: () => 0 }), 2_000)
  assert.equal(nextRetryDelayMs('rate-limit', 3, { random: () => 0 }), 8_000)
  assert.equal(nextRetryDelayMs('rate-limit', 4, { random: () => 0 }), null)
})

test('nextRetryDelayMs retries timeout/other once immediately', () => {
  assert.equal(nextRetryDelayMs('timeout', 1), 0)
  assert.equal(nextRetryDelayMs('timeout', 2), null)
  assert.equal(nextRetryDelayMs('other', 1), 0)
  assert.equal(nextRetryDelayMs('other', 2), null)
})

test('parseRetryAfterMs reads seconds from the error suffix', () => {
  assert.equal(parseRetryAfterMs('HTTP 429: busy retry-after=5'), 5_000)
  assert.equal(parseRetryAfterMs('HTTP 429: no hint'), null)
})

test('nextRetryDelayMs honors a longer Retry-After, capped', () => {
  assert.equal(
    nextRetryDelayMs('rate-limit', 1, { random: () => 0, retryAfterMs: 10_000 }),
    10_000,
  )
  assert.equal(
    nextRetryDelayMs('rate-limit', 1, { random: () => 0, retryAfterMs: 120_000 }),
    20_000,
  )
})

// Grok adapter. HTTP is mocked; nothing here calls api.x.ai.
// Subtests share process.env and fetch, so they run one at a time.

const ENGINE_KEYS = ['PERPLEXITY_API_KEY', 'OPENAI_API_KEY', 'XAI_API_KEY', 'GEO_GROK_MODEL'] as const

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENGINE_KEYS.map((k) => [k, process.env[k]]))
}

function restoreEnv(prev: Record<string, string | undefined>): void {
  for (const k of ENGINE_KEYS) {
    if (prev[k] === undefined) delete process.env[k]
    else process.env[k] = prev[k]
  }
}

test('grok engine', { concurrency: 1 }, async (t) => {
  const realFetch = globalThis.fetch

  await t.test('posts to the xAI Responses API with live web search', async () => {
    const prev = snapshotEnv()
    delete process.env.PERPLEXITY_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.GEO_GROK_MODEL
    process.env.XAI_API_KEY = 'test-xai-key'
    let seenUrl = ''
    let seenAuth = ''
    let seenBody: unknown
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seenUrl = String(input)
      seenAuth = new Headers(init?.headers).get('Authorization') ?? ''
      seenBody = JSON.parse(String(init?.body))
      return new Response(
        JSON.stringify({
          citations: ['https://www.joshuafink.com/buy/franklin-tn'],
          output: [
            {
              type: 'message',
              content: [
                {
                  type: 'output_text',
                  text: 'Joshua Fink is a Franklin realtor.',
                  annotations: [{ type: 'url_citation', url: 'https://www.compass.com/agents/joshua-fink' }],
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }) as typeof fetch
    try {
      assert.deepEqual(configuredEngines(), ['grok'])
      const [out] = await askAllEngines('Who is a good realtor in Franklin TN?')
      assert.equal(seenUrl, 'https://api.x.ai/v1/responses')
      assert.equal(seenAuth, 'Bearer test-xai-key')
      assert.deepEqual(seenBody, {
        model: 'grok-4.3',
        input: [{ role: 'user', content: 'Who is a good realtor in Franklin TN?' }],
        tools: [{ type: 'web_search' }],
      })
      assert.equal(out.engine, 'grok')
      assert.equal(out.ok, true)
      assert.equal(out.model, 'grok-4.3')
      assert.equal(out.error, null)
      assert.equal(out.answerText, 'Joshua Fink is a Franklin realtor.')
      assert.deepEqual(out.sourceUrls, [
        'https://www.joshuafink.com/buy/franklin-tn',
        'https://www.compass.com/agents/joshua-fink',
      ])
    } finally {
      globalThis.fetch = realFetch
      restoreEnv(prev)
    }
  })

  await t.test('GEO_GROK_MODEL overrides the default model', async () => {
    const prev = snapshotEnv()
    delete process.env.PERPLEXITY_API_KEY
    delete process.env.OPENAI_API_KEY
    process.env.XAI_API_KEY = 'test-xai-key'
    process.env.GEO_GROK_MODEL = 'grok-4.20-0309-non-reasoning'
    let seenModel = ''
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      seenModel = JSON.parse(String(init?.body)).model
      return new Response(JSON.stringify({ output_text: 'ok', citations: [] }), { status: 200 })
    }) as typeof fetch
    try {
      const [out] = await askAllEngines('q')
      assert.equal(seenModel, 'grok-4.20-0309-non-reasoning')
      assert.equal(out.model, 'grok-4.20-0309-non-reasoning')
      assert.equal(out.answerText, 'ok')
    } finally {
      globalThis.fetch = realFetch
      restoreEnv(prev)
    }
  })

  await t.test('unset XAI_API_KEY skips grok with a warning and does not call xAI', async () => {
    const prev = snapshotEnv()
    process.env.PERPLEXITY_API_KEY = 'test-pplx-key'
    delete process.env.OPENAI_API_KEY
    // GitHub Actions passes an empty string when the secret is not set.
    process.env.XAI_API_KEY = ''
    let calls = 0
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls += 1
      assert.equal(String(input).includes('api.x.ai'), false)
      return new Response(
        JSON.stringify({ choices: [{ message: { content: 'sonar answer' } }], citations: [] }),
        { status: 200 },
      )
    }) as typeof fetch
    const warnings: string[] = []
    const realWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map(String).join(' '))
    }
    try {
      assert.deepEqual(configuredEngines(), ['perplexity'])
      assert.ok(warnings.some((w) => w.includes('XAI_API_KEY unset — skipping grok engine')))
      const outs = await askAllEngines('q')
      assert.equal(outs.length, 1)
      assert.equal(outs[0].engine, 'perplexity')
      assert.equal(outs[0].ok, true)
      assert.equal(calls, 1)
    } finally {
      console.warn = realWarn
      globalThis.fetch = realFetch
      restoreEnv(prev)
    }
  })

  await t.test('an xAI HTTP error is a soft failure, not a throw', async () => {
    const prev = snapshotEnv()
    delete process.env.PERPLEXITY_API_KEY
    delete process.env.OPENAI_API_KEY
    process.env.XAI_API_KEY = 'test-xai-key'
    let calls = 0
    globalThis.fetch = (async () => {
      calls += 1
      return new Response('boom', { status: 500 })
    }) as typeof fetch
    try {
      const [out] = await askAllEngines('q')
      assert.equal(out.engine, 'grok')
      assert.equal(out.ok, false)
      assert.equal(out.answerText, '')
      assert.deepEqual(out.sourceUrls, [])
      assert.match(out.error ?? '', /HTTP 500/)
      assert.equal(calls, 2)
    } finally {
      globalThis.fetch = realFetch
      restoreEnv(prev)
    }
  })
})
