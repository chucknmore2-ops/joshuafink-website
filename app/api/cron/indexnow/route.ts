import { NextResponse } from 'next/server'
import { blogPosts } from '@/lib/blog'
import { getAllSuburbSlugs } from '@/lib/suburbs'

export const dynamic = 'force-dynamic'

const SITE = 'https://joshuafink.com'
// NOTE: This key is PUBLIC by design — IndexNow requires it to be fetchable at
// `${SITE}/${INDEXNOW_KEY}.txt` so Bing/Yandex can verify ownership. Do NOT
// file this as a secret leak. See public/7e3a8b9c4d5f6a2e1b0c9d8e7f5a4b3c.txt.
const INDEXNOW_KEY = '7e3a8b9c4d5f6a2e1b0c9d8e7f5a4b3c'
// Hardcoded upstream — never accept request-controlled values here (SSRF).
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

function buildUrlList(): string[] {
  const core = [
    '/',
    '/about',
    '/contact',
    '/listings',
    '/sell',
    '/cash-offer',
    '/blog',
    '/reviews',
    '/links',
  ]

  const suburbSlugs = getAllSuburbSlugs()
  const blogUrls = blogPosts.map((p) => `/blog/${p.slug}`)
  const buyUrls = suburbSlugs.map((slug) => `/buy/${slug}`)
  const sellUrls = suburbSlugs.map((slug) => `/sell/${slug}`)

  return [...core, ...blogUrls, ...buyUrls, ...sellUrls].map((path) => `${SITE}${path}`)
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET

  // Fail CLOSED — a cron endpoint with no configured secret is a
  // misconfiguration, not an invitation for anonymous callers.
  if (!expected) {
    return NextResponse.json(
      { error: 'indexnow cron not configured (missing CRON_SECRET)' },
      { status: 500 },
    )
  }

  // Vercel Cron attaches `Authorization: Bearer $CRON_SECRET`.
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const urlList = buildUrlList()

  const payload = {
    host: 'joshuafink.com',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
    urlList,
  }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      // Log full detail server-side; return stable opaque status to caller.
      console.error('[indexnow] upstream error', res.status, await res.text().catch(() => ''))
      return NextResponse.json(
        { error: 'indexnow upstream returned non-2xx', upstreamStatus: res.status },
        { status: 502 },
      )
    }

    return NextResponse.json({
      submitted: urlList.length,
      status: res.status,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[indexnow] network error', err)
    return NextResponse.json({ error: 'indexnow submit failed' }, { status: 502 })
  }
}
