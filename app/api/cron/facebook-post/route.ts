import { NextResponse } from 'next/server'
import { hasPostedRef, logPost } from '@/lib/admin-db'
import { buildMonthlyFacebookPost } from '@/lib/monthly-facebook-post'
import {
  currentSnapshot,
  snapshotExpectFromSearchParams,
  snapshotMatchesExpect,
  snapshotSkipReason,
} from '@/lib/market-snapshot'

export const dynamic = 'force-dynamic'

// Facebook Page auto-poster — monthly Middle TN market update.
//
// Fired by .github/workflows/monthly-market-update.yml after a new month lands
// in lib/market-snapshot.ts, alongside the LinkedIn and Google Business posts.
// Facebook is published by Railway services/autoposter, which already holds
// FB_PAGE_ID and FB_PAGE_TOKEN. This route does not call Graph. It reports
// already_posted from the shared post_log row, or pending until that service
// writes one. The healthcheck reads the same row.
//
// Required env var (set in Vercel):
//   CRON_SECRET — same secret used by the other /api/cron/* routes

const JOB_NAME = 'monthly-market-update'

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
  const built = buildMonthlyFacebookPost()
  const post = built
    ? { message: built.message, link: built.link, refKey: built.month }
    : null
  const expect = snapshotExpectFromSearchParams(params)

  // ?preview=1 composes the copy and hands it back without touching Facebook,
  // so a draft can be read and approved before anything is published.
  if (params.get('preview') === '1') {
    return NextResponse.json({ posted: false, preview: true, post })
  }

  // The workflow passes expect* from the commit it just merged. Until Vercel
  // is serving that commit, production still has the previous snapshot — do
  // not log that as a skipped month, and do not post the old one.
  if (expect.expectMonth && !snapshotMatchesExpect(currentSnapshot(), expect)) {
    return NextResponse.json({
      posted: false,
      skipped: 'deploy_pending',
      expectMonth: expect.expectMonth,
      at: new Date().toISOString(),
    })
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

  if (await hasPostedRef({ channel: 'facebook', jobName: JOB_NAME, refKey: post.refKey })) {
    return NextResponse.json({
      posted: false,
      skipped: 'already_posted',
      month: post.refKey,
      at: new Date().toISOString(),
    })
  }

  // services/autoposter publishes this month and writes the posted row.
  // Polling must not insert a failed row on every check.
  return NextResponse.json({
    posted: false,
    pending: 'autoposter',
    month: post.refKey,
    at: new Date().toISOString(),
  })
}
