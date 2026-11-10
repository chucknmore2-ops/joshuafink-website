import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  byTheNumbersDataset,
  byTheNumbersForBuySlug,
  getByTheNumbers,
  isoMonthLabel,
  quotedCityStats,
  quotedGnarStats,
  type ByTheNumbersId,
} from './by-the-numbers.ts'
import { latestSnapshot, monthLabel, type MarketSnapshot } from './market-snapshot.ts'
import {
  formatStatsDate,
  marketStatsSource,
  suburbStatsAsOf,
  suburbs,
  yoyMovement,
} from './suburbs.ts'

const PAGE_IDS: ByTheNumbersId[] = [
  'cash-offer-nashville-tn',
  'buy-franklin-tn',
  'buy-brentwood-tn',
  'buy-nolensville-tn',
  'moving-to-middle-tennessee',
]

function sentenceCount(text: string): number {
  const withoutDecimals = text.replace(/\d\.\d/g, (match) => match.replace('.', ''))
  return withoutDecimals
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length
}

test('edition heading follows the latest GNAR report date, not a hardcoded month', () => {
  const snapshot = latestSnapshot()
  assert.ok(snapshot)
  const edition = isoMonthLabel(snapshot.reportDate)
  // Rolls with reportDate. Do not pin a calendar month here — the GNAR
  // fetcher auto-merges the next snapshot, and a hardcoded month would fail CI.
  assert.equal(edition, monthLabel(snapshot.reportDate.slice(0, 7)))

  for (const id of PAGE_IDS) {
    const section = getByTheNumbers(id)
    assert.equal(section.heading, `By the numbers: ${edition}`)
    assert.equal(section.editionDate, snapshot.reportDate)
    assert.match(section.intro, new RegExp(edition))
    assert.match(section.intro, new RegExp(formatStatsDate(snapshot.reportDate)))
    assert.match(section.intro, /Each line names the source and the month that source covers/)
  }
})

test('every quoted stat names its source and as-of month and matches stored figures', () => {
  const snapshot = latestSnapshot()
  assert.ok(snapshot)
  const sections = PAGE_IDS.map((id) => getByTheNumbers(id))
  const stats = sections.flatMap((section) => section.stats)
  assert.ok(stats.length > 0)

  for (const stat of stats) {
    assert.match(stat.sentence, /Source: .+?, as of [A-Z][a-z]+ \d{4}\)\.$/)
    assert.ok(stat.sentence.includes(stat.source), stat.id)
    assert.ok(stat.sentence.includes(`as of ${stat.asOfMonth}`), stat.id)
    assert.ok(stat.sentence.includes(stat.value.split(' (')[0]), `${stat.id} value ${stat.value}`)
    assert.ok(stat.sourceUrl.startsWith('https://'), stat.id)
    assert.equal(sentenceCount(stat.sentence), 1, stat.sentence)
  }

  const franklin = quotedCityStats('franklin-tn')
  const suburb = suburbs['franklin-tn']
  const asOf = isoMonthLabel(suburbStatsAsOf(suburb))
  assert.equal(marketStatsSource, 'Redfin')
  assert.ok(franklin.some((stat) => stat.sentence === `The Franklin citywide median sale price is ${suburb.medianPrice} (Source: Redfin, as of ${asOf}).`))
  assert.ok(franklin.some((stat) => stat.sentence.includes(`median days on market is ${suburb.avgDaysOnMarket}`)))
  assert.ok(franklin.some((stat) => stat.sentence.includes(`$${suburb.pricePerSqft}`)))
  assert.ok(franklin.some((stat) => stat.sentence.includes(suburb.yoyChange)))
  assert.ok(franklin.every((stat) => stat.asOfDate === suburbStatsAsOf(suburb)))
  assert.ok(franklin.every((stat) => stat.sourceUrl === 'https://www.redfin.com/news/data-center/'))
})

test('city pages quote only that city’s Redfin lines', () => {
  const snapshot = latestSnapshot()
  assert.ok(snapshot)
  const pairs: Array<[ByTheNumbersId, keyof typeof suburbs]> = [
    ['cash-offer-nashville-tn', 'nashville-tn'],
    ['buy-franklin-tn', 'franklin-tn'],
    ['buy-brentwood-tn', 'brentwood-tn'],
    ['buy-nolensville-tn', 'nolensville-tn'],
  ]

  for (const [id, slug] of pairs) {
    const section = getByTheNumbers(id)
    const suburb = suburbs[slug]
    assert.equal(section.stats.length, quotedCityStats(slug).length)
    const blob = section.stats.map((stat) => stat.sentence).join('\n')
    assert.match(blob, new RegExp(suburb.medianPrice.replace(/[$,]/g, '\\$&')))
    assert.doesNotMatch(blob, /nine-county/i)
    assert.doesNotMatch(blob, new RegExp(snapshot.medianSalePrice.replace(/[$,]/g, '\\$&')))
    assert.match(section.intro, /citywide figures/)
  }

  assert.equal(byTheNumbersForBuySlug('brentwood-tn')?.id, 'buy-brentwood-tn')
  assert.equal(byTheNumbersForBuySlug('nashville-tn'), null)
  assert.equal(byTheNumbersForBuySlug('spring-hill-tn'), null)
})

test('moving page quotes the current GNAR snapshot and four city medians, and omits unstated fields', () => {
  const snapshot = latestSnapshot()
  assert.ok(snapshot)
  const section = getByTheNumbers('moving-to-middle-tennessee')
  const blob = section.stats.map((stat) => `${stat.label} ${stat.sentence}`).join('\n')

  assert.match(blob, /nine-county/i)
  assert.ok(blob.includes(snapshot.medianSalePrice))
  assert.ok(blob.includes(snapshot.closedSales.toLocaleString('en-US')))
  assert.ok(blob.includes(String(snapshot.avgDaysOnMarket)))
  if (snapshot.medianYoyChange) assert.ok(blob.includes(yoyMovement(snapshot.medianYoyChange)))
  if (snapshot.monthsOfInventory != null) {
    assert.ok(blob.includes(String(snapshot.monthsOfInventory)))
  }
  assert.ok(section.stats.every((stat) => stat.sentence.includes(snapshot.source) || stat.source === 'Redfin'))
  assert.match(section.intro, /not a single-city price/)

  for (const slug of ['nashville-tn', 'franklin-tn', 'brentwood-tn', 'nolensville-tn'] as const) {
    assert.ok(blob.includes(suburbs[slug].medianPrice), slug)
  }
  assert.equal(
    section.stats.filter((stat) => stat.id.endsWith('-dom') || stat.id.endsWith('-ppsf') || stat.id.endsWith('-yoy')).length,
    0,
  )

  const partial = {
    ...snapshot,
    medianYoyChange: undefined,
    monthsOfInventory: undefined,
  } as MarketSnapshot
  const lines = quotedGnarStats(partial)
  assert.equal(lines.some((stat) => /year over year/.test(stat.sentence)), false)
  assert.equal(lines.some((stat) => /months of supply/.test(stat.sentence)), false)
  assert.ok(lines.some((stat) => stat.sentence.includes(snapshot.medianSalePrice)))
  assert.ok(lines.some((stat) => stat.sentence.includes(snapshot.closedSales.toLocaleString('en-US'))))
})

test('answer statements are one sentence, use published process facts, and stay on brand', () => {
  const phones = new Set<string>()
  for (const id of PAGE_IDS) {
    const section = getByTheNumbers(id)
    assert.ok(section.answers.length >= 2 && section.answers.length <= 3, id)
    const questions = section.answers.map((answer) => answer.q)
    assert.equal(new Set(questions).size, questions.length, id)
    for (const answer of section.answers) {
      assert.equal(sentenceCount(answer.a), 1, `${id}: ${answer.a}`)
      assert.doesNotMatch(answer.a, /Parks/i)
      assert.doesNotMatch(answer.a, /3399/)
      assert.doesNotMatch(answer.a, /testimonial/i)
      for (const phone of answer.a.match(/\d{3}-\d{3}-\d{4}/g) ?? []) phones.add(phone)
    }
  }

  assert.deepEqual(Array.from(phones), ['615-551-2727'])

  const cash = getByTheNumbers('cash-offer-nashville-tn')
  assert.match(cash.answers.map((answer) => answer.a).join('\n'), /as little as 7 days/)
  assert.match(cash.answers.map((answer) => answer.a).join('\n'), /24 hours/)
  assert.match(cash.answers.map((answer) => answer.a).join('\n'), /no commission/)
  assert.match(cash.answers.map((answer) => answer.a).join('\n'), /TREC #351484/)
  assert.match(cash.answers.map((answer) => answer.a).join('\n'), /licensed since 2008/i)
  assert.match(cash.answers.map((answer) => answer.a).join('\n'), /40\+ homes a year/)
  assert.match(cash.answers.map((answer) => answer.a).join('\n'), /Compass Real Estate/)

  const franklin = getByTheNumbers('buy-franklin-tn')
  const franklinText = franklin.answers.map((answer) => answer.a).join('\n')
  assert.match(franklinText, /30–45 days/)
  assert.match(franklinText, /60–90 days/)
  assert.match(franklinText, /pre-approved before you tour/)
  assert.doesNotMatch(franklinText, /7 days/)

  const brentwood = getByTheNumbers('buy-brentwood-tn').answers.map((answer) => answer.a).join('\n')
  assert.match(brentwood, /pre-approval or proof of funds/)
  assert.match(brentwood, /off-market listings/)
  assert.doesNotMatch(brentwood, /60–90 days/)
  assert.doesNotMatch(brentwood, /30–45 days/)

  const nolensville = getByTheNumbers('buy-nolensville-tn').answers.map((answer) => answer.a).join('\n')
  assert.match(nolensville, /pre-approved/)
  assert.match(nolensville, /specific Nolensville street and subdivision/)
  assert.doesNotMatch(nolensville, /60–90 days/)

  const moving = getByTheNumbers('moving-to-middle-tennessee').answers.map((answer) => answer.a).join('\n')
  assert.match(moving, /remote searches/)
  assert.match(moving, /video walkthroughs/)
  assert.match(moving, /school-zone verification/)
  assert.match(moving, /615-551-2727/)
  assert.match(moving, /TREC #351484/)
  assert.doesNotMatch(moving, /best realtor/i)
})

test('dataset schema repeats the visible sentences and does not invent a second source', () => {
  for (const id of PAGE_IDS) {
    const section = getByTheNumbers(id)
    const dataset = byTheNumbersDataset(section)
    assert.equal(dataset['@type'], 'Dataset')
    assert.equal(dataset.name, section.heading)
    assert.equal(dataset.url, `${section.pageUrl}#by-the-numbers`)
    assert.equal(dataset.dateModified, section.editionDate)
    assert.equal(dataset.creator.telephone, '+16155512727')
    assert.equal(dataset.creator.worksFor.name, 'Compass Real Estate')
    assert.equal(dataset.variableMeasured.length, section.stats.length)
    dataset.variableMeasured.forEach((measured, index) => {
      assert.equal(measured.description, section.stats[index].sentence)
      assert.equal(measured.value, section.stats[index].value)
    })
    const sourceNames = dataset.isBasedOn.map((source) => source.name)
    assert.ok(sourceNames.includes('Redfin') || sourceNames.includes('Greater Nashville REALTORS®'))
    assert.ok(sourceNames.every((name) => name === 'Redfin' || name === 'Greater Nashville REALTORS®'))
  }
})

test('the five pages render the section and fold its answers into the existing schema', () => {
  const buy = readFileSync(new URL('../app/buy/[suburb]/page.tsx', import.meta.url), 'utf8')
  const cash = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const moving = readFileSync(new URL('../app/moving-to-middle-tennessee/page.tsx', import.meta.url), 'utf8')

  assert.match(buy, /byTheNumbersForBuySlug/)
  assert.match(buy, /<ByTheNumbers section=\{byTheNumbers\} \/>/)
  assert.match(buy, /byTheNumbersDataset\(byTheNumbers\)/)
  assert.match(buy, /byTheNumbers\?\.answers/)
  assert.equal(buy.match(/'@type': 'FAQPage'/g)?.length, 1)

  assert.match(cash, /getByTheNumbers\('cash-offer-nashville-tn'\)/)
  assert.match(cash, /<ByTheNumbers section=\{byTheNumbers\} \/>/)
  assert.match(cash, /byTheNumbersDataset\(byTheNumbers\)/)
  assert.match(cash, /faqSchemaAnswerText/)
  assert.equal(cash.match(/'@type': 'FAQPage'/g)?.length, 1)

  assert.match(moving, /getByTheNumbers\('moving-to-middle-tennessee'\)/)
  assert.match(moving, /<ByTheNumbers section=\{byTheNumbers\} \/>/)
  assert.match(moving, /byTheNumbersDataset\(byTheNumbers\)/)
  assert.match(moving, /byTheNumbers\.answers/)
  assert.equal(moving.match(/'@type': 'FAQPage'/g)?.length, 1)
})

test('quotedGnarStats returns nothing when there is no snapshot', () => {
  assert.deepEqual(quotedGnarStats(null), [])
})
