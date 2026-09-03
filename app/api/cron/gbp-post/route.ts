import { NextResponse } from 'next/server'
import { listings } from '@/lib/listings'
import { soldListings } from '@/lib/sold-listings'
import { blogPosts } from '@/lib/blog'
import { reviews } from '@/lib/reviews'
import { logPost } from '@/lib/admin-db'
import { withUtm } from '@/lib/utm'
import { suburbs, marketStatsLastUpdated, marketStatsSource } from '@/lib/suburbs'
import {
  currentSnapshot,
  marketUpdateSlug,
  monthLabel,
  snapshotSkipReason,
} from '@/lib/market-snapshot'
import { CALL_CTA, ctaLink, gbpCreatePayload, type CTA } from './cta'

export const dynamic = 'force-dynamic'

// Google Business Profile auto-poster (TypeScript port of scripts/gbp_post.py).
//
// Runs on Vercel Cron; authenticates with an offline-access refresh token stored
// in GBP_REFRESH_TOKEN, exchanges it for a short-lived access token, and POSTs a
// rotating localPost to the Joshua Fink Group location. The rotator uses ISO
// week number so a different post type goes out each week:
//   odd  week                → Brentwood market update  (see BRENTWOOD_SLUG)
//   even week, (week/2)%4=0  → featured listing
//                        = 1 → buyer/seller tip
//                        = 2 → client review
//                        = 3 → latest blog post
//
// Brentwood — Joshua's core market — has its own recurring slot rather than
// sharing a 1-in-5 "market update" week with everywhere else. The old scheme
// nominally rotated five suburbs inside that slot, but the suburb index and
// the slot test were both `week % 5`, so the two were locked together and
// Brentwood was in practice the only suburb that ever posted.
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

// IMPORTANT — never put PHONE (or the street address) in a post `summary`.
// Google auto-rejects local posts whose body text contains the business phone
// number or address; contact details already live on the listing, so Google
// treats repeating them in a post as spam. Verified on this profile 2026-08-04:
// three posts carrying "615-551-2727" in the body were REJECTED within seconds,
// and the byte-identical Spring Hill market update with only the phone number
// removed went LIVE on the first poll.
//
// Surface the number through the structured CALL call-to-action below instead —
// that renders as a tap-to-call button and is the supported channel for it.
// Google's CallToAction.url "should be left unset for Call CTA"; a tel: URL
// is INVALID_ARGUMENT (review-week failure 2026-09-01).

type GbpPayloadKind = 'listing' | 'sold' | 'market-update' | 'tip' | 'review' | 'blog'

interface PreparedPost {
  summary: string
  cta?: CTA
  // Publicly-fetchable JPEG for the post's single photo (see gbpPhotoUrl).
  photoUrl?: string
  // kind + refKey populate post_log columns so the morning healthcheck can
  // see freshness per channel and /admin can dedup across reruns.
  kind: GbpPayloadKind
  refKey: string
}

// Google's local-post API takes exactly ONE photo (`media[0]`), not a gallery,
// and it rejects WebP — which is the format of every Compass image URL in
// lib/listings.ts / lib/sold-listings.ts. Compass's CDN serves the same asset
// as a JPEG when the extension is swapped (…/480x320.webp → …/1200x900.jpg,
// verified 2026-08-13 against both URL hash shapes Compass emits), so no local
// copy is needed. Normalising to 1200x900 keeps every photo above Google's
// 720px minimum and well inside its 10KB–5MB size window.
function gbpPhotoUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined
  const m = imageUrl.match(
    /^(https:\/\/(?:www\.)?compass\.com\/m\/[^/?#]+)\/\d+x\d+\.webp$/,
  )
  return m ? `${m[1]}/1200x900.jpg` : undefined
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
    `Ask Joshua Fink at Compass about a private showing.\n\n` +
    `#MiddleTennessee #JoshuaFinkGroup #Compass`
  return {
    summary,
    cta: {
      actionType: 'LEARN_MORE',
      url: l.compassUrl || withUtm(`${SITE}/listings`, gbpUtm('listing')),
    },
    photoUrl: gbpPhotoUrl(l.imageUrl),
    kind: 'listing',
    refKey: l.address.toLowerCase().replace(/[^\w]+/g, '-'),
  }
}

// "Just Sold" post. On-demand ONLY (?kind=sold&address=1901+New+Bristol), never
// part of the weekly rotation: lib/sold-listings.ts carries no close date
// (Compass's transactions section doesn't publish one), so nothing here can
// tell a sale that closed last week from one that closed in 2019. Mirrors
// buildFromSale() in app/api/cron/linkedin-post/route.ts.
function buildSoldPost(addressQuery: string): PreparedPost | null {
  const needle = addressQuery.trim().toLowerCase()
  if (!needle) return null
  const l = soldListings.find((x) => x.address.toLowerCase().includes(needle))
  if (!l) return null
  // Sold `city` values sometimes lead with a lot number ("Lot 54, Brentwood, TN
  // 37027"), so take the segment before the state rather than the first one.
  const parts = l.city.split('|')[0].split(',').map((s) => s.trim())
  const stateIdx = parts.findIndex((p) => /^TN\b/.test(p))
  const locality = (stateIdx > 0 ? parts[stateIdx - 1] : parts[0]) || l.city
  const price = `$${l.price.toLocaleString()}`
  const stats = [
    l.beds ? `${l.beds} bed` : '',
    l.baths ? `${l.baths} bath` : '',
    l.sqft ? `${l.sqft.toLocaleString()} sq ft` : '',
    l.acres ? `${l.acres} acres` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  return {
    summary:
      `🎉 Just Sold — ${l.address}, ${locality}, TN\n\n` +
      `${stats}${stats ? ' · ' : ''}${price}\n\n` +
      `Another ${locality} closing for Joshua Fink at Compass. Thinking about ` +
      `selling? Ask for a free, comp-backed valuation.\n\n` +
      `#JustSold #${locality.replace(/\s+/g, '')}TN #JoshuaFinkGroup`,
    cta: {
      actionType: 'LEARN_MORE',
      url: withUtm(`${SITE}/listings`, gbpUtm('just-sold')),
    },
    photoUrl: gbpPhotoUrl(l.imageUrl),
    kind: 'sold',
    refKey: l.address.toLowerCase().replace(/[^\w]+/g, '-'),
  }
}

const gbpUtm = (campaign: string) => ({
  source: 'gbp' as const,
  medium: 'auto' as const,
  campaign: `gbp-${campaign}`,
})

// The market-update numbers come from lib/suburbs.ts — the same module that
// renders /market, /buy and /sell — so a GBP post can never contradict the
// site. (It used to keep a private copy here, which had already drifted:
// Nolensville $750K vs the site's $580K, Murfreesboro $430K vs $380K.)
const BRENTWOOD_SLUG = 'brentwood-tn'

// Stats this old aren't worth publishing to a public profile, so the job skips
// the week rather than posting a stale median under Joshua's name. Refreshing
// lib/suburbs.ts (numbers + dataUpdatedAt) is what un-sticks it.
const MAX_STATS_AGE_DAYS = 45

// "As of" date for a suburb's figures: its own dataUpdatedAt, else the global
// review date. Mirrors what /market/[suburb] and /sell/[suburb] display.
function statsAsOf(slug: string): string {
  return suburbs[slug]?.dataUpdatedAt ?? marketStatsLastUpdated
}

function statsAgeDays(slug: string, now: Date = new Date()): number {
  return Math.floor((+now - +new Date(`${statsAsOf(slug)}T00:00:00Z`)) / 86_400_000)
}

function buildMarketUpdatePost(slug: string): PreparedPost {
  const s = suburbs[slug]
  if (!s) return buildTipPost()
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  // Only cite a source when we actually have one — see marketStatsSource.
  const sourceLine = marketStatsSource
    ? `Source: ${marketStatsSource}, as of ${statsAsOf(slug)}\n\n`
    : ''
  return {
    summary:
      `📊 ${s.name}, TN Market Update — ${month}\n\n` +
      `• Median sale price: ${s.medianPrice} (${s.yoyChange} YoY)\n` +
      `• Avg. days on market: ${s.avgDaysOnMarket}\n\n` +
      sourceLine +
      `Thinking about selling in ${s.name}? Get a free, no-obligation valuation from Joshua Fink at Compass.\n\n` +
      `#${s.name.replace(/\s+/g, '')}TN #NashvilleRealEstate #JoshuaFinkGroup`,
    cta: {
      actionType: 'LEARN_MORE',
      url: withUtm(`${SITE}/sell/${s.slug}`, { ...gbpUtm('market-update'), content: s.slug }),
    },
    kind: 'market-update',
    refKey: s.slug,
  }
}

// Monthly Middle TN market update — fired by
// .github/workflows/monthly-market-update.yml with ?kind=market, outside the
// weekly rotation. Reads lib/market-snapshot.ts, the same numbers the blog post
// and the Facebook/LinkedIn posts use. Returns null when the month's figures
// haven't been entered, and the caller then posts nothing.
function buildMonthlyMarketPost(): PreparedPost | null {
  const s = currentSnapshot()
  if (!s) return null
  const label = monthLabel(s.month)
  const n = (v: number) => v.toLocaleString('en-US')
  return {
    summary:
      `📊 Middle Tennessee Market Update — ${label}\n\n` +
      `• Median sale price: ${s.medianSalePrice} (${s.medianYoyChange} YoY)\n` +
      `• Avg. days on market: ${s.avgDaysOnMarket}\n` +
      `• Active listings: ${n(s.activeListings)}\n` +
      `• Months of supply: ${s.monthsOfInventory}\n\n` +
      `Source: ${s.source}, ${label} report\n\n` +
      `Read the full ${label} breakdown — what these numbers mean if you're buying or selling.\n\n` +
      `#NashvilleRealEstate #MiddleTennessee #JoshuaFinkGroup`,
    cta: {
      actionType: 'LEARN_MORE',
      url: withUtm(`${SITE}/blog/${marketUpdateSlug(s.month)}`, {
        ...gbpUtm('monthly-market-update'),
        content: s.month,
      }),
    },
    kind: 'market-update',
    refKey: s.month,
  }
}

function buildTipPost(): PreparedPost {
  const tips = [
    {
      slug: 'buyer-preapproval',
      summary:
        `💡 Buyer Tip — Pre-approval matters more than price.\n\n` +
        `In Middle Tennessee's market, a strong pre-approval letter beats an all-cash "maybe." Sellers choose buyers who can actually close. Get pre-approved before you start touring.\n\n` +
        `Ready? Talk to Joshua before you start touring.`,
      url: `${SITE}/buy/franklin-tn`,
    },
    {
      slug: 'seller-price-day-one',
      summary:
        `💡 Seller Tip — Price right on day one.\n\n` +
        `Listings that test the market at an inflated number sit, go stale, and ultimately sell for less. Work with an agent who pulls real comps within a half-mile and prices strategically from day one.\n\n` +
        `Ask Joshua for a free, comp-backed valuation.`,
      url: `${SITE}/sell`,
    },
    {
      slug: 'investor-70-percent-rule',
      summary:
        `💡 Investor Tip — The 70% rule still works in Nashville.\n\n` +
        `ARV × 0.70 − repairs = your max buy price for a fix-and-flip. Zips 37206, 37115, 37013 still have deals for investors who move fast.\n\n` +
        `Ask Joshua how the numbers pencil on your first flip.`,
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
      `Ready to buy or sell in Middle Tennessee?\n\n` +
      `#ClientReview #NashvilleRealEstate #JoshuaFinkGroup #5Stars`,
    cta: CALL_CTA,
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

// Returns null when this week's slot is a market update whose figures are too
// old to publish — the caller skips the post instead of running one.
function pickPost(week: number): PreparedPost | null {
  if (week % 2 === 1) {
    if (statsAgeDays(BRENTWOOD_SLUG) > MAX_STATS_AGE_DAYS) return null
    return buildMarketUpdatePost(BRENTWOOD_SLUG)
  }
  switch (Math.floor(week / 2) % 4) {
    case 0:
      return buildListingPost()
    case 1:
      return buildTipPost()
    case 2:
      return buildReviewPost()
    default:
      return buildLatestBlogPost()
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

  // ?kind=market is the monthly market update (see buildMonthlyMarketPost).
  // It logs under its own job name so one monthly post can't refresh the
  // weekly rotator's freshness clock and hide a dead weekly cron.
  //
  // ?kind=listing and ?kind=sold&address=… are the on-demand "Just Listed" /
  // "Just Sold" posts, fired by hand when Joshua has news rather than on a
  // schedule. Same reasoning: they log under their own job name so a manual
  // post can't mask a dead weekly cron. Pair either with ?preview=1 to read
  // the copy back without publishing.
  const params = new URL(request.url).searchParams
  const kind = params.get('kind')
  const isMonthly = kind === 'market'
  const isOnDemand = kind === 'listing' || kind === 'sold'
  const jobName = isMonthly
    ? 'monthly-market-update'
    : isOnDemand
      ? 'gbp-on-demand'
      : 'gbp-post'

  const locationId = process.env.GBP_LOCATION_ID
  if (!locationId) {
    // Log the early exit too — otherwise a channel that never even reaches
    // Google looks identical in /admin to one that was never scheduled.
    await logPost({
      channel: 'gbp',
      jobName,
      payloadKind: 'none',
      refKey: 'no-payload',
      status: 'failed',
      errorMessage: 'GBP_LOCATION_ID not set',
    })
    return NextResponse.json(
      { error: 'GBP_LOCATION_ID not set' },
      { status: 500 },
    )
  }

  // Decide what to post before spending an OAuth round-trip, so a skipped week
  // never touches Google at all.
  const week = isoWeekNumber()
  const post = isMonthly
    ? buildMonthlyMarketPost()
    : kind === 'listing'
      ? buildListingPost()
      : kind === 'sold'
        ? buildSoldPost(params.get('address') ?? '')
        : pickPost(week)

  // ?preview=1 composes the copy (and resolves the photo URL) and hands it back
  // without touching Google, so a draft can be read and approved before
  // anything publishes. Mirrors the same flag on /api/cron/linkedin-post.
  if (params.get('preview') === '1') {
    return NextResponse.json({ posted: false, preview: true, week, post })
  }

  if (!post) {
    const reason = isMonthly
      ? `skipped: ${snapshotSkipReason()}`
      : isOnDemand
        ? `skipped: no ${kind} matched address=${params.get('address') ?? ''}`
        : `skipped: market stats stale (as of ${statsAsOf(BRENTWOOD_SLUG)}, ` +
          `${statsAgeDays(BRENTWOOD_SLUG)}d old > ${MAX_STATS_AGE_DAYS}d) — ` +
          `refresh lib/suburbs.ts`
    console.warn('[gbp-post]', reason)
    await logPost({
      channel: 'gbp',
      jobName,
      payloadKind: isOnDemand ? (kind as GbpPayloadKind) : 'market-update',
      refKey: isOnDemand
        ? params.get('address') || 'no-match'
        : isMonthly
          ? 'no-snapshot'
          : BRENTWOOD_SLUG,
      status: 'failed',
      errorMessage: reason.slice(0, 500),
    })
    // 200 so the GitHub Actions job doesn't retry-then-fail on a deliberate
    // skip; the post_log row is what surfaces it in /admin + the healthcheck.
    return NextResponse.json({
      posted: false,
      skipped: isOnDemand ? 'no_match' : isMonthly ? 'no_snapshot' : 'stats_stale',
      week,
      statsAsOf: isMonthly || isOnDemand ? undefined : statsAsOf(BRENTWOOD_SLUG),
      at: new Date().toISOString(),
    })
  }

  let accessToken: string
  try {
    accessToken = await refreshAccessToken()
  } catch (err) {
    // Server-side: structured error for debugging.
    console.error('[gbp-post] token refresh failed', (err as Error).message)
    await logPost({
      channel: 'gbp',
      jobName,
      payloadKind: 'none',
      refKey: 'no-payload',
      status: 'failed',
      errorMessage: `token refresh failed: ${(err as Error).message}`.slice(0, 500),
    })
    // Response body: opaque — callers with CRON_SECRET shouldn't see
    // upstream auth details either.
    return NextResponse.json(
      { error: 'gbp token refresh failed' },
      { status: 502 },
    )
  }

  // Exactly one photo: Google's localPost `media` array takes a single PHOTO on
  // a STANDARD post — it is not a gallery, so a second entry is rejected.
  const payload = gbpCreatePayload(post)

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
        jobName,
        payloadKind: post.kind,
        refKey: post.refKey,
        messagePreview: post.summary.slice(0, 200),
        link: ctaLink(post.cta),
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
      jobName,
      payloadKind: post.kind,
      refKey: post.refKey,
      messagePreview: post.summary.slice(0, 200),
      link: ctaLink(post.cta),
      externalPostId: data.name ?? null,
      status: 'posted',
    })
    return NextResponse.json({
      posted: true,
      week,
      rotator: post.kind,
      photo: post.photoUrl ?? null,
      summaryPreview: post.summary.slice(0, 100),
      name: data.name,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[gbp-post] network error', err)
    await logPost({
      channel: 'gbp',
      jobName,
      payloadKind: post.kind,
      refKey: post.refKey,
      messagePreview: post.summary.slice(0, 200),
      link: ctaLink(post.cta),
      externalPostId: null,
      status: 'failed',
      errorMessage: `network: ${(err as Error).message}`.slice(0, 500),
    })
    return NextResponse.json({ error: 'gbp post failed' }, { status: 502 })
  }
}
