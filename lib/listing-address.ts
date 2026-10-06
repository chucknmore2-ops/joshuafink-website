/**
 * Shared parsing for Compass `city` strings.
 *
 * Active listings look like "Brentwood, TN 37027" or
 * "Nashville, TN 37216 | MLS #3319964". Sold inventory sometimes prefixes a
 * lot/unit token ("Lot 54, Brentwood, TN 37027"), which is not the locality.
 * Every consumer that needs a city name or PostalAddress should go through
 * these helpers so Lot/Unit prefixes cannot silently become "the city".
 */

export function listingCityDisplay(city: string): string {
  return city.split('|')[0].trim()
}

/**
 * "City, ST ZIP" extracted from a Compass city string, or the display string
 * when no state/ZIP pattern is present.
 */
export function listingLocalityLine(city: string): string {
  const cityClean = listingCityDisplay(city)
  const match = cityClean.match(
    /([A-Za-z][A-Za-z .']+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/,
  )
  if (!match) return cityClean
  return `${match[1].trim()}, ${match[2]} ${match[3]}`
}

export function parseListingPostalAddress(
  streetAddress: string,
  city: string,
): Record<string, string> {
  const cityClean = listingCityDisplay(city)
  const match = cityClean.match(
    /([A-Za-z][A-Za-z .']+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/,
  )
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    streetAddress,
    addressCountry: 'US',
  }
  if (match) {
    address.addressLocality = match[1].trim()
    address.addressRegion = match[2]
    address.postalCode = match[3]
  } else {
    address.addressLocality = cityClean
  }
  return address
}
