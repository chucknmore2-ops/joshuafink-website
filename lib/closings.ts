import { getSuburbSlugForListing } from '@/lib/suburbs'
import { closings, type Closing, type ClosingSide } from '@/lib/closings-data'

export type { Closing, ClosingSide }
export { closings }

export const SOLD_PATH = '/sold'
export const SOLD_CANONICAL = 'https://www.joshuafink.com/sold'
export const AGENT_ID = 'https://www.joshuafink.com/#agent'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const SIDES: readonly ClosingSide[] = ['Represented buyer', 'Listed and sold']

export type CityClosings = {
  city: string
  anchor: string
  closings: Closing[]
}

function isRealIsoDate(iso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utc = new Date(Date.UTC(year, month - 1, day))
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  )
}

function isExactBathCount(n: number): boolean {
  if (!Number.isFinite(n) || n < 0) return false
  return Number.isInteger(n * 2)
}

function assertClosing(row: Closing, index: number): void {
  const where = `closings[${index}] ${row.address || '(no address)'}`
  if (row.state !== 'TN') throw new Error(`${where} is not in Tennessee`)
  if (row.status !== 'Closed') throw new Error(`${where} is not closed`)
  if (!SIDES.includes(row.side)) throw new Error(`${where} has an unknown side`)
  if (!row.address.trim() || row.address !== row.address.trim()) {
    throw new Error(`${where} has a blank address`)
  }
  if (!row.city.trim() || row.city !== row.city.trim()) {
    throw new Error(`${where} has a blank city`)
  }
  if (!/^\d{5}$/.test(row.zip)) throw new Error(`${where} has a bad zip`)
  if (!isRealIsoDate(row.closeDate)) throw new Error(`${where} has a bad close date`)
  if (!Number.isSafeInteger(row.soldPrice) || row.soldPrice <= 0) {
    throw new Error(`${where} has a sold price that is not a whole dollar amount`)
  }
  if (!Number.isSafeInteger(row.beds) || row.beds < 0) {
    throw new Error(`${where} has a bad bed count`)
  }
  if (!isExactBathCount(row.baths)) {
    throw new Error(`${where} has a bath count that would need rounding`)
  }
  if (!Number.isSafeInteger(row.sqft) || row.sqft <= 0) {
    throw new Error(`${where} has a bad square footage`)
  }
}

closings.forEach(assertClosing)

/** Whole dollars or an exact half-bath. Throws instead of rounding. */
export function formatGroupedInteger(n: number): string {
  if (!Number.isSafeInteger(n)) {
    throw new Error(`refusing to round ${n}`)
  }
  const sign = n < 0 ? '-' : ''
  const digits = Math.abs(n).toString()
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatSoldPrice(price: number): string {
  return `$${formatGroupedInteger(price)}`
}

export function formatBaths(n: number): string {
  if (!isExactBathCount(n)) throw new Error(`refusing to round baths ${n}`)
  if (Number.isInteger(n)) return formatGroupedInteger(n)
  return n.toString()
}

export function formatSqft(n: number): string {
  return formatGroupedInteger(n)
}

/** Month and year only. The day stays off the public label. */
export function formatCloseMonthYear(iso: string): string {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso)
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined
  if (!match || !month || !isRealIsoDate(iso)) {
    throw new Error(`bad close date: ${iso}`)
  }
  return `${month} ${match[1]}`
}

export function closingCityAnchor(city: string): string {
  const anchor = city
    .toLowerCase()
    .replace(/['‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(anchor)) {
    throw new Error(`unsafe city anchor: ${city}`)
  }
  return anchor
}

function compareNewestFirst(a: Closing, b: Closing): number {
  const byDate = b.closeDate.localeCompare(a.closeDate)
  if (byDate !== 0) return byDate
  const byAddress = a.address.localeCompare(b.address)
  if (byAddress !== 0) return byAddress
  return a.side.localeCompare(b.side)
}

/** Cities ordered by their newest closing, then name. Closings inside a city are newest first. */
export function closingGroups(): CityClosings[] {
  const byCity = new Map<string, Closing[]>()
  for (const row of closings) {
    const list = byCity.get(row.city)
    if (list) list.push(row)
    else byCity.set(row.city, [row])
  }

  const groups = Array.from(byCity.entries()).map(([city, rows]) => ({
    city,
    anchor: closingCityAnchor(city),
    closings: [...rows].sort(compareNewestFirst),
  }))

  groups.sort((a, b) => {
    const byDate = b.closings[0].closeDate.localeCompare(a.closings[0].closeDate)
    if (byDate !== 0) return byDate
    return a.city.localeCompare(b.city)
  })

  const anchors = groups.map((group) => group.anchor)
  if (new Set(anchors).size !== anchors.length) {
    throw new Error('two cities produced the same sold-page anchor')
  }
  return groups
}

export function closingGroupsForSuburb(slug: string): CityClosings[] {
  return closingGroups().filter((group) => getSuburbSlugForListing(group.city) === slug)
}

export type CityClosingProof = {
  city: string
  count: number
  /** Same /sold#city anchor the sold page and city pages already use. */
  href: string
}

/** Closed Tennessee sales for one city, from the same rows as /sold. */
export function cityClosingProof(city: string): CityClosingProof {
  const group = closingGroups().find((candidate) => candidate.city === city)
  if (!group) throw new Error(`no Tennessee closings for ${city}`)
  const count = group.closings.filter(
    (row) => row.city === city && row.state === 'TN' && row.status === 'Closed',
  ).length
  return {
    city: group.city,
    count,
    href: `${SOLD_PATH}#${group.anchor}`,
  }
}

/**
 * In-body closings proof for /cash-offer and /moving-to-middle-tennessee.
 * The total is every row behind /sold (each one is asserted Tennessee and
 * Closed). Named cities stay Nashville, Brentwood, and Franklin — the same
 * three the proof sentence publishes — and each count is computed here.
 */
export function tennesseeClosingsProof(): {
  total: number
  soldHref: typeof SOLD_PATH
  cities: readonly [CityClosingProof, CityClosingProof, CityClosingProof]
} {
  return {
    total: closings.length,
    soldHref: SOLD_PATH,
    cities: [
      cityClosingProof('Nashville'),
      cityClosingProof('Brentwood'),
      cityClosingProof('Franklin'),
    ],
  }
}

export function closingSideCounts(): Record<ClosingSide, number> {
  return {
    'Represented buyer': closings.filter((row) => row.side === 'Represented buyer').length,
    'Listed and sold': closings.filter((row) => row.side === 'Listed and sold').length,
  }
}

export function closingDateSpan(): { earliest: string; latest: string } {
  const dates = closings.map((row) => row.closeDate).sort()
  return { earliest: dates[0], latest: dates[dates.length - 1] }
}

/** Noon UTC on the newest close date. A real content date, not the build clock. */
export function closingsLastModified(): Date {
  return new Date(`${closingDateSpan().latest}T12:00:00.000Z`)
}

export function soldPageDescription(): string {
  const span = closingDateSpan()
  const sides = closingSideCounts()
  return `${closings.length} closed Tennessee sales in Joshua Fink's MLS record, ${formatCloseMonthYear(span.earliest)} through ${formatCloseMonthYear(span.latest)}. ${sides['Represented buyer']} Represented buyer and ${sides['Listed and sold']} Listed and sold, grouped by city.`
}

export function closingCountLabel(count: number): string {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error(`refusing to round closing count ${count}`)
  }
  return count === 1 ? '1 closing' : `${formatGroupedInteger(count)} closings`
}

/**
 * Show one city when its section is the URL hash. No client JavaScript.
 * Anchors are limited to the slug alphabet before they enter a selector.
 */
export function soldFilterCss(anchors: readonly string[]): string {
  const rules = [
    '.sold-page:has(.city-section:target) .city-section:not(:target){display:none}',
    '.sold-page[data-city]:not([data-city="all"]) .city-section{display:none}',
    '.sold-page:not(:has(.city-section:target)):not([data-city]) a[href="#all"]{background:#000;color:#fff;border-color:#000}',
    '.sold-page[data-city="all"] a[href="#all"]{background:#000;color:#fff;border-color:#000}',
  ]
  for (const anchor of anchors) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(anchor)) {
      throw new Error(`refusing city anchor ${anchor}`)
    }
    rules.push(
      `.sold-page[data-city="${anchor}"] #${anchor}{display:block}`,
      `.sold-page:has(#${anchor}:target) a[href="#${anchor}"],.sold-page[data-city="${anchor}"] a[href="#${anchor}"]{background:#000;color:#fff;border-color:#000}`,
    )
  }
  return rules.join('\n')
}

export function buildSoldClosingsSchema() {
  const items = closingGroups().flatMap((group) => group.closings)
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': AGENT_ID,
    name: 'Joshua Fink',
    url: 'https://www.joshuafink.com',
    subjectOf: {
      '@type': 'ItemList',
      '@id': `${SOLD_CANONICAL}#closings`,
      name: 'Recent closings',
      numberOfItems: items.length,
      itemListElement: items.map((row, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Offer',
          name: `${row.address}, ${row.city}, ${row.state}`,
          price: row.soldPrice,
          priceCurrency: 'USD',
          availability: 'https://schema.org/SoldOut',
          description: `Closed ${formatCloseMonthYear(row.closeDate)}. ${row.side}.`,
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'Close date',
            value: row.closeDate,
          },
          itemOffered: {
            '@type': 'SingleFamilyResidence',
            name: row.address,
            address: {
              '@type': 'PostalAddress',
              streetAddress: row.address,
              addressLocality: row.city,
              addressRegion: row.state,
              postalCode: row.zip,
              addressCountry: 'US',
            },
            numberOfRooms: row.beds,
            numberOfBathroomsTotal: row.baths,
            floorSize: {
              '@type': 'QuantitativeValue',
              value: row.sqft,
              unitCode: 'FTK',
            },
          },
        },
      })),
    },
  }
}
