/**
 * Monthly Middle Tennessee market snapshot — one month of numbers, read by
 * every channel that publishes them.
 *
 * The monthly blog post (lib/blog.ts), the Facebook post
 * (/api/cron/facebook-post), the LinkedIn post (/api/cron/linkedin-post?kind=market)
 * and the Google Business post (/api/cron/gbp-post?kind=market) all read this
 * file, so the site and every social channel quote the same figures and can't
 * drift apart. Nothing here is derived or estimated — every number is typed in
 * from a named published report.
 *
 * ── HOW TO PUBLISH A MONTH (about two minutes, once a month) ───────────────
 *
 * 1. Open the Greater Nashville REALTORS® monthly report (it lands in the
 *    first few days of the following month).
 * 2. Add ONE new object to the top of `marketSnapshots` below, copying the
 *    template. Every field is a figure straight off the report except
 *    `takeaways`, which is 2-4 plain-language lines in Joshua's voice.
 * 3. Commit. The blog post appears on the site at /blog/<slug> as soon as it
 *    deploys, and .github/workflows/monthly-market-update.yml pushes it to
 *    Facebook, LinkedIn and Google Business on the 5th.
 *
 * If the month's numbers aren't entered, `currentSnapshot()` returns null and
 * every channel posts NOTHING rather than recycling last month's figures.
 * Entering the numbers is the approval gate — no post happens without it.
 */

export interface MarketSnapshot {
  /** Calendar month the report covers, ISO `YYYY-MM` (e.g. "2026-07"). */
  month: string
  /** Median single-family sale price, formatted for display ("$537,000"). */
  medianSalePrice: string
  /** The same figure as a number, for schema + math. */
  medianSalePriceNum: number
  /** Year-over-year change in the median, signed ("+2.1%" / "-1.4%"). */
  medianYoyChange: string
  /** Average days on market for closed sales. */
  avgDaysOnMarket: number
  /** Closed sales during the month. */
  closedSales: number
  /** Active listings at month end. */
  activeListings: number
  /** Months of supply (inventory ÷ monthly sales pace). */
  monthsOfInventory: number
  /** Report the figures came from — cited verbatim on every channel. */
  source: string
  /** Stable URL for the report, when it has one. */
  sourceUrl?: string
  /** ISO date (YYYY-MM-DD) the report was published. */
  reportDate: string
  /** 2-4 plain-language takeaways, written by hand with the numbers. */
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
