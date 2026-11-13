import {
  defineCountySellerListings,
  formatMedianDays,
  medianDaysOnMarket as medianListingDays,
  type CountySellerListing,
} from '@/lib/county-seller-listings'

/**
 * Seller-side Rutherford County listings Joshua Fink closed.
 * Street and city only — no house numbers and no client names.
 * Every row is a traditional listing (side Seller), not a cash purchase.
 * Do not add rows, quotes, or stats that are not in this list.
 */
export type RutherfordSellerListing = CountySellerListing<'Murfreesboro' | 'Smyrna' | 'La Vergne'>

/** Page order: Murfreesboro, then Smyrna, then La Vergne. */
const CITY_ORDER = ['Murfreesboro', 'Smyrna', 'La Vergne'] as const

export const RUTHERFORD_RECENT_LISTING_COUNT = 6

const rutherford = defineCountySellerListings({
  county: 'Rutherford County',
  cityOrder: CITY_ORDER,
  recentCount: RUTHERFORD_RECENT_LISTING_COUNT,
  label: 'rutherfordSellerListings',
  listings: [
    { street: 'Kerr Ave', city: 'Murfreesboro', closeDate: '2025-09-23', soldPrice: 315000, daysOnMarket: 8, side: 'Seller' },
    { street: 'Lake Forest Dr', city: 'La Vergne', closeDate: '2024-11-12', soldPrice: 350000, daysOnMarket: 8, side: 'Seller' },
    { street: 'Jana Dr', city: 'Smyrna', closeDate: '2024-08-05', soldPrice: 388000, daysOnMarket: 24, side: 'Seller' },
    { street: 'Hollandale Rd', city: 'La Vergne', closeDate: '2022-11-01', soldPrice: 369000, daysOnMarket: 29, side: 'Seller' },
    { street: 'Stonetree Dr', city: 'Murfreesboro', closeDate: '2022-06-20', soldPrice: 675000, daysOnMarket: 5, side: 'Seller' },
    { street: 'Woodcrest Dr', city: 'La Vergne', closeDate: '2022-03-21', soldPrice: 339200, daysOnMarket: 2, side: 'Seller' },
    { street: 'Pearcy St', city: 'La Vergne', closeDate: '2022-03-11', soldPrice: 257000, daysOnMarket: 2, side: 'Seller' },
    { street: 'Drysdale Dr', city: 'Murfreesboro', closeDate: '2022-02-08', soldPrice: 407000, daysOnMarket: 4, side: 'Seller' },
    { street: 'Tom Hailey Blvd', city: 'La Vergne', closeDate: '2021-12-22', soldPrice: 250000, daysOnMarket: 16, side: 'Seller' },
    { street: 'Brandon Trl', city: 'Smyrna', closeDate: '2021-07-20', soldPrice: 284900, daysOnMarket: 1, side: 'Seller' },
  ],
})

export const rutherfordSellerListings = rutherford.listings

export const medianDaysOnMarket = medianListingDays

export { formatMedianDays }

/** Cities that appear in the rows, in Murfreesboro / Smyrna / La Vergne order. */
export function rutherfordListingCities(
  rows: readonly RutherfordSellerListing[] = rutherfordSellerListings,
): string[] {
  return rutherford.listingCities(rows)
}

export function rutherfordSellerListingsSummary(
  rows: readonly RutherfordSellerListing[] = rutherfordSellerListings,
): string {
  return rutherford.summary(rows)
}

/** Newest first. Defaults to the six most recent rows. */
export function recentRutherfordSellerListings(
  limit = RUTHERFORD_RECENT_LISTING_COUNT,
): RutherfordSellerListing[] {
  return rutherford.recent(limit)
}

export function rutherfordRealEstateAgentAreaServed() {
  return rutherford.areaServed()
}

/** Visible rows only. No review or rating fields. */
export function rutherfordSellerListingsItemList(rows: readonly RutherfordSellerListing[]) {
  return rutherford.itemList(rows)
}
