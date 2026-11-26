import {
  defineCountySellerListings,
  type CountySellerListing,
} from '@/lib/county-seller-listings'

/**
 * Seller-side Brentwood listings Joshua Fink closed.
 * Williamson County, Brentwood only. Street and city only — no house
 * numbers and no client names. Every row is a traditional listing (side
 * Seller), not a cash purchase. Do not add rows, quotes, or stats that
 * are not in this list.
 *
 * 1901 New Bristol Ln sold twice, and two different houses on Duncaster
 * Cir closed. Both closings on each street stay in the count and the
 * median. The public table keeps the newer closing on each street so the
 * same street is not listed twice.
 */
export type BrentwoodSellerListing = CountySellerListing<'Brentwood'>

const CITY_ORDER = ['Brentwood'] as const

export const BRENTWOOD_RECENT_LISTING_COUNT = 6

const brentwood = defineCountySellerListings({
  county: 'Williamson County',
  cityOrder: CITY_ORDER,
  recentCount: BRENTWOOD_RECENT_LISTING_COUNT,
  distinctStreets: true,
  label: 'brentwoodSellerListings',
  listings: [
    { street: 'New Bristol Ln', city: 'Brentwood', closeDate: '2026-08-06', soldPrice: 1800000, daysOnMarket: 13, side: 'Seller' },
    { street: 'Dresden Sq', city: 'Brentwood', closeDate: '2026-07-21', soldPrice: 1225000, daysOnMarket: 60, side: 'Seller' },
    { street: 'Duncaster Cir', city: 'Brentwood', closeDate: '2026-05-15', soldPrice: 2675000, daysOnMarket: 17, side: 'Seller' },
    { street: 'New Bristol Ln', city: 'Brentwood', closeDate: '2025-12-23', soldPrice: 1550000, daysOnMarket: 73, side: 'Seller' },
    { street: 'Duncaster Cir', city: 'Brentwood', closeDate: '2024-11-04', soldPrice: 1960000, daysOnMarket: 14, side: 'Seller' },
    { street: 'Hilldale Dr', city: 'Brentwood', closeDate: '2024-06-21', soldPrice: 1100000, daysOnMarket: 29, side: 'Seller' },
    { street: 'Lehigh Dr', city: 'Brentwood', closeDate: '2023-06-26', soldPrice: 3500000, daysOnMarket: 51, side: 'Seller' },
    { street: 'Stillbrook Trce', city: 'Brentwood', closeDate: '2023-03-20', soldPrice: 1599000, daysOnMarket: 3, side: 'Seller' },
    { street: 'Stillwater Cir', city: 'Brentwood', closeDate: '2023-01-05', soldPrice: 1100000, daysOnMarket: 0, side: 'Seller' },
    { street: 'Green Hill Cir', city: 'Brentwood', closeDate: '2022-05-17', soldPrice: 1299000, daysOnMarket: 2, side: 'Seller' },
  ],
})

export const brentwoodSellerListings = brentwood.listings

/** Cities that appear in the rows. Brentwood is the only city in this file. */
export function brentwoodListingCities(
  rows: readonly BrentwoodSellerListing[] = brentwoodSellerListings,
): string[] {
  return brentwood.listingCities(rows)
}

export function brentwoodSellerListingsSummary(
  rows: readonly BrentwoodSellerListing[] = brentwoodSellerListings,
): string {
  return brentwood.summary(rows)
}

/**
 * Newest first, one row per street. Defaults to the six most recent
 * distinct streets. Repeat closings on New Bristol Ln and Duncaster Cir
 * stay in the full list and are omitted here.
 */
export function recentBrentwoodSellerListings(
  limit = BRENTWOOD_RECENT_LISTING_COUNT,
): BrentwoodSellerListing[] {
  return brentwood.recent(limit)
}

export function brentwoodRealEstateAgentAreaServed() {
  return brentwood.areaServed()
}

/** Visible rows only. No review or rating fields. */
export function brentwoodSellerListingsItemList(
  rows: readonly BrentwoodSellerListing[],
  options?: { includePrice?: boolean },
) {
  return brentwood.itemList(rows, options)
}
