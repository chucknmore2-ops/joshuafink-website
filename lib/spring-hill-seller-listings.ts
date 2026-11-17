import {
  defineCountySellerListings,
  type CountySellerListing,
} from '@/lib/county-seller-listings'
import { columbiaSellerListings } from '@/lib/columbia-seller-listings'

/**
 * Seller-side Spring Hill listings Joshua Fink closed. Street and city
 * only — no house numbers and no client names. Every row is a traditional
 * listing (side Seller), not a cash purchase. Do not add rows, quotes, or
 * stats that are not in this list.
 *
 * These four closings, from 2021 and 2022, are the whole Spring Hill
 * seller-side record in the export. The same four rows are the Spring Hill
 * subset of the Williamson County catalog. Do not describe them as a
 * Williamson or Maury county total. The Columbia count lives in the
 * Columbia catalog and is only mentioned from here as nearby experience.
 */
export type SpringHillSellerListing = CountySellerListing<'Spring Hill'>

const CITY_ORDER = ['Spring Hill'] as const

export const SPRING_HILL_RECENT_LISTING_COUNT = 4

const springHill = defineCountySellerListings({
  county: 'Spring Hill',
  cityOrder: CITY_ORDER,
  recentCount: SPRING_HILL_RECENT_LISTING_COUNT,
  distinctStreets: true,
  label: 'springHillSellerListings',
  listings: [
    { street: 'Greens Mill Rd', city: 'Spring Hill', closeDate: '2022-10-13', soldPrice: 470000, daysOnMarket: 14, side: 'Seller' },
    { street: 'John Sharp Rd', city: 'Spring Hill', closeDate: '2021-12-06', soldPrice: 284900, daysOnMarket: 5, side: 'Seller' },
    { street: 'Nealcrest Cir', city: 'Spring Hill', closeDate: '2021-05-17', soldPrice: 475000, daysOnMarket: 19, side: 'Seller' },
    { street: 'Kedron Rd', city: 'Spring Hill', closeDate: '2021-03-16', soldPrice: 335000, daysOnMarket: 1, side: 'Seller' },
  ],
})

export const springHillSellerListings = springHill.listings

/** Cities that appear in the rows. Spring Hill is the only city in this file. */
export function springHillListingCities(
  rows: readonly SpringHillSellerListing[] = springHillSellerListings,
): string[] {
  return springHill.listingCities(rows)
}

export function springHillSellerListingsSummary(
  rows: readonly SpringHillSellerListing[] = springHillSellerListings,
): string {
  return springHill.summary(rows)
}

/** Newest first. The default limit is the whole four-closing record. */
export function recentSpringHillSellerListings(
  limit = SPRING_HILL_RECENT_LISTING_COUNT,
): SpringHillSellerListing[] {
  return springHill.recent(limit)
}

export function springHillRealEstateAgentAreaServed() {
  return springHill.areaServed()
}

/** Visible rows only. No review or rating fields. */
export function springHillSellerListingsItemList(rows: readonly SpringHillSellerListing[]) {
  return springHill.itemList(rows)
}

/**
 * Nearby Maury County experience for the Spring Hill page. The count and
 * year come from the Columbia catalog, which is the since-2022 set only.
 */
export function springHillNearbyColumbiaNote(
  rows: readonly { closeDate: string }[] = columbiaSellerListings,
): string {
  if (rows.length === 0) throw new Error('no Columbia listings')
  const year = rows.map((row) => row.closeDate.slice(0, 4)).sort()[0]
  return `Nearby in Maury County, I've closed ${rows.length} homes in Columbia since ${year}.`
}
