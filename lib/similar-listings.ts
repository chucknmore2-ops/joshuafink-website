import type { Listing } from './listings'
import { listingLocalityLine } from './listing-address'

/** City name only: "Nashville, TN 37216 | MLS #1" and "Lot 54, Brentwood, TN 37027". */
export function listingCityName(city: string): string {
  const line = listingLocalityLine(city || '')
  const comma = line.indexOf(',')
  return (comma === -1 ? line : line.slice(0, comma)).trim()
}

/**
 * Price window for "homes like this". The wider of 15% or $50,000, so a
 * lower-priced home still has a band and a luxury price does not swallow
 * the whole inventory. Rounded to the nearest thousand.
 */
export function suggestedPriceBand(price: number): { min: number; max: number } {
  const pad = Math.max(50_000, Math.round((price * 0.15) / 1000) * 1000)
  return {
    min: Math.max(0, price - pad),
    max: price + pad,
  }
}

function sameHome(a: Listing, b: Listing): boolean {
  if (a.compassUrl && b.compassUrl && a.compassUrl === b.compassUrl) return true
  return a.address.trim().toLowerCase() === b.address.trim().toLowerCase()
    && listingCityName(a.city).toLowerCase() === listingCityName(b.city).toLowerCase()
}

/**
 * Other current listings in the same city or price band.
 * Active homes sort ahead of under-contract ones. Same city sorts ahead of
 * price-only matches. Closest price breaks the rest of the ties.
 */
export function similarListings(
  listing: Listing,
  all: readonly Listing[],
  limit = 3,
): Listing[] {
  const city = listingCityName(listing.city).toLowerCase()
  const band = suggestedPriceBand(listing.price)
  const ranked = all
    .filter((other) => !sameHome(listing, other))
    .map((other) => {
      const sameCity = listingCityName(other.city).toLowerCase() === city && city.length > 0
      const inBand = other.price >= band.min && other.price <= band.max
      if (!sameCity && !inBand) return null
      return {
        other,
        statusScore: other.status === 'Active' || /coming soon/i.test(other.status) ? 0 : 1,
        cityScore: sameCity ? 0 : 1,
        priceDist: Math.abs(other.price - listing.price),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) =>
      a.statusScore - b.statusScore
      || a.cityScore - b.cityScore
      || a.priceDist - b.priceDist
      || a.other.address.localeCompare(b.other.address),
    )
  return ranked.slice(0, limit).map((row) => row.other)
}
