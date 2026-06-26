import { NextResponse } from 'next/server'
import { listings } from '@/lib/listings'
import { blogPosts } from '@/lib/blog'
import { reviews } from '@/lib/reviews'
import { logPost } from '@/lib/admin-db'
import { withUtm } from '@/lib/utm'

export const dynamic = 'force-dynamic'

// Google Business Profile auto-poster (TypeScript port of scripts/gbp_post.py).
//
// Runs on Vercel Cron; authenticates with an offline-access refresh token stored
// in GBP_REFRESH_TOKEN, exchanges it for a short-lived access token, and POSTs a
// rotating localPost to the Joshua Fink Group location. The rotator uses ISO
// week number so every week a different post type goes out:
//   week % 5 = 0 → featured listing
//   week % 5 = 1 → market update (rotates through suburbs)
//   week % 5 = 2 → buyer/seller tip
//   week % 5 = 3 → client review
//   week % 5 = 4 → latest blog post
//
// Required env vars (set in Vercel):
//   CRON_SECRET           — same secret used by other /api/cron/* routes
//   GBP_CLIENT_ID         — Google OAuth client ID
//   GBP_CLIENT_SECRET     — Google OAuth client secret
//   GBP_REFRESH_TOKEN     — OAuth refresh token with scope
//                           https://www.googleapis.com/auth/business.manage
//   GBP_ACCOUNT_ID        — e.g. "accounts/123456789012345"
//   GBP_LOCATION_ID       — e.g. "accounts/.../locations/987654321"
//
// See docs/automation.md for the one-time setup flow to get these values.

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GBP_POSTS_API = (location: string) =>
  `https://mybusiness.googleapis.com/v4/${location}/localPosts`

const SITE = 'https://www.joshuafink.com'
const PHONE = '615-551-2727'

type CTA = { actionType: 'LEARN_MORE' | 'CALL' | 'ORDER' | 'BOOK' | 'SIGN_UP'; url: string }

type GbpPayloadKind = 'listing' | 'market-update' | 'tip' | 'review' | 'blog'

interface PreparedPost {
  summary: string
  cta?: CTA
  // kind + refKey populate post_log columns so the morning healthcheck can
  // see freshness per channel and /admin can dedup across reruns.
  kind: GbpPayloadKind
  refKey: string
}

// ── Content builders ──────────────────────────────────────────────────

function buildListingPost(): PreparedPost {
  const l = listings.find((x) => x.price && x.beds && x.baths) || listings[0]
  if (!l) return buildTipPost()
  const cityShort = l.city.split('|')[0].trim()
  const price = `$${l.price.toLocaleString()}`
  const summary =
    `🏡 Featured Listing — ${l.address}, ${cityShort}\n\n` +
    `${l.beds ? `${l.beds} bed · ` : ''}${l.baths ? `${l.baths} bath · ` : ''}` +
    `${l.sqft ? `${l.sqft.toLocaleString()} sq ft · ` : ''}${price}\n\n` +
    `Call Joshua Fink at ${PHONE} for a private showing.\n\n` +
    `#MiddleTennessee #JoshuaFinkGroup #Compass`
  return {
    summary,
    cta: {
      actionType: 'LEARN_MORE',
      url: l.compassUrl || withUtm(`${SITE}/listings`, gbpUtm('listing')),
    },
    kind: 'listing',
    refKey: l.address.toLowerCase().replace(/[^\w]+/g, '-'),
  }
}

const gbpUtm = (campaign: string) => ({
  source: 'gbp' as const,
  medium: 'auto' as const,
  campaign: `gbp-${campaign}`,
})

function buildMarketUpdatePost(): PreparedPost {
  const suburbs = [
    { name: 'Franklin', median: '$650,000', dom: 21, yoy: '+4.2%', slug: 'franklin-tn' },
    { name: 'Brentwood', median: '$900,000', dom: 26, yoy: '+3.8%', slug: 'brentwood-tn' },
    { name: 'Spring Hill', median: '$450,000', dom: 28, yoy: '+5.1%', slug: 'spring-hill-tn' },
    { name: 'Nolensville', median: '$750,000', dom: 24, yoy: '+4.7%', slug: 'nolensville-tn' },
    { name: 'Murfreesboro', median: '$430,000', dom: 31, yoy: '+3.9%', slug: 'murfreesboro-tn' },
  ]
  const s = suburbs[isoWeekNumber() % suburbs.length]
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  return {
    summary:
      `📊 ${s.name}, TN Market Update — ${month}\n\n` +
      `• Median sale price: ${s.median} (${s.yoy} YoY)\n` +
      `• Avg. days on market: ${s.dom}\n\n` +
      `Thinking about selling in ${s.name}? Get a free, no-obligation valuation from Joshua Fink at Compass. ${PHONE} or joshuafink.com.\n\n` +
      `#${s.name.replace(/\s+/g, '')}TN #NashvilleRealEstate #JoshuaFinkGroup`,
    cta: {
      actionType: 'LEARN_MORE',
      url: withUtm(`${SITE}/sell/${s.slug}`, { ...gbpUtm('market-update'), content: s.slug }),
    },
    kind: 'market-update',
    refKey: s.slug,
  }
}

function buildTipPost(): PreparedPost {
  const tips = [
    {
      slug: 'buyer-preapproval',
      summary:
        `💡 Buyer Tip — Pre-approval matters more than price.\n\n` +
        `In Middle Tennessee's market, a strong pre-approval letter beats an all-cash "maybe." Sellers choose buyers who can actually close. Get pre-approved before you start touring.\n\n` +
        `Ready? Call Joshua at ${PHONE}.`,
      url: `${SITE}/buy/franklin-tn`,
    },
    {
      slug: 'seller-price-day-one',
      summary:
        `💡 Seller Tip — Price right on day one.\n\n` +
        `Listings that test the market at an inflated number sit, go stale, and ultimately sell for less. Work with an agent who pulls real comps within a half-mile and prices strategically from day one.\n\n` +
        `Free valuation: ${PHONE}.`,
      url: `${SITE}/sell`,
    },
    {
      slug: 'investor-70-percent-rule',
      summary:
        `💡 Investor Tip — The 70% rule still works in Nashville.\n\n` +
        `ARV × 0.70 − repairs = your max buy price for a fix-and-flip. Zips 37206, 37115, 37013 still have deals for investors who move fast.\n\n` +
        `Coaching on your first flip: ${PHONE}.`,
      url: `${SITE}/blog/fix-and-flip-nashville-tn`,
    },
  ]
  const t = tips[isoWeekNumber() % tips.length]
  return {
    summary: t.summary,
    cta: { actionType: 'LEARN_MORE', url: withUtm(t.url, gbpUtm('tip')) },
    kind: 'tip',
    refKey: t.slug,
  }
}

function buildReviewPost(): PreparedPost {
  if (!reviews.length) return buildTipPost()
  const r = reviews[isoWeekNumber() % reviews.length]
  return {
    summary:
      `⭐ What clients say about Joshua Fink Group:\n\n` +
      `"${r.text}"\n— ${r.reviewer}, ${r.transaction}\n\n` +
      `Ready to buy or sell in Middle Tennessee? ${PHONE}.\n\n` +
      `#ClientReview #NashvilleRealEstate #JoshuaFinkGroup #5Stars`,
    cta: { actionType: 'CALL', url: `tel:${PHONE.replace(/-/g, '')}` },
    kind: 'review',
    refKey: r.reviewer.toLowerCase().replace(/[^\w]+/g, '-'),
  }
}

function buildLatestBlogPost(): PreparedPost {
  if (!blogPosts.length) return buildTipPost()
  // Pick the most recent post by parsed date.
  const sorted = [...blogPosts].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )
  const p = sorted[0]
  const summary =
    `📝 Latest from the Joshua Fink Group blog:\n\n` +
    `${p.title}\n\n` +
    `${p.excerpt.slice(0, 240)}${p.excerpt.length > 240 ? '…' : ''}\n\n` +
    `Read: ${SITE}/blog/${p.slug}`
  return {
    summary,
    cta: {
      actionType: 'LEARN_MORE',
      url: withUtm(`${SITE}/blog/${p.slug}`, { ...gbpUtm('latest-blog'), content: p.slug }),
    },
    kind: 'blog',
    refKey: p.slug,
  }
}

function pickPost(weekMod: number): PreparedPost {
  switch (weekMod) {
    case 0:
      return buildListingPost()
    case 1:
      return buildMarketUpdatePost()
    case 2:
      return buildTipPost()
    case 3:
      return buildReviewPost()
    case 4:
      return buildLatestBlogPost()
    default:
      return buildTipPost()
  }
}

function isoWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7)
}

// ── Retry helper for Google APIs (429-aware) ──────────────────────────
//
// Google Business Profile has a default per-minute quota of ~1 req/min on
// new projects. A single cron run does ~3 calls (token refresh + post),
// so on cold-start days we can collide with the quota. Retry with linear
// backoff at 30s + 60s — caps total wait at ~90s, comfortably inside
// the Vercel Pro 60s function timeout for the second attempt and stays
// under the 5min Vercel cron timeout overall.
//
// On Vercel Hobby (10s timeout), the second attempt won't get a chance
// — that's a known constraint and the operator should upgrade or live
// with the safety-net nightly retry implicit in next Tuesday's run.
async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  context: string,
): Promise<Response> {
  const waits = [0, 30_000, 60_000]
  let lastRes: Response | null = null
  for (let i = 0; i < waits.length; i++) {
    if (waits[i] > 0) {
      console.warn(`[gbp-post] ${context} 429 — waiting ${waits[i] / 1000}s before retry ${i + 1}`)
      await new Promise((r) => setTimeout(r, waits[i]))
    }
    const res = await fetch(url, init)
    if (res.status !== 429) return res
    lastRes = res
  }
  return lastRes!
}

// ── Google OAuth refresh_token → access_token ─────────────────────────

async function refreshAccessToken(): Promise<string> {
  const clientId = process.env.GBP_CLIENT_ID
  const clientSecret = process.env.GBP_CLIENT_SECRET
  const refreshToken = process.env.GBP_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN must all be set')
  }
  const res = await fetchWithBackoff(
    GOOGLE_TOKEN_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    },
    'oauth-refresh',
  )
  if (!res.ok) {
    // Log status only; do NOT embed the response body (may contain diagnostic
    // context that shouldn't land in centralized logs).
    console.error('[gbp-post] google oauth refresh non-2xx', res.status)
    throw new Error(`google_oauth_refresh_status_${res.status}`)
  }
  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) {
    throw new Error('google_oauth_missing_access_token')
  }
  return data.access_token
}

// ── GET handler (Vercel Cron calls this) ──────────────────────────────

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'gbp cron not configured (missing CRON_SECRET)' },
      { status: 500 },
    )
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const locationId = process.env.GBP_LOCATION_ID
  if (!locationId) {
    return NextResponse.json(
      { error: 'GBP_LOCATION_ID not set' },
      { status: 500 },
    )
  }

  let accessToken: string
  try {
    accessToken = await refreshAccessToken()
  } catch (err) {
    // Server-side: structured error for debugging.
    console.error('[gbp-post] token refresh failed', (err as Error).message)
    // Response body: opaque — callers with CRON_SECRET shouldn't see
    // upstream auth details either.
    return NextResponse.json(
      { error: 'gbp token refresh failed' },
      { status: 502 },
    )
  }

  const week = isoWeekNumber()
  const post = pickPost(week % 5)

  const payload: Record<string, unknown> = {
    languageCode: 'en-US',
    summary: post.summary,
    topicType: 'STANDARD',
  }
  if (post.cta) payload.callToAction = post.cta

  try {
    const res = await fetchWithBackoff(
      GBP_POSTS_API(locationId),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      'gbp-post-create',
    )
    if (!res.ok) {
      // Don't log the raw upstream body — GBP error responses can include
      // account identifiers, validation context, and request IDs. Log the
      // status + first 100 chars of any error code field only, stripped of
      // potentially sensitive substrings.
      const bodySnippet = await res
        .text()
        .then((t) => t.slice(0, 100).replace(/[^\w\s.:,\-]/g, ''))
        .catch(() => '')
      console.error('[gbp-post] upstream error', res.status, bodySnippet)
      await logPost({
        channel: 'gbp',
        jobName: 'gbp-post',
        payloadKind: post.kind,
        refKey: post.refKey,
        messagePreview: post.summary.slice(0, 200),
        link: post.cta?.url ?? null,
        externalPostId: null,
        status: 'failed',
        errorMessage: `upstream ${res.status} ${bodySnippet}`.slice(0, 500),
      })
      return NextResponse.json(
        { error: 'gbp upstream returned non-2xx', upstreamStatus: res.status },
        { status: 502 },
      )
    }
    const data = (await res.json()) as { name?: string }
    await logPost({
      channel: 'gbp',
      jobName: 'gbp-post',
      payloadKind: post.kind,
      refKey: post.refKey,
      messagePreview: post.summary.slice(0, 200),
      link: post.cta?.url ?? null,
      externalPostId: data.name ?? null,
      status: 'posted',
    })
    return NextResponse.json({
      posted: true,
      week,
      rotator: week % 5,
      summaryPreview: post.summary.slice(0, 100),
      name: data.name,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[gbp-post] network error', err)
    await logPost({
      channel: 'gbp',
      jobName: 'gbp-post',
      payloadKind: post.kind,
      refKey: post.refKey,
      messagePreview: post.summary.slice(0, 200),
      link: post.cta?.url ?? null,
      externalPostId: null,
      status: 'failed',
      errorMessage: `network: ${(err as Error).message}`.slice(0, 500),
    })
    return NextResponse.json({ error: 'gbp post failed' }, { status: 502 })
  }
}
