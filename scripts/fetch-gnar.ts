/**
 * Pull last month's Greater Nashville REALTORS® statistics and, when they
 * validate, insert them at the top of lib/market-snapshot.ts.
 *
 *   npx tsx scripts/fetch-gnar.ts --dry-run
 *   npx tsx scripts/fetch-gnar.ts --dry-run --month 2026-08
 *   npx tsx scripts/fetch-gnar.ts
 *
 * Exit 0 when the month was written, already present, or not published yet
 * and it is still before the 10th (Chicago). Exit 1 when the month should
 * already be out and the fetch or the validation failed — the workflow
 * alerts and does not commit.
 *
 * The public chart page is behind a Vercel bot checkpoint (HTTP 429 for
 * curl and for headless Chromium), so this does not scrape it. The Sanity
 * dataset below is the same one that page reads.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import {
  formatSnapshotBlock,
  insertSnapshotBlock,
  isIsoMonth,
  planSnapshot,
  shouldAlert,
  snapshotMonthPresent,
  targetMonth,
  type GnarMonthlyStats,
  type GnarRelease,
  type SnapshotPlan,
} from '../lib/gnar-snapshot.ts'

const SANITY_QUERY =
  'https://it28gvxp.apicdn.sanity.io/v2021-10-21/data/query/production'
const SNAPSHOT_FILE = path.join(process.cwd(), 'lib/market-snapshot.ts')

const STATS_FIELDS = [
  'year',
  'month',
  'residentialClosings',
  'residentialInventory',
  'residentialMedianPrice',
  'condominiumClosings',
  'condominiumInventory',
  'condominiumMedianPrice',
  'multiFamilyClosings',
  'multiFamilyInventory',
  'farmsLandLotsClosings',
  'farmsLandLotsInventory',
  'daysOnMarket',
  'pendings',
  'visibleOnSite',
  '_updatedAt',
].join(',')

function parseArgs(argv: string[]): { dryRun: boolean; month?: string; now?: string } {
  let dryRun = false
  let month: string | undefined
  let now: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--month') month = argv[++i]
    else if (arg === '--now') now = argv[++i]
    else throw new Error(`unknown argument ${arg}`)
  }
  return { dryRun, month, now }
}

async function sanity(query: string): Promise<unknown> {
  const url = `${SANITY_QUERY}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Sanity HTTP ${res.status}`)
  const body = (await res.json()) as { result?: unknown; error?: { description?: string } }
  if (body.error) throw new Error(body.error.description || 'Sanity query failed')
  return body.result ?? null
}

function asStats(raw: unknown): GnarMonthlyStats | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const num = (key: string) => (typeof row[key] === 'number' ? row[key] : Number.NaN)
  return {
    year: num('year'),
    month: typeof row.month === 'string' ? row.month : '',
    residentialClosings: num('residentialClosings'),
    residentialInventory: num('residentialInventory'),
    residentialMedianPrice: num('residentialMedianPrice'),
    condominiumClosings: num('condominiumClosings'),
    condominiumInventory: num('condominiumInventory'),
    condominiumMedianPrice: num('condominiumMedianPrice'),
    multiFamilyClosings: num('multiFamilyClosings'),
    multiFamilyInventory: num('multiFamilyInventory'),
    farmsLandLotsClosings: num('farmsLandLotsClosings'),
    farmsLandLotsInventory: num('farmsLandLotsInventory'),
    daysOnMarket: num('daysOnMarket'),
    pendings: num('pendings'),
    updatedAt: typeof row._updatedAt === 'string' ? row._updatedAt : undefined,
    visibleOnSite: typeof row.visibleOnSite === 'boolean' ? row.visibleOnSite : undefined,
  }
}

function asRelease(raw: unknown): GnarRelease | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (typeof row.slug !== 'string' || typeof row.text !== 'string') return null
  return {
    title: typeof row.title === 'string' ? row.title : '',
    slug: row.slug,
    publishDate: typeof row.publishDate === 'string' ? row.publishDate : null,
    text: row.text,
  }
}

async function fetchStats(isoMonth: string): Promise<GnarMonthlyStats | null> {
  const [year, month] = isoMonth.split('-')
  const query =
    `*[_type=="marketMonthlyStats" && year==${Number(year)} && month=="${month}"][0]{${STATS_FIELDS}}`
  return asStats(await sanity(query))
}

function releaseWindow(isoMonth: string): { start: string; end: string } {
  const [year, month] = isoMonth.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 25))
  const end = new Date(Date.UTC(year, month, 25))
  const day = (d: Date) => d.toISOString().slice(0, 10)
  return { start: day(start), end: day(end) }
}

async function fetchReleases(isoMonth: string): Promise<GnarRelease[]> {
  const { start, end } = releaseWindow(isoMonth)
  const query =
    `*[_type=="post" && "Market Data & News" in categories[]->title && publishDate >= "${start}" && publishDate <= "${end}"]{` +
    `title, "slug": slug.current, publishDate, "text": pt::text(blocks[].content[])}`
  const result = await sanity(query)
  if (!Array.isArray(result)) return []
  return result.map(asRelease).filter((post): post is GnarRelease => post != null)
}

function priorIso(isoMonth: string): string {
  const [year, month] = isoMonth.split('-')
  return `${Number(year) - 1}-${month}`
}

function emit(status: string, alert: boolean, month: string, detail: string): void {
  console.log(`STATUS=${status}`)
  console.log(`ALERT=${alert ? 'yes' : 'no'}`)
  console.log(`MONTH=${month}`)
  console.log(`DETAIL=${detail.replace(/\s+/g, ' ').trim()}`)
}

function detailFor(plan: SnapshotPlan): string {
  if (plan.action === 'write') return `validated ${plan.built.snapshot.month}`
  if (plan.action === 'not_ready') return plan.detail
  return plan.errors.join('; ')
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  const now = args.now ? new Date(args.now) : new Date()
  if (Number.isNaN(now.getTime())) throw new Error(`bad --now ${args.now}`)
  const isoMonth = args.month ?? targetMonth(now)
  if (!isIsoMonth(isoMonth)) {
    emit('invalid', true, isoMonth, `--month ${isoMonth} is not YYYY-MM`)
    return 1
  }

  const source = readFileSync(SNAPSHOT_FILE, 'utf8')
  if (!args.dryRun && snapshotMonthPresent(source, isoMonth)) {
    emit('noop', false, isoMonth, 'month already in lib/market-snapshot.ts')
    return 0
  }

  let stats: GnarMonthlyStats | null
  let releases: GnarRelease[]
  try {
    stats = await fetchStats(isoMonth)
    releases = await fetchReleases(isoMonth)
  } catch (err) {
    const plan: SnapshotPlan = {
      action: 'not_ready',
      detail: `fetch failed: ${(err as Error).message}`,
    }
    const alert = shouldAlert(plan, now)
    emit(plan.action, alert, isoMonth, plan.detail)
    return alert ? 1 : 0
  }

  let prior: GnarMonthlyStats | null = null
  try {
    prior = await fetchStats(priorIso(isoMonth))
  } catch (err) {
    console.error(`prior-year fetch failed (YoY will be omitted): ${(err as Error).message}`)
  }

  const plan = planSnapshot({ now, isoMonth, stats, prior, releases })
  if (args.dryRun) {
    if (plan.action === 'write') {
      console.log(formatSnapshotBlock(plan.built))
      emit('dry_run', false, isoMonth, detailFor(plan))
      return 0
    }
    const alert = shouldAlert(plan, now)
    emit(plan.action === 'invalid' ? 'invalid' : 'not_ready', alert, isoMonth, detailFor(plan))
    return alert ? 1 : 0
  }

  if (plan.action !== 'write') {
    const alert = shouldAlert(plan, now)
    emit(plan.action === 'invalid' ? 'invalid' : 'not_ready', alert, isoMonth, detailFor(plan))
    return alert ? 1 : 0
  }

  const next = insertSnapshotBlock(source, formatSnapshotBlock(plan.built), isoMonth)
  writeFileSync(SNAPSHOT_FILE, next)
  emit('written', false, isoMonth, detailFor(plan))
  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err)
    console.log('STATUS=invalid')
    console.log('ALERT=yes')
    console.log('DETAIL=fetcher crashed')
    process.exit(1)
  })
