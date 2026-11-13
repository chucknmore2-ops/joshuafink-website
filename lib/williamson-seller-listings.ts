import {
  defineCountySellerListings,
  type CountySellerListing,
} from '@/lib/county-seller-listings'

/**
 * Seller-side Williamson County listings Joshua Fink closed since 2021.
 * Franklin, Brentwood, and Spring Hill. Street and city only — no house
 * numbers and no client names. Every row is a traditional listing (side
 * Seller), not a cash purchase. Do not add rows, quotes, or stats that
 * are not in this list.
 *
 * Two streets closed twice (New Bristol Ln and Duncaster Cir). Both
 * closings stay in the count and the median. The public table keeps the
 * newer closing on each street so the same street is not listed twice.
 */
export type WilliamsonSellerListing = CountySellerListing<'Franklin' | 'Brentwood' | 'Spring Hill'>

/** Page order: Franklin, then Brentwood, then Spring Hill. */
const CITY_ORDER = ['Franklin', 'Brentwood', 'Spring Hill'] as const

export const WILLIAMSON_RECENT_LISTING_COUNT = 6

const williamson = defineCountySellerListings({
  county: 'Williamson County',
  cityOrder: CITY_ORDER,
  recentCount: WILLIAMSON_RECENT_LISTING_COUNT,
  distinctStreets: true,
  label: 'williamsonSellerListings',
  listings: [
    { street: 'N Berwick Ln', city: 'Franklin', closeDate: '2026-08-31', soldPrice: 1147900, daysOnMarket: 0, side: 'Seller' },
    { street: 'New Bristol Ln', city: 'Brentwood', closeDate: '2026-08-06', soldPrice: 1800000, daysOnMarket: 13, side: 'Seller' },
    { street: 'Dresden Sq', city: 'Brentwood', closeDate: '2026-07-21', soldPrice: 1225000, daysOnMarket: 60, side: 'Seller' },
    { street: 'Duncaster Cir', city: 'Brentwood', closeDate: '2026-05-15', soldPrice: 2675000, daysOnMarket: 17, side: 'Seller' },
    { street: 'Glass St', city: 'Franklin', closeDate: '2026-01-28', soldPrice: 624900, daysOnMarket: 15, side: 'Seller' },
    { street: 'New Bristol Ln', city: 'Brentwood', closeDate: '2025-12-23', soldPrice: 1550000, daysOnMarket: 73, side: 'Seller' },
    { street: 'Highgrove Cir', city: 'Franklin', closeDate: '2025-03-31', soldPrice: 1975000, daysOnMarket: 2, side: 'Seller' },
    { street: 'Boyd Mill Ave', city: 'Franklin', closeDate: '2025-01-30', soldPrice: 270000, daysOnMarket: 19, side: 'Seller' },
    { street: 'Duncaster Cir', city: 'Brentwood', closeDate: '2024-11-04', soldPrice: 1960000, daysOnMarket: 14, side: 'Seller' },
    { street: 'Walton Rd', city: 'Franklin', closeDate: '2024-07-31', soldPrice: 675000, daysOnMarket: 29, side: 'Seller' },
    { street: 'Hilldale Dr', city: 'Brentwood', closeDate: '2024-06-21', soldPrice: 1100000, daysOnMarket: 29, side: 'Seller' },
    { street: 'Moss Ln', city: 'Franklin', closeDate: '2024-03-19', soldPrice: 760000, daysOnMarket: 16, side: 'Seller' },
    { street: 'Lehigh Dr', city: 'Brentwood', closeDate: '2023-06-26', soldPrice: 3500000, daysOnMarket: 51, side: 'Seller' },
    { street: 'Stillbrook Trce', city: 'Brentwood', closeDate: '2023-03-20', soldPrice: 1599000, daysOnMarket: 3, side: 'Seller' },
    { street: 'Stillwater Cir', city: 'Brentwood', closeDate: '2023-01-05', soldPrice: 1100000, daysOnMarket: 0, side: 'Seller' },
    { street: 'Greens Mill Rd', city: 'Spring Hill', closeDate: '2022-10-13', soldPrice: 470000, daysOnMarket: 14, side: 'Seller' },
    { street: 'Green Hill Cir', city: 'Brentwood', closeDate: '2022-05-17', soldPrice: 1299000, daysOnMarket: 2, side: 'Seller' },
    { street: 'John Sharp Rd', city: 'Spring Hill', closeDate: '2021-12-06', soldPrice: 284900, daysOnMarket: 5, side: 'Seller' },
    { street: 'Nealcrest Cir', city: 'Spring Hill', closeDate: '2021-05-17', soldPrice: 475000, daysOnMarket: 19, side: 'Seller' },
    { street: 'Kedron Rd', city: 'Spring Hill', closeDate: '2021-03-16', soldPrice: 335000, daysOnMarket: 1, side: 'Seller' },
  ],
})

export const williamsonSellerListings = williamson.listings

/** Cities that appear in the rows, in Franklin / Brentwood / Spring Hill order. */
export function williamsonListingCities(
  rows: readonly WilliamsonSellerListing[] = williamsonSellerListings,
): string[] {
  return williamson.listingCities(rows)
}

export function williamsonSellerListingsSummary(
  rows: readonly WilliamsonSellerListing[] = williamsonSellerListings,
): string {
  return williamson.summary(rows)
}

/**
 * Newest first, one row per street. Defaults to the six most recent
 * distinct streets. Repeat closings on New Bristol Ln and Duncaster Cir
 * stay in the full list and are omitted here.
 */
export function recentWilliamsonSellerListings(
  limit = WILLIAMSON_RECENT_LISTING_COUNT,
): WilliamsonSellerListing[] {
  return williamson.recent(limit)
}

export function williamsonRealEstateAgentAreaServed() {
  return williamson.areaServed()
}

/** Visible rows only. No review or rating fields. */
export function williamsonSellerListingsItemList(rows: readonly WilliamsonSellerListing[]) {
  return williamson.itemList(rows)
}
