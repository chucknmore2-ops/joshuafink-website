/**
 * Quotable "By the numbers" block for the pages AI answer engines keep
 * losing to dated third-party roundups.
 *
 * Every figure is read from lib/suburbs.ts (Redfin city medians) or
 * lib/market-snapshot.ts (Greater Nashville REALTORS® nine-county monthly
 * report). Nothing here is estimated. A missing field is omitted.
 *
 * The heading month is the month the latest GNAR snapshot was published
 * (`reportDate`), so the block rolls when the next snapshot is checked in.
 * Each line still names the month that source covers.
 */

import {
  latestSnapshot,
  monthLabel,
  snapshotDaysStat,
  type MarketSnapshot,
} from '@/lib/market-snapshot'
import {
  formatStatsDate,
  getSuburb,
  marketStatsLastUpdated,
  marketStatsSource,
  suburbStatsAsOf,
  yoyMovement,
  type Suburb,
} from '@/lib/suburbs'

/** Public download hub already recorded on the Redfin figures in lib/suburbs.ts. */
export const REDFIN_DATA_CENTER_URL = 'https://www.redfin.com/news/data-center/'

const GNAR_FALLBACK_URL = 'https://www.greaternashvillerealtors.org/monthly-home-sales-report'

const SITE = 'https://www.joshuafink.com'

export type ByTheNumbersId =
  | 'cash-offer-nashville-tn'
  | 'buy-franklin-tn'
  | 'buy-brentwood-tn'
  | 'buy-nolensville-tn'
  | 'moving-to-middle-tennessee'

export interface QuotedStat {
  id: string
  label: string
  value: string
  /** Sentence before the parenthetical citation. No trailing period. */
  claim: string
  /** Full quotable line, including source and as-of month. */
  sentence: string
  source: string
  sourceUrl: string
  /** "October 2026" */
  asOfMonth: string
  /** YYYY-MM the source covers. */
  asOfIsoMonth: string
  /** YYYY-MM-DD already stored for that source. */
  asOfDate: string
  unitText?: string
}

export interface AnswerStatement {
  q: string
  /** Exactly one sentence. Process facts already published on the site. */
  a: string
}

export interface ByTheNumbersSection {
  id: ByTheNumbersId
  /** "By the numbers: November 2026" */
  heading: string
  editionLabel: string
  /** ISO day the edition was published (GNAR reportDate, or the Redfin as-of day). */
  editionDate: string
  pageUrl: string
  placeName: string
  intro: string
  stats: QuotedStat[]
  answers: AnswerStatement[]
}

/** "2026-11-05" or "2026-11" → "November 2026". */
export function isoMonthLabel(iso: string): string {
  return monthLabel(iso.slice(0, 7))
}

function cite(source: string, asOfMonth: string): string {
  return `(Source: ${source}, as of ${asOfMonth}).`
}

function quotedStat(
  partial: Omit<QuotedStat, 'sentence'> & { claim: string },
): QuotedStat {
  return {
    ...partial,
    sentence: `${partial.claim} ${cite(partial.source, partial.asOfMonth)}`,
  }
}

function redfinTiming(suburb: Suburb): { asOfMonth: string; asOfIsoMonth: string; asOfDate: string } {
  const asOfDate = suburbStatsAsOf(suburb)
  const asOfIsoMonth = asOfDate.slice(0, 7)
  return { asOfMonth: isoMonthLabel(asOfDate), asOfIsoMonth, asOfDate }
}

/** Citywide Redfin lines. Skips a field only if that suburb record is missing it. */
export function quotedCityStats(slug: string): QuotedStat[] {
  const suburb = getSuburb(slug)
  if (!suburb || !marketStatsSource) return []

  const timing = redfinTiming(suburb)
  const place = `${suburb.name} citywide`
  const base = {
    source: marketStatsSource,
    sourceUrl: REDFIN_DATA_CENTER_URL,
    ...timing,
  }
  const stats: QuotedStat[] = [
    quotedStat({
      ...base,
      id: `${slug}-median`,
      label: `${place} median sale price`,
      value: suburb.medianPrice,
      unitText: 'USD',
      claim: `The ${place} median sale price is ${suburb.medianPrice}`,
    }),
    quotedStat({
      ...base,
      id: `${slug}-dom`,
      label: `${place} median days on market`,
      value: String(suburb.avgDaysOnMarket),
      unitText: 'days',
      claim: `The ${place} median days on market is ${suburb.avgDaysOnMarket}`,
    }),
  ]

  if (Number.isFinite(suburb.pricePerSqft)) {
    const perSqft = `$${suburb.pricePerSqft}`
    stats.push(
      quotedStat({
        ...base,
        id: `${slug}-ppsf`,
        label: `${place} median price per square foot`,
        value: perSqft,
        unitText: 'USD per square foot',
        claim: `The ${place} median price per square foot is ${perSqft}`,
      }),
    )
  }

  if (suburb.yoyChange) {
    stats.push(
      quotedStat({
        ...base,
        id: `${slug}-yoy`,
        label: `${place} year-over-year median price change`,
        value: suburb.yoyChange,
        unitText: 'percent',
        claim: `The ${place} year-over-year median sale price change is ${suburb.yoyChange}`,
      }),
    )
  }

  return stats
}

/**
 * Nine-county GNAR lines. Months of supply and year-over-year are included
 * only when that month's snapshot recorded them.
 */
export function quotedGnarStats(snapshot: MarketSnapshot | null): QuotedStat[] {
  if (!snapshot) return []

  const asOfIsoMonth = snapshot.month
  const asOfMonth = monthLabel(snapshot.month)
  const asOfDate = snapshot.reportDate
  const sourceUrl = snapshot.sourceUrl ?? GNAR_FALLBACK_URL
  const base = {
    source: snapshot.source,
    sourceUrl,
    asOfMonth,
    asOfIsoMonth,
    asOfDate,
  }
  const notCity = 'which is not a single-city figure'
  const medianClaim = snapshot.medianYoyChange
    ? `The nine-county Middle Tennessee residential median sale price was ${snapshot.medianSalePrice}, ${yoyMovement(snapshot.medianYoyChange)} year over year, ${notCity}`
    : `The nine-county Middle Tennessee residential median sale price was ${snapshot.medianSalePrice}, ${notCity}`
  const days = snapshotDaysStat(snapshot)
  const stats: QuotedStat[] = [
    quotedStat({
      ...base,
      id: `gnar-${snapshot.month}-median`,
      label: 'Nine-county residential median sale price',
      value: snapshot.medianYoyChange
        ? `${snapshot.medianSalePrice} (${snapshot.medianYoyChange} year over year)`
        : snapshot.medianSalePrice,
      unitText: 'USD',
      claim: medianClaim,
    }),
    quotedStat({
      ...base,
      id: `gnar-${snapshot.month}-days`,
      label: `Nine-county ${days.label.toLowerCase()}`,
      value: days.value,
      unitText: 'days',
      claim: `The nine-county Middle Tennessee ${days.label.toLowerCase()} was ${days.value}, ${notCity}`,
    }),
    quotedStat({
      ...base,
      id: `gnar-${snapshot.month}-closings`,
      label: 'Nine-county closed sales',
      value: snapshot.closedSales.toLocaleString('en-US'),
      unitText: 'count',
      claim: `Nine-county Middle Tennessee closed sales were ${snapshot.closedSales.toLocaleString('en-US')}, ${notCity}`,
    }),
  ]

  if (snapshot.monthsOfInventory != null) {
    stats.push(
      quotedStat({
        ...base,
        id: `gnar-${snapshot.month}-supply`,
        label: 'Nine-county months of supply',
        value: String(snapshot.monthsOfInventory),
        unitText: 'months',
        claim: `Nine-county Middle Tennessee months of supply were ${snapshot.monthsOfInventory}, ${notCity}`,
      }),
    )
  }

  return stats
}

function edition(snapshot: MarketSnapshot | null): { label: string; date: string } {
  if (snapshot?.reportDate) {
    return { label: isoMonthLabel(snapshot.reportDate), date: snapshot.reportDate }
  }
  return { label: isoMonthLabel(marketStatsLastUpdated), date: marketStatsLastUpdated }
}

function editionIntro(snapshot: MarketSnapshot | null, editionLabel: string, editionDate: string): string {
  if (!snapshot) {
    return 'Each line names the source and the month that source covers.'
  }
  return (
    `The heading month is ${editionLabel} because that is when the latest ${snapshot.source} snapshot on this site was published (${formatStatsDate(editionDate)}). ` +
    'Each line names the source and the month that source covers.'
  )
}

const CITY_SCOPE =
  'These are citywide figures, not a street, subdivision, or school-zone price.'

const NINE_COUNTY_SCOPE =
  'Greater Nashville REALTORS® nine-county totals cover Davidson, Cheatham, Dickson, Maury, Robertson, Rutherford, Sumner, Williamson, and Wilson. They are not a single-city price. City lines below are citywide Redfin medians.'

/**
 * One-sentence process answers. Wording is limited to facts already published
 * on the matching page or the shared Compass bio (license, volume, phone).
 */
const ANSWERS: Record<ByTheNumbersId, AnswerStatement[]> = {
  'cash-offer-nashville-tn': [
    {
      q: 'How fast do cash home sales close in Nashville?',
      a: 'Joshua Fink can close a Nashville cash sale in as little as 7 days, and you get a no-obligation cash offer within 24 hours.',
    },
    {
      q: 'Does Joshua Fink charge a commission on a Nashville cash offer?',
      a: 'Joshua Fink charges no commission on a Nashville cash purchase and buys the house as-is.',
    },
    {
      q: 'Who buys houses for cash in Nashville?',
      a: 'Joshua Fink, a licensed Tennessee Affiliate Broker (TREC #351484) with Compass Real Estate, licensed since 2008, sells 40+ homes a year in Middle Tennessee, buys Nashville houses for cash, and you can call or text him at 615-551-2727.',
    },
  ],
  'buy-franklin-tn': [
    {
      q: 'How fast does a Franklin home purchase close?',
      a: 'Closing itself typically takes 30–45 days after contract.',
    },
    {
      q: 'How long is a typical Franklin home search?',
      a: 'From active search to closing, most Franklin buyers are in their new home within 60–90 days.',
    },
    {
      q: 'What should a Franklin buyer have before touring?',
      a: "Joshua Fink's Franklin guidance is to get pre-approved before you tour.",
    },
  ],
  'buy-brentwood-tn': [
    {
      q: 'How should I prepare to buy a home in Brentwood?',
      a: 'Serious Brentwood buyers need a pre-approval or proof of funds in hand.',
    },
    {
      q: 'Can I see Brentwood homes before they hit the public market?',
      a: "Joshua Fink's Compass network gives Brentwood buyers access to off-market listings that never reach public portals.",
    },
    {
      q: 'Who should I call to buy a home in Brentwood?',
      a: 'Call or text Joshua Fink at 615-551-2727; he is a Compass Affiliate Broker (TREC #351484), licensed since 2008, who sells 40+ homes a year in Middle Tennessee, including Brentwood.',
    },
  ],
  'buy-nolensville-tn': [
    {
      q: 'How should I prepare to buy a home in Nolensville?',
      a: 'Nolensville buyers need to be pre-approved and ready to move when the right listing hits.',
    },
    {
      q: 'Does Joshua Fink price a Nolensville home off the citywide median alone?',
      a: 'Joshua Fink prices the specific Nolensville street and subdivision, not only the citywide median.',
    },
    {
      q: 'Who should I call to buy a home in Nolensville?',
      a: 'Call or text Joshua Fink at 615-551-2727; he is a Compass Affiliate Broker (TREC #351484), licensed since 2008, who sells 40+ homes a year in Middle Tennessee, including Nolensville.',
    },
  ],
  'moving-to-middle-tennessee': [
    {
      q: 'How does a remote Middle Tennessee home search work with Joshua Fink?',
      a: 'Joshua Fink runs remote searches, video walkthroughs, school-zone verification, and coordinated closings so you can buy before or shortly after you arrive.',
    },
    {
      q: 'How do I reach Joshua Fink about moving to Middle Tennessee?',
      a: 'Call Joshua Fink at 615-551-2727 to start a relocation plan.',
    },
    {
      q: 'Who is licensed to help with a Middle Tennessee relocation on this page?',
      a: 'Joshua Fink is an Affiliate Broker with Compass Real Estate (TREC #351484), licensed since 2008, with 40+ homes sold a year in Middle Tennessee.',
    },
  ],
}

const PAGES: Record<
  ByTheNumbersId,
  { pageUrl: string; placeName: string; citySlug?: string; includeGnar: boolean; scope: string }
> = {
  'cash-offer-nashville-tn': {
    pageUrl: `${SITE}/cash-offer/nashville-tn`,
    placeName: 'Nashville, TN',
    citySlug: 'nashville-tn',
    includeGnar: false,
    scope: CITY_SCOPE,
  },
  'buy-franklin-tn': {
    pageUrl: `${SITE}/buy/franklin-tn`,
    placeName: 'Franklin, TN',
    citySlug: 'franklin-tn',
    includeGnar: false,
    scope: CITY_SCOPE,
  },
  'buy-brentwood-tn': {
    pageUrl: `${SITE}/buy/brentwood-tn`,
    placeName: 'Brentwood, TN',
    citySlug: 'brentwood-tn',
    includeGnar: false,
    scope: CITY_SCOPE,
  },
  'buy-nolensville-tn': {
    pageUrl: `${SITE}/buy/nolensville-tn`,
    placeName: 'Nolensville, TN',
    citySlug: 'nolensville-tn',
    includeGnar: false,
    scope: CITY_SCOPE,
  },
  'moving-to-middle-tennessee': {
    pageUrl: `${SITE}/moving-to-middle-tennessee`,
    placeName: 'Middle Tennessee',
    includeGnar: true,
    scope: NINE_COUNTY_SCOPE,
  },
}

const MOVING_CITY_MEDIANS = ['nashville-tn', 'franklin-tn', 'brentwood-tn', 'nolensville-tn'] as const

export function getByTheNumbers(id: ByTheNumbersId): ByTheNumbersSection {
  const page = PAGES[id]
  const snapshot = latestSnapshot()
  const { label, date } = edition(snapshot)
  const cityStats = page.citySlug ? quotedCityStats(page.citySlug) : []
  const movingMedians = page.includeGnar
    ? MOVING_CITY_MEDIANS.flatMap((slug) => quotedCityStats(slug).filter((stat) => stat.id.endsWith('-median')))
    : []
  const gnarStats = page.includeGnar ? quotedGnarStats(snapshot) : []

  return {
    id,
    heading: `By the numbers: ${label}`,
    editionLabel: label,
    editionDate: date,
    pageUrl: page.pageUrl,
    placeName: page.placeName,
    intro: `${editionIntro(snapshot, label, date)} ${page.scope}`,
    stats: [...gnarStats, ...cityStats, ...movingMedians],
    answers: ANSWERS[id],
  }
}

export function byTheNumbersForBuySlug(slug: string): ByTheNumbersSection | null {
  if (slug === 'franklin-tn' || slug === 'brentwood-tn' || slug === 'nolensville-tn') {
    return getByTheNumbers(`buy-${slug}`)
  }
  return null
}

export function byTheNumbersDataset(section: ByTheNumbersSection) {
  const sources = Array.from(
    new Map(section.stats.map((stat) => [stat.sourceUrl, stat.source])).entries(),
  )
  const months = Array.from(new Set(section.stats.map((stat) => stat.asOfIsoMonth))).sort()
  const temporalCoverage = months.length <= 1 ? months[0] : `${months[0]}/${months[months.length - 1]}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: section.heading,
    description: section.intro,
    url: `${section.pageUrl}#by-the-numbers`,
    dateModified: section.editionDate,
    ...(temporalCoverage ? { temporalCoverage } : {}),
    spatialCoverage: {
      '@type': 'Place',
      name: section.placeName,
    },
    creator: {
      '@type': 'RealEstateAgent',
      name: 'Joshua Fink',
      url: SITE,
      telephone: '+16155512727',
      worksFor: { '@type': 'Organization', name: 'Compass Real Estate' },
    },
    isBasedOn: sources.map(([url, name]) => ({
      '@type': 'CreativeWork',
      name,
      url,
    })),
    variableMeasured: section.stats.map((stat) => ({
      '@type': 'PropertyValue',
      name: stat.label,
      value: stat.value,
      ...(stat.unitText ? { unitText: stat.unitText } : {}),
      description: stat.sentence,
      measurementTechnique: stat.source,
      url: stat.sourceUrl,
    })),
  }
}
