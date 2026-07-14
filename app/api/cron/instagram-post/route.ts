import { NextResponse } from 'next/server'
import { blogPosts } from '@/lib/blog'
import { listings } from '@/lib/listings'
import { listingSlug } from '@/lib/listing-detail'
import { withUtm } from '@/lib/utm'

export const dynamic = 'force-dynamic'

// Instagram auto-poster for Joshua Fink Group.
//
// Runs on Vercel Cron; posts to the linked IG Business account via the Meta
// Graph API. IG requires media on every post (no text-only), so the rotator
// favors listings (always have imageUrl). Blog posts only post if they have a
// coverImage — otherwise we fall through to a listing.
//
// Required env vars:
//   CRON_SECRET             — shared across /api/cron/* routes
//   IG_BUSINESS_ACCOUNT_ID  — 17-digit Instagram Business account ID, found in
//                             Meta Business Suite → Business settings → Accounts
//                             → Instagram accounts. Requires the IG account to
//                             be Business/Creator and linked to the FB Page.
//   IG_ACCESS_TOKEN         — Page access token with instagram_basic +
//                             instagram_content_publish + pages_read_engagement
//                             scopes. Often the same token used for FB Page
//                             posting if linked.
//
// Two-step Graph API flow:
//   1. POST /{ig-user-id}/media with image_url + caption → returns container ID
//   2. POST /{ig-user-id}/media_publish with creation_id → returns media ID

const GRAPH_API = 'https://graph.facebook.com/v19.0'
const SITE = 'https://www.joshuafink.com'
const MAX_CAPTION = 2200 // IG hard limit

type PostPayload = {
  caption: string
  imageUrl: string
  url: string
}

function isoWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7)
}

function buildFromListing(): PostPayload | null {
  const l = listings.find((x) => x.imageUrl && x.price && x.compassUrl)
  if (!l) return null
  // Locality only ("Brentwood"), not "Brentwood, TN 37027", so the caption
  // reads "in Brentwood, TN".
  const locality = l.city.split('|')[0].split(',')[0].trim()
  const price = `$${l.price.toLocaleString()}`
  const cityHashtag = locality.replace(/[,\s]+/g, '')
  const slug = listingSlug(l)
  const features = [
    l.beds ? `${l.beds} bed` : '',
    l.baths ? `${l.baths} bath` : '',
    l.sqft ? `${l.sqft.toLocaleString()} sq ft` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  // Link to the on-site listing page (traffic to the money site), not Compass.
  const url = withUtm(`${SITE}/listings/${slug}`, {
    source: 'instagram',
    medium: 'auto',
    campaign: 'listing-spotlight',
    content: slug,
  })
  // Entity-first + location keyword up front so the post indexes/seeds AI for
  // the right terms. Hashtags are fine on Instagram (unlike LinkedIn).
  const caption =
    `Joshua Fink Group just listed a home in ${locality}, TN — ${l.address}.\n\n` +
    `${features}\n${price}\n\n` +
    `Call or text Joshua Fink at 615-551-2727 for a private showing. Full details at joshuafink.com — link in bio.\n\n` +
    `#${cityHashtag} #JustListed #JoshuaFinkGroup #Compass #NashvilleRealEstate #MiddleTennessee #TennesseeRealEstate`
  return {
    caption: caption.slice(0, MAX_CAPTION),
    imageUrl: l.imageUrl!,
    url,
  }
}

function buildFromBlog(): PostPayload | null {
  const candidates = blogPosts.filter((p) => p.coverImage)
  if (!candidates.length) return null
  const sorted = [...candidates].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )
  const p = sorted[0]
  const url = withUtm(`${SITE}/blog/${p.slug}`, {
    source: 'instagram',
    medium: 'auto',
    campaign: 'blog-syndication',
    content: p.slug,
  })
  const cover = p.coverImage!.startsWith('http')
    ? p.coverImage!
    : `${SITE}${p.coverImage!.startsWith('/') ? '' : '/'}${p.coverImage}`
  const caption =
    `${p.title}\n\n` +
    `${p.excerpt.slice(0, 1500)}${p.excerpt.length > 1500 ? '…' : ''}\n\n` +
    `Joshua Fink Group — Compass Real Estate, Middle Tennessee. Read the full post — link in bio.\n\n` +
    `#NashvilleRealEstate #MiddleTennessee #JoshuaFinkGroup #Compass`
  return {
    caption: caption.slice(0, MAX_CAPTION),
    imageUrl: cover,
    url,
  }
}

function pickPayload(): PostPayload | null {
  // Even weeks → blog (if it has a cover image); odd weeks → listing.
  // IG requires media so we always fall back to listing if blog has no image.
  return isoWeekNumber() % 2 === 0
    ? buildFromBlog() || buildFromListing()
    : buildFromListing() || buildFromBlog()
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'instagram cron not configured (missing CRON_SECRET)' },
      { status: 500 },
    )
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const igUserId = process.env.IG_BUSINESS_ACCOUNT_ID
  const accessToken = process.env.IG_ACCESS_TOKEN
  if (!igUserId || !accessToken) {
    return NextResponse.json(
      { error: 'IG_BUSINESS_ACCOUNT_ID or IG_ACCESS_TOKEN not set' },
      { status: 500 },
    )
  }

  const payload = pickPayload()
  if (!payload) {
    return NextResponse.json(
      { error: 'no content available to post (no listings or blog covers)' },
      { status: 422 },
    )
  }

  const sanitize = (t: string) => t.slice(0, 100).replace(/[^\w\s.:,\-]/g, '')

  try {
    const containerParams = new URLSearchParams({
      image_url: payload.imageUrl,
      caption: payload.caption,
      access_token: accessToken,
    })
    const containerRes = await fetch(
      `${GRAPH_API}/${igUserId}/media?${containerParams.toString()}`,
      { method: 'POST' },
    )
    if (!containerRes.ok) {
      const snippet = await containerRes.text().then(sanitize).catch(() => '')
      console.error('[instagram-post] container error', containerRes.status, snippet)
      return NextResponse.json(
        {
          error: 'instagram container creation failed',
          upstreamStatus: containerRes.status,
          hint:
            containerRes.status === 401 || containerRes.status === 400
              ? 'IG_ACCESS_TOKEN may have expired or lacks instagram_content_publish scope.'
              : undefined,
        },
        { status: 502 },
      )
    }
    const containerData = (await containerRes.json()) as { id?: string }
    const creationId = containerData.id
    if (!creationId) {
      return NextResponse.json(
        { error: 'instagram container returned no id' },
        { status: 502 },
      )
    }

    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    })
    const publishRes = await fetch(
      `${GRAPH_API}/${igUserId}/media_publish?${publishParams.toString()}`,
      { method: 'POST' },
    )
    if (!publishRes.ok) {
      const snippet = await publishRes.text().then(sanitize).catch(() => '')
      console.error('[instagram-post] publish error', publishRes.status, snippet)
      return NextResponse.json(
        { error: 'instagram publish failed', upstreamStatus: publishRes.status },
        { status: 502 },
      )
    }
    const publishData = (await publishRes.json()) as { id?: string }

    return NextResponse.json({
      posted: true,
      mediaId: publishData.id,
      creationId,
      preview: payload.caption.slice(0, 120),
      url: payload.url,
      at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[instagram-post] network error', err)
    return NextResponse.json({ error: 'instagram post failed' }, { status: 502 })
  }
}
