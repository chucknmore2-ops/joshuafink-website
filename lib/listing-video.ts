// Copy, eligibility, and launch seed for automatic listing Shorts.
//
// The Compass sync rewrites lib/listings.ts. This module stays hand-maintained
// so a new Active or Coming Soon home can be turned into a vertical video
// without that regeneration wiping the rules. tour video ids live in
// lib/listing-tour-videos.json for the same reason.

import type { Listing } from './listings'
import { listingDetailPath, listingSlug } from './listing-detail'
import { parseListingPostalAddress } from './listing-address'
import { compassPhotoId } from './compass-photo'
import { withUtm } from './utm'

export const LISTING_VIDEO_SITE = 'https://www.joshuafink.com'
export const LISTING_VIDEO_END_CARD = 'Joshua Fink | Compass | joshuafink.com'
export const LISTING_VIDEO_JOB = 'listing-video'
export const LISTING_VIDEO_SEED_JOB = 'listing-video-seed'
export const LISTING_VIDEO_KIND = 'listing-video'
/** How many new homes one automatic run may publish. */
export const LISTING_VIDEO_PER_RUN = 2
export const LISTING_VIDEO_MAX_PHOTOS = 6

export const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload'
export const YOUTUBE_MANAGE_SCOPE = 'https://www.googleapis.com/auth/youtube'
export const YOUTUBE_FORCE_SSL_SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl'

export const YOUTUBE_SECRET_NAMES = [
  'YOUTUBE_CLIENT_ID',
  'YOUTUBE_CLIENT_SECRET',
  'YOUTUBE_REFRESH_TOKEN',
] as const

/**
 * Homes already on joshuafink.com when listing videos shipped (2026-10-06).
 * Automatic runs skip these addresses so merging the workflow does not upload
 * a Short for every current listing. Do not add future listings here.
 * Includes Active Under Contract homes so a later status flip back to Active
 * is not treated as a brand-new listing.
 */
export const LISTING_VIDEO_SEED_ADDRESSES = [
  '511 Wanda Dr',
  '4127 Edwards Ave',
  '1100 Gibson Dr',
  '3814 Plantation Dr',
  '261 Paragon Mills Rd',
  '316 7th Ave',
  '2037 Walnut Ln',
  '4874 Sparta Pike',
] as const

/** Same address key the GBP just-listed route writes (`listingRefKey`). */
export function listingVideoRefKey(address: string): string {
  return address.toLowerCase().replace(/[^\w]+/g, '-')
}

const SEED_REF_KEYS = new Set(LISTING_VIDEO_SEED_ADDRESSES.map(listingVideoRefKey))

export function isListingVideoSeeded(address: string): boolean {
  return SEED_REF_KEYS.has(listingVideoRefKey(address))
}

/** Automatic videos are Active or Coming Soon only. Under Contract is not. */
export function isListingVideoStatus(status: string): boolean {
  const trimmed = status.trim()
  if (/^active$/i.test(trimmed)) return true
  return /coming\s*soon/i.test(trimmed)
}

export function planAutomaticListingVideos(source: readonly Listing[]): Listing[] {
  return source.filter(
    (listing) => isListingVideoStatus(listing.status) && !isListingVideoSeeded(listing.address),
  )
}

export interface ListingVideoPlace {
  city: string
  region: string
  /** "Nashville, TN" */
  cityLine: string
  /** "Nashville TN" for the YouTube title. */
  titlePlace: string
}

export function listingVideoPlace(listing: Pick<Listing, 'address' | 'city'>): ListingVideoPlace {
  const parsed = parseListingPostalAddress(listing.address, listing.city)
  const city = (parsed.addressLocality || listing.city.split('|')[0].split(',')[0] || '').trim()
  const region = parsed.addressRegion || 'TN'
  return {
    city,
    region,
    cityLine: city ? `${city}, ${region}` : region,
    titlePlace: city ? `${city} ${region}` : region,
  }
}

function plural(n: number, singular: string, pluralLabel: string): string {
  return `${n} ${n === 1 ? singular : pluralLabel}`
}

/** Beds, baths, and sq ft from the listing record. Omits anything missing. */
export function listingSpecLine(listing: Pick<Listing, 'beds' | 'baths' | 'sqft'>): string {
  const parts: string[] = []
  if (listing.beds && listing.beds > 0) parts.push(plural(listing.beds, 'bed', 'beds'))
  if (listing.baths && listing.baths > 0) parts.push(plural(listing.baths, 'bath', 'baths'))
  if (listing.sqft && listing.sqft > 0) {
    parts.push(`${listing.sqft.toLocaleString('en-US')} sq ft`)
  }
  return parts.join(' · ')
}

export function listingPriceLine(listing: Pick<Listing, 'price'>): string {
  if (!Number.isFinite(listing.price) || listing.price <= 0) return ''
  return `$${listing.price.toLocaleString('en-US')}`
}

/** `<address>, <city> TN | Home for Sale` */
export function listingVideoTitle(listing: Pick<Listing, 'address' | 'city'>): string {
  const place = listingVideoPlace(listing)
  const title = `${listing.address}, ${place.titlePlace} | Home for Sale`
  return title.length <= 100 ? title : `${title.slice(0, 97)}...`
}

export function listingVideoPageUrl(
  listing: Pick<Listing, 'address' | 'city' | 'compassUrl' | 'status'>,
  source: string,
): string {
  const path = listingDetailPath(listing) ?? `/listings/${listingSlug(listing)}`
  return withUtm(`${LISTING_VIDEO_SITE}${path}`, {
    source,
    medium: 'social',
    campaign: 'listing-video',
    content: listingSlug(listing),
  })
}

export function listingVideoDescription(listing: Listing): string {
  const place = listingVideoPlace(listing)
  const facts = [listingSpecLine(listing), listingPriceLine(listing)].filter(Boolean)
  return [
    `${listing.address}, ${place.cityLine}`,
    facts.join('\n'),
    listingVideoPageUrl(listing, 'youtube'),
    LISTING_VIDEO_END_CARD,
    '#Shorts',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function listingVideoCaption(
  listing: Listing,
  source: 'instagram' | 'facebook',
): string {
  const place = listingVideoPlace(listing)
  const comingSoon = /coming\s*soon/i.test(listing.status)
  const cityHash = place.city.replace(/[^A-Za-z0-9]+/g, '')
  const hash = comingSoon ? '#ComingSoon' : '#JustListed'
  const facts = [listingSpecLine(listing), listingPriceLine(listing)].filter(Boolean)
  return [
    `${comingSoon ? 'Coming soon' : 'Home for sale'}: ${listing.address}, ${place.cityLine}.`,
    facts.join('\n'),
    'Joshua Fink | Compass',
    'Call or text 615-551-2727.',
    listingVideoPageUrl(listing, source),
    `${hash} #${cityHash}TN #CompassRealEstate #JoshuaFinkGroup`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export interface ListingVideoOverlay {
  address: string
  city: string
  specs: string
  price: string
}

export function listingVideoOverlay(listing: Listing): ListingVideoOverlay {
  const place = listingVideoPlace(listing)
  return {
    address: listing.address,
    city: place.cityLine,
    specs: listingSpecLine(listing),
    price: listingPriceLine(listing),
  }
}

export function listingVideoPublicUrl(slug: string): string {
  return `${LISTING_VIDEO_SITE}/listing-videos/${slug}.mp4`
}

export function listingVideoSlug(listing: Pick<Listing, 'address' | 'city'>): string {
  return listingSlug(listing)
}

/**
 * Compass CDN ids in document order, hero image first, capped for a
 * 20–30 second slideshow. Ids are lowercase hex so a page cannot point the
 * downloader at an arbitrary host.
 */
export function listingPhotoIds(html: string, imageUrl: string | undefined, limit = LISTING_VIDEO_MAX_PHOTOS): string[] {
  const ids: string[] = []
  const seen = new Set<string>()
  const push = (id: string | undefined) => {
    if (!id || ids.length >= limit) return
    const clean = id.trim().toLowerCase()
    if (!/^[a-f0-9]{32,64}$/.test(clean)) return
    if (seen.has(clean)) return
    seen.add(clean)
    ids.push(clean)
  }
  push(compassPhotoId(imageUrl))
  const re = /compass\.com\/m\/([a-f0-9]{32,64})\//gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) push(match[1])
  return ids
}

export function compassPhotoJpegCandidates(id: string): string[] {
  const base = `https://www.compass.com/m/${id}`
  return [`${base}/1600x1200.jpg`, `${base}/1200x900.jpg`, `${base}/2048x1536.jpg`]
}

export interface YoutubeCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

export function readYoutubeCredentials(
  env: Record<string, string | undefined>,
): { ok: true; credentials: YoutubeCredentials } | { ok: false; missing: string[] } {
  const clientId = env.YOUTUBE_CLIENT_ID?.trim() ?? ''
  const clientSecret = env.YOUTUBE_CLIENT_SECRET?.trim() ?? ''
  const refreshToken = env.YOUTUBE_REFRESH_TOKEN?.trim() ?? ''
  const missing: string[] = []
  if (!clientId) missing.push('YOUTUBE_CLIENT_ID')
  if (!clientSecret) missing.push('YOUTUBE_CLIENT_SECRET')
  if (!refreshToken) missing.push('YOUTUBE_REFRESH_TOKEN')
  if (missing.length) return { ok: false, missing }
  return { ok: true, credentials: { clientId, clientSecret, refreshToken } }
}

export function youtubeScopeAllowsUpload(scope: string): boolean {
  const parts = new Set(scope.split(/\s+/).filter(Boolean))
  return (
    parts.has(YOUTUBE_UPLOAD_SCOPE) ||
    parts.has(YOUTUBE_MANAGE_SCOPE) ||
    parts.has(YOUTUBE_FORCE_SSL_SCOPE)
  )
}

export function youtubeSetupMessage(reason: 'missing' | 'scope'): string {
  if (reason === 'missing') {
    return [
      'YouTube upload is not configured. Add these GitHub Actions secrets:',
      ...YOUTUBE_SECRET_NAMES.map((name) => `  ${name}`),
      `The refresh token must include the scope ${YOUTUBE_UPLOAD_SCOPE}`,
      `(or the broader ${YOUTUBE_MANAGE_SCOPE}).`,
      'Enable YouTube Data API v3 on the Google Cloud project, authorize the',
      'joshuafinkgroup channel (UCc6j1NWgJeb00pT5xsenz3g), and store that refresh token.',
      'The Google Business Profile token (business.manage) cannot upload videos.',
    ].join('\n')
  }
  return [
    'The YouTube refresh token does not include the upload scope.',
    `Required: ${YOUTUBE_UPLOAD_SCOPE}`,
    `Also accepted: ${YOUTUBE_MANAGE_SCOPE} or ${YOUTUBE_FORCE_SSL_SCOPE}.`,
    'Re-authorize YOUTUBE_REFRESH_TOKEN with that scope. The client id and secret can stay.',
    'Channel: joshuafinkgroup (UCc6j1NWgJeb00pT5xsenz3g).',
  ].join('\n')
}

export function redactListingVideoSecrets(text: string, secrets: readonly string[]): string {
  let out = text
  for (const secret of secrets) {
    if (secret) out = out.split(secret).join('[redacted]')
  }
  return out
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/g, 'Bearer [redacted]')
    .replace(/access_token=[^&\s"']+/gi, 'access_token=[redacted]')
    .slice(0, 500)
}

export interface VideoTimeline {
  fps: number
  photoCount: number
  clipFrames: number
  fadeFrames: number
  endFrames: number
  totalFrames: number
  clipSec: number
  fadeSec: number
  endSec: number
  totalSec: number
}

export function listingVideoTimeline(
  photoCount: number,
  opts: { photoVisibleSec?: number; endCardSec?: number; crossfadeSec?: number; fps?: number } = {},
): VideoTimeline {
  const fps = opts.fps ?? 30
  const photoVisibleSec = opts.photoVisibleSec ?? 21
  const endCardSec = opts.endCardSec ?? 5
  const crossfadeSec = opts.crossfadeSec ?? 0.5
  const n = Math.max(1, photoCount)
  const fadeFrames = n === 1 ? 0 : Math.max(1, Math.round(crossfadeSec * fps))
  const visibleFrames = Math.max(1, Math.round(photoVisibleSec * fps))
  const clipFrames = Math.max(fadeFrames + 1, Math.round((visibleFrames + (n - 1) * fadeFrames) / n))
  const actualVisible = n * clipFrames - (n - 1) * fadeFrames
  const endFrames = Math.max(1, Math.round(endCardSec * fps))
  const totalFrames = actualVisible + endFrames
  return {
    fps,
    photoCount: n,
    clipFrames,
    fadeFrames,
    endFrames,
    totalFrames,
    clipSec: clipFrames / fps,
    fadeSec: fadeFrames / fps,
    endSec: endFrames / fps,
    totalSec: totalFrames / fps,
  }
}

/** Channels that must have a successful listing-video row before a home is done. */
export function requiredListingVideoChannels(facebookChannelId: string | undefined): string[] {
  const channels = ['youtube', 'instagram']
  if (facebookChannelId?.trim()) channels.push('facebook')
  return channels
}

export function listingVideoFullyPosted(
  postedChannels: ReadonlySet<string> | undefined,
  required: readonly string[],
): boolean {
  if (!postedChannels) return false
  return required.every((channel) => postedChannels.has(channel))
}
