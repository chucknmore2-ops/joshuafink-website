import { NextResponse } from 'next/server'
import { blogPosts } from '@/lib/blog'
import { listings } from '@/lib/listings'
import { soldListings } from '@/lib/sold-listings'
import { listingSlug } from '@/lib/listing-detail'
import { reviews, reviewStats } from '@/lib/reviews'
import { logPost } from '@/lib/admin-db'
import { withUtm } from '@/lib/utm'
import {
  currentSnapshot,
  marketUpdateSlug,
  monthLabel,
  snapshotSkipReason,
} from '@/lib/market-snapshot'

export const dynamic = 'force-dynamic'

// LinkedIn auto-poster for Joshua Fink Group.
//
// Runs on Vercel Cron; posts to the authenticated LinkedIn member URN using a
// long-lived access token. Rotates weekly between (a) latest blog post and
// (b) featured listing so LinkedIn feed stays varied.
//
// Required env vars:
//   CRON_SECRET             — shared across /api/cron/* routes
//   LINKEDIN_ACCESS_TOKEN   — from the one-time /api/linkedin/auth + /callback flow
//   LINKEDIN_AUTHOR_URN     — e.g. urn:li:person:XXXXX (returned by /callback)
//
// NOTE: LinkedIn access tokens expire ~60 days after issue. When a run returns
// 401 Unauthorized from LinkedIn, re-run the OAuth flow:
//   1. Visit https://www.joshuafink.com/api/linkedin/auth
//   2. Approve, get redirected to /api/linkedin/callback
//   3. Copy access_token from the JSON response into Vercel env
// Consider enabling LinkedIn's "Member Data Portability" for a longer-lived
// token if Joshua's app is approved for that scope.

const LINKEDIN_API = 'https://api.linkedin.com/v2/ugcPosts'
const SITE = 'https://www.joshuafink.com'

type PostPayload = {
  text: string
  url: string
  title: string
  description: string
  // kind + refKey populate post_log columns so the morning healthcheck can
  // see freshness per channel and /admin can dedup across reruns.
  kind: 'blog' | 'listing' | 'sold' | 'market' | 'testimonial'
  refKey: string
}

// Job name the post is logged under. The monthly market update is a separate
// pipeline from the weekly rotation, so it logs separately — otherwise one
// monthly post would refresh the weekly job's freshness clock and hide a dead
// weekly cron from the morning healthcheck.
const WEEKLY_JOB = 'linkedin-post'
const MONTHLY_JOB = 'monthly-market-update'

function isoWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7)
}

function buildFromLatestBlog(): PostPayload | null {
  if (!blogPosts.length) return null
  const sorted = [...blogPosts].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )
  const p = sorted[0]
  const url = withUtm(`${SITE}/blog/${p.slug}`, {
    source: 'linkedin',
    medium: 'auto',
    campaign: 'blog-syndication',
    content: p.slug,
  })
  // Blog title is already the keyword target (it becomes LinkedIn's title tag),
  // so lead with it. No hashtags on LinkedIn — a hashtag would hijack the title
  // tag away from the title's keywords (James Dooley / Sterling Sky, 2026).
  const text =
    `${p.title}\n\n` +
    `${p.excerpt.slice(0, 280)}${p.excerpt.length > 280 ? '…' : ''}\n\n` +
    `From Joshua Fink Group — Compass Real Estate serving Nashville & Middle Tennessee. Read the full post: ${url}`
  return {
    text,
    url,
    title: p.title,
    description: p.excerpt.slice(0, 160),
    kind: 'blog',
    refKey: p.slug,
  }
}

function buildFromListing(): PostPayload | null {
  const l = listings.find((x) => x.imageUrl && x.price && x.compassUrl)
  if (!l) return null
  // Locality only (strip ", TN 37027 | MLS #…") so the caption reads
  // "in Brentwood, TN", not "in Brentwood, TN 37027, TN".
  const locality = l.city.split('|')[0].split(',')[0].trim()
  const price = `$${l.price.toLocaleString()}`
  const slug = listingSlug(l)
  // Link to the on-site listing page, not compass.com — real clicks to the
  // money site are a ranking signal (traffic/nav-boost), and we keep the
  // visitor on joshuafink.com instead of ceding them to Compass.
  const url = withUtm(`${SITE}/listings/${slug}`, {
    source: 'linkedin',
    medium: 'auto',
    campaign: 'listing-spotlight',
    content: slug,
  })
  const description = [
    l.beds ? `${l.beds} bed` : '',
    l.baths ? `${l.baths} bath` : '',
    l.sqft ? `${l.sqft.toLocaleString()} sq ft` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  // Entity-first + location keyword in the first ~9 words (that opening line
  // becomes the post's title tag and is what Gemini/Claude pull via Google
  // search). Semantic-triple phrasing (entity → predicate → object). No
  // hashtags on LinkedIn.
  const text =
    `Joshua Fink Group just listed a home in ${locality}, TN — ${l.address}, ${price}.\n\n` +
    `${description}\n\n` +
    `Joshua Fink Group helps buyers and sellers across ${locality} and Middle Tennessee. ` +
    `Call or text Joshua Fink at 615-551-2727 for a private showing, or see the full listing at joshuafink.com.`
  return {
    text,
    url,
    title: `Homes for sale in ${locality}, TN — ${l.address}`,
    description: description || 'Middle Tennessee real estate',
    kind: 'listing',
    refKey: slug,
  }
}

// "Just sold" post. NOT part of the weekly rotation: lib/sold-listings.ts
// carries no close date (Compass's transactions section doesn't publish one),
// so nothing here can tell a sale that closed last week from one that closed in
// 2019. It is opt-in per sale instead — ?kind=sold&address=1901+New+Bristol —
// and pairs with ?preview=1 to read the copy back without publishing.
function buildFromSale(addressQuery: string): PostPayload | null {
  const needle = addressQuery.trim().toLowerCase()
  if (!needle) return null
  const l = soldListings.find((x) => x.address.toLowerCase().includes(needle))
  if (!l) return null
  const locality = l.city.split('|')[0].split(',')[0].trim()
  const price = `$${l.price.toLocaleString()}`
  const slug = listingSlug(l)
  // Sold homes get no on-site detail page (see lib/listing-detail.ts), so link
  // to the listings hub, where the sale shows in the Recently Sold grid.
  const url = withUtm(`${SITE}/listings`, {
    source: 'linkedin',
    medium: 'auto',
    campaign: 'just-sold',
    content: slug,
  })
  const description = [
    l.beds ? `${l.beds} bed` : '',
    l.baths ? `${l.baths} bath` : '',
    l.sqft ? `${l.sqft.toLocaleString()} sq ft` : '',
    l.acres ? `${l.acres} acres` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const text =
    `Joshua Fink Group just sold a home in ${locality}, TN — ${l.address}, ${price}.\n\n` +
    `${description}\n\n` +
    `Another ${locality} closing for Joshua Fink Group. If you're weighing a move in ${locality} ` +
    `or anywhere in Middle Tennessee, call or text Joshua Fink at 615-551-2727 for a no-pressure ` +
    `valuation, or see recent sales at joshuafink.com.`
  return {
    text,
    url,
    title: `Just sold in ${locality}, TN — ${l.address}`,
    description: description || 'Middle Tennessee real estate',
    kind: 'sold',
    refKey: slug,
  }
}

// Client testimonial. Like the just-sold post this is opt-in rather than part
// of the weekly rotation — lib/reviews.ts carries no "already posted" state, so
// a recurring slot would recycle the same handful of reviews through the feed.
// Google Business already publishes a review every 8th week; this is the
// LinkedIn equivalent, fired when Joshua has a specific client win to share:
//   ?kind=testimonial                  → the week's review
//   ?kind=testimonial&reviewer=lindsay → that client's review
// Pairs with ?preview=1 to read the copy back without publishing.
function buildFromTestimonial(reviewerQuery: string): PostPayload | null {
  if (!reviews.length) return null
  const needle = reviewerQuery.trim().toLowerCase()
  const r = needle
    ? reviews.find((x) => x.reviewer.toLowerCase().includes(needle))
    : reviews[isoWeekNumber() % reviews.length]
  if (!r) return null
  const refKey = r.reviewer.toLowerCase().replace(/[^\w]+/g, '-')
  const url = withUtm(`${SITE}/reviews`, {
    source: 'linkedin',
    medium: 'auto',
    campaign: 'testimonial',
    content: refKey,
  })
  const social = `${reviewStats.rating.toFixed(1)}-star average across ${reviewStats.total} client reviews`
  // Entity + the transaction's location keyword land in the first ~9 words —
  // that opening line becomes the post's title tag. No hashtags on LinkedIn.
  const text =
    `Joshua Fink Group client review — ${r.transaction}.\n\n` +
    `"${r.text}"\n— ${r.reviewer}\n\n` +
    `Joshua Fink Group helps buyers and sellers across Nashville and Middle Tennessee, ` +
    `with a ${social}. Call or text Joshua Fink at 615-551-2727, or read more: ${url}`
  return {
    text,
    url,
    title: `Client reviews — Joshua Fink Group, Compass Real Estate`,
    description: `${r.transaction} · ${social}`,
    kind: 'testimonial',
    refKey,
  }
}

// Monthly Middle TN market update. Fired by
// .github/workflows/monthly-market-update.yml with ?kind=market — deliberately
// NOT part of the weekly rotation. Reads lib/market-snapshot.ts, the same
// numbers the blog post and the Facebook/GBP posts use, and returns null when
// the month's figures haven't been entered yet (the caller then posts nothing).
function buildFromMarketSnapshot(): PostPayload | null {
  const s = currentSnapshot()
  if (!s) return null
  const label = monthLabel(s.month)
  const slug = marketUpdateSlug(s.month)
  const url = withUtm(`${SITE}/blog/${slug}`, {
    source: 'linkedin',
    medium: 'auto',
    campaign: 'monthly-market-update',
    content: s.month,
  })
  const n = (v: number) => v.toLocaleString('en-US')
  // Entity + location keyword inside the first ~9 words — that opening line
  // becomes the post's title tag. No hashtags on LinkedIn.
  const text =
    `Middle Tennessee real estate market update — ${label}. ` +
    `Median sale price ${s.medianSalePrice}, ${s.medianYoyChange} year over year.\n\n` +
    `• Average days on market: ${s.avgDaysOnMarket}\n` +
    `• Closed sales: ${n(s.closedSales)}\n` +
    `• Active listings: ${n(s.activeListings)}\n` +
    `• Months of supply: ${s.monthsOfInventory}\n\n` +
    `Source: ${s.source}, ${label} report.\n\n` +
    `Joshua Fink Group — Compass Real Estate, serving Nashville & Middle Tennessee. ` +
    `The full ${label} breakdown, and what it means if you're buying or selling: ${url}`
  return {
    text,
    url,
    title: `Middle Tennessee Real Estate Market Update — ${label}`,
    description: `Median ${s.medianSalePrice} · ${s.avgDaysOnMarket} days on market · ${n(s.activeListings)} active listings`,
    kind: 'market',
    refKey: s.month,
  }
}

function pickPayload(): PostPayload | null {
  // Even weeks → latest blog. Odd weeks → featured listing.
  return isoWeekNumber() % 2 === 0
    ? buildFromLatestBlog() || buildFromListing()
    : buildFromListing() || buildFromLatestBlog()
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'linkedin cron not configured (missing CRON_SECRET)' },
      { status: 500 },
    )
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Opt-in overrides for one-off posts. With no params the route behaves
  // exactly as the weekly cron always has (blog / active-listing rotation).
  const params = new URL(request.url).searchParams
  const kind = params.get('kind')
  const isMonthly = kind === 'market'
  const jobName = isMonthly ? MONTHLY_JOB : WEEKLY_JOB
  const payload = isMonthly
    ? buildFromMarketSnapshot()
    : kind === 'sold'
      ? buildFromSale(params.get('address') ?? '')
      : kind === 'testimonial'
        ? buildFromTestimonial(params.get('reviewer') ?? '')
        : pickPayload()

  // ?preview=1 composes the copy and hands it back without touching LinkedIn,
  // so a draft can be read and approved before anything is published.
  if (params.get('preview') === '1') {
    return NextResponse.json({ posted: false, preview: true, payload })
  }

  // Monthly run with no numbers entered for the month → post nothing at all
  // rather than recycling last month's figures. 200 so the monthly workflow
  // doesn't retry-then-fail on a deliberate skip; the post_log row is what
  // surfaces it in /admin and the morning healthcheck.
  if (isMonthly && !payload) {
    const reason = snapshotSkipReason()
    console.warn('[linkedin-post] skipping monthly market update —', reason)
    await logPost({
      channel: 'linkedin',
      jobName,
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

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN
  if (!accessToken || !authorUrn) {
    // Log the early exit too — otherwise a channel that never even reaches
    // LinkedIn looks identical in /admin to one that was never scheduled.
    await logPost({
      channel: 'linkedin',
      jobName,
      payloadKind: 'none',
      refKey: 'no-payload',
      status: 'failed',
      errorMessage: 'LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN not set',
    })
    return NextResponse.json(
      { error: 'LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN not set' },
      { status: 500 },
    )
  }

  if (!payload) {
    await logPost({
      channel: 'linkedin',
      jobName,
      payloadKind: 'none',
      refKey: 'no-payload',
      status: 'failed',
      errorMessage: 'no content available to post (no blogs or listings)',
    })
    return NextResponse.json(
      { error: 'no content available to post (no blogs or listings)' },
      { status: 422 },
    )
  }

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: payload.text },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: payload.url,
            title: { text: payload.title },
            description: { text: payload.description },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  try {
    const res = await fetch(LINKEDIN_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      // Don't log the raw upstream body — LinkedIn error responses include
      // request IDs, account URNs, and sometimes user metadata. Log status
      // only plus a sanitized snippet of any error code string.
      const bodySnippet = await res
        .text()
        .then((t) => t.slice(0, 100).replace(/[^\w\s.:,\-]/g, ''))
        .catch(() => '')
      console.error('[linkedin-post] upstream error', res.status, bodySnippet)
      await logPost({
        channel: 'linkedin',
        jobName,
        payloadKind: payload.kind,
        refKey: payload.refKey,
        messagePreview: payload.text.slice(0, 200),
        link: payload.url,
        externalPostId: null,
        status: 'failed',
        errorMessage: `upstream ${res.status} ${bodySnippet}`.slice(0, 500),
      })
      return NextResponse.json(
        {
          error: 'linkedin upstream returned non-2xx',
          upstreamStatus: res.status,
          hint:
            res.status === 401
              ? 'LINKEDIN_ACCESS_TOKEN may have expired (60-day lifetime). Re-run /api/linkedin/auth.'
              : undefined,
        },
        { status: 502 },
      )
    }
    const data = (await res.json()) as { id?: string }
    await logPost({
      channel: 'linkedin',
      jobName,
      payloadKind: payload.kind,
      refKey: payload.refKey,
      messagePreview: payload.text.slice(0, 200),
      link: payload.url,
      externalPostId: data.id ?? null,
      status: 'posted',
    })
    return NextResponse.json({
      posted: true,
      postId: data.id,
      preview: payload.text.slice(0, 120),
      url: payload.url,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[linkedin-post] network error', err)
    await logPost({
      channel: 'linkedin',
      jobName,
      payloadKind: payload.kind,
      refKey: payload.refKey,
      messagePreview: payload.text.slice(0, 200),
      link: payload.url,
      externalPostId: null,
      status: 'failed',
      errorMessage: `network: ${(err as Error).message}`.slice(0, 500),
    })
    return NextResponse.json({ error: 'linkedin post failed' }, { status: 502 })
  }
}
