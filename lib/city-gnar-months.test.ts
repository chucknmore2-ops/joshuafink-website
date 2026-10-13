import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  cityMonthCitation,
  cityMonthFaq,
  cityMonthIntro,
  cityMonthParams,
  cityMonthPath,
  getCityMonthPage,
  gnarMonthlyCitySlugs,
} from './city-gnar-months.ts'
import { marketSnapshots, monthLabel } from './market-snapshot.ts'
import { getSiteUrlCatalog } from './site-urls.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

test('Franklin, Brentwood, and Nashville each get a page for every GNAR month', () => {
  const params = cityMonthParams()
  assert.equal(params.length, gnarMonthlyCitySlugs.length * marketSnapshots.length)
  for (const slug of gnarMonthlyCitySlugs) {
    for (const snapshot of marketSnapshots) {
      assert.ok(params.some((row) => row.suburb === slug && row.month === snapshot.month))
      const page = getCityMonthPage(slug, snapshot.month)
      assert.ok(page)
      assert.equal(page.snapshot.month, snapshot.month)
      assert.match(cityMonthCitation(snapshot), new RegExp(`Source: ${snapshot.source}, ${monthLabel(snapshot.month)}`))
      assert.match(cityMonthIntro(page.suburb.name, snapshot), /nine-county/)
      assert.match(cityMonthIntro(page.suburb.name, snapshot), new RegExp(`not the ${page.suburb.name} city median`))
      const faq = cityMonthFaq(page.suburb.name, snapshot)
      assert.match(faq.a, /not the/)
      assert.match(faq.a, new RegExp(snapshot.medianSalePrice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
  }
  assert.equal(getCityMonthPage('spring-hill-tn', marketSnapshots[0].month), null)
  assert.equal(getCityMonthPage('franklin-tn', '1999-01'), null)
})

test('September 2026 cites GNAR and does not relabel the regional median as Franklin', () => {
  const page = getCityMonthPage('franklin-tn', '2026-09')
  assert.ok(page)
  assert.equal(cityMonthCitation(page.snapshot), 'Source: Greater Nashville REALTORS®, September 2026')
  assert.equal(page.snapshot.medianSalePrice, '$510,000')
  assert.match(cityMonthIntro('Franklin', page.snapshot), /not the Franklin city median/)
  assert.equal(cityMonthPath('franklin-tn', '2026-09'), '/market/franklin-tn/2026-09')
})

test('monthly city pages and the sitemap read the snapshot list', () => {
  const page = readFileSync(join(repoRoot, 'app/market/[suburb]/[month]/page.tsx'), 'utf8')
  const section = readFileSync(join(repoRoot, 'components/CityGnarMonths.tsx'), 'utf8')
  assert.match(page, /getCityMonthPage/)
  assert.match(page, /cityMonthCitation/)
  assert.match(page, /cityMonthParams/)
  assert.doesNotMatch(page, /\$510,000/)
  assert.match(section, /marketSnapshots/)
  assert.match(section, /currentCityGnarSnapshot/)
  for (const slug of ['franklin-tn', 'brentwood-tn', 'nashville-tn']) {
    const latest = marketSnapshots[0]
    const path = cityMonthPath(slug, latest.month)
    const entry = getSiteUrlCatalog().find((row) => row.path === path)
    assert.ok(entry, path)
    assert.equal(entry.changeFrequency, 'monthly')
    assert.equal(entry.lastModified?.toISOString(), `${latest.reportDate}T12:00:00.000Z`)
  }
  assert.equal(
    getSiteUrlCatalog().some((row) => row.path === '/market/spring-hill-tn/2026-09'),
    false,
  )
})
