// Captions for same-day listing events. Instagram and Facebook share the
// wording; LinkedIn drops hashtags, matching the weekly LinkedIn posts.
// Every caption names Compass and links to the on-site listing page.

import { listingDetailPath, listingSlug } from './listing-detail'
import type { Listing } from './listings'
import { instagramImageUrl } from './compass-photo'
import { withUtm } from './utm'
import {
  openHouseText,
  type EventChannel,
  type ListingEvent,
  type ListingEventKind,
} from './listing-events'

const SITE = 'https://www.joshuafink.com'
const MAX_CAPTION = 2200

const HEADLINE: Record<ListingEventKind, string> = {
  'just-listed': 'Just Listed',
  'coming-soon': 'Coming Soon',
  'price-improved': 'Price Improved',
  'back-on-market': 'Back on Market',
  'open-house': 'Open House',
}

const STATUS_TAG: Record<ListingEventKind, string> = {
  'just-listed': '#JustListed',
  'coming-soon': '#ComingSoon',
  'price-improved': '#PriceImproved',
  'back-on-market': '#BackOnMarket',
  'open-house': '#OpenHouse',
}

export interface ListingEventPost {
  channel: EventChannel
  kind: ListingEventKind
  refKey: string
  address: string
  text: string
  url: string
  imageUrl?: string
  title: string
  description: string
}

export function listingLocality(city: string): string {
  return city.split('|')[0].split(',')[0].trim()
}

function money(price: number): string {
  return `$${price.toLocaleString('en-US')}`
}

export function listingEventPageUrl(listing: Pick<Listing, 'address' | 'city' | 'compassUrl' | 'status'>, channel: EventChannel, kind: ListingEventKind): string {
  const path = listingDetailPath(listing) ?? `/listings/${listingSlug(listing)}`
  return withUtm(`${SITE}${path}`, {
    source: channel,
    medium: 'social',
    campaign: 'listing',
    content: kind,
  })
}

function statsLine(event: ListingEvent): string {
  return [
    event.listing.beds ? `${event.listing.beds} bed` : '',
    event.listing.baths ? `${event.listing.baths} bath` : '',
    event.listing.sqft ? `${event.listing.sqft.toLocaleString('en-US')} sq ft` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function priceLine(event: ListingEvent): string {
  if (event.kind === 'price-improved' && event.previous && event.previous.price > event.listing.price) {
    return `Now ${money(event.listing.price)} · was ${money(event.previous.price)}`
  }
  return money(event.listing.price)
}

function hashtags(event: ListingEvent, locality: string): string {
  const city = locality.replace(/[^A-Za-z0-9]+/g, '')
  return [STATUS_TAG[event.kind], city ? `#${city}TN` : '', '#Compass', '#JoshuaFinkGroup', '#MiddleTennessee']
    .filter(Boolean)
    .join(' ')
}

export function buildListingEventPost(event: ListingEvent, channel: EventChannel): ListingEventPost {
  const locality = listingLocality(event.listing.city)
  const headline = HEADLINE[event.kind]
  const url = listingEventPageUrl(event.listing, channel, event.kind)
  const openHouse = openHouseText(event.listing)
  const showOpenHouse =
    event.kind === 'open-house' ||
    ((event.kind === 'just-listed' || event.kind === 'coming-soon') && Boolean(openHouse))
  const lines = [`${headline} — ${event.listing.address}, ${locality}`, '']
  if (showOpenHouse) lines.push(openHouse, '')
  const stats = statsLine(event)
  if (stats) lines.push(stats)
  lines.push(
    priceLine(event),
    '',
    'Listed with Joshua Fink, Compass.',
    'Call or text Joshua Fink at 615-551-2727.',
    '',
    url,
  )

  let text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (channel !== 'linkedin') {
    text = `${text}\n\n${hashtags(event, locality)}`
  }
  text = text.slice(0, MAX_CAPTION)

  const description = [statsLine(event), priceLine(event)].filter(Boolean).join(' · ')
  return {
    channel,
    kind: event.kind,
    refKey: event.refKey,
    address: event.listing.address,
    text,
    url,
    imageUrl: event.listing.imageUrl ? instagramImageUrl(event.listing.imageUrl) : undefined,
    title: `${headline} in ${locality}, TN — ${event.listing.address}`,
    description: description || 'Middle Tennessee real estate',
  }
}
