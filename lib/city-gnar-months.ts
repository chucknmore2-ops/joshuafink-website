import {
  latestSnapshot,
  marketSnapshots,
  monthLabel,
  type MarketSnapshot,
} from '@/lib/market-snapshot'
import { getSuburb, type Suburb } from '@/lib/suburbs'

/**
 * Cities that get a page for every month in lib/market-snapshot.ts.
 * The figures stay the nine-county GNAR totals. A new snapshot month
 * adds a page for each city on the next build — nothing here is hardcoded
 * to one calendar month.
 */
export const gnarMonthlyCitySlugs = ['franklin-tn', 'brentwood-tn', 'nashville-tn'] as const

export function isGnarMonthlyCity(slug: string): boolean {
  return (gnarMonthlyCitySlugs as readonly string[]).includes(slug)
}

export function cityMonthPath(slug: string, month: string): string {
  return `/market/${slug}/${month}`
}

export function cityMonthParams(): { suburb: string; month: string }[] {
  return gnarMonthlyCitySlugs.flatMap((suburb) =>
    marketSnapshots.map((snapshot) => ({ suburb, month: snapshot.month })),
  )
}

export function cityMonthCitation(snapshot: MarketSnapshot): string {
  return `Source: ${snapshot.source}, ${monthLabel(snapshot.month)}`
}

/** Says the GNAR print is regional, and points at the city's own Redfin median. */
export function cityMonthIntro(cityName: string, snapshot: MarketSnapshot): string {
  const label = monthLabel(snapshot.month)
  return (
    `${label} figures on this page are nine-county totals from ${snapshot.source} ` +
    '(Davidson, Cheatham, Dickson, Maury, Robertson, Rutherford, Sumner, Williamson, and Wilson). ' +
    `They are not the ${cityName} city median. The ${cityName} citywide median is the Redfin figure on the city market report.`
  )
}

export function cityMonthFaq(cityName: string, snapshot: MarketSnapshot): { q: string; a: string } {
  const label = monthLabel(snapshot.month)
  const yoy = snapshot.medianYoyChange ? ` (${snapshot.medianYoyChange} year over year)` : ''
  return {
    q: `Is the ${label} median of ${snapshot.medianSalePrice} the ${cityName} median?`,
    a:
      `No. ${snapshot.medianSalePrice}${yoy} is the nine-county residential median from ` +
      `${snapshot.source} for ${label}. It is not the ${cityName} city median. ` +
      `Use the ${cityName} market report for the Redfin citywide median, then price the specific street.`,
  }
}

export interface CityMonthPage {
  suburb: Suburb
  snapshot: MarketSnapshot
}

export function getCityMonthPage(slug: string, month: string): CityMonthPage | null {
  if (!isGnarMonthlyCity(slug)) return null
  if (!/^\d{4}-\d{2}$/.test(month)) return null
  const suburb = getSuburb(slug)
  const snapshot = marketSnapshots.find((row) => row.month === month)
  if (!suburb || !snapshot) return null
  return { suburb, snapshot }
}

/** Newest snapshot, for the city report's current-month block. Null when none is entered. */
export function currentCityGnarSnapshot(): MarketSnapshot | null {
  return latestSnapshot()
}
