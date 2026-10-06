/**
 * Turn Greater Nashville REALTORS® monthly statistics into a MarketSnapshot.
 *
 * Numbers come from GNAR's public Sanity dataset (`marketMonthlyStats`) and,
 * when a matching press release exists, from that release's own sentences.
 * This module does not fetch. It rejects a month rather than filling a gap.
 */

import {
  monthLabel,
  type DaysMetric,
  type MarketSnapshot,
} from '@/lib/market-snapshot'

export const GNAR_SOURCE = 'Greater Nashville REALTORS®'
export const GNAR_CHART_URL =
  'https://www.greaternashvillerealtors.org/monthly-home-sales-report'
export const GNAR_NEWS_ORIGIN = 'https://www.greaternashvillerealtors.org/news'

/** Chicago calendar day on/after which a missing month should page someone. */
export const ALERT_FROM_DAY = 10

/**
 * Through this Chicago calendar day, validated stats wait for the matching
 * press release so months of supply can be copied from it. On the next day
 * the stats publish anyway and months of supply is omitted.
 */
export const WAIT_FOR_RELEASE_THROUGH_DAY = 8

export interface GnarMonthlyStats {
  year: number
  /** Zero-padded "01"–"12". */
  month: string
  residentialClosings: number
  residentialInventory: number
  residentialMedianPrice: number
  condominiumClosings: number
  condominiumInventory: number
  condominiumMedianPrice: number
  multiFamilyClosings: number
  multiFamilyInventory: number
  farmsLandLotsClosings: number
  farmsLandLotsInventory: number
  daysOnMarket: number
  pendings: number
  /** ISO timestamp from Sanity `_updatedAt`, when the fetch had one. */
  updatedAt?: string
  visibleOnSite?: boolean
}

export interface GnarRelease {
  title: string
  slug: string
  /** CMS `publishDate` (`YYYY-MM-DD`), when present. */
  publishDate: string | null
  text: string
}

export interface SnapshotAudit {
  closings: string
  inventory: string
  yoy?: string
  supply?: string
  days?: string
}

export interface BuiltGnarSnapshot {
  snapshot: MarketSnapshot
  audit: SnapshotAudit
}

const COUNT_RANGES = {
  residentialClosings: [200, 8_000],
  residentialInventory: [1_000, 40_000],
  condominiumClosings: [0, 3_000],
  condominiumInventory: [0, 15_000],
  multiFamilyClosings: [0, 500],
  multiFamilyInventory: [0, 5_000],
  farmsLandLotsClosings: [0, 2_000],
  farmsLandLotsInventory: [0, 15_000],
  daysOnMarket: [1, 180],
  pendings: [0, 20_000],
} as const

const PRICE_RANGES = {
  residentialMedianPrice: [100_000, 2_000_000],
  condominiumMedianPrice: [50_000, 1_500_000],
} as const

const MONTH_NUMBERS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
}

export function chicagoCalendar(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: pick('year'), month: pick('month'), day: pick('day') }
}

/** `YYYY-MM-DD` civil date in America/Chicago. */
export function chicagoIsoDate(now: Date): string {
  const { year, month, day } = chicagoCalendar(now)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** The month a run on `now` is trying to publish: the previous Chicago month. */
export function targetMonth(now: Date): string {
  const { year, month } = chicagoCalendar(now)
  const prior = new Date(Date.UTC(year, month - 2, 1))
  const y = prior.getUTCFullYear()
  const m = String(prior.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function isIsoMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

function integerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

/** Field-level rejection reasons. Empty means the record is safe to publish. */
export function validateMonthlyStats(
  stats: GnarMonthlyStats,
  isoMonth: string,
): string[] {
  const errors: string[] = []
  if (!isIsoMonth(isoMonth)) errors.push(`target month ${isoMonth} is not YYYY-MM`)
  const [year, month] = isoMonth.split('-')
  if (stats.year !== Number(year) || stats.month !== month) {
    errors.push(
      `record ${stats.year}-${stats.month} does not match requested ${isoMonth}`,
    )
  }
  for (const [key, [min, max]] of Object.entries(COUNT_RANGES)) {
    const value = stats[key as keyof typeof COUNT_RANGES]
    if (!integerInRange(value, min, max)) {
      errors.push(`${key}=${String(value)} outside ${min}–${max} or not an integer`)
    }
  }
  for (const [key, [min, max]] of Object.entries(PRICE_RANGES)) {
    const value = stats[key as keyof typeof PRICE_RANGES]
    if (!integerInRange(value, min, max)) {
      errors.push(`${key}=${String(value)} outside ${min}–${max} or not an integer`)
    }
  }
  const closings = categoryClosings(stats)
  const inventory = categoryInventory(stats)
  if (closings != null && (closings < 500 || closings > 12_000)) {
    errors.push(`category closings sum ${closings} outside 500–12000`)
  }
  if (inventory != null && (inventory < 2_000 || inventory > 60_000)) {
    errors.push(`category inventory sum ${inventory} outside 2000–60000`)
  }
  return errors
}

export function categoryClosings(stats: GnarMonthlyStats): number | null {
  const parts = [
    stats.residentialClosings,
    stats.condominiumClosings,
    stats.multiFamilyClosings,
    stats.farmsLandLotsClosings,
  ]
  if (parts.some((n) => !Number.isInteger(n))) return null
  return parts.reduce((sum, n) => sum + n, 0)
}

export function categoryInventory(stats: GnarMonthlyStats): number | null {
  const parts = [
    stats.residentialInventory,
    stats.condominiumInventory,
    stats.multiFamilyInventory,
    stats.farmsLandLotsInventory,
  ]
  if (parts.some((n) => !Number.isInteger(n))) return null
  return parts.reduce((sum, n) => sum + n, 0)
}

/**
 * Signed one-decimal percent. Null when the prior median is missing or the
 * change is too large to be a same-series comparison (the caller omits YoY).
 */
export function yoyPercent(current: number, prior: number): string | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior <= 0) return null
  const pct = ((current - prior) / prior) * 100
  if (Math.abs(pct) > 40) return null
  const rounded = Math.round(pct * 10) / 10
  if (rounded === 0) return '0.0%'
  const body = Math.abs(rounded).toFixed(1)
  return rounded > 0 ? `+${body}%` : `-${body}%`
}

/** The release's own "months of available inventory" figure, or null. */
export function parseMonthsOfSupply(text: string): number | null {
  const re = /(\d+(?:\.\d+)?)\s+months of available inventory/gi
  const found: number[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    found.push(Number(match[1]))
  }
  if (found.length !== 1) return null
  const n = found[0]
  if (!Number.isFinite(n) || n < 0.5 || n > 24) return null
  return n
}

/** First "(Sept. 8, 2026)"-style dateline, as `YYYY-MM-DD`. */
export function parseDateline(text: string): string | null {
  const re = /\(\s*([A-Za-z]+)\.?\s+(\d{1,2}),\s*(\d{4})\s*\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const month = MONTH_NUMBERS[match[1].toLowerCase()]
    const day = Number(match[2])
    const year = Number(match[3])
    if (!month || day < 1 || day > 31 || year < 2000 || year > 2100) continue
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return null
}

export function daysMetricFromRelease(
  text: string,
  days: number,
): DaysMetric | undefined {
  const sentences = text.split(/[.\n]/)
  const sentence = sentences.find(
    (line) => new RegExp(`\\b${days}\\b`).test(line) && /day|contract/i.test(line),
  )
  const blob = sentence ?? ''
  const listToContract = /list-to-contract|list to contract/i.test(blob)
  const daysOnMarket = /days on the market|days on market/i.test(blob)
  if (listToContract && !daysOnMarket) return 'list-to-contract'
  if (daysOnMarket && !listToContract) return 'days-on-market'
  return undefined
}

function commaNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function releaseMentionsMonth(text: string, isoMonth: string): boolean {
  const label = monthLabel(isoMonth) // "August 2026"
  const name = label.split(' ')[0] ?? ''
  if (!name) return false
  return new RegExp(`\\b${name}\\b`, 'i').test(text)
}

function releaseMentionsTotal(text: string, total: number): boolean {
  const plain = String(total)
  const commas = commaNumber(total)
  return text.includes(commas) || text.includes(plain)
}

/**
 * One Market Data & News post that names this month and this closing total.
 * Zero or several matches → no release (months of supply stays omitted).
 */
export function matchRelease(
  posts: readonly GnarRelease[],
  isoMonth: string,
  closedSales: number,
): GnarRelease | null {
  const hits = posts.filter(
    (post) =>
      /^[a-z0-9-]+$/.test(post.slug) &&
      releaseMentionsMonth(post.text, isoMonth) &&
      releaseMentionsTotal(post.text, closedSales),
  )
  return hits.length === 1 ? hits[0] : null
}

function dollars(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

function chicagoDateFromTimestamp(iso: string): string | null {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return chicagoIsoDate(parsed)
}

/**
 * Calendar day stamped on the market post (`YYYY-MM-DD`, America/Chicago).
 *
 * Prefer the release dateline, then the CMS `publishDate`, then
 * `stats.updatedAt` as a Chicago civil day. A UTC date slice of that
 * timestamp is already the next day after 7pm CT, so it is not used.
 *
 * GNAR sometimes schedules the dateline and `publishDate` ahead of the
 * day the document exists. September 2026 was datelined 2026-10-07 while
 * the release and this site's post both went out on 2026-10-05. A source
 * day after the Chicago day of this run is not the publish date — the
 * post goes live on the run day, and a future `datePublished` is wrong
 * for readers and for search engines.
 */
function reportDateFor(
  stats: GnarMonthlyStats,
  release: GnarRelease | null,
  now: Date,
): string | null {
  const today = chicagoIsoDate(now)
  const candidates: string[] = []
  if (release) {
    const dateline = parseDateline(release.text)
    if (dateline) candidates.push(dateline)
    if (release.publishDate && /^\d{4}-\d{2}-\d{2}$/.test(release.publishDate)) {
      candidates.push(release.publishDate)
    }
  }
  if (stats.updatedAt) {
    const updated = chicagoDateFromTimestamp(stats.updatedAt)
    if (updated) candidates.push(updated)
  }
  if (candidates.length === 0) return null
  // A scheduled dateline can be later than the day the figures existed.
  // Use the first source day that is not still in the future. If every
  // source day is later than this run, the post goes live today.
  return candidates.find((day) => day <= today) ?? today
}

function buildTakeaways(
  stats: GnarMonthlyStats,
  isoMonth: string,
  closings: number,
  inventory: number,
  yoy: string | undefined,
  prior: GnarMonthlyStats | null,
  supply: number | undefined,
  daysMetric: DaysMetric | undefined,
): string[] {
  const label = monthLabel(isoMonth)
  const priorLabel = monthLabel(
    `${stats.year - 1}-${stats.month}`,
  )
  const lines = [
    `${label} closed ${commaNumber(closings)} nine-county sales: ` +
      `${commaNumber(stats.residentialClosings)} residential, ` +
      `${commaNumber(stats.condominiumClosings)} condominium, ` +
      `${commaNumber(stats.multiFamilyClosings)} multi-family, and ` +
      `${commaNumber(stats.farmsLandLotsClosings)} farms, land, and lots.`,
  ]
  if (yoy && prior) {
    lines.push(
      `The residential median was ${dollars(stats.residentialMedianPrice)}, ` +
        `${yoy} from ${dollars(prior.residentialMedianPrice)} in ${priorLabel}.`,
    )
  } else {
    lines.push(
      `The residential median was ${dollars(stats.residentialMedianPrice)}.`,
    )
  }
  if (
    prior &&
    integerInRange(
      prior.condominiumMedianPrice,
      PRICE_RANGES.condominiumMedianPrice[0],
      PRICE_RANGES.condominiumMedianPrice[1],
    )
  ) {
    lines.push(
      `The condominium median was ${dollars(stats.condominiumMedianPrice)}, ` +
        `compared with ${dollars(prior.condominiumMedianPrice)} in ${priorLabel}.`,
    )
  } else {
    lines.push(
      `The condominium median was ${dollars(stats.condominiumMedianPrice)}.`,
    )
  }
  const daysSentence =
    daysMetric === 'list-to-contract'
      ? `Average list-to-contract time was ${stats.daysOnMarket} days.`
      : `Days on market was ${stats.daysOnMarket}.`
  const supplySentence =
    supply != null
      ? ` The release reported ${supply} months of available inventory.`
      : ''
  lines.push(
    `Active inventory was ${commaNumber(inventory)}, with ${commaNumber(stats.pendings)} pending sales. ` +
      `${daysSentence}${supplySentence}`,
  )
  return lines
}

/**
 * Build the snapshot from already-validated current stats. Prior-year stats
 * are used only when they validate. The release contributes months of supply,
 * the days label, the dateline, and the source URL — nothing else.
 */
export function buildSnapshot(input: {
  isoMonth: string
  stats: GnarMonthlyStats
  prior: GnarMonthlyStats | null
  release: GnarRelease | null
  /** Clock for the publish date. The scheduled fetcher passes the run time. */
  now: Date
}): { ok: true; built: BuiltGnarSnapshot } | { ok: false; errors: string[] } {
  const errors = validateMonthlyStats(input.stats, input.isoMonth)
  const closings = categoryClosings(input.stats)
  const inventory = categoryInventory(input.stats)
  if (closings == null || inventory == null) {
    errors.push('category totals could not be summed')
  }
  const reportDate = reportDateFor(input.stats, input.release, input.now)
  if (!reportDate) errors.push('no report date on the release dateline, publishDate, or stats updatedAt')
  if (errors.length || closings == null || inventory == null || !reportDate) {
    return { ok: false, errors }
  }

  const priorOk =
    input.prior != null &&
    validateMonthlyStats(
      input.prior,
      `${input.stats.year - 1}-${input.stats.month}`,
    ).length === 0
      ? input.prior
      : null
  const yoy = priorOk
    ? yoyPercent(input.stats.residentialMedianPrice, priorOk.residentialMedianPrice) ?? undefined
    : undefined
  const supply = input.release ? parseMonthsOfSupply(input.release.text) ?? undefined : undefined
  const daysMetric = input.release
    ? daysMetricFromRelease(input.release.text, input.stats.daysOnMarket)
    : undefined
  const sourceUrl = input.release
    ? `${GNAR_NEWS_ORIGIN}/${input.release.slug}`
    : GNAR_CHART_URL

  const snapshot: MarketSnapshot = {
    month: input.isoMonth,
    medianSalePrice: dollars(input.stats.residentialMedianPrice),
    medianSalePriceNum: input.stats.residentialMedianPrice,
    ...(yoy ? { medianYoyChange: yoy } : {}),
    avgDaysOnMarket: input.stats.daysOnMarket,
    ...(daysMetric ? { daysMetric } : {}),
    closedSales: closings,
    activeListings: inventory,
    ...(supply != null ? { monthsOfInventory: supply } : {}),
    condoMedianPrice: dollars(input.stats.condominiumMedianPrice),
    condoMedianPriceNum: input.stats.condominiumMedianPrice,
    pendingSales: input.stats.pendings,
    source: GNAR_SOURCE,
    sourceUrl,
    reportDate,
    takeaways: buildTakeaways(
      input.stats,
      input.isoMonth,
      closings,
      inventory,
      yoy,
      priorOk,
      supply,
      daysMetric,
    ),
  }

  const audit: SnapshotAudit = {
    closings:
      `${input.stats.residentialClosings} residential + ` +
      `${input.stats.condominiumClosings} condominium + ` +
      `${input.stats.multiFamilyClosings} multi-family + ` +
      `${input.stats.farmsLandLotsClosings} farms, land, and lots`,
    inventory:
      `${input.stats.residentialInventory} residential + ` +
      `${input.stats.condominiumInventory} condominium + ` +
      `${input.stats.multiFamilyInventory} multi-family + ` +
      `${input.stats.farmsLandLotsInventory} farms, land, and lots`,
    ...(yoy && priorOk
      ? {
          yoy:
            `${dollars(input.stats.residentialMedianPrice)} vs ` +
            `${monthLabel(`${input.stats.year - 1}-${input.stats.month}`)} ` +
            `${dollars(priorOk.residentialMedianPrice)}`,
        }
      : {}),
    ...(supply != null
      ? { supply: `release: "${supply} months of available inventory"` }
      : {}),
    ...(daysMetric === 'list-to-contract'
      ? { days: 'release: average list-to-contract time' }
      : daysMetric === 'days-on-market'
        ? { days: 'release: average days on the market' }
        : {}),
  }

  return { ok: true, built: { snapshot, audit } }
}

export type SnapshotPlan =
  | { action: 'write'; built: BuiltGnarSnapshot }
  | { action: 'not_ready'; detail: string }
  | { action: 'invalid'; errors: string[] }

/**
 * What a scheduled run should do. `not_ready` covers a missing document, a
 * hidden draft, and "stats are in but the release is not, and it is still
 * early in the month". Invalid records are never written.
 */
export function planSnapshot(input: {
  now: Date
  isoMonth: string
  stats: GnarMonthlyStats | null
  prior: GnarMonthlyStats | null
  releases: readonly GnarRelease[]
}): SnapshotPlan {
  if (!input.stats) {
    return {
      action: 'not_ready',
      detail: `no marketMonthlyStats document for ${input.isoMonth}`,
    }
  }
  if (input.stats.visibleOnSite === false) {
    return {
      action: 'not_ready',
      detail: `${input.isoMonth} stats exist but visibleOnSite is false`,
    }
  }
  const closings = categoryClosings(input.stats)
  const fieldErrors = validateMonthlyStats(input.stats, input.isoMonth)
  if (fieldErrors.length || closings == null) {
    return { action: 'invalid', errors: fieldErrors.length ? fieldErrors : ['category totals could not be summed'] }
  }
  const release = matchRelease(input.releases, input.isoMonth, closings)
  const day = chicagoCalendar(input.now).day
  if (!release && day <= WAIT_FOR_RELEASE_THROUGH_DAY) {
    return {
      action: 'not_ready',
      detail:
        `${input.isoMonth} stats validated, but no single matching release yet ` +
        `(waiting through day ${WAIT_FOR_RELEASE_THROUGH_DAY})`,
    }
  }
  const built = buildSnapshot({
    isoMonth: input.isoMonth,
    stats: input.stats,
    prior: input.prior,
    release,
    now: input.now,
  })
  if (!built.ok) return { action: 'invalid', errors: built.errors }
  return { action: 'write', built: built.built }
}

export function shouldAlert(plan: SnapshotPlan, now: Date): boolean {
  if (plan.action === 'write') return false
  return chicagoCalendar(now).day >= ALERT_FROM_DAY
}

function tsSingle(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function jsNumber(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(value)
}

/** TypeScript object literal, indented to sit inside `marketSnapshots`. */
export function formatSnapshotBlock(built: BuiltGnarSnapshot): string {
  const s = built.snapshot
  const a = built.audit
  const lines = [
    '  {',
    `    month: ${tsSingle(s.month)},`,
    `    medianSalePrice: ${tsSingle(s.medianSalePrice)},`,
    `    medianSalePriceNum: ${s.medianSalePriceNum},`,
  ]
  if (s.medianYoyChange) {
    const comment = a.yoy ? ` // ${a.yoy}` : ''
    lines.push(`    medianYoyChange: ${tsSingle(s.medianYoyChange)},${comment}`)
  }
  lines.push(`    avgDaysOnMarket: ${s.avgDaysOnMarket},`)
  if (s.daysMetric) {
    const comment = a.days ? ` // ${a.days}` : ''
    lines.push(`    daysMetric: ${tsSingle(s.daysMetric)},${comment}`)
  }
  lines.push(`    closedSales: ${s.closedSales}, // ${a.closings}`)
  lines.push(`    activeListings: ${s.activeListings}, // ${a.inventory}`)
  if (s.monthsOfInventory != null) {
    const comment = a.supply ? ` // ${a.supply}` : ''
    lines.push(`    monthsOfInventory: ${jsNumber(s.monthsOfInventory)},${comment}`)
  }
  if (s.condoMedianPrice && s.condoMedianPriceNum != null) {
    lines.push(`    condoMedianPrice: ${tsSingle(s.condoMedianPrice)},`)
    lines.push(`    condoMedianPriceNum: ${s.condoMedianPriceNum},`)
  }
  if (s.pendingSales != null) lines.push(`    pendingSales: ${s.pendingSales},`)
  lines.push(`    source: ${tsSingle(s.source)},`)
  if (s.sourceUrl) lines.push(`    sourceUrl: ${tsSingle(s.sourceUrl)},`)
  lines.push(`    reportDate: ${tsSingle(s.reportDate)},`)
  lines.push('    takeaways: [')
  for (const takeaway of s.takeaways) lines.push(`      ${tsSingle(takeaway)},`)
  lines.push('    ],')
  lines.push('  },')
  return lines.join('\n')
}

const ARRAY_START = 'export const marketSnapshots: MarketSnapshot[] = [\n'

export function snapshotMonthPresent(source: string, isoMonth: string): boolean {
  return new RegExp(`month:\\s*'${isoMonth}'`).test(source)
}

/** Insert a formatted block at the top of `marketSnapshots`. */
export function insertSnapshotBlock(source: string, block: string, isoMonth: string): string {
  if (!isIsoMonth(isoMonth)) throw new Error(`refusing to insert invalid month ${isoMonth}`)
  if (snapshotMonthPresent(source, isoMonth)) {
    throw new Error(`${isoMonth} is already in lib/market-snapshot.ts`)
  }
  const at = source.indexOf(ARRAY_START)
  if (at < 0) throw new Error('marketSnapshots array start not found')
  const insertAt = at + ARRAY_START.length
  return `${source.slice(0, insertAt)}${block}\n${source.slice(insertAt)}`
}
