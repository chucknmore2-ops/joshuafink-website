/**
 * Monthly Middle Tennessee market snapshot — one month of numbers, read by
 * every channel that publishes them.
 *
 * The monthly blog post (lib/blog.ts), the Facebook post (Railway autoposter,
 * copy from /api/market-update/facebook), the LinkedIn post
 * (/api/cron/linkedin-post?kind=market) and the Google Business post
 * (/api/cron/gbp-post?kind=market) all read this file, so the site and every
 * social channel quote the same figures and can't drift apart. Nothing here
 * is derived or estimated — every number is typed in from a named published
 * report.
 *
 * ── HOW A MONTH GETS PUBLISHED ─────────────────────────────────────────────
 *
 * scripts/fetch-gnar.ts reads last month's `marketMonthlyStats` from GNAR's
 * public Sanity dataset, checks every field, and (when the matching press
 * release exists) copies months of supply and the days-metric wording from
 * that release. .github/workflows/fetch-gnar-snapshot.yml runs it daily on
 * the 3rd–12th. A validated new month is committed and auto-merged to main.
 * lib/blog.ts renders the post from that entry. The monthly social workflow
 * then posts LinkedIn and Google Business once production is serving the
 * same figures. The Railway autoposter posts Facebook on its next tick from
 * that deployed snapshot.
 *
 * Nothing here is estimated. A failed check writes nothing. If the month is
 * still missing on the 10th, that workflow sends a Pushover alert.
 *
 * Hand entry still works: add one object at the top of `marketSnapshots`
 * from the template below and commit. If the month is already present, the
 * fetcher leaves the file alone.
 */

export type DaysMetric = 'days-on-market' | 'list-to-contract'

export interface MarketSnapshot {
  /** Calendar month the report covers, ISO `YYYY-MM` (e.g. "2026-07"). */
  month: string
  /** Median single-family sale price, formatted for display ("$537,000"). */
  medianSalePrice: string
  /** The same figure as a number, for schema + math. */
  medianSalePriceNum: number
  /** Year-over-year change in the median, signed ("+2.1%" / "-1.4%").
   *  Omit when GNAR does not publish YoY in that month's chart or release. */
  medianYoyChange?: string
  /**
   * Days figure from the monthly chart (`daysOnMarket`). GNAR's August 2026
   * release calls this "list to contract"; older releases call it days on
   * the market. See `daysMetric`.
   */
  avgDaysOnMarket: number
  /**
   * Label GNAR used for `avgDaysOnMarket` in that month's release.
   * Omit when no release named it — display falls back to days on market.
   */
  daysMetric?: DaysMetric
  /** Closed sales during the month. */
  closedSales: number
  /** Active listings at month end. */
  activeListings: number
  /** Months of supply. Omit when GNAR does not publish the figure. */
  monthsOfInventory?: number
  /** Condo median sale price, when GNAR publishes one on the monthly chart. */
  condoMedianPrice?: string
  condoMedianPriceNum?: number
  /** Pending sales at month end, when GNAR publishes the figure. */
  pendingSales?: number
  /** Report the figures came from — cited verbatim on every channel. */
  source: string
  /** Stable URL for the report, when it has one. */
  sourceUrl?: string
  /**
   * ISO date (YYYY-MM-DD) stamped on the blog post, in America/Chicago.
   * The generator will not use a press-release dateline that is still in
   * the future on the day the snapshot is written.
   */
  reportDate: string
  /**
   * 2-4 plain-language lines. The fetcher fills these from the validated
   * figures only — no claim that is not a number in the stats or the release.
   */
  takeaways: string[]
}

/**
 * Newest month first. Add one object per month; keep the old ones — each is a
 * published blog post URL and deleting an entry would 404 it.
 *
 * TEMPLATE — copy, fill in from the report, and drop at the top:
 *
 *   {
 *     month: '2026-07',
 *     medianSalePrice: '$537,000',
 *     medianSalePriceNum: 537000,
 *     medianYoyChange: '+1.8%',
 *     avgDaysOnMarket: 51,
 *     closedSales: 3459,
 *     activeListings: 15617,
 *     monthsOfInventory: 6.0,
 *     source: 'Greater Nashville REALTORS®',
 *     sourceUrl: 'https://www.greaternashvillerealtors.org/market-statistics',
 *     reportDate: '2026-08-05',
 *     takeaways: [
 *       'Inventory keeps building, so buyers have real choice for the first time since 2021.',
 *       'Correctly priced homes in strong school zones still move in the first two weeks.',
 *     ],
 *   },
 *
 * Deliberately empty until a real report is entered — publishing invented
 * numbers under Joshua's name is worse than publishing nothing.
 */
export const marketSnapshots: MarketSnapshot[] = [
  {
    month: '2026-09',
    medianSalePrice: '$510,000',
    medianSalePriceNum: 510000,
    medianYoyChange: '+4.1%', // $510,000 vs September 2025 $490,000
    avgDaysOnMarket: 57,
    daysMetric: 'list-to-contract', // release: average list-to-contract time
    closedSales: 2885, // 2284 residential + 452 condominium + 20 multi-family + 129 farms, land, and lots
    activeListings: 15536, // 10462 residential + 2788 condominium + 143 multi-family + 2143 farms, land, and lots
    monthsOfInventory: 5.7, // release: "5.7 months of available inventory"
    condoMedianPrice: '$331,780',
    condoMedianPriceNum: 331780,
    pendingSales: 2045,
    source: 'Greater Nashville REALTORS®',
    sourceUrl: 'https://www.greaternashvillerealtors.org/news/september-homes-sales-continued-to-show-mixed-results-across-counties-and-price-points',
    reportDate: '2026-10-05', // Chicago day this post published; GNAR datelined it 2026-10-07
    takeaways: [
      'September 2026 closed 2,885 nine-county sales: 2,284 residential, 452 condominium, 20 multi-family, and 129 farms, land, and lots.',
      'The residential median was $510,000, +4.1% from $490,000 in September 2025.',
      'The condominium median was $331,780, compared with $329,250 in September 2025.',
      'Active inventory was 15,536, with 2,045 pending sales. Average list-to-contract time was 57 days. The release reported 5.7 months of available inventory.',
    ],
  },
  {
    month: '2026-08',
    medianSalePrice: '$515,725',
    medianSalePriceNum: 515725,
    medianYoyChange: '+2.1%', // $515,725 vs August 2025 $505,000
    avgDaysOnMarket: 55,
    daysMetric: 'list-to-contract', // release: average list-to-contract time
    closedSales: 2928, // 2306 residential + 438 condominium + 16 multi-family + 168 farms, land, and lots
    activeListings: 15637, // 10532 residential + 2813 condominium + 150 multi-family + 2142 farms, land, and lots
    monthsOfInventory: 5.8, // release: "5.8 months of available inventory"
    condoMedianPrice: '$339,995',
    condoMedianPriceNum: 339995,
    pendingSales: 2409,
    source: 'Greater Nashville REALTORS®',
    sourceUrl: 'https://www.greaternashvillerealtors.org/news/august-housing-market-shows-strength-in-wilson-county-as-downtown-condo-sales-slow',
    reportDate: '2026-09-08',
    takeaways: [
      'August 2026 closed 2,928 nine-county sales: 2,306 residential, 438 condominium, 16 multi-family, and 168 farms, land, and lots.',
      'The residential median was $515,725, +2.1% from $505,000 in August 2025.',
      'The condominium median was $339,995, compared with $353,450 in August 2025.',
      'Active inventory was 15,637, with 2,409 pending sales. Average list-to-contract time was 55 days. The release reported 5.8 months of available inventory.',
    ],
  },
  {
    month: '2026-07',
    medianSalePrice: '$520,000',
    medianSalePriceNum: 520000,
    medianYoyChange: '-0.9%', // from GNAR's stated July 2026 residential median $520,000 vs July 2025 $524,700 in the same release
    avgDaysOnMarket: 54,
    closedSales: 3269, // total closings
    activeListings: 15636, // total inventory
    monthsOfInventory: 6, // stated by GNAR: "Currently, there are 6 months of available inventory"
    source: 'Greater Nashville REALTORS®',
    sourceUrl:
      'https://www.greaternashvillerealtors.org/news/market-conditions-diverge-across-price-points-in-july-housing-report',
    reportDate: '2026-08-07',
    takeaways: [
      "Inventory sits at six months of supply — a balanced market, not the frantic seller's market of a few years ago.",
      'The regional median eased to $520,000 from $524,700 a year earlier, while homes priced above $800,000 still saw closings up 8% year over year.',
      'Average days on market for a single-family home was 54. Correctly priced homes still move; overpriced ones sit.',
      'First-time buyers remain under pressure — condo closings fell 17% year over year as affordability stays tight at the entry level.',
    ],
  },
]

/** "2026-07" → "July 2026". UTC-anchored so the label can't drift a month. */
export function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number)
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Blog slug for a month's market update. Stable — used as the post URL. */
export function marketUpdateSlug(month: string): string {
  return `middle-tennessee-market-update-${monthLabel(month)
    .toLowerCase()
    .replace(/\s+/g, '-')}`
}

/** Whole calendar months between the covered month and `now`. */
function monthsBehind(month: string, now: Date): number {
  const [year, m] = month.split('-').map(Number)
  return (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - m)
}

/**
 * A month's report is published in the following month, so the newest snapshot
 * is expected to be at most one month behind. Anything older means the numbers
 * were never entered — the channels skip rather than post stale figures.
 */
export const MAX_MONTHS_BEHIND = 1

/** Newest entered snapshot, regardless of age. */
export function latestSnapshot(): MarketSnapshot | null {
  return marketSnapshots[0] ?? null
}

/**
 * The snapshot that's current enough to publish, or null when this month's
 * numbers haven't been entered yet. Every posting route gates on this.
 */
export function currentSnapshot(now: Date = new Date()): MarketSnapshot | null {
  const s = latestSnapshot()
  if (!s) return null
  return monthsBehind(s.month, now) <= MAX_MONTHS_BEHIND ? s : null
}

/** Why `currentSnapshot()` returned null — for logs and skip messages. */
export function snapshotSkipReason(now: Date = new Date()): string {
  const s = latestSnapshot()
  if (!s) {
    return 'no market snapshot entered yet — add this month to lib/market-snapshot.ts'
  }
  return (
    `latest market snapshot is ${s.month} (${monthsBehind(s.month, now)} months ` +
    `behind, max ${MAX_MONTHS_BEHIND}) — add this month to lib/market-snapshot.ts`
  )
}

const n = (v: number) => v.toLocaleString('en-US')

/** Display line for the residential median — YoY only when GNAR published it. */
export function snapshotMedianLine(s: MarketSnapshot): string {
  return s.medianYoyChange
    ? `${s.medianSalePrice} (${s.medianYoyChange} year over year)`
    : s.medianSalePrice
}

/** Label and value for the days figure, using GNAR's wording for that month. */
export function snapshotDaysStat(s: MarketSnapshot): { label: string; value: string } {
  if (s.daysMetric === 'list-to-contract') {
    return { label: 'List to contract', value: `${s.avgDaysOnMarket} days` }
  }
  return { label: 'Average days on market', value: String(s.avgDaysOnMarket) }
}

/**
 * Sourced stat lines for social copy and glance lists. Skips YoY and months
 * of supply unless they were copied from a named GNAR figure.
 */
export function snapshotStatLines(s: MarketSnapshot): string[] {
  const days = snapshotDaysStat(s)
  const lines = [
    `Median sale price: ${snapshotMedianLine(s)}`,
    `${days.label}: ${days.value}`,
    `Closed sales: ${n(s.closedSales)}`,
    `Active listings: ${n(s.activeListings)}`,
  ]
  if (s.pendingSales != null) lines.push(`Pending sales: ${n(s.pendingSales)}`)
  if (s.condoMedianPrice) lines.push(`Condo median: ${s.condoMedianPrice}`)
  if (s.monthsOfInventory != null) {
    lines.push(`Months of supply: ${s.monthsOfInventory}`)
  }
  return lines
}

export interface SnapshotExpect {
  expectMonth?: string | null
  expectMedian?: string | null
  expectClosings?: string | null
  /** `none` means the snapshot must omit months of supply. */
  expectSupply?: string | null
  /** `none` means the snapshot must omit YoY. */
  expectYoy?: string | null
}

/**
 * True when production is serving the snapshot a social run is about to post.
 * No expectations means "whatever is current". A mismatch means the new
 * commit is not deployed yet — the caller retries instead of posting the
 * previous month.
 */
export function snapshotExpectFromSearchParams(
  params: { get(name: string): string | null },
): SnapshotExpect {
  return {
    expectMonth: params.get('expectMonth'),
    expectMedian: params.get('expectMedian'),
    expectClosings: params.get('expectClosings'),
    expectSupply: params.get('expectSupply'),
    expectYoy: params.get('expectYoy'),
  }
}

export function snapshotMatchesExpect(
  s: MarketSnapshot | null,
  expect: SnapshotExpect,
): boolean {
  if (!expect.expectMonth) return true
  if (!s || s.month !== expect.expectMonth) return false
  if (expect.expectMedian && String(s.medianSalePriceNum) !== expect.expectMedian) {
    return false
  }
  if (expect.expectClosings && String(s.closedSales) !== expect.expectClosings) {
    return false
  }
  if (expect.expectSupply) {
    if (expect.expectSupply === 'none') {
      if (s.monthsOfInventory != null) return false
    } else {
      const want = Number(expect.expectSupply)
      if (
        s.monthsOfInventory == null ||
        !Number.isFinite(want) ||
        Math.abs(s.monthsOfInventory - want) > 0.001
      ) {
        return false
      }
    }
  }
  if (expect.expectYoy) {
    const got = s.medianYoyChange ?? 'none'
    if (got !== expect.expectYoy) return false
  }
  return true
}

/** Six-month convention — only when GNAR published months of supply. */
export function marketReadFromSupply(
  months: number | undefined,
): string | null {
  if (months == null) return null
  if (months >= 6) return 'a balanced market'
  if (months >= 4) return 'a market tilting from sellers toward balanced'
  return "still a seller's market"
}

/**
 * Buy-page slugs that show the nine-county GNAR block under the Redfin
 * city snapshot. Same figures and citations on every city — only the
 * city name in the heading/disclosure changes.
 */
export const gnarRegionalBuySlugs = ['franklin-tn', 'nolensville-tn'] as const

export function showsGnarRegionalSnapshot(slug: string): boolean {
  return (gnarRegionalBuySlugs as readonly string[]).includes(slug)
}
