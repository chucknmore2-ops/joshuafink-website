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
    assert.equal(august.medianYoyChange, undefined)
    assert.equal(august.monthsOfInventory, undefined)
    assert.equal(
      august.sourceUrl,
      'https://www.greaternashvillerealtors.org/monthly-home-sales-report',
    )
  })

  it('is current enough to publish in September 2026', () => {
    const s = currentSnapshot(new Date('2026-09-07T12:00:00Z'))
    assert.ok(s)
    assert.equal(s.month, '2026-08')
  })

  it('omits unsourced YoY and months of supply from copy helpers', () => {
    assert.ok(august)
    assert.equal(snapshotMedianLine(august), '$515,725')
    assert.equal(marketReadFromSupply(august.monthsOfInventory), null)
    const lines = snapshotStatLines(august)
    assert.ok(lines.some((l) => l.includes('2,928')))
    assert.ok(lines.some((l) => l.includes('$339,995')))
    assert.ok(lines.some((l) => l.includes('2,409')))
    assert.equal(
      lines.some((l) => /year over year|Months of supply/i.test(l)),
      false,
    )
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
    assert.match(
      post.content,
      /did not publish year-over-year or months-of-supply/,
    )
    const julyGenerated = blogPosts.find(
      (p) => p.slug === 'middle-tennessee-market-update-july-2026',
    )
    assert.ok(julyGenerated)
    assert.ok(julyGenerated.content.includes('$520,000'))
  })
})
