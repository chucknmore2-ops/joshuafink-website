import { NextResponse } from 'next/server'
import { blogPosts } from '@/lib/blog'
import { listings } from '@/lib/listings'
import { logPost } from '@/lib/admin-db'
import { withUtm } from '@/lib/utm'

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
  kind: 'blog' | 'listing'
  refKey: string
}

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
  const text =
    `${p.title}\n\n` +
    `${p.excerpt.slice(0, 280)}${p.excerpt.length > 280 ? '…' : ''}\n\n` +
    `Read the full post: ${url}\n\n` +
    `#NashvilleRealEstate #MiddleTennessee #JoshuaFinkGroup #Compass`
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
  const cityShort = l.city.split('|')[0].trim()
  const price = `$${l.price.toLocaleString()}`
  const title = `${l.address}, ${cityShort} — ${price}`
  const description = [
    l.beds ? `${l.beds} bed` : '',
    l.baths ? `${l.baths} bath` : '',
    l.sqft ? `${l.sqft.toLocaleString()} sq ft` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const text =
    `Featured listing — ${title}\n\n` +
    `${description}\n\n` +
    `Call Joshua Fink at 615-551-2727 for a private showing, or see the full listing on Compass.\n\n` +
    `#${cityShort.replace(/[,\s]+/g, '')} #JustListed #JoshuaFinkGroup #Compass`
  return {
    text,
    url: l.compassUrl,
    title,
    description: description || 'Middle Tennessee real estate',
    kind: 'listing',
    refKey: l.address.toLowerCase().replace(/[^\w]+/g, '-'),
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

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN
  if (!accessToken || !authorUrn) {
    return NextResponse.json(
      { error: 'LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN not set' },
      { status: 500 },
    )
  }

  const payload = pickPayload()
  if (!payload) {
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
        jobName: 'linkedin-post',
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
      jobName: 'linkedin-post',
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
      jobName: 'linkedin-post',
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
