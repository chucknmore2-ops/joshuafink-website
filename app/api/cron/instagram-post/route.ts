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
  IG_ENV_TOKEN_POLL_MS,
  IG_POLL_MS,
  IG_RESUME_POLL_MS,
  IgPageResolutionError,
  igFailureBody,
  igStallHint,
  igTokenLogFields,
  isGenericInProgress,
  pollIgContainer,
  preflightPublicJpeg,
  redactSecrets,
  resolveIgPublishToken,
  shouldCompareEnvToken,
  type IgAttemptDebug,
  type IgPublishToken,
  type IgTokenKind,
} from '@/lib/instagram-publish'

export const dynamic = 'force-dynamic'
// Next 14 caches fetch GET by default. A cached IN_PROGRESS status would
// never observe FINISHED. force-no-store covers every Graph call in this route.
export const fetchCache = 'force-no-store'
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

function igJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

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
    return igJson(
      { error: 'instagram cron not configured (missing CRON_SECRET)' },
      500,
    )
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return igJson({ error: 'unauthorized' }, 401)
  }

  const igUserId =
    process.env.IG_BUSINESS_ACCOUNT_ID || process.env.IG_USER_ID
  const envToken = process.env.IG_ACCESS_TOKEN
  if (!igUserId || !envToken) {
    await logIg('failed', null, {
      errorMessage: 'IG_BUSINESS_ACCOUNT_ID or IG_ACCESS_TOKEN not set',
    })
    return igJson(
      { error: 'IG_BUSINESS_ACCOUNT_ID or IG_ACCESS_TOKEN not set' },
      500,
    )
  }
  const igAccountId = igUserId
  const envAccessToken = envToken

  // graph.facebook.com content publishing wants a Page token. Swap when
  // /me/accounts yields the linked Page — never the first brand on the User
  // (GHA 35606977924 picked Water Filter Lab). Run 35628788322 swapped to
  // Joshua Fink Group and still stalled, so tokenKind must name the Page
  // token we actually send, and a generic stall is compared once against
  // the unswapped env token.
  let resolved: IgPublishToken
  try {
    resolved = await resolveIgPublishToken({
      envToken: envAccessToken,
      igBusinessAccountId: igAccountId,
      preferredPageId: process.env.FB_PAGE_ID,
    })
  } catch (err) {
    const message =
      err instanceof IgPageResolutionError
        ? err.message
        : `instagram page resolution failed: ${(err as Error).message}`
    console.error('[instagram-post] page resolution', redactSecrets(message))
    await logIg('failed', null, { errorMessage: message })
    return igJson({ error: message }, 500)
  }
  const accessToken = resolved.accessToken
  const tokenLog = igTokenLogFields(resolved)
  console.info('[instagram-post] token', JSON.stringify(tokenLog))

  const payload = pickPayload()
  if (!payload) {
    await logIg('failed', null, {
      errorMessage: 'no content available to post (no listings or blog covers)',
    })
    return igJson(
      { error: 'no content available to post (no listings or blog covers)' },
      422,
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
    | { ok: true; mediaId?: string; creationId: string; tokenKind: IgTokenKind }
    | {
        ok: false
        status: number
        error: string
        errorMessage: string
        creationId?: string
        statusCode?: string
        statusText?: string
        statusCodeEx?: string | null
        graphError?: string | null
        probeError?: string | null
        tokenKind?: IgTokenKind
        hint?: string
        /** Meta accepted the container but never finished it — another photo may work. */
        stalled: boolean
      }

  const attempts: IgAttemptDebug[] = []
  let comparedEnvToken = false

  function pushAttempt(p: PostPayload, attempt: Attempt) {
    const row: IgAttemptDebug = {
      refKey: p.refKey,
      kind: p.kind,
      imageUrl: p.imageUrl,
      creationId: attempt.creationId,
      statusCode: attempt.ok ? 'FINISHED' : attempt.statusCode,
      status: attempt.ok ? undefined : attempt.statusText,
      statusCodeEx: attempt.ok ? null : attempt.statusCodeEx,
      graphError: attempt.ok ? null : attempt.graphError,
      probeError: attempt.ok ? null : attempt.probeError,
      tokenKind: attempt.tokenKind,
      error: attempt.ok ? undefined : attempt.error,
    }
    attempts.push(row)
    console.info(
      '[instagram-post] result',
      JSON.stringify({
        refKey: p.refKey,
        creationId: row.creationId ?? null,
        statusCode: row.statusCode ?? null,
        status: row.status ?? null,
        statusCodeEx: row.statusCodeEx ?? null,
        probeError: row.probeError ?? null,
        tokenKind: row.tokenKind ?? null,
        ok: attempt.ok,
      }),
    )
  }

  // One create → poll → publish cycle for a single token. Never throws.
  async function cycle(
    p: PostPayload,
    pollMs: number,
    token: string,
    tokenKind: IgTokenKind,
    resume = '',
  ): Promise<Attempt> {
    try {
      let creationId = resume
      if (!creationId) {
        const containerParams = new URLSearchParams({
          image_url: p.imageUrl,
          caption: p.caption,
          access_token: token,
        })
        const containerRes = await fetch(
          `${GRAPH_API}/${igAccountId}/media?${containerParams.toString()}`,
          { method: 'POST', cache: 'no-store' },
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
            tokenKind,
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
            tokenKind,
            stalled: false,
          }
        }
      }

      // Publishing before status_code=FINISHED is the 400 "Media ID is not
      // available" (code 9007) failure. Poll status_code and status, then ask
      // for status_code_ex once so a stall reason is not dropped on the floor.
      const polled = await pollIgContainer({
        creationId,
        accessToken: token,
        pollMs,
      })
      const statusCode = polled.statusCode || 'IN_PROGRESS'
      const statusText = polled.status ? sanitize(polled.status) : ''
      const graphError = polled.graphError ? sanitize(polled.graphError) : null
      const probeError = polled.probeError ? sanitize(polled.probeError) : null
      if (statusCode === 'PUBLISHED') {
        return { ok: true, creationId, tokenKind }
      }
      if (statusCode !== 'FINISHED') {
        const unread = Boolean(graphError) && statusCode === 'ERROR'
        const reason = statusText ? `; ${statusText}` : ''
        const extra = probeError ? `; probe ${probeError}` : ''
        return {
          ok: false,
          status: 502,
          error: unread ? 'instagram container status failed' : 'instagram container not ready',
          errorMessage: `container ${creationId} not ready (status_code ${statusCode}${reason}${extra}) slug=${p.refKey}`,
          creationId,
          statusCode,
          statusText: statusText || undefined,
          statusCodeEx: polled.statusCodeEx,
          graphError,
          probeError,
          tokenKind,
          stalled: !unread,
        }
      }

      const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: token,
      })
      const publishRes = await fetch(
        `${GRAPH_API}/${igAccountId}/media_publish?${publishParams.toString()}`,
        { method: 'POST', cache: 'no-store' },
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
          statusCode,
          tokenKind,
          stalled: false,
        }
      }
      const publishData = (await publishRes.json()) as { id?: string }
      return { ok: true, mediaId: publishData.id, creationId, tokenKind }
    } catch (err) {
      const message = redactSecrets((err as Error).message ?? 'network')
      console.error('[instagram-post] network error', message)
      return {
        ok: false,
        status: 502,
        error: 'instagram post failed',
        errorMessage: `network: ${message}`,
        tokenKind,
        stalled: false,
      }
    }
  }

  // Page token first. If that container stays on the generic processing
  // status, one container with the env token tests the open half of the
  // User-vs-Page hypothesis (run 35628788322 only exercised the Page token).
  async function attemptPost(p: PostPayload, pollMs: number, resume = ''): Promise<Attempt> {
    const first = await cycle(p, pollMs, accessToken, resolved.tokenKind, resume)
    pushAttempt(p, first)
    if (first.ok || !first.stalled) return first
    if (
      shouldCompareEnvToken({
        swapped: resolved.swapped,
        alreadyCompared: comparedEnvToken,
        resuming: Boolean(resume),
        statusCode: first.statusCode,
        status: first.statusText,
      })
    ) {
      comparedEnvToken = true
      console.info(
        '[instagram-post] generic IN_PROGRESS on page token; comparing env token',
        resolved.envTokenKind,
      )
      const second = await cycle(
        p,
        IG_ENV_TOKEN_POLL_MS,
        envAccessToken,
        resolved.envTokenKind,
        '',
      )
      pushAttempt(p, second)
      if (second.ok || !second.stalled) return second
    }
    return first
  }

  const queue = payloadsToTry(payload)
  let lastFail: Extract<Attempt, { ok: false }> | null = null

  function stallHint(): string | undefined {
    return igStallHint({
      generic: attempts.some((a) => isGenericInProgress(a.statusCode, a.status)),
      comparedEnvToken,
      missingScopes: resolved.missingScopes,
      missingBusinessManagerAdsScope: resolved.missingBusinessManagerAdsScope,
    })
  }

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

    if (attempt.ok) {
      await logIg('posted', posted, { externalPostId: attempt.mediaId ?? null })
      return igJson({
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
    // creating more containers. A generic stall on both the Page token and the
    // env token is not the photo's fault either (run 35628788322, three homes).
    if (
      comparedEnvToken &&
      isGenericInProgress(attempt.statusCode, attempt.statusText)
    ) {
      break
    }
    if (!attempt.stalled) {
      return igJson(
        {
          ...igFailureBody({
            error: attempt.error,
            attempts,
            hint: attempt.hint ?? stallHint(),
            resume: false,
          }),
          ...tokenLog,
        },
        attempt.status,
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
  return igJson(
    {
      ...igFailureBody({
        error: fail.error,
        attempts,
        hint: fail.hint ?? stallHint(),
        // Alternates already tried in-process. Echo creationId for logs, but do
        // not ask Social Autopost to resume a container Meta has abandoned.
        resume: false,
      }),
      ...tokenLog,
    },
    fail.status,
  )
}
