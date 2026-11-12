import { formatCloseMonthYear } from '@/lib/closings'

/**
 * Seller-side Rutherford County listings Joshua Fink closed.
 * Street and city only — no house numbers and no client names.
 * Every row is a traditional listing (side Seller), not a cash purchase.
 * Do not add rows, quotes, or stats that are not in this list.
 */
export type RutherfordSellerListing = {
  street: string
  city: 'Murfreesboro' | 'Smyrna' | 'La Vergne'
  /** ISO close date. The page shows month and year. */
  closeDate: string
  soldPrice: number
  daysOnMarket: number
  side: 'Seller'
}

const COUNTY = 'Rutherford County'

/** Page order: Murfreesboro, then Smyrna, then La Vergne. */
const CITY_ORDER = ['Murfreesboro', 'Smyrna', 'La Vergne'] as const

export const RUTHERFORD_RECENT_LISTING_COUNT = 6

export const rutherfordSellerListings: readonly RutherfordSellerListing[] = [
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
]

function isRealIsoDate(iso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utc = new Date(Date.UTC(year, month - 1, day))
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
}

function assertListing(row: RutherfordSellerListing, index: number): void {
  const where = `rutherfordSellerListings[${index}] ${row.street || '(no street)'}`
  if (!row.street.trim() || row.street !== row.street.trim()) {
    throw new Error(`${where} has a blank street`)
  }
  if (/^\d/.test(row.street) || /\d/.test(row.street)) {
    throw new Error(`${where} includes a house number`)
  }
  if (!(CITY_ORDER as readonly string[]).includes(row.city)) {
    throw new Error(`${where} is outside ${COUNTY}`)
  }
  if (row.side !== 'Seller') throw new Error(`${where} is not a seller-side listing`)
  if (!isRealIsoDate(row.closeDate)) throw new Error(`${where} has a bad close date`)
  if (!Number.isSafeInteger(row.soldPrice) || row.soldPrice <= 0) {
    throw new Error(`${where} has a sold price that is not a whole dollar amount`)
  }
  if (!Number.isSafeInteger(row.daysOnMarket) || row.daysOnMarket < 0) {
    throw new Error(`${where} has a bad days-on-market count`)
  }
}

rutherfordSellerListings.forEach(assertListing)

function compareNewestFirst(a: RutherfordSellerListing, b: RutherfordSellerListing): number {
  const byDate = b.closeDate.localeCompare(a.closeDate)
  if (byDate !== 0) return byDate
  return a.street.localeCompare(b.street)
}

/** Cities that appear in the rows, in Murfreesboro / Smyrna / La Vergne order. */
export function rutherfordListingCities(
  rows: readonly RutherfordSellerListing[] = rutherfordSellerListings,
): string[] {
  const present = new Set(rows.map((row) => row.city))
  return CITY_ORDER.filter((city) => present.has(city))
}

function joinCities(cities: readonly string[]): string {
  if (cities.length === 0) throw new Error('no Rutherford cities')
  if (cities.length === 1) return cities[0]
  if (cities.length === 2) return `${cities[0]} and ${cities[1]}`
  return `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}`
}

/**
 * Even counts use the mean of the two middle values. Both inputs are whole
 * days, so the result is a whole number or an exact half — never rounded.
 */
export function medianDaysOnMarket(rows: readonly RutherfordSellerListing[]): number {
  if (rows.length === 0) throw new Error('no listings')
  const sorted = rows.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[mid]
  return (sorted[mid - 1] + sorted[mid]) / 2
}

export function formatMedianDays(median: number): string {
  if (!Number.isFinite(median) || median < 0) throw new Error(`bad median ${median}`)
  if (Number.isInteger(median)) return String(median)
  const doubled = median * 2
  if (!Number.isInteger(doubled)) throw new Error(`refusing to round median ${median}`)
  return String(median)
}

export function rutherfordSellerListingsSummary(
  rows: readonly RutherfordSellerListing[] = rutherfordSellerListings,
): string {
  const count = rows.length
  const year = rows.map((row) => row.closeDate.slice(0, 4)).sort()[0]
  const median = medianDaysOnMarket(rows)
  const medianLabel = formatMedianDays(median)
  const listingWord = count === 1 ? 'listing' : 'listings'
  const dayWord = median === 1 ? 'day' : 'days'
  return `I've closed ${count} ${listingWord} in ${joinCities(rutherfordListingCities(rows))} since ${year}, with a median of ${medianLabel} ${dayWord} on market.`
}

/** Newest first. Defaults to the six most recent rows. */
export function recentRutherfordSellerListings(
  limit = RUTHERFORD_RECENT_LISTING_COUNT,
): RutherfordSellerListing[] {
  if (!Number.isSafeInteger(limit) || limit < 0) throw new Error(`bad listing limit ${limit}`)
  return [...rutherfordSellerListings].sort(compareNewestFirst).slice(0, limit)
}

export function rutherfordRealEstateAgentAreaServed() {
  return [
    {
      '@type': 'AdministrativeArea' as const,
      name: COUNTY,
      addressRegion: 'TN',
      addressCountry: 'US',
    },
    ...rutherfordListingCities().map((name) => ({
      '@type': 'City' as const,
      name,
      addressRegion: 'TN',
      addressCountry: 'US',
    })),
  ]
}

/** Visible rows only. No review or rating fields. */
export function rutherfordSellerListingsItemList(rows: readonly RutherfordSellerListing[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: "Homes I've sold in Rutherford County",
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Offer',
        name: `${row.street}, ${row.city}, TN`,
        price: row.soldPrice,
        priceCurrency: 'USD',
        availability: 'https://schema.org/SoldOut',
        description: `Traditional listing. Closed ${formatCloseMonthYear(row.closeDate)}. ${row.daysOnMarket} ${row.daysOnMarket === 1 ? 'day' : 'days'} on market.`,
        itemOffered: {
          '@type': 'Residence',
          address: {
            '@type': 'PostalAddress',
            streetAddress: row.street,
            addressLocality: row.city,
            addressRegion: 'TN',
            addressCountry: 'US',
          },
        },
      },
    })),
  }
}
