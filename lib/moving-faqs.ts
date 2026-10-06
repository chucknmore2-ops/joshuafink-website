import {
  suburbs,
  marketStatsLastUpdated,
  marketStatsSource,
  formatStatsDate,
} from '@/lib/suburbs'
import { latestSnapshot, marketUpdateSlug, monthLabel } from '@/lib/market-snapshot'

const SITE_ORIGIN = 'https://www.joshuafink.com'

/** Round a city median the way the relocation FAQ quotes the city cards. */
export function compactMedian(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  return `$${Math.round(n / 1000)}K`
}

export function cityMedian(slug: string): string {
  const suburb = suburbs[slug]
  if (!suburb) throw new Error(`Missing suburb ${slug}`)
  return compactMedian(suburb.medianPriceNum)
}

export function gnarMarketUpdatePath(): string {
  return `/blog/${marketUpdateSlug(latestSnapshot()?.month ?? '2026-08')}`
}

/**
 * “How much do homes cost…” FAQ — numbers come from lib/suburbs.ts (Redfin
 * city medians, same source as the city cards). The GNAR nine-county read is
 * a pointer, not a second set of city prices.
 */
export function homesCostFaqAnswer(): string {
  const redfinAsOf = formatStatsDate(marketStatsLastUpdated)
  const gnar = latestSnapshot()
  const gnarMonth = gnar ? monthLabel(gnar.month) : 'August 2026'
  const gnarSource = gnar?.source ?? 'Greater Nashville REALTORS®'
  const gnarUrl = `${SITE_ORIGIN}${gnarMarketUpdatePath()}`

  return (
    `It varies widely by city. Using the same ${marketStatsSource} city medians shown in the city cards on this page (as of ${redfinAsOf}): ` +
    `Columbia and La Vergne sit in the high $300Ks (${cityMedian('columbia-tn')} and ${cityMedian('la-vergne-tn')}); ` +
    `Smyrna, Lebanon, Murfreesboro, and Gallatin in the low-to-mid $400Ks (${cityMedian('smyrna-tn')}–${cityMedian('gallatin-tn')}); ` +
    `Hendersonville around ${cityMedian('hendersonville-tn')}. ` +
    `Williamson County spans a wide range — Spring Hill around ${cityMedian('spring-hill-tn')}, ` +
    `Franklin around ${cityMedian('franklin-tn')}, ` +
    `Nolensville around ${cityMedian('nolensville-tn')}, ` +
    `and Brentwood around ${cityMedian('brentwood-tn')}. ` +
    `For nine-county ${gnarMonth} ${gnarSource} context, see ${gnarUrl}. ` +
    `Joshua can pull exact, current comps for any specific area.`
  )
}

export const HOUSING_MARKET_FAQ_QUESTION =
  "What's the Middle Tennessee housing market like right now?"

function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

/**
 * “What's the Middle Tennessee housing market like right now?” — figures come
 * only from the newest Greater Nashville REALTORS® entry in
 * lib/market-snapshot.ts. Missing fields are omitted, never estimated.
 */
export function housingMarketFaqAnswer(): string {
  const gnar = latestSnapshot()
  if (!gnar) {
    return (
      'A current Greater Nashville REALTORS® regional snapshot is not on this page yet. ' +
      'Joshua Fink and the Joshua Fink Group at Compass Real Estate can walk through the latest Middle Tennessee numbers for the city you are considering.'
    )
  }

  const label = monthLabel(gnar.month)
  const count = (value: number) => value.toLocaleString('en-US')
  const yoy = gnar.medianYoyChange ? `, ${gnar.medianYoyChange} year over year` : ''
  const daysPhrase =
    gnar.daysMetric === 'list-to-contract'
      ? `a ${gnar.avgDaysOnMarket}-day average list-to-contract time`
      : `an average of ${gnar.avgDaysOnMarket} days on market`
  const detailParts = [
    `${count(gnar.closedSales)} closings`,
    `${count(gnar.activeListings)} active listings`,
  ]
  if (gnar.monthsOfInventory != null) {
    detailParts.push(`${gnar.monthsOfInventory} months of supply`)
  }
  const updateUrl = `${SITE_ORIGIN}${gnarMarketUpdatePath()}`

  return (
    `Right now, per ${gnar.source}, ${label}, the nine-county Middle Tennessee residential median is ${gnar.medianSalePrice}${yoy}. ` +
    `The same report shows ${joinList(detailParts)}, with ${daysPhrase}. ` +
    `Joshua Fink and the Joshua Fink Group at Compass Real Estate work with buyers and sellers across Middle Tennessee and can translate those regional numbers into a plan for a specific city or neighborhood. ` +
    `See the full ${label} write-up at ${updateUrl}.`
  )
}
