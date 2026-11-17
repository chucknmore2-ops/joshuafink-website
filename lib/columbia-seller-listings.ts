import {
  defineCountySellerListings,
  type CountySellerListing,
} from '@/lib/county-seller-listings'

/**
 * Seller-side Columbia listings Joshua Fink closed since January 2022.
 * Maury County, Columbia only. Street and city only — no house numbers
 * and no client names. Every row is a traditional listing (side Seller),
 * not a cash purchase. Do not add rows, quotes, or stats that are not in
 * this list.
 *
 * Twenty-six more Columbia seller-side sales from 2020–2021 are in the
 * export. They are not rows here, and the count on the page does not
 * include them. The summary is these 39 closings since 2022.
 */
export type ColumbiaSellerListing = CountySellerListing<'Columbia'>

const CITY_ORDER = ['Columbia'] as const

export const COLUMBIA_RECENT_LISTING_COUNT = 6

const columbia = defineCountySellerListings({
  county: 'Maury County',
  cityOrder: CITY_ORDER,
  recentCount: COLUMBIA_RECENT_LISTING_COUNT,
  distinctStreets: true,
  label: 'columbiaSellerListings',
  listings: [
    { street: 'Hampton Rd', city: 'Columbia', closeDate: '2026-05-04', soldPrice: 325000, daysOnMarket: 6, side: 'Seller' },
    { street: 'Transit Ave', city: 'Columbia', closeDate: '2026-02-26', soldPrice: 335000, daysOnMarket: 23, side: 'Seller' },
    { street: 'Porter Cir', city: 'Columbia', closeDate: '2026-02-25', soldPrice: 339900, daysOnMarket: 20, side: 'Seller' },
    { street: 'Brown St', city: 'Columbia', closeDate: '2026-02-11', soldPrice: 235000, daysOnMarket: 18, side: 'Seller' },
    { street: 'Lee Dr', city: 'Columbia', closeDate: '2025-10-10', soldPrice: 285000, daysOnMarket: 10, side: 'Seller' },
    { street: 'Annie Ln', city: 'Columbia', closeDate: '2025-08-19', soldPrice: 328050, daysOnMarket: 36, side: 'Seller' },
    { street: '6th Ave', city: 'Columbia', closeDate: '2025-07-17', soldPrice: 360000, daysOnMarket: 8, side: 'Seller' },
    { street: 'W Hardin Dr', city: 'Columbia', closeDate: '2025-06-26', soldPrice: 317400, daysOnMarket: 1, side: 'Seller' },
    { street: 'Hickman St', city: 'Columbia', closeDate: '2025-04-24', soldPrice: 215000, daysOnMarket: 1, side: 'Seller' },
    { street: 'Lookout Dr', city: 'Columbia', closeDate: '2025-04-04', soldPrice: 359900, daysOnMarket: 19, side: 'Seller' },
    { street: 'Rayburn Ave', city: 'Columbia', closeDate: '2025-01-29', soldPrice: 249900, daysOnMarket: 26, side: 'Seller' },
    { street: 'Spring Ln', city: 'Columbia', closeDate: '2024-12-23', soldPrice: 315000, daysOnMarket: 13, side: 'Seller' },
    { street: 'Woods Dr', city: 'Columbia', closeDate: '2024-07-31', soldPrice: 317500, daysOnMarket: 54, side: 'Seller' },
    { street: 'Stonewall Rd', city: 'Columbia', closeDate: '2024-05-24', soldPrice: 337500, daysOnMarket: 19, side: 'Seller' },
    { street: 'Dalton St', city: 'Columbia', closeDate: '2024-04-26', soldPrice: 160000, daysOnMarket: 8, side: 'Seller' },
    { street: 'W 15th St', city: 'Columbia', closeDate: '2024-03-22', soldPrice: 284900, daysOnMarket: 19, side: 'Seller' },
    { street: 'Mockingbird Dr', city: 'Columbia', closeDate: '2024-03-15', soldPrice: 232000, daysOnMarket: 7, side: 'Seller' },
    { street: 'Jewell Dr', city: 'Columbia', closeDate: '2024-02-29', soldPrice: 450000, daysOnMarket: 12, side: 'Seller' },
    { street: 'Whatley St', city: 'Columbia', closeDate: '2023-12-28', soldPrice: 195994, daysOnMarket: 17, side: 'Seller' },
    { street: 'E 17th St', city: 'Columbia', closeDate: '2023-12-19', soldPrice: 200000, daysOnMarket: 32, side: 'Seller' },
    { street: 'Napier Dr', city: 'Columbia', closeDate: '2023-11-30', soldPrice: 242500, daysOnMarket: 66, side: 'Seller' },
    { street: 'N Cayce Ln', city: 'Columbia', closeDate: '2023-09-08', soldPrice: 395000, daysOnMarket: 15, side: 'Seller' },
    { street: 'Birchwood Dr', city: 'Columbia', closeDate: '2023-07-26', soldPrice: 290000, daysOnMarket: 3, side: 'Seller' },
    { street: 'E Valley Dr', city: 'Columbia', closeDate: '2023-03-30', soldPrice: 175000, daysOnMarket: 10, side: 'Seller' },
    { street: 'Creek Trl', city: 'Columbia', closeDate: '2023-03-22', soldPrice: 288000, daysOnMarket: 34, side: 'Seller' },
    { street: 'W 18th St', city: 'Columbia', closeDate: '2023-03-06', soldPrice: 229900, daysOnMarket: 9, side: 'Seller' },
    { street: 'Hickory Ridge Trl', city: 'Columbia', closeDate: '2022-11-10', soldPrice: 433000, daysOnMarket: 30, side: 'Seller' },
    { street: 'Santa Fe Pike', city: 'Columbia', closeDate: '2022-11-01', soldPrice: 245000, daysOnMarket: 24, side: 'Seller' },
    { street: 'Dimple Ct', city: 'Columbia', closeDate: '2022-08-19', soldPrice: 225000, daysOnMarket: 19, side: 'Seller' },
    { street: 'E 9th St', city: 'Columbia', closeDate: '2022-07-08', soldPrice: 180000, daysOnMarket: 15, side: 'Seller' },
    { street: 'Westover Dr', city: 'Columbia', closeDate: '2022-06-17', soldPrice: 89900, daysOnMarket: 21, side: 'Seller' },
    { street: 'S Laurel Cir', city: 'Columbia', closeDate: '2022-05-31', soldPrice: 355000, daysOnMarket: 11, side: 'Seller' },
    { street: 'Mooresville Pike', city: 'Columbia', closeDate: '2022-05-12', soldPrice: 285000, daysOnMarket: 0, side: 'Seller' },
    { street: 'Carter St', city: 'Columbia', closeDate: '2022-04-08', soldPrice: 398000, daysOnMarket: 2, side: 'Seller' },
    { street: 'Morningside Ln', city: 'Columbia', closeDate: '2022-03-21', soldPrice: 250000, daysOnMarket: 17, side: 'Seller' },
    { street: 'Saint Margarett Cir', city: 'Columbia', closeDate: '2022-02-17', soldPrice: 300000, daysOnMarket: 3, side: 'Seller' },
    { street: 'Scribner Ave', city: 'Columbia', closeDate: '2022-02-10', soldPrice: 210000, daysOnMarket: 9, side: 'Seller' },
    { street: 'Fred White Rd', city: 'Columbia', closeDate: '2022-02-09', soldPrice: 219900, daysOnMarket: 6, side: 'Seller' },
    { street: 'College Park Dr', city: 'Columbia', closeDate: '2022-01-07', soldPrice: 385000, daysOnMarket: 2, side: 'Seller' },
  ],
})

export const columbiaSellerListings = columbia.listings

/** Cities that appear in the rows. Columbia is the only city in this file. */
export function columbiaListingCities(
  rows: readonly ColumbiaSellerListing[] = columbiaSellerListings,
): string[] {
  return columbia.listingCities(rows)
}

export function columbiaSellerListingsSummary(
  rows: readonly ColumbiaSellerListing[] = columbiaSellerListings,
): string {
  return columbia.summary(rows)
}

/**
 * Newest first, one row per street. Defaults to the six most recent
 * distinct streets. Every Columbia street in this file closed once, so
 * the six are the six newest closings.
 */
export function recentColumbiaSellerListings(
  limit = COLUMBIA_RECENT_LISTING_COUNT,
): ColumbiaSellerListing[] {
  return columbia.recent(limit)
}

export function columbiaRealEstateAgentAreaServed() {
  return columbia.areaServed()
}

/** Visible rows only. No review or rating fields. */
export function columbiaSellerListingsItemList(rows: readonly ColumbiaSellerListing[]) {
  return columbia.itemList(rows)
}
