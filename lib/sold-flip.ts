import { GOOGLE_REVIEW_URL } from '@/lib/reviews'

/**
 * A Compass listing row, reduced to the fields a sold-flip check needs.
 * The Compass sync writes these on lib/listings.ts and lib/sold-listings.ts.
 */
export interface SoldFlipListing {
  address: string
  city: string
  status: string
  compassUrl?: string
}

export const SOLD_FLIP_PUSHOVER_TITLE = 'Just sold — text a review ask'

/** Same URL rule the Compass sync uses, so a query string does not look like a new home. */
export function normalizeCompassUrl(url: string | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  try {
    const parsed = new URL(trimmed)
    parsed.hash = ''
    parsed.search = ''
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`.toLowerCase()
  } catch {
    return trimmed.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase()
  }
}

export function isSoldLikeStatus(status: string | undefined): boolean {
  const value = (status ?? '').toLowerCase()
  return value.includes('sold') || value.includes('closed')
}

function addressKey(listing: SoldFlipListing): string {
  return `${listing.address ?? ''}|${listing.city ?? ''}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function findMatch(listing: SoldFlipListing, pool: readonly SoldFlipListing[]): SoldFlipListing | undefined {
  const url = normalizeCompassUrl(listing.compassUrl)
  if (url) {
    const byUrl = pool.find((row) => normalizeCompassUrl(row.compassUrl) === url)
    if (byUrl) return byUrl
  }
  const addr = addressKey(listing)
  if (!addr || addr === '|') return undefined
  return pool.find((row) => addressKey(row) === addr)
}

/**
 * Homes that were active (not already sold) before this Compass sync and are
 * sold after it. Historical sold inventory is ignored: a home already in the
 * previous sold file, or one that never appeared on the active file, is not
 * a flip. A withdrawn listing that simply leaves the active file is not a flip.
 */
export function newlySoldFlips(
  previousActive: readonly SoldFlipListing[],
  nextActive: readonly SoldFlipListing[],
  previousSold: readonly SoldFlipListing[],
  nextSold: readonly SoldFlipListing[],
): SoldFlipListing[] {
  const seen = new Set<string>()
  const flips: SoldFlipListing[] = []

  for (const prior of previousActive) {
    if (isSoldLikeStatus(prior.status)) continue
    if (findMatch(prior, previousSold)) continue

    const inNextSold = findMatch(prior, nextSold)
    const inNextActive = findMatch(prior, nextActive)
    const soldNow = Boolean(inNextSold) || (inNextActive ? isSoldLikeStatus(inNextActive.status) : false)
    if (!soldNow) continue

    const source = inNextSold ?? inNextActive ?? prior
    const id = normalizeCompassUrl(source.compassUrl) || addressKey(source)
    if (!id || seen.has(id)) continue
    seen.add(id)
    flips.push({
      address: (source.address || prior.address).trim(),
      city: (source.city || prior.city).trim(),
      status: (source.status || 'Sold').trim() || 'Sold',
      compassUrl: source.compassUrl || prior.compassUrl,
    })
  }

  return flips
}

/** Copy Joshua pastes into a text. The first name stays a placeholder. */
export function readyToTextReviewMessage(listing: Pick<SoldFlipListing, 'address' | 'city'>): string {
  const place = listing.city?.trim()
    ? `${listing.address.trim()} in ${listing.city.trim()}`
    : listing.address.trim()
  return `Hi [First name]! It was a pleasure helping you with ${place}. If you have 30 seconds, a quick Google review means the world to a local business like mine: ${GOOGLE_REVIEW_URL} — thank you! — Joshua`
}

/**
 * Pushover body for Josh only. States that no client message was sent, then
 * the ready-to-text draft with the Google Business Profile write-review link.
 */
export function soldFlipPushoverMessage(listing: SoldFlipListing): string {
  const where = listing.city?.trim() ? `${listing.address}, ${listing.city}` : listing.address
  return [
    `${where} flipped to Sold in the Compass sync.`,
    '',
    'Nothing was texted or emailed to the client. Copy this and send it yourself:',
    '',
    readyToTextReviewMessage(listing),
  ].join('\n')
}
