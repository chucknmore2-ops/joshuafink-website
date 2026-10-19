import { NextResponse } from 'next/server'
import { getSiteUrlCatalog, getSiteUrlsModifiedSince, INDEXNOW_LOOKBACK_MS } from '@/lib/site-urls'

export const dynamic = 'force-dynamic'

const SITE = 'https://www.joshuafink.com'
// NOTE: This key is PUBLIC by design — IndexNow requires it to be fetchable at
// `${SITE}/${INDEXNOW_KEY}.txt` so Bing/Yandex can verify ownership. Do NOT
// file this as a secret leak. See public/7e3a8b9c4d5f6a2e1b0c9d8e7f5a4b3c.txt.
const INDEXNOW_KEY = '7e3a8b9c4d5f6a2e1b0c9d8e7f5a4b3c'
// Hardcoded upstream — never accept request-controlled values here (SSRF).
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

// URL set comes from lib/site-urls.ts — the same source the XML sitemap uses.
// Only URLs with a real lastmod inside the lookback window are submitted.
// A nightly ping of all ~264 URLs was recrawling pages that had not changed.
// Add new page types in lib/site-urls.ts, and set lastModified when the
// content actually changes, or IndexNow will not hear about them.

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

  const since = new Date(Date.now() - INDEXNOW_LOOKBACK_MS)
  const urlList = getSiteUrlsModifiedSince(since)
  const catalog = getSiteUrlCatalog().length

  if (urlList.length === 0) {
    return NextResponse.json({
      submitted: 0,
      catalog,
      since: since.toISOString(),
      at: new Date().toISOString(),
    })
  }

  const payload = {
    // MUST match the host of every URL in urlList. IndexNow silently ignores
    // URLs that don't belong to the declared host — and still returns 2xx, so
    // this read as "submitted OK" while the submissions were being discarded.
    // Every URL here comes from SITE, which is the www host.
    host: 'www.joshuafink.com',
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
      catalog,
      since: since.toISOString(),
      status: res.status,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[indexnow] network error', err)
    return NextResponse.json({ error: 'indexnow submit failed' }, { status: 502 })
  }
}
