// Same-day listing events, detected by comparing the previous Compass sync
// with the current lib/listings.ts.
//
// Just Sold is intentionally absent. The site does not know which side
// Joshua represented, so a sale stays on the manual LinkedIn / GBP trigger.

import type { Listing } from './listings'

export const LISTING_EVENTS_JOB = 'listing-events'
export const LISTING_EVENTS_PER_RUN = 3
/** Pause between events in one workflow run. Not a Google quota. */
export const LISTING_EVENTS_GAP_MS = 30_000

export type ListingEventKind =
  | 'just-listed'
  | 'coming-soon'
  | 'price-improved'
  | 'back-on-market'
  | 'open-house'

export type EventChannel = 'instagram' | 'facebook' | 'linkedin'

export interface ListingSnapshot {
  address: string
  city: string
  price: number
  beds?: number
  baths?: number
  sqft?: number
  status: string
  compassUrl: string
  imageUrl?: string
  openHouse?: string
  seenAt: string
  generation: number
}

export interface ListingEvent {
  kind: ListingEventKind
  /** post_log ref_key. Stable for this change, different for a later one. */
  refKey: string
  /** Key in listing_state. The street address, normalized. */
  stateKey: string
  address: string
  listing: ListingSnapshot
  previous?: ListingSnapshot
}

const EVENT_RANK: Record<ListingEventKind, number> = {
  'coming-soon': 0,
  'just-listed': 1,
  'back-on-market': 2,
  'price-improved': 3,
  'open-house': 4,
}

export function listingStateKey(listing: Pick<ListingSnapshot, 'address'>): string {
  return listing.address.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '')
}

export function compassPid(compassUrl: string | undefined): string {
  const match = compassUrl?.match(/\/([A-Za-z0-9]+)_pid/i)
  return match?.[1]?.toLowerCase() ?? ''
}

function normalizeCompassUrl(url: string | undefined): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    parsed.search = ''
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`.toLowerCase()
  } catch {
    return url.trim().toLowerCase()
  }
}

export function snapshotFromListing(
  listing: Listing,
  seenAt: string,
  generation = 1,
): ListingSnapshot {
  const openHouse = listing.openHouse?.trim()
  return {
    address: listing.address,
    city: listing.city,
    price: listing.price,
    beds: listing.beds,
    baths: listing.baths,
    sqft: listing.sqft,
    status: listing.status,
    compassUrl: listing.compassUrl,
    imageUrl: listing.imageUrl,
    openHouse: openHouse || undefined,
    seenAt,
    generation,
  }
}

export function isComingSoonStatus(status: string): boolean {
  return /coming\s*soon/i.test(status)
}

export function isPendingLikeStatus(status: string): boolean {
  return /under\s*contract|\bpending\b/i.test(status)
}

export function isStrictlyActiveStatus(status: string): boolean {
  return status.trim().toLowerCase() === 'active'
}

export function isSoldLikeStatus(status: string): boolean {
  const value = status.toLowerCase()
  return value.includes('sold') || value.includes('closed')
}

export function isOpenHouseStatus(status: string): boolean {
  return /open\s*house/i.test(status)
}

/** Text Compass actually gave us. Empty when there is no open house. */
export function openHouseText(listing: Pick<ListingSnapshot, 'status' | 'openHouse'>): string {
  const fromField = listing.openHouse?.replace(/\s+/g, ' ').trim() ?? ''
  if (fromField) return fromField
  if (isOpenHouseStatus(listing.status) && !isPendingLikeStatus(listing.status)) {
    return listing.status.replace(/\s+/g, ' ').trim()
  }
  return ''
}

function eventId(listing: ListingSnapshot): string {
  return compassPid(listing.compassUrl) || listingStateKey(listing)
}

export function listingEventRefKey(
  kind: ListingEventKind,
  listing: ListingSnapshot,
  previous?: ListingSnapshot,
): string {
  const id = eventId(listing)
  if (kind === 'just-listed' || kind === 'coming-soon') return `${kind}:${id}`
  if (kind === 'price-improved') {
    return `${kind}:${id}:${previous?.price ?? 0}-${listing.price}`
  }
  if (kind === 'back-on-market') {
    return `${kind}:${id}:g${previous?.generation ?? 0}`
  }
  const label = openHouseText(listing)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${kind}:${id}:${label || 'open'}`
}

function canAnnouncePrice(status: string, openHouse: string): boolean {
  return isStrictlyActiveStatus(status) || isComingSoonStatus(status) || isOpenHouseStatus(status) || Boolean(openHouse)
}

function eventsForListing(previous: ListingSnapshot | undefined, listing: ListingSnapshot): ListingEventKind[] {
  if (isSoldLikeStatus(listing.status)) return []
  if (!previous) {
    if (isComingSoonStatus(listing.status)) return ['coming-soon']
    if (isStrictlyActiveStatus(listing.status) || isOpenHouseStatus(listing.status)) {
      return ['just-listed']
    }
    return []
  }

  const kinds: ListingEventKind[] = []
  if (isPendingLikeStatus(previous.status) && isStrictlyActiveStatus(listing.status)) {
    kinds.push('back-on-market')
  }
  const openHouse = openHouseText(listing)
  if (
    listing.price > 0 &&
    previous.price > 0 &&
    listing.price < previous.price &&
    canAnnouncePrice(listing.status, openHouse)
  ) {
    kinds.push('price-improved')
  }
  const previousOpenHouse = openHouseText(previous)
  if (openHouse && openHouse !== previousOpenHouse) kinds.push('open-house')
  return kinds
}

export function detectListingEvents(
  before: readonly ListingSnapshot[],
  after: readonly ListingSnapshot[],
): ListingEvent[] {
  const byAddress = new Map<string, ListingSnapshot>()
  const byUrl = new Map<string, ListingSnapshot>()
  for (const row of before) {
    const key = listingStateKey(row)
    if (key && !byAddress.has(key)) byAddress.set(key, row)
    const url = normalizeCompassUrl(row.compassUrl)
    if (url && !byUrl.has(url)) byUrl.set(url, row)
  }

  const found: Array<ListingEvent & { index: number }> = []
  const seen = new Set<string>()
  after.forEach((listing, index) => {
    const stateKey = listingStateKey(listing)
    if (!stateKey || seen.has(stateKey)) return
    seen.add(stateKey)
    const previous =
      byAddress.get(stateKey) ?? byUrl.get(normalizeCompassUrl(listing.compassUrl))
    for (const kind of eventsForListing(previous, listing)) {
      found.push({
        kind,
        refKey: listingEventRefKey(kind, listing, previous),
        stateKey,
        address: listing.address,
        listing,
        previous,
        index,
      })
    }
  })

  found.sort((a, b) => EVENT_RANK[a.kind] - EVENT_RANK[b.kind] || a.index - b.index)
  return found.map(({ index: _index, ...event }) => event)
}

function contentSignature(listing: ListingSnapshot): string {
  return JSON.stringify({
    address: listing.address,
    city: listing.city,
    price: listing.price,
    beds: listing.beds ?? null,
    baths: listing.baths ?? null,
    sqft: listing.sqft ?? null,
    status: listing.status,
    compassUrl: listing.compassUrl,
    imageUrl: listing.imageUrl ?? null,
    openHouse: openHouseText(listing),
  })
}

/**
 * Next stored snapshot. Listings that still have an unposted event keep
 * their previous price and status so the next run still sees the change.
 * Everything else advances. Homes that left the file are dropped.
 * Nothing here emits Just Sold.
 */
export function reconcileListingState(
  before: readonly ListingSnapshot[],
  after: readonly ListingSnapshot[],
  pendingStateKeys: ReadonlySet<string>,
  nowIso: string,
): ListingSnapshot[] {
  const byAddress = new Map<string, ListingSnapshot>()
  const byUrl = new Map<string, ListingSnapshot>()
  for (const row of before) {
    const key = listingStateKey(row)
    if (key && !byAddress.has(key)) byAddress.set(key, row)
    const url = normalizeCompassUrl(row.compassUrl)
    if (url && !byUrl.has(url)) byUrl.set(url, row)
  }

  const next: ListingSnapshot[] = []
  const seen = new Set<string>()
  for (const listing of after) {
    const key = listingStateKey(listing)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const previous = byAddress.get(key) ?? byUrl.get(normalizeCompassUrl(listing.compassUrl))
    if (pendingStateKeys.has(key)) {
      if (previous) next.push(previous)
      continue
    }
    if (!previous) {
      next.push({ ...listing, seenAt: nowIso, generation: 1 })
      continue
    }
    if (contentSignature(previous) === contentSignature(listing)) {
      next.push(previous)
      continue
    }
    next.push({
      ...listing,
      seenAt: nowIso,
      generation: previous.generation + 1,
    })
  }
  return next
}

export function remainingChannelActions(opts: {
  alreadyPosted: ReadonlySet<EventChannel>
  facebookConfigured: boolean
}): Array<{ channel: EventChannel; action: 'post' | 'skip-already' | 'skip-no-channel' }> {
  const actions: Array<{ channel: EventChannel; action: 'post' | 'skip-already' | 'skip-no-channel' }> = []
  for (const channel of ['instagram', 'facebook', 'linkedin'] as const) {
    if (channel === 'facebook' && !opts.facebookConfigured) {
      actions.push({ channel, action: 'skip-no-channel' })
      continue
    }
    if (opts.alreadyPosted.has(channel)) {
      actions.push({ channel, action: 'skip-already' })
      continue
    }
    actions.push({ channel, action: 'post' })
  }
  return actions
}

export function eventIsComplete(
  actions: ReadonlyArray<{ action: 'post' | 'skip-already' | 'skip-no-channel' }>,
): boolean {
  return actions.every((action) => action.action !== 'post')
}
