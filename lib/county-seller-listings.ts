import { formatCloseMonthYear } from '@/lib/closings'

/**
 * Shared seller-side listing proof for a county cash-offer page.
 * Street and city only — no house numbers and no client names.
 * Every row is a traditional listing (side Seller), not a cash purchase.
 */
export type CountySellerListing<City extends string = string> = {
  street: string
  city: City
  /** ISO close date. The page shows month and year. */
  closeDate: string
  soldPrice: number
  daysOnMarket: number
  side: 'Seller'
}

export type CountySellerArea =
  | {
      '@type': 'AdministrativeArea'
      name: string
      addressRegion: 'TN'
      addressCountry: 'US'
    }
  | {
      '@type': 'City'
      name: string
      addressRegion: 'TN'
      addressCountry: 'US'
    }

type DefineOptions<City extends string> = {
  county: string
  cityOrder: readonly City[]
  listings: readonly CountySellerListing<City>[]
  recentCount?: number
  /**
   * When true, the public list keeps the newest closing on each street
   * so two sales on the same street do not look like a duplicated row.
   * The full list, the count, and the median still include every closing.
   */
  distinctStreets?: boolean
  /** Error prefix, so a bad row names the catalog it came from. */
  label?: string
}

function isRealIsoDate(iso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utc = new Date(Date.UTC(year, month - 1, day))
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
}

/**
 * Street ordinals (5th, 53rd) are the name. Any other digit is a house
 * number or a unit number that should have been stripped before the row
 * was stored.
 */
function streetIncludesHouseNumber(street: string): boolean {
  return /\d/.test(street.replace(/\d+(?:st|nd|rd|th)\b/gi, ''))
}

function assertListing<City extends string>(
  row: CountySellerListing<City>,
  index: number,
  cityOrder: readonly City[],
  county: string,
  label: string,
): void {
  const where = `${label}[${index}] ${row.street || '(no street)'}`
  if (!row.street.trim() || row.street !== row.street.trim()) {
    throw new Error(`${where} has a blank street`)
  }
  if (streetIncludesHouseNumber(row.street)) {
    throw new Error(`${where} includes a house number`)
  }
  if (!(cityOrder as readonly string[]).includes(row.city)) {
    throw new Error(`${where} is outside ${county}`)
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

function compareNewestFirst<City extends string>(
  a: CountySellerListing<City>,
  b: CountySellerListing<City>,
): number {
  const byDate = b.closeDate.localeCompare(a.closeDate)
  if (byDate !== 0) return byDate
  return a.street.localeCompare(b.street)
}

function joinCities(cities: readonly string[], county: string): string {
  if (cities.length === 0) throw new Error(`no ${county} cities`)
  if (cities.length === 1) return cities[0]
  if (cities.length === 2) return `${cities[0]} and ${cities[1]}`
  return `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}`
}

/**
 * Even counts use the mean of the two middle values. Both inputs are whole
 * days, so the result is a whole number or an exact half — never rounded.
 */
export function medianDaysOnMarket(rows: readonly CountySellerListing[]): number {
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

export function defineCountySellerListings<City extends string>(options: DefineOptions<City>) {
  const {
    county,
    cityOrder,
    listings,
    recentCount = 6,
    distinctStreets = false,
    label = 'sellerListings',
  } = options

  if (!county.trim()) throw new Error(`${label} is missing a county`)
  if (cityOrder.length === 0) throw new Error(`${label} is missing cities`)
  if (listings.length === 0) throw new Error(`${label} has no listings`)
  listings.forEach((row, index) => assertListing(row, index, cityOrder, county, label))

  function listingCities(rows: readonly CountySellerListing<City>[] = listings): string[] {
    const present = new Set<string>(rows.map((row) => row.city))
    return cityOrder.filter((city) => present.has(city))
  }

  function summary(rows: readonly CountySellerListing<City>[] = listings): string {
    const count = rows.length
    const year = rows.map((row) => row.closeDate.slice(0, 4)).sort()[0]
    const median = medianDaysOnMarket(rows)
    const medianLabel = formatMedianDays(median)
    const listingWord = count === 1 ? 'listing' : 'listings'
    const dayWord = median === 1 ? 'day' : 'days'
    return `I've closed ${count} ${listingWord} in ${joinCities(listingCities(rows), county)} since ${year}, with a median of ${medianLabel} ${dayWord} on market.`
  }

  /** Newest first. With distinctStreets, one row per street (the newest closing). */
  function recent(limit = recentCount): CountySellerListing<City>[] {
    if (!Number.isSafeInteger(limit) || limit < 0) throw new Error(`bad listing limit ${limit}`)
    const sorted = [...listings].sort(compareNewestFirst)
    if (!distinctStreets) return sorted.slice(0, limit)
    const seen = new Set<string>()
    const picked: CountySellerListing<City>[] = []
    for (const row of sorted) {
      if (seen.has(row.street)) continue
      seen.add(row.street)
      picked.push(row)
      if (picked.length === limit) break
    }
    return picked
  }

  function areaServed(): CountySellerArea[] {
    return [
      {
        '@type': 'AdministrativeArea',
        name: county,
        addressRegion: 'TN',
        addressCountry: 'US',
      },
      ...listingCities().map((name) => ({
        '@type': 'City' as const,
        name,
        addressRegion: 'TN' as const,
        addressCountry: 'US' as const,
      })),
    ]
  }

  /** Visible rows only. No review or rating fields. */
  function itemList(rows: readonly CountySellerListing<City>[]) {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Homes I've sold in ${county}`,
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

  return {
    listings,
    listingCities,
    summary,
    recent,
    areaServed,
    itemList,
  }
}
