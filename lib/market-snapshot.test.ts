import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { blogPosts } from './blog.ts'
import {
  currentSnapshot,
  gnarRegionalBuySlugs,
  latestSnapshot,
  marketReadFromSupply,
  marketSnapshots,
  marketUpdateSlug,
  monthLabel,
  showsGnarRegionalSnapshot,
  snapshotDaysStat,
  snapshotMatchesExpect,
  snapshotMedianLine,
  snapshotStatLines,
} from './market-snapshot.ts'

describe('August 2026 GNAR snapshot', () => {
  const august = latestSnapshot()

  it('is the current/latest month', () => {
    assert.ok(august)
    assert.equal(august.month, '2026-08')
    assert.equal(monthLabel(august.month), 'August 2026')
    assert.equal(
      marketUpdateSlug(august.month),
      'middle-tennessee-market-update-august-2026',
    )
    assert.equal(marketSnapshots[1]?.month, '2026-07')
  })

  it('is reused on Franklin and Nolensville buy pages', () => {
    assert.deepEqual([...gnarRegionalBuySlugs], ['franklin-tn', 'nolensville-tn'])
    assert.equal(showsGnarRegionalSnapshot('franklin-tn'), true)
    assert.equal(showsGnarRegionalSnapshot('nolensville-tn'), true)
    assert.equal(showsGnarRegionalSnapshot('brentwood-tn'), false)
  })

  it('uses official nine-county chart figures only', () => {
    assert.ok(august)
    assert.equal(august.medianSalePrice, '$515,725')
    assert.equal(august.medianSalePriceNum, 515725)
    assert.equal(august.avgDaysOnMarket, 55)
    assert.equal(august.closedSales, 2928)
    assert.equal(august.activeListings, 15637)
    assert.equal(august.condoMedianPrice, '$339,995')
    assert.equal(august.pendingSales, 2409)
    assert.equal(august.medianYoyChange, '+2.1%')
    assert.equal(august.monthsOfInventory, 5.8)
    assert.equal(august.daysMetric, 'list-to-contract')
    assert.equal(august.reportDate, '2026-09-08')
    assert.equal(
      august.sourceUrl,
      'https://www.greaternashvillerealtors.org/news/august-housing-market-shows-strength-in-wilson-county-as-downtown-condo-sales-slow',
    )
  })

  it('is current enough to publish in September 2026', () => {
    const s = currentSnapshot(new Date('2026-09-07T12:00:00Z'))
    assert.ok(s)
    assert.equal(s.month, '2026-08')
  })

  it('quotes the release YoY, months of supply, and list-to-contract label', () => {
    assert.ok(august)
    assert.equal(snapshotMedianLine(august), '$515,725 (+2.1% year over year)')
    assert.equal(marketReadFromSupply(august.monthsOfInventory), 'a market tilting from sellers toward balanced')
    assert.deepEqual(snapshotDaysStat(august), { label: 'List to contract', value: '55 days' })
    const lines = snapshotStatLines(august)
    assert.ok(lines.some((l) => l.includes('2,928')))
    assert.ok(lines.some((l) => l.includes('$339,995')))
    assert.ok(lines.some((l) => l.includes('2,409')))
    assert.ok(lines.some((l) => l.includes('List to contract: 55 days')))
    assert.ok(lines.some((l) => l.includes('+2.1% year over year')))
    assert.ok(lines.some((l) => l.includes('Months of supply: 5.8')))
  })

  it('treats a deploy as pending until production matches the committed snapshot', () => {
    assert.ok(august)
    assert.equal(
      snapshotMatchesExpect(august, {
        expectMonth: '2026-08',
        expectMedian: '515725',
        expectClosings: '2928',
        expectSupply: '5.8',
        expectYoy: '+2.1%',
      }),
      true,
    )
    assert.equal(
      snapshotMatchesExpect(august, { expectMonth: '2026-09', expectMedian: '1' }),
      false,
    )
    assert.equal(snapshotMatchesExpect(null, { expectMonth: '2026-08' }), false)
  })

  it('leads the blog with the generated August post', () => {
    const post = blogPosts[0]
    assert.ok(post)
    assert.equal(post.slug, 'middle-tennessee-market-update-august-2026')
    assert.ok(post.content.includes('$515,725'))
    assert.ok(post.content.includes('$339,995'))
    assert.ok(post.content.includes('2,928'))
    assert.ok(post.content.includes('15,637'))
    assert.ok(post.content.includes('2,409'))
    assert.ok(post.content.includes('nine-county'))
    assert.ok(post.content.includes('+2.1%'))
    assert.ok(post.content.includes('5.8'))
    assert.ok(post.content.includes('List to contract'))
    assert.doesNotMatch(post.content, /did not publish year-over-year or months-of-supply/)
    const julyGenerated = blogPosts.find(
      (p) => p.slug === 'middle-tennessee-market-update-july-2026',
    )
    assert.ok(julyGenerated)
    assert.ok(julyGenerated.content.includes('$520,000'))
  })
})
