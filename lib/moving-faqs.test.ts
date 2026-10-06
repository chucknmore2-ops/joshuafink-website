import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { suburbs } from './suburbs.ts'
import { latestSnapshot, marketUpdateSlug, monthLabel } from './market-snapshot.ts'
import {
  cityMedian,
  compactMedian,
  homesCostFaqAnswer,
  HOUSING_MARKET_FAQ_QUESTION,
  housingMarketFaqAnswer,
} from './moving-faqs.ts'

test('homes-cost FAQ quotes the same Redfin city medians as the city cards', () => {
  const answer = homesCostFaqAnswer()
  const williamson = [
    'spring-hill-tn',
    'franklin-tn',
    'nolensville-tn',
    'brentwood-tn',
  ] as const

  for (const slug of williamson) {
    assert.ok(
      answer.includes(cityMedian(slug)),
      `FAQ should include ${slug} compact median ${cityMedian(slug)}`,
    )
  }

  // Pin the rounded figures the city cards currently display.
  assert.equal(compactMedian(suburbs['spring-hill-tn'].medianPriceNum), '$508K')
  assert.equal(compactMedian(suburbs['nolensville-tn'].medianPriceNum), '$929K')
  assert.equal(compactMedian(suburbs['franklin-tn'].medianPriceNum), '$863K')
  assert.equal(compactMedian(suburbs['brentwood-tn'].medianPriceNum), '$1.42M')

  assert.match(answer, /Source: Redfin|same Redfin city medians/)
  assert.match(answer, /Greater Nashville REALTORS/)
  assert.ok(answer.includes(`/blog/${marketUpdateSlug(latestSnapshot()!.month)}`))
})

test('homes-cost FAQ no longer quotes the old Williamson ballparks', () => {
  const answer = homesCostFaqAnswer()
  assert.doesNotMatch(answer, /\$450Ks/)
  assert.doesNotMatch(answer, /near \$580K/)
  assert.doesNotMatch(answer, /Franklin around \$650K/)
  assert.doesNotMatch(answer, /Brentwood around \$900K/)
})

test('housing-market FAQ quotes the latest GNAR snapshot and names Joshua', () => {
  const snapshot = latestSnapshot()
  assert.ok(snapshot)
  const answer = housingMarketFaqAnswer()
  const sentences = answer.split(/(?<=\.)\s+/).filter(Boolean)

  assert.equal(
    HOUSING_MARKET_FAQ_QUESTION,
    "What's the Middle Tennessee housing market like right now?",
  )
  assert.ok(sentences.length >= 2 && sentences.length <= 4, answer)
  assert.ok(answer.startsWith('Right now, per '))
  assert.ok(answer.includes(snapshot.source))
  assert.ok(answer.includes(monthLabel(snapshot.month)))
  assert.ok(answer.includes(snapshot.medianSalePrice))
  if (snapshot.medianYoyChange) assert.ok(answer.includes(snapshot.medianYoyChange))
  assert.ok(answer.includes(snapshot.closedSales.toLocaleString('en-US')))
  assert.ok(answer.includes(snapshot.activeListings.toLocaleString('en-US')))
  if (snapshot.monthsOfInventory != null) {
    assert.ok(answer.includes(`${snapshot.monthsOfInventory} months of supply`))
  }
  assert.ok(answer.includes(String(snapshot.avgDaysOnMarket)))
  if (snapshot.daysMetric === 'list-to-contract') {
    assert.match(answer, /list-to-contract/)
  }
  assert.match(answer, /Joshua Fink/)
  assert.match(answer, /Joshua Fink Group/)
  assert.match(answer, /Compass Real Estate/)
  assert.doesNotMatch(answer, /Parks/)
  assert.ok(answer.includes(`/blog/${marketUpdateSlug(snapshot.month)}`))
})

test('moving page puts the housing-market FAQ in FAQPage schema and stamps Oct 5, 2026', () => {
  const page = readFileSync(
    new URL('../app/moving-to-middle-tennessee/page.tsx', import.meta.url),
    'utf8',
  )
  assert.match(page, /PAGE_LAST_VERIFIED = '2026-10-05'/)
  assert.match(page, /dateModified: PAGE_LAST_VERIFIED/)
  assert.match(page, /Page last verified: \{PAGE_LAST_VERIFIED\}/)
  assert.match(page, /q: HOUSING_MARKET_FAQ_QUESTION/)
  assert.match(page, /a: housingMarketFaqAnswer\(\)/)
  assert.match(page, /mainEntity: RELO_FAQS\.map/)
})
