import { NextResponse } from 'next/server'
import { listings, listingsSyncedAt } from '@/lib/listings'
import {
  logPost,
  postedEventChannels,
  readListingState,
  replaceListingState,
  type ListingStateRecord,
} from '@/lib/admin-db'
import { queueBufferImagePost } from '@/lib/buffer-publish'
import { preflightPublicJpeg } from '@/lib/instagram-publish'
import { publishLinkedInListingPost } from '@/lib/linkedin-publish'
import { buildListingEventPost } from '@/lib/listing-event-copy'
import {
  LISTING_EVENTS_GAP_MS,
  LISTING_EVENTS_JOB,
  LISTING_EVENTS_PER_RUN,
  detectListingEvents,
  eventIsComplete,
  listingStateKey,
  reconcileListingState,
  remainingChannelActions,
  snapshotFromListing,
  type EventChannel,
  type ListingEvent,
  type ListingSnapshot,
} from '@/lib/listing-events'

export const dynamic = 'force-dynamic'
// One event: JPEG preflight, Buffer for Instagram and maybe Facebook, LinkedIn upload.
export const maxDuration = 60

// Same-day Just Listed, Coming Soon, Price Improved, Back on Market, and
// Open House posts. Just Sold stays on the manual linkedin-post / gbp-post
// ?kind=sold triggers. This route posts one event per call. The workflow
// caps a run at LISTING_EVENTS_PER_RUN and waits between calls.
//
// The first run with an empty listing_state table records the current
// file and posts nothing, so merging does not announce homes already on
// the site. Later runs compare that stored price and status to the file.

const FACEBOOK_SKIP_LOG = 'Facebook skipped: BUFFER_FB_CHANNEL_ID is not set'

function headerOrEnv(request: Request, header: string, envName: string): string {
  const fromHeader = request.headers.get(header)?.trim() ?? ''
  if (fromHeader) return fromHeader
  return process.env[envName]?.trim() ?? ''
}

function snapshotsFromFile(seenAt: string): ListingSnapshot[] {
  return listings.map((listing) => snapshotFromListing(listing, seenAt, 1))
}

function toSnapshot(row: ListingStateRecord): ListingSnapshot {
  return {
    address: row.address,
    city: row.city,
    price: row.price,
    beds: row.beds ?? undefined,
    baths: row.baths ?? undefined,
    sqft: row.sqft ?? undefined,
    status: row.status,
    compassUrl: row.compassUrl,
    imageUrl: row.imageUrl ?? undefined,
    openHouse: row.openHouse ?? undefined,
    seenAt: row.seenAt,
    generation: row.generation,
  }
}

function toRecord(snapshot: ListingSnapshot): ListingStateRecord {
  return {
    listingKey: listingStateKey(snapshot),
    address: snapshot.address,
    city: snapshot.city,
    price: snapshot.price,
    beds: snapshot.beds ?? null,
    baths: snapshot.baths ?? null,
    sqft: snapshot.sqft ?? null,
    status: snapshot.status,
    openHouse: snapshot.openHouse ?? null,
    compassUrl: snapshot.compassUrl,
    imageUrl: snapshot.imageUrl ?? null,
    seenAt: snapshot.seenAt,
    generation: snapshot.generation,
  }
}

function asChannel(value: string): EventChannel | null {
  if (value === 'instagram' || value === 'facebook' || value === 'linkedin') return value
  return null
}

async function pendingEvents(
  before: ListingSnapshot[],
  facebookConfigured: boolean,
): Promise<{ pending: ListingEvent[] } | { error: 'post_log_unreadable' }> {
  const detected = detectListingEvents(before, snapshotsFromFile(listingsSyncedAt))
  const pending: ListingEvent[] = []
  for (const event of detected) {
    const posted = await postedEventChannels(event.refKey)
    if (posted === null) return { error: 'post_log_unreadable' }
    const already = new Set<EventChannel>()
    posted.forEach((channel) => {
      const known = asChannel(channel)
      if (known) already.add(known)
    })
    if (!eventIsComplete(remainingChannelActions({ alreadyPosted: already, facebookConfigured }))) {
      pending.push(event)
    }
  }
  return { pending }
}

function logEvent(
  status: 'posted' | 'failed',
  event: ListingEvent,
  channel: EventChannel,
  extra: { externalPostId?: string | null; errorMessage?: string; link?: string | null; preview?: string },
) {
  return logPost({
    channel,
    jobName: LISTING_EVENTS_JOB,
    payloadKind: event.kind,
    refKey: event.refKey,
    messagePreview: extra.preview?.slice(0, 280) ?? null,
    link: extra.link ?? null,
    externalPostId: extra.externalPostId ?? null,
    status,
    errorMessage: extra.errorMessage?.slice(0, 500) ?? null,
  })
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'listing-events cron not configured (missing CRON_SECRET)' },
      { status: 500 },
    )
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const preview = new URL(request.url).searchParams.get('preview') === '1'
  const facebookConfigured = Boolean(headerOrEnv(request, 'x-buffer-fb-channel-id', 'BUFFER_FB_CHANNEL_ID'))
  const stored = await readListingState()
  if (stored === null) {
    console.error('[listing-events] post_log unreadable')
    return NextResponse.json(
      {
        posted: false,
        error: 'post_log_unreadable',
        mode: 'listing-events',
        preview,
        postLogReadable: false,
      },
      { status: preview ? 200 : 503 },
    )
  }

  const before = stored.map(toSnapshot)
  if (before.length === 0) {
    if (preview) {
      return NextResponse.json({
        posted: false,
        preview: true,
        mode: 'listing-events',
        perRun: LISTING_EVENTS_PER_RUN,
        gapSeconds: LISTING_EVENTS_GAP_MS / 1000,
        postLogReadable: true,
        pending: [],
        remaining: 0,
        note: 'First post run will record the current listings and announce nothing.',
      })
    }
    if (listings.length === 0) {
      return NextResponse.json({
        posted: false,
        skipped: 'none_pending',
        mode: 'listing-events',
        remaining: 0,
        at: new Date().toISOString(),
      })
    }
    const seeded = await replaceListingState(snapshotsFromFile(listingsSyncedAt).map(toRecord))
    if (seeded == null) {
      return NextResponse.json(
        { posted: false, error: 'post_log_unreadable', mode: 'listing-events' },
        { status: 503 },
      )
    }
    console.log(`[listing-events] Seeded ${listings.length} current listings. Not posting.`)
    return NextResponse.json({
      posted: false,
      skipped: 'seeded',
      mode: 'listing-events',
      seeded: listings.length,
      remaining: 0,
      at: new Date().toISOString(),
    })
  }

  const planned = await pendingEvents(before, facebookConfigured)
  if ('error' in planned) {
    return NextResponse.json(
      { posted: false, error: planned.error, mode: 'listing-events' },
      { status: preview ? 200 : 503 },
    )
  }

  if (preview) {
    return NextResponse.json({
      posted: false,
      preview: true,
      mode: 'listing-events',
      perRun: LISTING_EVENTS_PER_RUN,
      gapSeconds: LISTING_EVENTS_GAP_MS / 1000,
      postLogReadable: true,
      pending: planned.pending.map((event) => ({
        kind: event.kind,
        refKey: event.refKey,
        address: event.address,
        instagram: buildListingEventPost(event, 'instagram').text,
        facebook: buildListingEventPost(event, 'facebook').text,
        linkedin: buildListingEventPost(event, 'linkedin').text,
      })),
      remaining: planned.pending.length,
    })
  }

  if (planned.pending.length === 0) {
    const next = reconcileListingState(before, snapshotsFromFile(new Date().toISOString()), new Set(), new Date().toISOString())
    await replaceListingState(next.map(toRecord))
    return NextResponse.json({
      posted: false,
      skipped: 'none_pending',
      mode: 'listing-events',
      remaining: 0,
      at: new Date().toISOString(),
    })
  }

  const apiKey = headerOrEnv(request, 'x-buffer-api-key', 'BUFFER_API_KEY')
  const igChannel = headerOrEnv(request, 'x-buffer-ig-channel-id', 'BUFFER_IG_CHANNEL_ID')
  const fbChannel = headerOrEnv(request, 'x-buffer-fb-channel-id', 'BUFFER_FB_CHANNEL_ID')
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim() ?? ''
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN?.trim() ?? ''
  if (!apiKey || !igChannel || !accessToken || !authorUrn) {
    const errorMessage = !apiKey || !igChannel
      ? 'BUFFER_API_KEY or BUFFER_IG_CHANNEL_ID not set'
      : 'LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN not set'
    await logPost({
      channel: 'instagram',
      jobName: LISTING_EVENTS_JOB,
      payloadKind: 'none',
      refKey: 'no-credentials',
      status: 'failed',
      errorMessage,
    })
    return NextResponse.json({ error: errorMessage, mode: 'listing-events' }, { status: 500 })
  }

  const tokenExpiresAtMs = Number(process.env.LINKEDIN_TOKEN_EXPIRES_AT_MS ?? 0)
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  if (tokenExpiresAtMs && Date.now() > tokenExpiresAtMs - sevenDaysMs) {
    const errorMessage =
      'LINKEDIN_ACCESS_TOKEN expires within 7 days — listing event posting aborted. Re-run /api/linkedin/auth.'
    await logPost({
      channel: 'linkedin',
      jobName: LISTING_EVENTS_JOB,
      payloadKind: 'none',
      refKey: 'token-expiry',
      status: 'failed',
      errorMessage,
    })
    return NextResponse.json({ error: 'linkedin token expired or expiring', mode: 'listing-events' }, { status: 503 })
  }

  const event = planned.pending[0]
  const postedNow = await postedEventChannels(event.refKey)
  if (postedNow === null) {
    return NextResponse.json(
      { posted: false, error: 'post_log_unreadable', mode: 'listing-events' },
      { status: 503 },
    )
  }
  const already = new Set<EventChannel>()
  postedNow.forEach((channel) => {
    const known = asChannel(channel)
    if (known) already.add(known)
  })
  const actions = remainingChannelActions({ alreadyPosted: already, facebookConfigured: Boolean(fbChannel) })
  if (eventIsComplete(actions)) {
    return NextResponse.json({
      posted: false,
      skipped: 'already_posted',
      mode: 'listing-events',
      refKey: event.refKey,
      remaining: Math.max(0, planned.pending.length - 1),
      at: new Date().toISOString(),
    })
  }

  const draft = buildListingEventPost(event, 'instagram')
  if (!draft.imageUrl) {
    await logEvent('failed', event, 'instagram', { errorMessage: 'listing photo missing', link: draft.url })
    return NextResponse.json(
      { posted: false, error: 'listing photo missing', mode: 'listing-events', refKey: event.refKey },
      { status: 422 },
    )
  }
  const preflight = await preflightPublicJpeg(draft.imageUrl)
  if (!preflight.ok) {
    await logEvent('failed', event, 'instagram', {
      errorMessage: preflight.reason,
      link: draft.url,
      preview: draft.text,
    })
    return NextResponse.json(
      { posted: false, error: preflight.reason, mode: 'listing-events', refKey: event.refKey },
      { status: 502 },
    )
  }

  const channelResults: Record<string, unknown> = {}
  let failed = false
  for (const action of actions) {
    if (action.action === 'skip-no-channel') {
      console.log(FACEBOOK_SKIP_LOG)
      channelResults.facebook = { posted: false, skipped: 'no_channel' }
      continue
    }
    if (action.action === 'skip-already') {
      channelResults[action.channel] = { posted: false, skipped: 'already_posted' }
      continue
    }
    const post = buildListingEventPost(event, action.channel)
    if (action.channel === 'linkedin') {
      const result = await publishLinkedInListingPost({
        accessToken,
        authorUrn,
        text: post.text,
        title: post.title,
        description: post.description,
        articleUrl: post.url,
        imageUrl: post.imageUrl,
      })
      if (!result.ok) {
        failed = true
        await logEvent('failed', event, 'linkedin', {
          errorMessage: result.error,
          link: post.url,
          preview: post.text,
        })
        channelResults.linkedin = { posted: false, error: result.error }
        continue
      }
      await logEvent('posted', event, 'linkedin', {
        externalPostId: result.postId,
        link: post.url,
        preview: post.text,
      })
      channelResults.linkedin = { posted: true, postId: result.postId, via: result.via }
      continue
    }

    const channelId = action.channel === 'facebook' ? fbChannel : igChannel
    const queued = await queueBufferImagePost({
      apiKey,
      channelId,
      text: post.text,
      imageUrl: post.imageUrl ?? draft.imageUrl,
      channel: action.channel,
    })
    if (!queued.ok) {
      failed = true
      await logEvent('failed', event, action.channel, {
        errorMessage: queued.error,
        link: post.url,
        preview: post.text,
      })
      channelResults[action.channel] = { posted: false, error: queued.error }
      continue
    }
    await logEvent('posted', event, action.channel, {
      externalPostId: queued.postId,
      link: post.url,
      preview: post.text,
    })
    if (action.channel === 'facebook') {
      // Same shape the Railway spotlight cooldown reads: channel facebook,
      // payload_kind listing, ref_key = the street address.
      await logPost({
        channel: 'facebook',
        jobName: LISTING_EVENTS_JOB,
        payloadKind: 'listing',
        refKey: event.listing.address,
        messagePreview: post.text.slice(0, 280),
        link: post.url,
        externalPostId: queued.postId,
        status: 'posted',
      })
    }
    channelResults[action.channel] = { posted: true, postId: queued.postId }
  }

  if (failed) {
    return NextResponse.json(
      {
        posted: false,
        error: 'listing event channel failed',
        mode: 'listing-events',
        kind: event.kind,
        refKey: event.refKey,
        address: event.address,
        channels: channelResults,
        remaining: planned.pending.length,
      },
      { status: 502 },
    )
  }

  const stillPending = new Set(
    planned.pending.filter((item) => item.refKey !== event.refKey).map((item) => item.stateKey),
  )
  const nowIso = new Date().toISOString()
  const next = reconcileListingState(before, snapshotsFromFile(nowIso), stillPending, nowIso)
  const saved = await replaceListingState(next.map(toRecord))
  if (saved == null) {
    console.error('[listing-events] posted but could not advance listing_state')
  }

  return NextResponse.json({
    posted: true,
    mode: 'listing-events',
    kind: event.kind,
    refKey: event.refKey,
    address: event.address,
    channels: channelResults,
    remaining: Math.max(0, planned.pending.length - 1),
    at: nowIso,
  })
}
