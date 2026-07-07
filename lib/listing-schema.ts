/**
 * Schema.org ItemList builder for listing grids.
 *
 * Emits an ItemList of SingleFamilyResidence items so Google can understand
 * the set of homes shown on /listings and the homepage Featured grid (address,
 * image, size, room counts). Price is intentionally left off the schema — it
 * lives on the visible card and is not a reliably-supported listing rich-result
 * field — so the markup stays valid and uncontested in Search Console.
 */
import type { Listing } from './listings'

function parseAddress(streetAddress: string, city: string) {
  // city looks like "Brentwood, TN 37027" optionally suffixed with " | MLS #…"
  const cityClean = city.split('|')[0].trim()
  const match = cityClean.match(/^(.*?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    streetAddress,
    addressCountry: 'US',
  }
  if (match) {
    address.addressLocality = match[1]
    address.addressRegion = match[2]
    address.postalCode = match[3]
  } else {
    address.addressLocality = cityClean
  }
  return address
}

export function buildListingItemList(items: Listing[], name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SingleFamilyResidence',
        name: l.address,
        address: parseAddress(l.address, l.city),
        url: l.compassUrl,
        ...(l.imageUrl ? { image: l.imageUrl } : {}),
        ...(l.beds !== undefined ? { numberOfRooms: l.beds } : {}),
        ...(l.baths !== undefined ? { numberOfBathroomsTotal: l.baths } : {}),
        ...(l.sqft !== undefined
          ? {
              floorSize: {
                '@type': 'QuantitativeValue',
                value: l.sqft,
                unitCode: 'FTK',
              },
            }
          : {}),
      },
    })),
  }
}

/**
 * Single-property schema for an on-site listing detail page
 * (app/listings/[slug]/page.tsx).
 *
 * Emits a RealEstateListing whose `about` is a SingleFamilyResidence built with
 * the SAME address / room-count / floor-size shape as buildListingItemList
 * above, so the detail page and the /listings grid describe each home
 * identically to Google. Price is intentionally omitted for the same
 * Search-Console-validity reason noted at the top of this file — it lives on the
 * visible page, not in the markup. `url` should be the on-site detail URL (not
 * the Compass URL) so this page is the canonical entity for the address.
 */
export function buildListingSchema(listing: Listing, url: string) {
  const residence: Record<string, unknown> = {
    '@type': 'SingleFamilyResidence',
    name: listing.address,
    address: parseAddress(listing.address, listing.city),
    ...(listing.imageUrl ? { image: listing.imageUrl } : {}),
    ...(listing.beds !== undefined ? { numberOfRooms: listing.beds } : {}),
    ...(listing.baths !== undefined ? { numberOfBathroomsTotal: listing.baths } : {}),
    ...(listing.sqft !== undefined
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: listing.sqft,
            unitCode: 'FTK',
          },
        }
      : {}),
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    url,
    name: listing.address,
    ...(listing.imageUrl ? { image: listing.imageUrl } : {}),
    ...(listing.lastVerified ? { datePosted: listing.lastVerified } : {}),
    about: residence,
  }
}
