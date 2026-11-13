import {
  defineCountySellerListings,
  type CountySellerListing,
} from '@/lib/county-seller-listings'

/**
 * Seller-side Davidson County listings Joshua Fink closed since 2021.
 * Nashville only. Street and city only — no house numbers and no client
 * names. Every row is a traditional listing (side Seller), not a cash
 * purchase. Do not add rows, quotes, or stats that are not in this list.
 *
 * Four streets closed twice (Neelys Bend Rd, Ray Ave, Kimberly Dr, and
 * Leslie Ave). Both closings stay in the count and the median. The public
 * table keeps the newer closing on each street so the same street is not
 * listed twice.
 */
export type DavidsonSellerListing = CountySellerListing<'Nashville'>

const CITY_ORDER = ['Nashville'] as const

export const DAVIDSON_RECENT_LISTING_COUNT = 6

const davidson = defineCountySellerListings({
  county: 'Davidson County',
  cityOrder: CITY_ORDER,
  recentCount: DAVIDSON_RECENT_LISTING_COUNT,
  distinctStreets: true,
  label: 'davidsonSellerListings',
  listings: [
    { street: 'Garwood Dr', city: 'Nashville', closeDate: '2026-07-02', soldPrice: 405000, daysOnMarket: 21, side: 'Seller' },
    { street: 'Fox Hollow Rd', city: 'Nashville', closeDate: '2026-06-17', soldPrice: 905000, daysOnMarket: 16, side: 'Seller' },
    { street: 'Lakeside Dr', city: 'Nashville', closeDate: '2026-04-30', soldPrice: 269900, daysOnMarket: 30, side: 'Seller' },
    { street: 'Pafford Dr', city: 'Nashville', closeDate: '2026-04-28', soldPrice: 540000, daysOnMarket: 12, side: 'Seller' },
    { street: 'N 5th St', city: 'Nashville', closeDate: '2026-03-31', soldPrice: 315000, daysOnMarket: 32, side: 'Seller' },
    { street: 'Neelys Bend Rd', city: 'Nashville', closeDate: '2026-03-26', soldPrice: 319900, daysOnMarket: 131, side: 'Seller' },
    { street: 'Ray Ave', city: 'Nashville', closeDate: '2025-07-23', soldPrice: 315000, daysOnMarket: 15, side: 'Seller' },
    { street: 'Boyd Dr', city: 'Nashville', closeDate: '2025-05-23', soldPrice: 349900, daysOnMarket: 44, side: 'Seller' },
    { street: 'Kimberly Dr', city: 'Nashville', closeDate: '2025-05-19', soldPrice: 515000, daysOnMarket: 10, side: 'Seller' },
    { street: 'Ray Ave', city: 'Nashville', closeDate: '2025-05-16', soldPrice: 300000, daysOnMarket: 2, side: 'Seller' },
    { street: 'Fox Ave', city: 'Nashville', closeDate: '2025-04-30', soldPrice: 399900, daysOnMarket: 7, side: 'Seller' },
    { street: 'Whiteheath Ct', city: 'Nashville', closeDate: '2025-03-05', soldPrice: 950000, daysOnMarket: 22, side: 'Seller' },
    { street: 'Dubois Dr', city: 'Nashville', closeDate: '2025-03-03', soldPrice: 350000, daysOnMarket: 10, side: 'Seller' },
    { street: 'Saunders Ave', city: 'Nashville', closeDate: '2025-03-03', soldPrice: 489900, daysOnMarket: 10, side: 'Seller' },
    { street: 'Westboro Dr', city: 'Nashville', closeDate: '2024-12-13', soldPrice: 465000, daysOnMarket: 14, side: 'Seller' },
    { street: 'Argle Ave', city: 'Nashville', closeDate: '2024-11-25', soldPrice: 349900, daysOnMarket: 18, side: 'Seller' },
    { street: 'Luna Dr', city: 'Nashville', closeDate: '2024-10-25', soldPrice: 405000, daysOnMarket: 25, side: 'Seller' },
    { street: 'Fedders Dr', city: 'Nashville', closeDate: '2024-09-13', soldPrice: 369000, daysOnMarket: 6, side: 'Seller' },
    { street: 'Tobylynn Dr', city: 'Nashville', closeDate: '2024-09-05', soldPrice: 477000, daysOnMarket: 21, side: 'Seller' },
    { street: 'Cheyenne Trce', city: 'Nashville', closeDate: '2024-08-16', soldPrice: 325000, daysOnMarket: 34, side: 'Seller' },
    { street: 'Pebble Creek Dr', city: 'Nashville', closeDate: '2024-08-06', soldPrice: 370000, daysOnMarket: 20, side: 'Seller' },
    { street: 'Kirkwall Dr', city: 'Nashville', closeDate: '2024-07-19', soldPrice: 599900, daysOnMarket: 0, side: 'Seller' },
    { street: 'Jones Ave', city: 'Nashville', closeDate: '2024-07-16', soldPrice: 535000, daysOnMarket: 21, side: 'Seller' },
    { street: 'Richard Jones Rd', city: 'Nashville', closeDate: '2024-06-27', soldPrice: 330000, daysOnMarket: 5, side: 'Seller' },
    { street: 'Hampton Hall Way', city: 'Nashville', closeDate: '2024-06-07', soldPrice: 405000, daysOnMarket: 30, side: 'Seller' },
    { street: 'Garrison Dr', city: 'Nashville', closeDate: '2024-05-21', soldPrice: 350000, daysOnMarket: 5, side: 'Seller' },
    { street: 'Brook Hollow Rd', city: 'Nashville', closeDate: '2024-05-10', soldPrice: 850000, daysOnMarket: 0, side: 'Seller' },
    { street: 'Elliston St', city: 'Nashville', closeDate: '2023-12-08', soldPrice: 284900, daysOnMarket: 32, side: 'Seller' },
    { street: 'Arapaho Bnd', city: 'Nashville', closeDate: '2023-11-22', soldPrice: 360000, daysOnMarket: 13, side: 'Seller' },
    { street: 'Nashua Ln', city: 'Nashville', closeDate: '2023-10-27', soldPrice: 350000, daysOnMarket: 6, side: 'Seller' },
    { street: 'Jay St', city: 'Nashville', closeDate: '2023-09-18', soldPrice: 438000, daysOnMarket: 12, side: 'Seller' },
    { street: 'Artelia Dr', city: 'Nashville', closeDate: '2023-07-12', soldPrice: 339000, daysOnMarket: 9, side: 'Seller' },
    { street: 'Anderson Rd', city: 'Nashville', closeDate: '2023-01-10', soldPrice: 269000, daysOnMarket: 27, side: 'Seller' },
    { street: 'Timber Valley Dr', city: 'Nashville', closeDate: '2022-08-30', soldPrice: 339000, daysOnMarket: 8, side: 'Seller' },
    { street: 'Lemont Dr', city: 'Nashville', closeDate: '2022-08-04', soldPrice: 397000, daysOnMarket: 16, side: 'Seller' },
    { street: 'Leslie Ave', city: 'Nashville', closeDate: '2022-07-08', soldPrice: 480000, daysOnMarket: 29, side: 'Seller' },
    { street: 'Modena Dr', city: 'Nashville', closeDate: '2022-06-27', soldPrice: 349900, daysOnMarket: 14, side: 'Seller' },
    { street: 'Ocala Drive', city: 'Nashville', closeDate: '2022-06-25', soldPrice: 430000, daysOnMarket: 12, side: 'Seller' },
    { street: 'Kimberly Dr', city: 'Nashville', closeDate: '2022-05-23', soldPrice: 499900, daysOnMarket: 5, side: 'Seller' },
    { street: 'Goodland Rd', city: 'Nashville', closeDate: '2022-05-17', soldPrice: 480000, daysOnMarket: 1, side: 'Seller' },
    { street: 'Flora Maxwell Rd', city: 'Nashville', closeDate: '2022-05-09', soldPrice: 309900, daysOnMarket: 33, side: 'Seller' },
    { street: '53rd Ave N', city: 'Nashville', closeDate: '2022-05-06', soldPrice: 475000, daysOnMarket: 40, side: 'Seller' },
    { street: 'Kendall Dr', city: 'Nashville', closeDate: '2022-04-21', soldPrice: 549900, daysOnMarket: 2, side: 'Seller' },
    { street: 'Heritage Cir', city: 'Nashville', closeDate: '2022-04-04', soldPrice: 280000, daysOnMarket: 0, side: 'Seller' },
    { street: 'Boulder Park Dr', city: 'Nashville', closeDate: '2022-02-17', soldPrice: 345000, daysOnMarket: 10, side: 'Seller' },
    { street: 'Hill Creek Dr', city: 'Nashville', closeDate: '2022-02-11', soldPrice: 415000, daysOnMarket: 7, side: 'Seller' },
    { street: 'Ridgeway Dr', city: 'Nashville', closeDate: '2022-02-10', soldPrice: 338000, daysOnMarket: 4, side: 'Seller' },
    { street: 'Bullock Ave', city: 'Nashville', closeDate: '2022-02-04', soldPrice: 340000, daysOnMarket: 10, side: 'Seller' },
    { street: 'Scott Ave', city: 'Nashville', closeDate: '2022-01-12', soldPrice: 425000, daysOnMarket: 0, side: 'Seller' },
    { street: 'Donna Kay Dr', city: 'Nashville', closeDate: '2022-01-10', soldPrice: 340000, daysOnMarket: 11, side: 'Seller' },
    { street: 'Douglas Ave', city: 'Nashville', closeDate: '2021-12-21', soldPrice: 379900, daysOnMarket: 4, side: 'Seller' },
    { street: 'Old Hickory Blvd', city: 'Nashville', closeDate: '2021-11-29', soldPrice: 500000, daysOnMarket: 4, side: 'Seller' },
    { street: 'Labrador Ln', city: 'Nashville', closeDate: '2021-10-29', soldPrice: 325000, daysOnMarket: 1, side: 'Seller' },
    { street: 'Redfern Ct', city: 'Nashville', closeDate: '2021-10-26', soldPrice: 350000, daysOnMarket: 13, side: 'Seller' },
    { street: 'Neelys Bend Rd', city: 'Nashville', closeDate: '2021-10-15', soldPrice: 190000, daysOnMarket: 8, side: 'Seller' },
    { street: 'Leslie Ave', city: 'Nashville', closeDate: '2021-09-29', soldPrice: 269900, daysOnMarket: 4, side: 'Seller' },
    { street: 'Apple Valley Rd', city: 'Nashville', closeDate: '2021-09-10', soldPrice: 283000, daysOnMarket: 6, side: 'Seller' },
    { street: 'Bonnafair Dr', city: 'Nashville', closeDate: '2021-06-30', soldPrice: 290000, daysOnMarket: 11, side: 'Seller' },
    { street: 'Rural Hill Rd', city: 'Nashville', closeDate: '2021-06-29', soldPrice: 323422, daysOnMarket: 2, side: 'Seller' },
    { street: 'Cedarcliff Ct', city: 'Nashville', closeDate: '2021-06-18', soldPrice: 305000, daysOnMarket: 0, side: 'Seller' },
    { street: 'Grinstead Pl', city: 'Nashville', closeDate: '2021-04-30', soldPrice: 325000, daysOnMarket: 0, side: 'Seller' },
    { street: 'Croley Dr', city: 'Nashville', closeDate: '2021-04-27', soldPrice: 319900, daysOnMarket: 7, side: 'Seller' },
    { street: 'Oak Park Dr', city: 'Nashville', closeDate: '2021-04-14', soldPrice: 219000, daysOnMarket: 72, side: 'Seller' },
    { street: 'Tampa Dr', city: 'Nashville', closeDate: '2021-04-05', soldPrice: 374900, daysOnMarket: 3, side: 'Seller' },
    { street: 'Hickman St', city: 'Nashville', closeDate: '2021-03-16', soldPrice: 155000, daysOnMarket: 35, side: 'Seller' },
    { street: 'Lyndale Dr', city: 'Nashville', closeDate: '2021-02-17', soldPrice: 260000, daysOnMarket: 10, side: 'Seller' },
    { street: 'Cloverbrook Dr', city: 'Nashville', closeDate: '2021-02-09', soldPrice: 630000, daysOnMarket: 18, side: 'Seller' },
  ],
})

export const davidsonSellerListings = davidson.listings

/** Cities that appear in the rows. Nashville is the only city in this file. */
export function davidsonListingCities(
  rows: readonly DavidsonSellerListing[] = davidsonSellerListings,
): string[] {
  return davidson.listingCities(rows)
}

export function davidsonSellerListingsSummary(
  rows: readonly DavidsonSellerListing[] = davidsonSellerListings,
): string {
  return davidson.summary(rows)
}

/**
 * Newest first, one row per street. Defaults to the six most recent
 * distinct streets. Repeat closings stay in the full list and are omitted
 * here.
 */
export function recentDavidsonSellerListings(
  limit = DAVIDSON_RECENT_LISTING_COUNT,
): DavidsonSellerListing[] {
  return davidson.recent(limit)
}

export function davidsonRealEstateAgentAreaServed() {
  return davidson.areaServed()
}

/** Visible rows only. No review or rating fields. */
export function davidsonSellerListingsItemList(rows: readonly DavidsonSellerListing[]) {
  return davidson.itemList(rows)
}
