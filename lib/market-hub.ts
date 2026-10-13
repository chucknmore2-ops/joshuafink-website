import {
  formatStatsDate,
  marketStatsLastUpdated,
  marketStatsSource,
  suburbs,
  yoyValue,
  type Suburb,
} from './suburbs.ts'

function nameList(items: Suburb[]): string {
  const names = items.map((s) => s.name)
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

/** FAQ copy for /market. Figures come from the same Redfin constants as the city pages. */
export function marketHubFaqs(): { q: string; a: string }[] {
  const asOf = formatStatsDate(marketStatsLastUpdated)
  const cities = Object.values(suburbs)
  const up = nameList(cities.filter((s) => yoyValue(s.yoyChange) > 0))
  const down = nameList(cities.filter((s) => yoyValue(s.yoyChange) < 0))

  return [
    {
      q: 'How often are these Middle Tennessee market reports updated?',
      a: `The headline numbers — median sale price, median days on market, price per square foot, and year-over-year change — are ${marketStatsSource} city medians, last reviewed ${asOf}. They cover a rolling three-month window, not a live MLS feed, and they are refreshed when a newer ${marketStatsSource} city file is published.`,
    },
    {
      q: 'Where does the market data come from?',
      a: `Source: ${marketStatsSource}, as of ${asOf}. The figures are city-level medians: median sale price, median days on market, sale-price change, and median price per square foot, from the ${marketStatsSource} Data Center public city file. They are not an automated valuation of one address.`,
    },
    {
      q: 'Is the Middle Tennessee housing market up or down right now?',
      a: `It depends on the city. As of ${asOf} (${marketStatsSource}), prices are up year over year in ${up}, and down in ${down}. Open a city report for that market's median sale price and median days on market.`,
    },
    {
      q: 'What does "days on market" mean on these reports?',
      a: `It is the median days on market from ${marketStatsSource}, as of ${asOf}: the midpoint of how long sold homes took to go under contract, not an average. A lower median means homes are finding buyers faster. Each city page states that suburb's lean from this median and the year-over-year price change.`,
    },
    {
      q: 'Can Joshua send a more detailed report for my specific street or subdivision?',
      a: 'Yes. Hyperlocal reports — narrowed to your subdivision, street, or a specific price band — are free on request. Call or text 615-551-2727 and tell Joshua the address and what decision the report is informing.',
    },
  ]
}
