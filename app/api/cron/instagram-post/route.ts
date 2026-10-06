import { NextResponse } from 'next/server'
import { blogPosts } from '@/lib/blog'
import {
  pickWeeklyPromotable,
  fallbackPromotables,
  promotableListings,
} from '@/lib/promotable-listings'
import type { Listing } from '@/lib/listings'
import { listingSlug } from '@/lib/listing-detail'
import { logPost } from '@/lib/admin-db'
import { instagramImageUrl } from '@/lib/compass-photo'
import { withUtm } from '@/lib/utm'
import { queueInstagramImagePost } from '@/lib/buffer-publish'
import {
  IG_ALTERNATE_LISTINGS,
  preflightPublicJpeg,
} from '@/lib/instagram-publish'

export const dynamic = 'force-dynamic'
// One public JPEG preflight plus a Buffer createPost. No Graph poll.
export const maxDuration = 60

// Instagram auto-poster for Joshua Fink Group.
//
// Social Autopost (IG_AUTOPOST=buffer) calls this route. The live path queues
// one feed photo through Buffer Free — caption + a public image URL — with
// schedulingType automatic and mode addToQueue. Meta Graph media create /
// poll / publish stays off (containers sat IN_PROGRESS; Tech Provider was
// declined). Do not reintroduce a Meta media call here.
//
// Required:
//   CRON_SECRET              — shared across /api/cron/* routes
//   BUFFER_API_KEY           — Buffer Free API key. GitHub Actions secret,
//                              forwarded on X-Buffer-Api-Key. Env is a fallback.
//   BUFFER_IG_CHANNEL_ID     — Buffer channel id for @joshuafinkgroup.
//                              Forwarded on X-Buffer-Ig-Channel-Id.
//
// A Buffer PostActionSuccess is a successful queue, not a Graph publish.
// post_log status `posted` means Buffer accepted the item.

const SITE = 'https://www.joshuafink.com'
const MAX_CAPTION = 2200 // IG hard limit

type PostPayload = {
  caption: string
  imageUrl: string
  url: string
  // kind + refKey populate post_log columns so the morning healthcheck can
  // see freshness per channel and /admin can dedup across reruns.
  kind: 'blog' | 'listing'
  refKey: string
}

// Every post_log write from this route. Kept in one helper so the early-exit
// paths (missing token, nothing to post) leave a red row in /admin instead of
// nothing at all — a silently dead channel used to be indistinguishable from
// a channel that was never scheduled.
function logIg(
  status: 'posted' | 'failed',
  payload: PostPayload | null,
  extra: { externalPostId?: string | null; errorMessage?: string } = {},
) {
  return logPost({
    channel: 'instagram',
    jobName: 'instagram-post',
    payloadKind: payload?.kind ?? 'none',
    refKey: payload?.refKey ?? 'no-payload',
    messagePreview: payload ? payload.caption.slice(0, 200) : null,
    link: payload?.url ?? null,
    externalPostId: extra.externalPostId ?? null,
    status,
    errorMessage: extra.errorMessage?.slice(0, 500) ?? null,
  })
}

function headerOrEnv(request: Request, header: string, envName: string): string {
  const fromHeader = request.headers.get(header)?.trim() ?? ''
  if (fromHeader) return fromHeader
  return process.env[envName]?.trim() ?? ''
}

function isoWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7)
}

function buildFromListing(listing?: Listing | null): PostPayload | null {
  // Rotates weekly (this cron runs Wednesdays only) and skips anything not
  // positively Active — the old `.find()` returned the array head every run,
  // and the head was "Active Under Contract", so this caption announced an
  // unavailable home. See lib/promotable-listings.ts. An explicit `listing` is
  // the preflight fallback in GET, which needs a different photo.
  const l = listing ?? pickWeeklyPromotable(1)
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
    `Joshua Fink Group has a home for sale in ${locality}, TN — ${l.address}.\n\n` +
    `${features}\n${price}\n\n` +
    `Call or text Joshua Fink at 615-551-2727 for a private showing. Full details at joshuafink.com — link in bio.\n\n` +
    `#${cityHashtag} #JustListed #JoshuaFinkGroup #Compass #NashvilleRealEstate #MiddleTennessee #TennesseeRealEstate`
  return {
    caption: caption.slice(0, MAX_CAPTION),
    // Hosted JPEG on joshuafink.com — never the Compass CDN. See
    // app/ig-photo/[id]/route.ts.
    imageUrl: instagramImageUrl(l.imageUrl!),
    url,
    kind: 'listing',
    refKey: slug,
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
    imageUrl: instagramImageUrl(cover),
    url,
    kind: 'blog',
    refKey: p.slug,
  }
}

function pickPayload(): PostPayload | null {
  // Even weeks → blog (if it has a cover image); odd weeks → listing.
  // IG requires media so we always fall back to listing if blog has no image.
  return isoWeekNumber() % 2 === 0
    ? buildFromBlog() || buildFromListing()
    : buildFromListing() || buildFromBlog()
}

function payloadsToTry(first: PostPayload): PostPayload[] {
  const out: PostPayload[] = [first]
  if (first.kind !== 'listing') return out
  const current = promotableListings().find((l) => listingSlug(l) === first.refKey)
  if (!current) return out
  for (const alt of fallbackPromotables(current, IG_ALTERNATE_LISTINGS)) {
    const payload = buildFromListing(alt)
    if (payload && payload.refKey !== first.refKey) out.push(payload)
  }
  return out
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

  // Graph stays off even when these are missing. Social Autopost forwards
  // the GitHub secrets; process.env covers a Vercel env if one is added later.
  const apiKey = headerOrEnv(request, 'x-buffer-api-key', 'BUFFER_API_KEY')
  const channelId = headerOrEnv(
    request,
    'x-buffer-ig-channel-id',
    'BUFFER_IG_CHANNEL_ID',
  )
  if (!apiKey || !channelId) {
    await logIg('failed', null, {
      errorMessage: 'BUFFER_API_KEY or BUFFER_IG_CHANNEL_ID not set',
    })
    return NextResponse.json(
      {
        error: 'BUFFER_API_KEY or BUFFER_IG_CHANNEL_ID not set',
        via: 'buffer',
      },
      { status: 500 },
    )
  }

  const payload = pickPayload()
  if (!payload) {
    await logIg('failed', null, {
      errorMessage: 'no content available to post (no listings or blog covers)',
    })
    return NextResponse.json(
      { error: 'no content available to post (no listings or blog covers)', via: 'buffer' },
      { status: 422 },
    )
  }

  const queue = payloadsToTry(payload)
  const preflightErrors: string[] = []
  let posted: PostPayload | null = null
  for (const candidate of queue) {
    const preflight = await preflightPublicJpeg(candidate.imageUrl)
    if (!preflight.ok) {
      console.warn('[instagram-post] image preflight failed', candidate.refKey, preflight.reason)
      preflightErrors.push(`${candidate.refKey}: ${preflight.reason}`)
      continue
    }
    posted = candidate
    console.info(
      '[instagram-post] queuing via buffer',
      JSON.stringify({
        refKey: candidate.refKey,
        kind: candidate.kind,
        imageUrl: candidate.imageUrl,
        bytes: preflight.bytes,
        schedulingType: 'automatic',
        mode: 'addToQueue',
      }),
    )
    break
  }

  if (!posted) {
    const errorMessage = `preflight failed: ${preflightErrors.join('; ') || 'no image'}`
    await logIg('failed', queue[0] ?? null, { errorMessage })
    return NextResponse.json(
      {
        error: 'instagram image_url not ready',
        via: 'buffer',
        refKey: queue[0]?.refKey ?? null,
        kind: queue[0]?.kind ?? null,
        imageUrl: queue[0]?.imageUrl ?? null,
        preflight: preflightErrors,
      },
      { status: 502 },
    )
  }

  const queued = await queueInstagramImagePost({
    apiKey,
    channelId,
    text: posted.caption,
    imageUrl: posted.imageUrl,
  })
  if (!queued.ok) {
    console.error('[instagram-post] buffer error', queued.error)
    await logIg('failed', posted, { errorMessage: queued.error })
    return NextResponse.json(
      {
        error: 'buffer queue failed',
        via: 'buffer',
        refKey: posted.refKey,
        kind: posted.kind,
        imageUrl: posted.imageUrl,
        message: queued.error,
      },
      { status: 502 },
    )
  }

  await logIg('posted', posted, { externalPostId: queued.postId })
  return NextResponse.json({
    posted: true,
    via: 'buffer',
    bufferPostId: queued.postId,
    schedulingType: 'automatic',
    mode: 'addToQueue',
    refKey: posted.refKey,
    kind: posted.kind,
    imageUrl: posted.imageUrl,
    preview: posted.caption.slice(0, 120),
    url: posted.url,
    at: new Date().toISOString(),
  })
}
