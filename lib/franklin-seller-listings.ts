import { closings } from '@/lib/closings-data'
import {
  defineCountySellerListings,
  type CountySellerListing,
} from '@/lib/county-seller-listings'
import { williamsonSellerListings } from '@/lib/williamson-seller-listings'

/**
 * Seller-side Franklin listings Joshua Fink closed. Street and city only —
 * no house numbers and no client names. Every row is a traditional listing
 * (side Seller), not a cash purchase and not a buyer-side closing. Do not
 * add rows, quotes, or stats that are not in this list.
 *
 * These six closings, all since 2024, are the Franklin rows of the
 * Williamson County catalog. They are also the Franklin "Listed and sold"
 * rows since 2024 in lib/closings-data.ts. Do not describe them as the
 * Williamson County total. Brentwood and Spring Hill stay on their own pages.
 * Buyer-side Franklin closings in the closing file (Parish Pl, Battlefield
 * Dr, Glastonbury Dr) are not in this count or this median.
 */
export type FranklinSellerListing = CountySellerListing<'Franklin'>

const CITY_ORDER = ['Franklin'] as const

export const FRANKLIN_RECENT_LISTING_COUNT = 6

const franklin = defineCountySellerListings({
  county: 'Franklin',
  cityOrder: CITY_ORDER,
  recentCount: FRANKLIN_RECENT_LISTING_COUNT,
  distinctStreets: true,
  label: 'franklinSellerListings',
  listings: [
    { street: 'N Berwick Ln', city: 'Franklin', closeDate: '2026-08-31', soldPrice: 1147900, daysOnMarket: 0, side: 'Seller' },
    { street: 'Glass St', city: 'Franklin', closeDate: '2026-01-28', soldPrice: 624900, daysOnMarket: 15, side: 'Seller' },
    { street: 'Highgrove Cir', city: 'Franklin', closeDate: '2025-03-31', soldPrice: 1975000, daysOnMarket: 2, side: 'Seller' },
    { street: 'Boyd Mill Ave', city: 'Franklin', closeDate: '2025-01-30', soldPrice: 270000, daysOnMarket: 19, side: 'Seller' },
    { street: 'Walton Rd', city: 'Franklin', closeDate: '2024-07-31', soldPrice: 675000, daysOnMarket: 29, side: 'Seller' },
    { street: 'Moss Ln', city: 'Franklin', closeDate: '2024-03-19', soldPrice: 760000, daysOnMarket: 16, side: 'Seller' },
  ],
})

export const franklinSellerListings = franklin.listings

/** Cities that appear in the rows. Franklin is the only city in this file. */
export function franklinListingCities(
  rows: readonly FranklinSellerListing[] = franklinSellerListings,
): string[] {
  return franklin.listingCities(rows)
}

export function franklinSellerListingsSummary(
  rows: readonly FranklinSellerListing[] = franklinSellerListings,
): string {
  return franklin.summary(rows)
}

/** Newest first. The default limit is the whole six-closing record. */
export function recentFranklinSellerListings(
  limit = FRANKLIN_RECENT_LISTING_COUNT,
): FranklinSellerListing[] {
  return franklin.recent(limit)
}

export function franklinRealEstateAgentAreaServed() {
  return franklin.areaServed()
}

/** Visible rows only. No review or rating fields. */
export function franklinSellerListingsItemList(
  rows: readonly FranklinSellerListing[],
  options?: { includePrice?: boolean },
) {
  return franklin.itemList(rows, options)
}

/**
 * The Williamson County catalog includes Brentwood and Spring Hill. This
 * page does not restate those closings. Counts come from that catalog.
 */
export function franklinWilliamsonSalesNote(
  rows: readonly { closeDate: string; city: string }[] = williamsonSellerListings,
): string {
  if (rows.length === 0) throw new Error('no Williamson listings')
  const year = rows.map((row) => row.closeDate.slice(0, 4)).sort()[0]
  const brentwood = rows.filter((row) => row.city === 'Brentwood').length
  const springHill = rows.filter((row) => row.city === 'Spring Hill').length
  if (brentwood === 0 || springHill === 0) {
    throw new Error('Williamson note is missing Brentwood or Spring Hill')
  }
  const listingWord = rows.length === 1 ? 'listing' : 'listings'
  return `The full Williamson County record is ${rows.length} ${listingWord} since ${year}, including ${brentwood} in Brentwood and ${springHill} in Spring Hill.`
}

/** House number and unit off. Street only, matching the public table. */
export function franklinClosingStreet(address: string): string {
  return address.replace(/^\d+\s+/, '').replace(/\s+#\S+$/, '').trim()
}

/**
 * Franklin rows in the Tennessee closing file that are not these six
 * seller listings. Today they are the buyer-side closings. The sentence
 * is built from those rows so a new closing changes the note instead of
 * leaving a stale street list.
 */
export function franklinBuyerSideNote(
  rows: readonly { address: string; city: string; side: string; closeDate: string }[] = closings,
): string {
  const buyer = rows
    .filter((row) => row.city === 'Franklin' && row.side === 'Represented buyer')
    .sort((a, b) => b.closeDate.localeCompare(a.closeDate) || a.address.localeCompare(b.address))
  if (buyer.length === 0) throw new Error('no buyer-side Franklin closings')
  const streets = buyer.map((row) => franklinClosingStreet(row.address))
  const list =
    streets.length === 1
      ? streets[0]
      : `${streets.slice(0, -1).join(', ')} and ${streets[streets.length - 1]}`
  const closingWord = buyer.length === 1 ? 'closing' : 'closings'
  return `The Tennessee closing file also has ${buyer.length} Franklin ${closingWord} where I represented the buyer (${list}). Those are not in this count or this median.`
}
