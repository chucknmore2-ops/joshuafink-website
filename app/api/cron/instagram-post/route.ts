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
import {
  GRAPH_API,
  IG_ALTERNATE_LISTINGS,
  IG_ALTERNATE_POLL_MS,
  IG_POLL_INTERVAL_MS,
  IG_POLL_MS,
  IG_RESUME_POLL_MS,
  IgPageResolutionError,
  igFailureBody,
  igTokenLogFields,
  preflightPublicJpeg,
  redactSecrets,
  resolveIgPublishToken,
  type IgAttemptDebug,
  type IgPublishToken,
} from '@/lib/instagram-publish'

export const dynamic = 'force-dynamic'
// First listing 90s + two 80s alternates plus image preflight. geo-audit
// already runs at 300 on this plan; do not raise this.
export const maxDuration = 300

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
//                             IG_USER_ID is accepted as an alias.
//   IG_ACCESS_TOKEN         — long-lived Page token, or a User token with
//                             instagram_content_publish (+ pages_show_list /
//                             pages_read_engagement so we can read /me/accounts).
//                             User tokens are swapped at runtime for the Page
//                             token of the Page linked to IG_BUSINESS_ACCOUNT_ID
//                             (never the first Page on the User).
//
// Two-step Graph API flow:
//   1. POST /{ig-user-id}/media with image_url + caption → returns container ID
//   2. POST /{ig-user-id}/media_publish with creation_id → returns media ID
//
// image_url is always a JPEG on https://www.joshuafink.com (see
// lib/compass-photo.ts + /ig-photo/{id}.jpg). Compass CDN URLs stalled Meta
// at IN_PROGRESS on 2026-09-16 and 2026-09-17.

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
  // the stalled-container fallback in GET, which needs a different photo.
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

  const igUserId =
    process.env.IG_BUSINESS_ACCOUNT_ID || process.env.IG_USER_ID
  const envToken = process.env.IG_ACCESS_TOKEN
  if (!igUserId || !envToken) {
    await logIg('failed', null, {
      errorMessage: 'IG_BUSINESS_ACCOUNT_ID or IG_ACCESS_TOKEN not set',
    })
    return NextResponse.json(
      { error: 'IG_BUSINESS_ACCOUNT_ID or IG_ACCESS_TOKEN not set' },
      { status: 500 },
    )
  }

  // graph.facebook.com content publishing wants a Page token. A User token
  // can create containers that sit at status_code IN_PROGRESS until timeout
  // (GHA 35604056983). Swap when /me/accounts yields the linked Page — never
  // the first brand on the User (GHA 35606977924 picked Water Filter Lab).
  let resolved: IgPublishToken
  try {
    resolved = await resolveIgPublishToken({
      envToken,
      igBusinessAccountId: igUserId,
      preferredPageId: process.env.FB_PAGE_ID,
    })
  } catch (err) {
    const message =
      err instanceof IgPageResolutionError
        ? err.message
        : `instagram page resolution failed: ${(err as Error).message}`
    console.error('[instagram-post] page resolution', redactSecrets(message))
    await logIg('failed', null, { errorMessage: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const accessToken = resolved.accessToken
  const tokenLog = igTokenLogFields(resolved)
  console.info('[instagram-post] token', JSON.stringify(tokenLog))

  const payload = pickPayload()
  if (!payload) {
    await logIg('failed', null, {
      errorMessage: 'no content available to post (no listings or blog covers)',
    })
    return NextResponse.json(
      { error: 'no content available to post (no listings or blog covers)' },
      { status: 422 },
    )
  }

  const sanitize = (t: string) =>
    redactSecrets(t).replace(/[^\w\s.:,\-;/()#'"=[\]]/g, '')
  // ?creationId= lets Social Autopost resume the container a previous attempt
  // created. Honour it only for the first payload: a container Meta has left
  // IN_PROGRESS for minutes is dead, and on 2026-09-16 all three GHA attempts
  // polled the same stuck id.
  const resumeRaw = new URL(request.url).searchParams.get('creationId')?.trim() ?? ''
  const resumeId = /^\d+$/.test(resumeRaw) ? resumeRaw : ''

  type Attempt =
    | { ok: true; mediaId?: string; creationId: string }
    | {
        ok: false
        status: number
        error: string
        errorMessage: string
        creationId?: string
        statusCode?: string
        statusText?: string
        hint?: string
        /** Meta accepted the container but never finished it — another photo may work. */
        stalled: boolean
      }

  // One create → poll → publish cycle. Never throws, so the caller can decide
  // whether a different listing is worth another cycle.
  async function attemptPost(p: PostPayload, pollMs: number, resume = ''): Promise<Attempt> {
    try {
      let creationId = resume
      if (!creationId) {
        const containerParams = new URLSearchParams({
          image_url: p.imageUrl,
          caption: p.caption,
          access_token: accessToken!,
        })
        const containerRes = await fetch(
          `${GRAPH_API}/${igUserId}/media?${containerParams.toString()}`,
          { method: 'POST' },
        )
        if (!containerRes.ok) {
          const snippet = await containerRes.text().then(sanitize).catch(() => '')
          console.error('[instagram-post] container error', containerRes.status, snippet)
          return {
            ok: false,
            status: 502,
            error: 'instagram container creation failed',
            errorMessage: `container ${containerRes.status} ${snippet}`,
            hint:
              containerRes.status === 401 || containerRes.status === 400
                ? 'IG_ACCESS_TOKEN may have expired or lacks instagram_content_publish scope.'
                : undefined,
            // A rejected token or request is not the photo's fault.
            stalled: false,
          }
        }
        const containerData = (await containerRes.json()) as { id?: string }
        creationId = containerData.id ?? ''
        if (!creationId) {
          return {
            ok: false,
            status: 502,
            error: 'instagram container returned no id',
            errorMessage: 'instagram container returned no id',
            stalled: false,
          }
        }
      }

      // Meta processes the image asynchronously after the container is created.
      // Publishing before status_code=FINISHED is what threw the 400 "Media ID
      // is not available" (OAuthException code 9007) failures, so poll until
      // it's ready. Also read `status` — when status_code is ERROR that field
      // is Meta's human-readable reason (download failure, aspect ratio, …).
      let statusCode = 'IN_PROGRESS'
      let statusText = ''
      const pollDeadline = Date.now() + pollMs
      while (Date.now() < pollDeadline) {
        const statusRes = await fetch(
          `${GRAPH_API}/${creationId}?fields=status_code,status&access_token=${accessToken}`,
        )
        if (statusRes.ok) {
          const statusData = (await statusRes.json()) as {
            status_code?: string
            status?: string
          }
          statusCode = statusData.status_code ?? 'IN_PROGRESS'
          statusText = typeof statusData.status === 'string' ? statusData.status : ''
        }
        if (statusCode === 'FINISHED' || statusCode === 'ERROR' || statusCode === 'EXPIRED') {
          break
        }
        await new Promise((resolve) => setTimeout(resolve, IG_POLL_INTERVAL_MS))
      }
      if (statusCode !== 'FINISHED') {
        const reason = statusText ? `; ${sanitize(statusText)}` : ''
        return {
          ok: false,
          status: 502,
          error: 'instagram container not ready',
          errorMessage: `container ${creationId} not ready (status_code ${statusCode}${reason}) slug=${p.refKey}`,
          creationId,
          statusCode,
          statusText: statusText ? sanitize(statusText) : undefined,
          stalled: true,
        }
      }

      const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken!,
      })
      const publishRes = await fetch(
        `${GRAPH_API}/${igUserId}/media_publish?${publishParams.toString()}`,
        { method: 'POST' },
      )
      if (!publishRes.ok) {
        const snippet = await publishRes.text().then(sanitize).catch(() => '')
        console.error('[instagram-post] publish error', publishRes.status, snippet)
        return {
          ok: false,
          status: 502,
          error: 'instagram publish failed',
          errorMessage: `publish ${publishRes.status} ${snippet}`,
          creationId,
          stalled: false,
        }
      }
      const publishData = (await publishRes.json()) as { id?: string }
      return { ok: true, mediaId: publishData.id, creationId }
    } catch (err) {
      console.error('[instagram-post] network error', err)
      return {
        ok: false,
        status: 502,
        error: 'instagram post failed',
        errorMessage: `network: ${(err as Error).message}`,
        stalled: false,
      }
    }
  }

  const queue = payloadsToTry(payload)
  const attempts: IgAttemptDebug[] = []
  let lastFail: Extract<Attempt, { ok: false }> | null = null

  for (let i = 0; i < queue.length; i++) {
    const posted = queue[i]
    const debugBase: IgAttemptDebug = {
      refKey: posted.refKey,
      kind: posted.kind,
      imageUrl: posted.imageUrl,
    }

    const preflight = await preflightPublicJpeg(posted.imageUrl)
    if (!preflight.ok) {
      console.warn('[instagram-post] image preflight failed', posted.refKey, preflight.reason)
      attempts.push({ ...debugBase, error: preflight.reason })
      await logIg('failed', posted, {
        errorMessage: `preflight ${posted.refKey}: ${preflight.reason}`,
      })
      lastFail = {
        ok: false,
        status: 502,
        error: 'instagram image_url not ready',
        errorMessage: `preflight ${posted.refKey}: ${preflight.reason}`,
        stalled: true,
      }
      continue
    }

    console.info(
      '[instagram-post] attempting',
      JSON.stringify({
        refKey: posted.refKey,
        kind: posted.kind,
        imageUrl: posted.imageUrl,
        bytes: preflight.bytes,
        resume: i === 0 && Boolean(resumeId),
      }),
    )

    const pollMs =
      i === 0
        ? resumeId
          ? IG_RESUME_POLL_MS
          : IG_POLL_MS
        : IG_ALTERNATE_POLL_MS
    const attempt = await attemptPost(posted, pollMs, i === 0 ? resumeId : '')
    const attemptLog: IgAttemptDebug = {
      ...debugBase,
      creationId: attempt.creationId,
      statusCode: attempt.ok ? 'FINISHED' : attempt.statusCode,
      status: attempt.ok ? undefined : attempt.statusText,
      error: attempt.ok ? undefined : attempt.error,
    }
    attempts.push(attemptLog)
    console.info(
      '[instagram-post] result',
      JSON.stringify({
        refKey: posted.refKey,
        creationId: attemptLog.creationId ?? null,
        statusCode: attemptLog.statusCode ?? null,
        status: attemptLog.status ?? null,
        ok: attempt.ok,
      }),
    )

    if (attempt.ok) {
      await logIg('posted', posted, { externalPostId: attempt.mediaId ?? null })
      return NextResponse.json({
        posted: true,
        mediaId: attempt.mediaId,
        creationId: attempt.creationId,
        refKey: posted.refKey,
        kind: posted.kind,
        imageUrl: posted.imageUrl,
        preview: posted.caption.slice(0, 120),
        url: posted.url,
        attempts,
        ...tokenLog,
        at: new Date().toISOString(),
      })
    }

    await logIg('failed', posted, { errorMessage: attempt.errorMessage })
    lastFail = attempt
    // Token / request rejection is not the photo's fault — don't burn quota
    // creating more containers.
    if (!attempt.stalled) {
      return NextResponse.json(
        {
          ...igFailureBody({
            error: attempt.error,
            attempts,
            hint: attempt.hint,
            resume: false,
          }),
          ...tokenLog,
        },
        { status: attempt.status },
      )
    }

    if (i < queue.length - 1) {
      console.warn(
        '[instagram-post] container stalled on',
        posted.refKey,
        attempt.creationId,
        attempt.statusCode,
        '— retrying with',
        queue[i + 1].refKey,
      )
    }
  }

  const fail = lastFail ?? {
    ok: false as const,
    status: 502,
    error: 'instagram container not ready',
    errorMessage: 'no attempt completed',
    stalled: true,
  }
  return NextResponse.json(
    {
      ...igFailureBody({
        error: fail.error,
        attempts,
        hint: fail.hint,
        // Alternates already tried in-process. Echo creationId for logs, but do
        // not ask Social Autopost to resume a container Meta has abandoned.
        resume: false,
      }),
      ...tokenLog,
    },
    { status: fail.status },
  )
}
