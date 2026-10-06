import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { marketSnapshots } from './market-snapshot.ts'
import {
  buildSnapshot,
  categoryClosings,
  categoryInventory,
  chicagoIsoDate,
  formatSnapshotBlock,
  insertSnapshotBlock,
  matchRelease,
  parseDateline,
  parseMonthsOfSupply,
  planSnapshot,
  shouldAlert,
  snapshotMonthPresent,
  targetMonth,
  validateMonthlyStats,
  yoyPercent,
  type GnarMonthlyStats,
  type GnarRelease,
} from './gnar-snapshot.ts'

const august2026: GnarMonthlyStats = {
  year: 2026,
  month: '08',
  residentialClosings: 2306,
  residentialInventory: 10532,
  residentialMedianPrice: 515725,
  condominiumClosings: 438,
  condominiumInventory: 2813,
  condominiumMedianPrice: 339995,
  multiFamilyClosings: 16,
  multiFamilyInventory: 150,
  farmsLandLotsClosings: 168,
  farmsLandLotsInventory: 2142,
  daysOnMarket: 55,
  pendings: 2409,
  updatedAt: '2026-09-06T14:12:50Z',
  visibleOnSite: true,
}

const august2025: GnarMonthlyStats = {
  year: 2025,
  month: '08',
  residentialClosings: 2434,
  residentialInventory: 10080,
  residentialMedianPrice: 505000,
  condominiumClosings: 460,
  condominiumInventory: 2431,
  condominiumMedianPrice: 353450,
  multiFamilyClosings: 20,
  multiFamilyInventory: 150,
  farmsLandLotsClosings: 142,
  farmsLandLotsInventory: 1964,
  daysOnMarket: 49,
  pendings: 2627,
  visibleOnSite: true,
}

const augustRelease: GnarRelease = {
  title: 'August Housing Market Shows Strength in Wilson County as Downtown Condo Sales Slow',
  slug: 'august-housing-market-shows-strength-in-wilson-county-as-downtown-condo-sales-slow',
  publishDate: '2026-09-07',
  text:
    'NASHVILLE, Tenn. (Sept. 8, 2026) – Data for the month of August showed 2,928 home closings. ' +
    'There were 2,409 sales pending at the end of August. ' +
    'The average list-to-contract time for a single-family home in August was 55 days. ' +
    'The median residential price was $515,725 and the condominium median was $339,995, ' +
    'compared with $505,000 and $353,450. ' +
    'Inventory at the end of August was 15,637. ' +
    'Currently, there are 5.8 months of available inventory in the Greater Nashville region.',
}

const onTheAugustDateline = new Date('2026-09-08T15:00:00Z')

describe('GNAR snapshot builder', () => {
  it('sums August 2026 categories to the published totals', () => {
    assert.equal(categoryClosings(august2026), 2928)
    assert.equal(categoryInventory(august2026), 15637)
    assert.deepEqual(validateMonthlyStats(august2026, '2026-08'), [])
  })

  it('computes residential YoY from the prior-year median', () => {
    assert.equal(yoyPercent(515725, 505000), '+2.1%')
    assert.equal(yoyPercent(520000, 524700), '-0.9%')
    assert.equal(yoyPercent(100, 50), null)
  })

  it('reads months of supply and the dateline only when the release states them once', () => {
    assert.equal(parseMonthsOfSupply(augustRelease.text), 5.8)
    assert.equal(parseMonthsOfSupply('6 months of available inventory, and later 7 months of available inventory'), null)
    assert.equal(parseMonthsOfSupply('no supply figure'), null)
    assert.equal(parseDateline(augustRelease.text), '2026-09-08')
  })

  it('builds the August 2026 entry that is checked in', () => {
    const built = buildSnapshot({
      isoMonth: '2026-08',
      stats: august2026,
      prior: august2025,
      release: augustRelease,
      now: onTheAugustDateline,
    })
    assert.equal(built.ok, true)
    if (!built.ok) return
    const checkedIn = marketSnapshots.find((s) => s.month === '2026-08')
    assert.ok(checkedIn)
    assert.deepEqual(built.built.snapshot, checkedIn)
    const source = readFileSync(new URL('./market-snapshot.ts', import.meta.url), 'utf8')
    assert.ok(source.includes(formatSnapshotBlock(built.built)))
  })

  it('omits months of supply and YoY instead of guessing', () => {
    const built = buildSnapshot({
      isoMonth: '2026-08',
      stats: august2026,
      prior: null,
      release: { ...augustRelease, text: 'NASHVILLE, Tenn. (Sept. 8, 2026) August closings were 2,928.' },
      now: onTheAugustDateline,
    })
    assert.equal(built.ok, true)
    if (!built.ok) return
    assert.equal(built.built.snapshot.monthsOfInventory, undefined)
    assert.equal(built.built.snapshot.medianYoyChange, undefined)
    assert.equal(built.built.snapshot.daysMetric, undefined)
    assert.equal(
      built.built.snapshot.sourceUrl,
      'https://www.greaternashvillerealtors.org/news/august-housing-market-shows-strength-in-wilson-county-as-downtown-condo-sales-slow',
    )
    assert.ok(built.built.snapshot.takeaways.every((line) => !/typical|school-year|Wilson County/i.test(line)))
  })

  it('rejects a partial record and will not insert one', () => {
    const broken = { ...august2026, residentialClosings: 10 }
    const errors = validateMonthlyStats(broken, '2026-08')
    assert.ok(errors.length > 0)
    const built = buildSnapshot({
      isoMonth: '2026-08',
      stats: broken,
      prior: august2025,
      release: augustRelease,
      now: onTheAugustDateline,
    })
    assert.equal(built.ok, false)
  })

  it('ignores a release that does not name this month’s closing total', () => {
    const other: GnarRelease = {
      ...augustRelease,
      slug: 'some-other-post',
      text: 'NASHVILLE, Tenn. (Sept. 8, 2026) July closings were 3,269. Currently, there are 6 months of available inventory.',
    }
    assert.equal(matchRelease([other, augustRelease], '2026-08', 2928)?.slug, augustRelease.slug)
    assert.equal(matchRelease([augustRelease, { ...augustRelease, slug: 'duplicate-august-note' }], '2026-08', 2928), null)
  })

  it('waits for the release early in the month and alerts from the 10th', () => {
    const early = new Date('2026-10-08T15:00:00Z')
    assert.equal(targetMonth(early), '2026-09')
    const waiting = planSnapshot({
      now: early,
      isoMonth: '2026-09',
      stats: { ...august2026, year: 2026, month: '09' },
      prior: null,
      releases: [],
    })
    assert.equal(waiting.action, 'not_ready')
    assert.equal(shouldAlert(waiting, early), false)

    const late = new Date('2026-10-10T15:00:00Z')
    const missing = planSnapshot({
      now: late,
      isoMonth: '2026-09',
      stats: null,
      prior: null,
      releases: [],
    })
    assert.equal(missing.action, 'not_ready')
    assert.equal(shouldAlert(missing, late), true)

    const stillNinth = new Date('2026-10-10T04:30:00Z')
    assert.equal(shouldAlert(missing, stillNinth), false)
  })

  it('publishes without months of supply once the wait window has passed', () => {
    const day = new Date('2026-10-09T15:00:00Z')
    const plan = planSnapshot({
      now: day,
      isoMonth: '2026-09',
      stats: { ...august2026, year: 2026, month: '09', updatedAt: '2026-10-09T14:00:00Z' },
      prior: null,
      releases: [],
    })
    assert.equal(plan.action, 'write')
    if (plan.action !== 'write') return
    assert.equal(plan.built.snapshot.monthsOfInventory, undefined)
    assert.equal(
      plan.built.snapshot.sourceUrl,
      'https://www.greaternashvillerealtors.org/monthly-home-sales-report',
    )
    assert.equal(plan.built.snapshot.reportDate, '2026-10-09')
  })

  it('keeps a dateline that is already on or before the Chicago run day', () => {
    const built = buildSnapshot({
      isoMonth: '2026-08',
      stats: august2026,
      prior: august2025,
      release: augustRelease,
      now: new Date('2026-09-11T15:00:00Z'),
    })
    assert.equal(built.ok, true)
    if (!built.ok) return
    assert.equal(built.built.snapshot.reportDate, '2026-09-08')
  })

  it('does not future-date a post from a scheduled GNAR dateline', () => {
    // September 2026: GNAR datelined the release Oct 7 and set CMS publishDate
    // to 2026-10-07, but the document existed on Oct 5 and PR #538 merged
    // 2026-10-05T22:22:47Z (5:22pm CT). The branch was cut at 4:45pm CT.
    const now = new Date('2026-10-05T21:45:19Z')
    assert.equal(chicagoIsoDate(now), '2026-10-05')
    assert.equal(parseDateline('NASHVILLE, Tenn. (Oct. 7, 2026) – September.'), '2026-10-07')
    const release: GnarRelease = {
      title: 'September Homes Sales Continued to Show Mixed Results',
      slug: 'september-homes-sales-continued-to-show-mixed-results-across-counties-and-price-points',
      publishDate: '2026-10-07',
      text:
        'NASHVILLE, Tenn. (Oct. 7, 2026) – Data for the month of September showed 2,928 home closings. ' +
        'Currently, there are 5.7 months of available inventory.',
    }
    const stats: GnarMonthlyStats = {
      ...august2026,
      year: 2026,
      month: '09',
      updatedAt: '2026-10-05T18:08:03Z',
    }
    const built = buildSnapshot({
      isoMonth: '2026-09',
      stats,
      prior: null,
      release,
      now,
    })
    assert.equal(built.ok, true)
    if (!built.ok) return
    assert.equal(built.built.snapshot.reportDate, '2026-10-05')

    const plan = planSnapshot({
      now,
      isoMonth: '2026-09',
      stats,
      prior: null,
      releases: [release],
    })
    assert.equal(plan.action, 'write')
    if (plan.action !== 'write') return
    assert.equal(plan.built.snapshot.reportDate, '2026-10-05')
  })

  it('reads stats updatedAt in America/Chicago, not as a UTC date slice', () => {
    // 03:30 UTC on Oct 6 is 10:30pm CT on Oct 5. Slicing the UTC timestamp
    // would stamp Oct 6, which is still in the future at an evening run
    // and is the wrong Chicago day the next morning too.
    const evening = new Date('2026-10-06T01:00:00Z') // 8:00pm CT Oct 5
    assert.equal(chicagoIsoDate(evening), '2026-10-05')
    const built = buildSnapshot({
      isoMonth: '2026-09',
      stats: {
        ...august2026,
        year: 2026,
        month: '09',
        updatedAt: '2026-10-06T03:30:00Z',
      },
      prior: null,
      release: {
        title: 'September note',
        slug: 'september-note',
        publishDate: null,
        text: 'Data for the month of September showed 2,928 home closings.',
      },
      now: evening,
    })
    assert.equal(built.ok, true)
    if (!built.ok) return
    assert.equal(built.built.snapshot.reportDate, '2026-10-05')

    const nextMorning = buildSnapshot({
      isoMonth: '2026-09',
      stats: {
        ...august2026,
        year: 2026,
        month: '09',
        updatedAt: '2026-10-06T03:30:00Z',
      },
      prior: null,
      release: {
        title: 'September note',
        slug: 'september-note',
        publishDate: null,
        text: 'Data for the month of September showed 2,928 home closings.',
      },
      now: new Date('2026-10-06T15:00:00Z'), // 10:00am CT, the daily cron
    })
    assert.equal(nextMorning.ok, true)
    if (!nextMorning.ok) return
    assert.equal(nextMorning.built.snapshot.reportDate, '2026-10-05')
  })

  it('inserts once and refuses a second copy of the same month', () => {
    const source = 'export const marketSnapshots: MarketSnapshot[] = [\n]\n'
    const built = buildSnapshot({
      isoMonth: '2026-08',
      stats: august2026,
      prior: august2025,
      release: augustRelease,
      now: onTheAugustDateline,
    })
    assert.equal(built.ok, true)
    if (!built.ok) return
    const block = formatSnapshotBlock(built.built)
    const next = insertSnapshotBlock(source, block, '2026-08')
    assert.equal(snapshotMonthPresent(next, '2026-08'), true)
    assert.throws(() => insertSnapshotBlock(next, block, '2026-08'), /already/)
  })
})
