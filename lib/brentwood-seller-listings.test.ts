import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cityClosingProof } from './closings.ts'
import { medianDaysOnMarket } from './county-seller-listings.ts'
import { formatCloseMonthYear, formatSoldPrice } from './closings.ts'
import {
  recentBrentwoodSellerListings,
  brentwoodRealEstateAgentAreaServed,
  brentwoodSellerListings,
  brentwoodSellerListingsItemList,
  brentwoodSellerListingsSummary,
} from './brentwood-seller-listings.ts'
import { williamsonSellerListings } from './williamson-seller-listings.ts'

const HOUSE_NUMBERS = ['1901', '9560', '9209', '9208', '8117', '9242', '9499', '1743', '9407']

test('Brentwood seller listings are the ten supplied closings and nothing else', () => {
  assert.equal(brentwoodSellerListings.length, 10)
  assert.ok(brentwoodSellerListings.every((row) => row.side === 'Seller'))
  assert.ok(brentwoodSellerListings.every((row) => row.city === 'Brentwood'))
  assert.deepEqual(
    brentwoodSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['New Bristol Ln', 'Brentwood', '2026-08-06', 1800000, 13],
      ['Dresden Sq', 'Brentwood', '2026-07-21', 1225000, 60],
      ['Duncaster Cir', 'Brentwood', '2026-05-15', 2675000, 17],
      ['New Bristol Ln', 'Brentwood', '2025-12-23', 1550000, 73],
      ['Duncaster Cir', 'Brentwood', '2024-11-04', 1960000, 14],
      ['Hilldale Dr', 'Brentwood', '2024-06-21', 1100000, 29],
      ['Lehigh Dr', 'Brentwood', '2023-06-26', 3500000, 51],
      ['Stillbrook Trce', 'Brentwood', '2023-03-20', 1599000, 3],
      ['Stillwater Cir', 'Brentwood', '2023-01-05', 1100000, 0],
      ['Green Hill Cir', 'Brentwood', '2022-05-17', 1299000, 2],
    ],
  )

  const fromWilliamson = williamsonSellerListings
    .filter((row) => row.city === 'Brentwood')
    .map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket])
  assert.deepEqual(
    brentwoodSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    fromWilliamson,
  )

  const newBristol = brentwoodSellerListings.filter((row) => row.street === 'New Bristol Ln')
  assert.deepEqual(
    newBristol.map((row) => [row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['2026-08-06', 1800000, 13],
      ['2025-12-23', 1550000, 73],
    ],
  )
  const duncaster = brentwoodSellerListings.filter((row) => row.street === 'Duncaster Cir')
  assert.deepEqual(
    duncaster.map((row) => [row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['2026-05-15', 2675000, 17],
      ['2024-11-04', 1960000, 14],
    ],
  )

  for (const row of brentwoodSellerListings) {
    assert.equal(/^\d/.test(row.street), false, row.street)
    assert.equal(/\d/.test(row.street), false, row.street)
  }
  const streets = brentwoodSellerListings.map((row) => row.street).join('\n')
  for (const number of HOUSE_NUMBERS) {
    assert.equal(streets.includes(number), false, number)
  }
  const blob = JSON.stringify(brentwoodSellerListings)
  assert.doesNotMatch(blob, /Parks|client|reviewer|quote/i)
})

test('the summary line uses the count, Brentwood, the earliest close year, and the exact median', () => {
  const days = brentwoodSellerListings.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  assert.deepEqual(days, [0, 2, 3, 13, 14, 17, 29, 51, 60, 73])
  assert.equal(medianDaysOnMarket(brentwoodSellerListings), 15.5)
  assert.equal(
    brentwoodSellerListingsSummary(),
    "I've closed 10 listings in Brentwood since 2022, with a median of 15.5 days on market.",
  )
})

test('the public list is the six newest distinct streets, without house numbers', () => {
  const recent = recentBrentwoodSellerListings()
  assert.equal(recent.length, 6)
  assert.equal(new Set(recent.map((row) => row.street)).size, 6)
  assert.deepEqual(
    recent.map((row) => [
      `${row.street}, ${row.city}`,
      formatCloseMonthYear(row.closeDate),
      formatSoldPrice(row.soldPrice),
      row.daysOnMarket,
    ]),
    [
      ['New Bristol Ln, Brentwood', 'August 2026', '$1,800,000', 13],
      ['Dresden Sq, Brentwood', 'July 2026', '$1,225,000', 60],
      ['Duncaster Cir, Brentwood', 'May 2026', '$2,675,000', 17],
      ['Hilldale Dr, Brentwood', 'June 2024', '$1,100,000', 29],
      ['Lehigh Dr, Brentwood', 'June 2023', '$3,500,000', 51],
      ['Stillbrook Trce, Brentwood', 'March 2023', '$1,599,000', 3],
    ],
  )
  assert.equal(
    recent.some((row) => row.street === 'New Bristol Ln' && row.closeDate === '2025-12-23'),
    false,
  )
  assert.equal(
    recent.some((row) => row.street === 'Duncaster Cir' && row.closeDate === '2024-11-04'),
    false,
  )
  assert.equal(
    recent.some((row) => row.street === 'Stillwater Cir' || row.street === 'Green Hill Cir'),
    false,
  )
})

test('JSON-LD names Williamson County and Brentwood and does not add reviews', () => {
  assert.deepEqual(
    brentwoodRealEstateAgentAreaServed().map((area) => [area['@type'], area.name]),
    [
      ['AdministrativeArea', 'Williamson County'],
      ['City', 'Brentwood'],
    ],
  )

  const list = brentwoodSellerListingsItemList(recentBrentwoodSellerListings())
  const json = JSON.stringify(list)
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 6)
  assert.equal(list.name, "Homes I've sold in Williamson County")
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks/)
  assert.match(json, /Traditional listing/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const number of HOUSE_NUMBERS) {
    assert.equal(json.includes(`"${number} `) || json.includes(` ${number},`), false, number)
  }
  const names = list.itemListElement.map((item) => item.item.name)
  assert.deepEqual(names, [
    'New Bristol Ln, Brentwood, TN',
    'Dresden Sq, Brentwood, TN',
    'Duncaster Cir, Brentwood, TN',
    'Hilldale Dr, Brentwood, TN',
    'Lehigh Dr, Brentwood, TN',
    'Stillbrook Trce, Brentwood, TN',
  ])
})

test('the Brentwood cash-offer page mounts the listings proof and the matching schema', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/BrentwoodSellerListings.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')

  assert.equal(cityClosingProof('Brentwood').href, '/sold#brentwood')
  assert.match(page, /slug === 'brentwood-tn' \? <BrentwoodSellerListings \/> : null/)
  assert.match(page, /brentwoodRealEstateAgentAreaServed\(\)/)
  assert.match(page, /brentwoodSellerListingsItemList\(brentwoodRows\)/)
  assert.doesNotMatch(page, /slug === 'brentwood-tn' \? <WilliamsonSellerListings/)
  assert.doesNotMatch(page, /slug === 'brentwood-tn' \? <RutherfordSellerListings/)
  assert.doesNotMatch(page, /slug === 'brentwood-tn' \? <DavidsonSellerListings/)
  assert.doesNotMatch(page, /slug === 'franklin-tn' \? <BrentwoodSellerListings/)
  assert.doesNotMatch(page, /slug === 'nashville-tn' \? <BrentwoodSellerListings/)
  assert.doesNotMatch(page, /slug === 'murfreesboro-tn' \? <BrentwoodSellerListings/)
  assert.doesNotMatch(page, /I've closed 10/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)
  assert.match(wrapper, /county="Williamson County"/)
  assert.match(wrapper, /sellHref="\/sell\/brentwood-tn"/)
  assert.match(wrapper, /cityClosingProof\('Brentwood'\)/)
  assert.match(wrapper, /soldHref=\{sold\.href\}/)
  assert.match(wrapper, /headingId="brentwood-listings-proof"/)
  assert.match(wrapper, /CountySellerListings/)
  assert.doesNotMatch(wrapper, /Parks/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)
  assert.match(component, /soldHref && soldLabel/)
  assert.match(component, /traditional listings I sold, not cash purchases/)
  assert.match(component, /full-market listing/)
  assert.match(component, /Compass Real Estate/)
  assert.match(component, /615-551-2727/)
  assert.doesNotMatch(component, /Parks/)
  assert.doesNotMatch(component, /615-551-3399|6155513399/)

  const localAt = page.indexOf('Why Sell for Cash in')
  const proofAt = page.indexOf("slug === 'brentwood-tn' ? <BrentwoodSellerListings /> : null")
  const situationsAt = page.indexOf('We Buy in Any Situation')
  assert.ok(localAt > 0 && proofAt > localAt && situationsAt > proofAt)
})
