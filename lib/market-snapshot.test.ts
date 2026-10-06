import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { blogDateToIso, blogDateToUtcDate, blogPosts } from './blog.ts'
import { chicagoIsoDate } from './gnar-snapshot.ts'
import { getSiteUrlCatalog } from './site-urls.ts'
import {
  currentSnapshot,
  gnarRegionalBuySlugs,
  latestSnapshot,
  marketReadFromSupply,
  marketSnapshots,
  marketUpdateSlug,
  MAX_MONTHS_BEHIND,
  monthLabel,
  showsGnarRegionalSnapshot,
  snapshotDaysStat,
  snapshotMatchesExpect,
  snapshotMedianLine,
  snapshotStatLines,
  type MarketSnapshot,
} from './market-snapshot.ts'

function snapshotFor(month: string): MarketSnapshot {
  const found = marketSnapshots.find((s) => s.month === month)
  assert.ok(found, `${month} snapshot is checked in`)
  return found
}

/** UTC date `monthsAfter` calendar months after `isoMonth`, on `day`. */
function dateAfterMonth(isoMonth: string, monthsAfter: number, day: number, hour = 12): Date {
  const [year, month] = isoMonth.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1 + monthsAfter, day, hour))
}

describe('August 2026 GNAR snapshot', () => {
  const august = snapshotFor('2026-08')

  it('stays checked in with July behind it', () => {
    assert.equal(august.month, '2026-08')
    assert.equal(monthLabel(august.month), 'August 2026')
    assert.equal(
      marketUpdateSlug(august.month),
      'middle-tennessee-market-update-august-2026',
    )
    const index = marketSnapshots.findIndex((s) => s.month === '2026-08')
    assert.equal(marketSnapshots[index + 1]?.month, '2026-07')
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

  it('still quotes the generated August post after newer months are added', () => {
    const post = blogPosts.find((p) => p.slug === 'middle-tennessee-market-update-august-2026')
    assert.ok(post)
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

describe('newest checked-in GNAR snapshot', () => {
  it('is the current/latest month', () => {
    const latest = latestSnapshot()
    assert.ok(latest)
    assert.equal(latest, marketSnapshots[0])
    const [year, month] = latest.month.split('-').map(Number)
    const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    assert.equal(monthLabel(latest.month), label)
    assert.equal(
      marketUpdateSlug(latest.month),
      `middle-tennessee-market-update-${label.toLowerCase().replace(/\s+/g, '-')}`,
    )
    const prev = new Date(Date.UTC(year, month - 2, 1))
    const prevMonth = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`
    assert.equal(marketSnapshots[1]?.month, prevMonth)
  })

  it('is current enough to publish through the following month', () => {
    const latest = latestSnapshot()
    assert.ok(latest)
    const duringFollowingMonth = dateAfterMonth(latest.month, 1, 7)
    const s = currentSnapshot(duringFollowingMonth)
    assert.ok(s)
    assert.equal(s.month, latest.month)
    assert.equal(currentSnapshot(dateAfterMonth(latest.month, MAX_MONTHS_BEHIND + 1, 1, 0)), null)
  })

  it('treats a deploy as pending until production matches the committed snapshot', () => {
    const latest = latestSnapshot()
    assert.ok(latest)
    assert.equal(
      snapshotMatchesExpect(latest, {
        expectMonth: latest.month,
        expectMedian: String(latest.medianSalePriceNum),
        expectClosings: String(latest.closedSales),
        expectSupply: latest.monthsOfInventory == null ? 'none' : String(latest.monthsOfInventory),
        expectYoy: latest.medianYoyChange ?? 'none',
      }),
      true,
    )
    assert.equal(
      snapshotMatchesExpect(latest, { expectMonth: latest.month, expectMedian: '1' }),
      false,
    )
    assert.equal(snapshotMatchesExpect(null, { expectMonth: latest.month }), false)
  })

  it('leads the blog with the generated post for the newest month', () => {
    const latest = latestSnapshot()
    assert.ok(latest)
    const post = blogPosts[0]
    assert.ok(post)
    assert.equal(post.slug, marketUpdateSlug(latest.month))
    assert.ok(post.content.includes(latest.medianSalePrice))
    assert.ok(post.content.includes(latest.closedSales.toLocaleString('en-US')))
    assert.ok(post.content.includes(latest.activeListings.toLocaleString('en-US')))
    if (latest.condoMedianPrice) assert.ok(post.content.includes(latest.condoMedianPrice))
    if (latest.pendingSales != null) {
      assert.ok(post.content.includes(latest.pendingSales.toLocaleString('en-US')))
    }
    assert.ok(post.content.includes('nine-county'))
    if (latest.medianYoyChange) assert.ok(post.content.includes(latest.medianYoyChange))
    if (latest.monthsOfInventory != null) {
      assert.ok(post.content.includes(String(latest.monthsOfInventory)))
    }
    if (latest.daysMetric === 'list-to-contract') {
      assert.ok(post.content.includes('List to contract'))
    }
    if (latest.medianYoyChange && latest.monthsOfInventory != null) {
      assert.doesNotMatch(post.content, /did not publish year-over-year or months-of-supply/)
    }
  })

  it('stamps September 2026 on 2026-10-05 everywhere the date is published', () => {
    const september = snapshotFor('2026-09')
    assert.equal(september.reportDate, '2026-10-05')
    const post = blogPosts.find((p) => p.slug === 'middle-tennessee-market-update-september-2026')
    assert.ok(post)
    assert.equal(post.date, 'October 5, 2026')
    assert.equal(post.dateModified, 'October 5, 2026')
    assert.ok(post.content.includes('published October 5, 2026'))
    // JSON-LD datePublished / dateModified use blogDateToIso (calendar day, no timezone shift).
    assert.equal(blogDateToIso(post.date), '2026-10-05')
    assert.equal(blogDateToIso(post.dateModified), '2026-10-05')
    const listed = getSiteUrlCatalog().find(
      (entry) => entry.path === '/blog/middle-tennessee-market-update-september-2026',
    )
    assert.ok(listed?.lastModified)
    assert.equal(listed.lastModified.toISOString(), '2026-10-05T12:00:00.000Z')
    assert.equal(blogDateToUtcDate(post.date)?.toISOString().slice(0, 10), '2026-10-05')
  })
})

describe('blog publish dates', () => {
  it('parses the visible date as that calendar day', () => {
    assert.equal(blogDateToIso('October 5, 2026'), '2026-10-05')
    assert.equal(blogDateToIso('March 15, 2026'), '2026-03-15')
    assert.equal(blogDateToIso('February 31, 2026'), undefined)
  })

  it('has no post dated after today in America/Chicago', () => {
    const today = chicagoIsoDate(new Date())
    for (const post of blogPosts) {
      const published = blogDateToIso(post.date)
      assert.ok(published, `${post.slug} date ${JSON.stringify(post.date)} did not parse`)
      assert.ok(
        published <= today,
        `${post.slug} is dated ${published}, after ${today} America/Chicago`,
      )
      if (!post.dateModified) continue
      const modified = blogDateToIso(post.dateModified)
      assert.ok(modified, `${post.slug} dateModified ${JSON.stringify(post.dateModified)} did not parse`)
      assert.ok(
        modified <= today,
        `${post.slug} was modified ${modified}, after ${today} America/Chicago`,
      )
    }
  })
})
