/**
 * First-party sold-inventory helpers for GEO / proof sections.
 *
 * Every figure here is derived from lib/sold-listings.ts (the records currently
 * shown on this site). Do not treat counts, cities, or prices as market
 * statistics, GNAR/Redfin comps, or a complete sales history — and do not infer
 * which side of the transaction Joshua represented.
 */
import type { Listing } from './listings'
import { soldListings } from './sold-listings'
import { isIndexableSoldListing } from './listing-detail'
import { listingLocalityLine } from './listing-address'
import { getSuburbSlugForListing } from './suburbs'

/** Sold records that are complete enough to show and link on-site. */
export function publishedSoldListings(pool: readonly Listing[] = soldListings): Listing[] {
  return pool.filter(isIndexableSoldListing)
}

export function soldListingsForSuburb(
  suburbSlug: string,
  pool: readonly Listing[] = soldListings,
): Listing[] {
  return publishedSoldListings(pool).filter(
    (listing) => getSuburbSlugForListing(listing.city) === suburbSlug,
  )
}

export function soldListingLocationNames(items: readonly Listing[]): string[] {
  const names = new Set<string>()
  for (const listing of items) {
    const locality = listingLocalityLine(listing.city)
    const city = locality.split(',')[0]?.trim()
    if (city) names.add(city)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}
