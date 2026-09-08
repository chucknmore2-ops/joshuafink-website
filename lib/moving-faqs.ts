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
    `La Vergne and Columbia sit in the high $300Ks (${cityMedian('la-vergne-tn')} and ${cityMedian('columbia-tn')}); ` +
    `Smyrna, Lebanon, Murfreesboro, and Gallatin in the low-to-mid $400Ks (${cityMedian('smyrna-tn')}–${cityMedian('gallatin-tn')}); ` +
    `Hendersonville around ${cityMedian('hendersonville-tn')}. ` +
    `The Williamson County core is higher — Spring Hill around ${cityMedian('spring-hill-tn')}, ` +
    `Franklin around ${cityMedian('franklin-tn')}, ` +
    `Nolensville around ${cityMedian('nolensville-tn')}, ` +
    `and Brentwood around ${cityMedian('brentwood-tn')}. ` +
    `For nine-county ${gnarMonth} ${gnarSource} context, see ${gnarUrl}. ` +
    `Joshua can pull exact, current comps for any specific area.`
  )
}
