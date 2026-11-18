import {
  defineCountySellerListings,
  formatMedianDays,
  medianDaysOnMarket,
  type CountySellerListing,
} from '@/lib/county-seller-listings'
import { rutherfordSellerListings } from '@/lib/rutherford-seller-listings'

/**
 * Seller-side Smyrna and La Vergne listings Joshua Fink closed. Street and
 * city only — no house numbers and no client names. Every row is a
 * traditional listing (side Seller), not a cash purchase. Do not add rows,
 * quotes, or stats that are not in this list.
 *
 * These seven closings, from 2021 through 2024, are the Smyrna and La Vergne
 * rows of the Rutherford County catalog. Two are in Smyrna and five are in
 * next-door La Vergne. Do not describe them as the Rutherford County total.
 * The Murfreesboro closings stay on the Murfreesboro page.
 */
export type SmyrnaSellerListing = CountySellerListing<'Smyrna' | 'La Vergne'>

/** Page order: Smyrna, then La Vergne. */
const CITY_ORDER = ['Smyrna', 'La Vergne'] as const

export const SMYRNA_RECENT_LISTING_COUNT = 6

const smyrna = defineCountySellerListings({
  county: 'Smyrna and La Vergne',
  cityOrder: CITY_ORDER,
  recentCount: SMYRNA_RECENT_LISTING_COUNT,
  label: 'smyrnaSellerListings',
  listings: [
    { street: 'Lake Forest Dr', city: 'La Vergne', closeDate: '2024-11-12', soldPrice: 350000, daysOnMarket: 8, side: 'Seller' },
    { street: 'Jana Dr', city: 'Smyrna', closeDate: '2024-08-05', soldPrice: 388000, daysOnMarket: 24, side: 'Seller' },
    { street: 'Hollandale Rd', city: 'La Vergne', closeDate: '2022-11-01', soldPrice: 369000, daysOnMarket: 29, side: 'Seller' },
    { street: 'Woodcrest Dr', city: 'La Vergne', closeDate: '2022-03-21', soldPrice: 339200, daysOnMarket: 2, side: 'Seller' },
    { street: 'Pearcy St', city: 'La Vergne', closeDate: '2022-03-11', soldPrice: 257000, daysOnMarket: 2, side: 'Seller' },
    { street: 'Tom Hailey Blvd', city: 'La Vergne', closeDate: '2021-12-22', soldPrice: 250000, daysOnMarket: 16, side: 'Seller' },
    { street: 'Brandon Trl', city: 'Smyrna', closeDate: '2021-07-20', soldPrice: 284900, daysOnMarket: 1, side: 'Seller' },
  ],
})

export const smyrnaSellerListings = smyrna.listings

/** Cities that appear in the rows, in Smyrna / La Vergne order. */
export function smyrnaListingCities(
  rows: readonly SmyrnaSellerListing[] = smyrnaSellerListings,
): string[] {
  return smyrna.listingCities(rows)
}

/**
 * Honest split: these are not seven Smyrna sales. The count, the city
 * split, the year, and the median all come from the rows passed in.
 */
export function smyrnaSellerListingsSummary(
  rows: readonly SmyrnaSellerListing[] = smyrnaSellerListings,
): string {
  if (rows.length === 0) throw new Error('no Smyrna and La Vergne listings')
  const year = rows.map((row) => row.closeDate.slice(0, 4)).sort()[0]
  const median = medianDaysOnMarket(rows)
  const medianLabel = formatMedianDays(median)
  const listingWord = rows.length === 1 ? 'listing' : 'listings'
  const dayWord = median === 1 ? 'day' : 'days'
  const counts = CITY_ORDER.map((city) => {
    const count = rows.filter((row) => row.city === city).length
    return `${count} in ${city}`
  }).join(', ')
  return `I've closed ${rows.length} ${listingWord} in Smyrna and next-door La Vergne since ${year} (${counts}), with a median of ${medianLabel} ${dayWord} on market.`
}

/** Newest first. Defaults to six rows. The seventh stays in the count and the median. */
export function recentSmyrnaSellerListings(
  limit = SMYRNA_RECENT_LISTING_COUNT,
): SmyrnaSellerListing[] {
  return smyrna.recent(limit)
}

export function smyrnaRealEstateAgentAreaServed() {
  return smyrna.areaServed()
}

/** Visible rows only. No review or rating fields. */
export function smyrnaSellerListingsItemList(rows: readonly SmyrnaSellerListing[]) {
  return smyrna.itemList(rows)
}

/**
 * The seven rows above are the Smyrna and La Vergne part of the Rutherford
 * catalog. The count and year come from that catalog, which also includes
 * Murfreesboro. This page does not restate those Murfreesboro closings.
 */
export function smyrnaRutherfordSalesNote(
  rows: readonly { closeDate: string; city: string }[] = rutherfordSellerListings,
): string {
  if (rows.length === 0) throw new Error('no Rutherford listings')
  const year = rows.map((row) => row.closeDate.slice(0, 4)).sort()[0]
  const murfreesboro = rows.filter((row) => row.city === 'Murfreesboro').length
  if (murfreesboro === 0) throw new Error('Rutherford note is missing Murfreesboro')
  const listingWord = rows.length === 1 ? 'listing' : 'listings'
  return `The full Rutherford County record is ${rows.length} ${listingWord} since ${year}, including ${murfreesboro} in Murfreesboro.`
}
