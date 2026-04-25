import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SITE = 'https://joshuafink.com'

// Hardcoded probe targets — never accept request-controlled URLs (SSRF).
// Each one represents a "site is live and healthy" signal we want to verify
// after a Vercel deploy. Failure of any one fails the whole probe.
const PROBES: ReadonlyArray<{ path: string; expectStatus: number }> = [
  { path: '/sitemap.xml', expectStatus: 200 },
  { path: '/blog/rss.xml', expectStatus: 200 },
  { path: '/api/healthcheck', expectStatus: 200 },
  { path: '/listings', expectStatus: 200 },
  { path: '/blog', expectStatus: 200 },
]

const PROBE_TIMEOUT_MS = 10_000

async function probe(path: string, expectStatus: number) {
  const url = `${SITE}${path}`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'joshuafink-refresh-probe/1.0' },
      cache: 'no-store',
    })
    return {
      path,
      ok: res.status === expectStatus,
      status: res.status,
      expected: expectStatus,
    }
  } catch (err) {
    return {
      path,
      ok: false,
      status: 0,
      expected: expectStatus,
      error: err instanceof Error ? err.name : 'fetch-failed',
    }
  } finally {
    clearTimeout(t)
  }
}

async function runProbes() {
  return Promise.all(PROBES.map((p) => probe(p.path, p.expectStatus)))
}

export async function POST(request: Request) {
  return handle(request)
}

// Vercel webhooks send POST, but allow GET so the endpoint can be
// curl'd manually with the same bearer for debugging.
export async function GET(request: Request) {
  return handle(request)
}

async function handle(request: Request) {
  const expected = process.env.DEPLOY_HOOK_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'refresh-listings webhook not configured (missing DEPLOY_HOOK_SECRET)' },
      { status: 500 },
    )
  }

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const results = await runProbes()
  const allOk = results.every((r) => r.ok)

  return NextResponse.json(
    {
      ok: allOk,
      timestamp: new Date().toISOString(),
      site: SITE,
      probes: results,
    },
    { status: allOk ? 200 : 503 },
  )
}
