import { NextResponse } from 'next/server'
import { logPost } from '@/lib/admin-db'
import { withUtm } from '@/lib/utm'
import {
  currentSnapshot,
  marketUpdateSlug,
  monthLabel,
  snapshotSkipReason,
} from '@/lib/market-snapshot'

export const dynamic = 'force-dynamic'

// Facebook Page auto-poster — monthly Middle TN market update.
//
// Fired by .github/workflows/monthly-market-update.yml on the 5th of each
// month, alongside the LinkedIn and Google Business posts. All three read the
// same figures from lib/market-snapshot.ts as the monthly blog post, so the
// site and every channel quote identical numbers.
//
// This route exists because the Railway `autoposter-stats` / `-testimonial` /
// `-tips` / `-engagement` services in services/autoposter were never actually
// created — they showed as permanent [GAP]s in the morning healthcheck for
// months. Facebook's *listing spotlight* still runs on Railway
// (services/autoposter, job `listing-spotlight`); this is a separate pipeline
// and logs under its own job name.
//
// Required env vars (set in Vercel):
//   CRON_SECRET    — same secret used by the other /api/cron/* routes
//   FB_PAGE_ID     — numeric Page ID (same value Railway's autoposter uses)
//   FB_PAGE_TOKEN  — Page access token with pages_manage_posts

const GRAPH_VERSION = 'v19.0'
const SITE = 'https://www.joshuafink.com'
const JOB_NAME = 'monthly-market-update'

interface PreparedPost {
  message: string
  link: string
  refKey: string
}

function buildMonthlyMarketPost(): PreparedPost | null {
  const s = currentSnapshot()
  if (!s) return null
  const label = monthLabel(s.month)
  const n = (v: number) => v.toLocaleString('en-US')
  const link = withUtm(`${SITE}/blog/${marketUpdateSlug(s.month)}`, {
    source: 'facebook',
    medium: 'auto',
    campaign: 'monthly-market-update',
    content: s.month,
  })
  const message =
    `📊 Middle Tennessee real estate market update — ${label}\n\n` +
    `• Median sale price: ${s.medianSalePrice} (${s.medianYoyChange} year over year)\n` +
    `• Average days on market: ${s.avgDaysOnMarket}\n` +
    `• Closed sales: ${n(s.closedSales)}\n` +
    `• Active listings: ${n(s.activeListings)}\n` +
    `• Months of supply: ${s.monthsOfInventory}\n\n` +
    `Source: ${s.source}, ${label} report.\n\n` +
    `${s.takeaways[0] ?? ''}\n\n`.trimStart() +
    `Metro-wide medians are useful for direction, not for decisions — your street ` +
    `is what matters. Call or text Joshua Fink at 615-551-2727 for an honest read ` +
    `on your specific home, or read the full ${label} breakdown below.\n\n` +
    `#NashvilleRealEstate #MiddleTennessee #JoshuaFinkGroup #Compass`
  return { message, link, refKey: s.month }
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'facebook cron not configured (missing CRON_SECRET)' },
      { status: 500 },
    )
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const params = new URL(request.url).searchParams
  const post = buildMonthlyMarketPost()

  // ?preview=1 composes the copy and hands it back without touching Facebook,
  // so a draft can be read and approved before anything is published.
  if (params.get('preview') === '1') {
    return NextResponse.json({ posted: false, preview: true, post })
  }

  // No numbers entered for the month → post nothing at all rather than
  // recycling last month's figures. 200 so the monthly workflow doesn't
  // retry-then-fail on a deliberate skip; the post_log row is what surfaces it
  // in /admin and the morning healthcheck.
  if (!post) {
    const reason = snapshotSkipReason()
    console.warn('[facebook-post] skipping monthly market update —', reason)
    await logPost({
      channel: 'facebook',
      jobName: JOB_NAME,
      payloadKind: 'market',
      refKey: 'no-snapshot',
      status: 'failed',
      errorMessage: reason.slice(0, 500),
    })
    return NextResponse.json({
      posted: false,
      skipped: 'no_snapshot',
      reason,
      at: new Date().toISOString(),
    })
  }

  const pageId = process.env.FB_PAGE_ID
  const pageToken = process.env.FB_PAGE_TOKEN
  if (!pageId || !pageToken) {
    // Log the early exit too — otherwise a channel that never even reaches
    // Facebook looks identical in /admin to one that was never scheduled.
    await logPost({
      channel: 'facebook',
      jobName: JOB_NAME,
      payloadKind: 'market',
      refKey: post.refKey,
      status: 'failed',
      errorMessage: 'FB_PAGE_ID or FB_PAGE_TOKEN not set',
    })
    return NextResponse.json(
      { error: 'FB_PAGE_ID or FB_PAGE_TOKEN not set' },
      { status: 500 },
    )
  }

  const body = new URLSearchParams({
    message: post.message,
    link: post.link,
    access_token: pageToken,
  })

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    )
    if (!res.ok) {
      // Don't log the raw upstream body — Graph API errors carry request IDs
      // and account metadata. Status plus a sanitized snippet only.
      const bodySnippet = await res
        .text()
        .then((t) => t.slice(0, 100).replace(/[^\w\s.:,\-]/g, ''))
        .catch(() => '')
      console.error('[facebook-post] upstream error', res.status, bodySnippet)
      await logPost({
        channel: 'facebook',
        jobName: JOB_NAME,
        payloadKind: 'market',
        refKey: post.refKey,
        messagePreview: post.message.slice(0, 200),
        link: post.link,
        externalPostId: null,
        status: 'failed',
        errorMessage: `upstream ${res.status} ${bodySnippet}`.slice(0, 500),
      })
      return NextResponse.json(
        {
          error: 'facebook upstream returned non-2xx',
          upstreamStatus: res.status,
          hint:
            res.status === 400 || res.status === 401
              ? 'FB_PAGE_TOKEN may have expired or lost pages_manage_posts. Re-issue it at developers.facebook.com/tools/debug/accesstoken/.'
              : undefined,
        },
        { status: 502 },
      )
    }
    const data = (await res.json()) as { id?: string }
    await logPost({
      channel: 'facebook',
      jobName: JOB_NAME,
      payloadKind: 'market',
      refKey: post.refKey,
      messagePreview: post.message.slice(0, 200),
      link: post.link,
      externalPostId: data.id ?? null,
      status: 'posted',
    })
    return NextResponse.json({
      posted: true,
      postId: data.id,
      month: post.refKey,
      preview: post.message.slice(0, 120),
      link: post.link,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[facebook-post] network error', err)
    await logPost({
      channel: 'facebook',
      jobName: JOB_NAME,
      payloadKind: 'market',
      refKey: post.refKey,
      messagePreview: post.message.slice(0, 200),
      link: post.link,
      externalPostId: null,
      status: 'failed',
      errorMessage: `network: ${(err as Error).message}`.slice(0, 500),
    })
    return NextResponse.json({ error: 'facebook post failed' }, { status: 502 })
  }
}
