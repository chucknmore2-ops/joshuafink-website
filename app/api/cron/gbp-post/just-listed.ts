// "Just Listed" / "Coming Soon" copy for Google Business Profile.
//
// The Tuesday rotator (buildListingPost in route.ts, job gbp-post) is a
// separate featured-listing slot and does not use this module. On-demand
// ?kind=listing&address= and automatic ?kind=new-listings both do.
//
// Google rejects a local post whose summary contains the business phone,
// the business street address used as contact info, or a raw http(s) URL.
// The property address is the subject of the post (same as the weekly
// featured listing). The link goes on the LEARN_MORE button only.
// Never mention Parks — Joshua's brand on these posts is Compass.

import { listings, type Listing } from '@/lib/listings'
import { listingDetailPath } from '@/lib/listing-detail'
import { parseListingPostalAddress } from '@/lib/listing-address'
import { withUtm } from '@/lib/utm'
import { compassJpegUrl } from '@/lib/compass-photo'

export const GBP_JUST_LISTED_JOB = 'gbp-just-listed'
/** Manual ?kind=listing posts. A successful row here counts as announced. */
export const GBP_LISTING_ON_DEMAND_JOB = 'gbp-on-demand'

/** One Google local-post create per minute, with a little headroom. */
export const JUST_LISTED_GAP_MS = 65_000
/** How many new listings one workflow run may publish. The route posts one per call. */
export const JUST_LISTED_PER_RUN = 3

const SITE = 'https://www.joshuafink.com'

/**
 * Homes already on joshuafink.com when Just Listed auto-post launched
 * (2026-10-06, inventory synced 2026-10-05). Treated as already announced
 * so the first runs do not flood Google Business.
 *
 * Do not add future listings here. 261 Paragon Mills Rd is now an Active
 * listing in lib/listings.ts and stays outside this baseline so it can
 * still be announced.
 */
export const GBP_JUST_LISTED_BASELINE_ADDRESSES = [
  '511 Wanda Dr',
  '4127 Edwards Ave',
  '1100 Gibson Dr',
  '3814 Plantation Dr',
  '316 7th Ave',
  '2037 Walnut Ln',
  '4874 Sparta Pike',
] as const

/** Same ref key the GBP routes write to post_log. */
export function listingRefKey(address: string): string {
  return address.toLowerCase().replace(/[^\w]+/g, '-')
}

export const GBP_JUST_LISTED_BASELINE_REF_KEYS: ReadonlySet<string> = new Set(
  GBP_JUST_LISTED_BASELINE_ADDRESSES.map(listingRefKey),
)

export function isComingSoonStatus(status: string): boolean {
  return /coming\s*soon/i.test(status)
}

/**
 * Homes the auto path may announce. Mirrors the site's "available" rule
 * (Active, Coming Soon, Open House*) and also accepts any Coming Soon
 * spelling Compass might send. "Active Under Contract" is not announced
 * as Just Listed.
 */
export function isGbpAnnounceable(status: string): boolean {
  if (isComingSoonStatus(status)) return true
  if (status === 'Active') return true
  if (status.startsWith('Open House')) return true
  return false
}

export interface JustListedDraft {
  summary: string
  cta: { actionType: 'LEARN_MORE'; url: string }
  photoUrl?: string
  kind: 'listing'
  refKey: string
  headline: 'Just Listed' | 'Coming Soon'
  address: string
}

function cityName(listing: Pick<Listing, 'address' | 'city'>): string {
  return parseListingPostalAddress(listing.address, listing.city).addressLocality || listing.city
}

function statsLine(listing: Listing): string {
  const parts = [
    listing.beds ? `${listing.beds} bed` : '',
    listing.baths ? `${listing.baths} bath` : '',
    listing.sqft ? `${listing.sqft.toLocaleString('en-US')} sq ft` : '',
  ].filter(Boolean)
  const price =
    Number.isFinite(listing.price) && listing.price > 0
      ? `$${listing.price.toLocaleString('en-US')}`
      : ''
  return [parts.join(' · '), price].filter(Boolean).join(' · ')
}

export function buildJustListedDraft(listing: Listing): JustListedDraft {
  const comingSoon = isComingSoonStatus(listing.status)
  const headline: JustListedDraft['headline'] = comingSoon ? 'Coming Soon' : 'Just Listed'
  const city = cityName(listing)
  const hashCity = city.replace(/[^A-Za-z0-9]+/g, '')
  const hashTag = comingSoon ? '#ComingSoon' : '#JustListed'
  const closer = comingSoon
    ? 'Coming soon with Joshua Fink at Compass.'
    : 'Just listed with Joshua Fink at Compass.'
  const stats = statsLine(listing)
  const summary =
    `🏡 ${headline} — ${listing.address}, ${city}\n\n` +
    (stats ? `${stats}\n\n` : '') +
    `${closer}\n\n` +
    `${hashTag} #${hashCity}TN #JoshuaFinkGroup #Compass`

  const path = listingDetailPath(listing)
  const target = path ? `${SITE}${path}` : listing.compassUrl
  const refKey = listingRefKey(listing.address)

  return {
    summary,
    cta: {
      actionType: 'LEARN_MORE',
      url: withUtm(target, {
        source: 'gbp',
        medium: 'auto',
        campaign: 'gbp-just-listed',
        content: refKey,
      }),
    },
    photoUrl: compassJpegUrl(listing.imageUrl),
    kind: 'listing',
    refKey,
    headline,
    address: listing.address,
  }
}

/**
 * Substring match on the street address. Exact (case-insensitive) match
 * wins; otherwise the shortest matching address wins so a narrower query
 * is not shadowed by a longer one.
 */
export function findListingByAddress(
  query: string,
  source: readonly Listing[] = listings,
): Listing | null {
  const needle = query.trim().toLowerCase()
  if (!needle) return null
  const matches = source.filter((listing) => listing.address.toLowerCase().includes(needle))
  if (matches.length === 0) return null
  const exact = matches.find((listing) => listing.address.toLowerCase() === needle)
  if (exact) return exact
  return [...matches].sort(
    (a, b) => a.address.length - b.address.length || a.address.localeCompare(b.address),
  )[0]
}

export function draftForAddress(
  query: string,
  source: readonly Listing[] = listings,
): JustListedDraft | null {
  const listing = findListingByAddress(query, source)
  return listing ? buildJustListedDraft(listing) : null
}

export interface JustListedPlan {
  /** Announceable listings that are not in the launch baseline, file order. */
  eligible: JustListedDraft[]
  /** Announceable listings suppressed by the launch baseline. */
  baselined: JustListedDraft[]
}

export function planJustListedPosts(source: readonly Listing[] = listings): JustListedPlan {
  const eligible: JustListedDraft[] = []
  const baselined: JustListedDraft[] = []
  for (const listing of source) {
    if (!isGbpAnnounceable(listing.status)) continue
    const draft = buildJustListedDraft(listing)
    if (GBP_JUST_LISTED_BASELINE_REF_KEYS.has(draft.refKey)) baselined.push(draft)
    else eligible.push(draft)
  }
  return { eligible, baselined }
}
