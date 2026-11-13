import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { medianDaysOnMarket } from './county-seller-listings.ts'
import { formatCloseMonthYear, formatSoldPrice } from './closings.ts'
import {
  recentWilliamsonSellerListings,
  williamsonRealEstateAgentAreaServed,
  williamsonSellerListings,
  williamsonSellerListingsItemList,
  williamsonSellerListingsSummary,
} from './williamson-seller-listings.ts'

const HOUSE_NUMBERS = [
  '159',
  '1901',
  '9560',
  '9209',
  '931',
  '833',
  '601',
  '9208',
  '1012',
  '8117',
  '103',
  '9242',
  '9499',
  '1743',
  '3516',
  '9407',
  '1122',
  '1026',
  '3932',
]

test('Williamson seller listings are the twenty supplied closings and nothing else', () => {
  assert.equal(williamsonSellerListings.length, 20)
  assert.ok(williamsonSellerListings.every((row) => row.side === 'Seller'))
  assert.deepEqual(
    williamsonSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['N Berwick Ln', 'Franklin', '2026-08-31', 1147900, 0],
      ['New Bristol Ln', 'Brentwood', '2026-08-06', 1800000, 13],
      ['Dresden Sq', 'Brentwood', '2026-07-21', 1225000, 60],
      ['Duncaster Cir', 'Brentwood', '2026-05-15', 2675000, 17],
      ['Glass St', 'Franklin', '2026-01-28', 624900, 15],
      ['New Bristol Ln', 'Brentwood', '2025-12-23', 1550000, 73],
      ['Highgrove Cir', 'Franklin', '2025-03-31', 1975000, 2],
      ['Boyd Mill Ave', 'Franklin', '2025-01-30', 270000, 19],
      ['Duncaster Cir', 'Brentwood', '2024-11-04', 1960000, 14],
      ['Walton Rd', 'Franklin', '2024-07-31', 675000, 29],
      ['Hilldale Dr', 'Brentwood', '2024-06-21', 1100000, 29],
      ['Moss Ln', 'Franklin', '2024-03-19', 760000, 16],
      ['Lehigh Dr', 'Brentwood', '2023-06-26', 3500000, 51],
      ['Stillbrook Trce', 'Brentwood', '2023-03-20', 1599000, 3],
      ['Stillwater Cir', 'Brentwood', '2023-01-05', 1100000, 0],
      ['Greens Mill Rd', 'Spring Hill', '2022-10-13', 470000, 14],
      ['Green Hill Cir', 'Brentwood', '2022-05-17', 1299000, 2],
      ['John Sharp Rd', 'Spring Hill', '2021-12-06', 284900, 5],
      ['Nealcrest Cir', 'Spring Hill', '2021-05-17', 475000, 19],
      ['Kedron Rd', 'Spring Hill', '2021-03-16', 335000, 1],
    ],
  )

  const cities = williamsonSellerListings.reduce<Record<string, number>>((counts, row) => {
    counts[row.city] = (counts[row.city] ?? 0) + 1
    return counts
  }, {})
  assert.deepEqual(cities, { Franklin: 6, Brentwood: 10, 'Spring Hill': 4 })

  const newBristol = williamsonSellerListings.filter((row) => row.street === 'New Bristol Ln')
  assert.deepEqual(
    newBristol.map((row) => [row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['2026-08-06', 1800000, 13],
      ['2025-12-23', 1550000, 73],
    ],
  )
  const duncaster = williamsonSellerListings.filter((row) => row.street === 'Duncaster Cir')
  assert.deepEqual(
    duncaster.map((row) => [row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['2026-05-15', 2675000, 17],
      ['2024-11-04', 1960000, 14],
    ],
  )

  for (const row of williamsonSellerListings) {
    assert.equal(/^\d/.test(row.street), false, row.street)
    assert.equal(/\d/.test(row.street), false, row.street)
  }
  // Scan streets only. A close price can contain the same digits as a house
  // number (Stillbrook Trce closed at $1,599,000) without publishing the address.
  const streets = williamsonSellerListings.map((row) => row.street).join('\n')
  for (const number of HOUSE_NUMBERS) {
    assert.equal(streets.includes(number), false, number)
  }
  assert.equal(streets.includes('H6'), false)
  const blob = JSON.stringify(williamsonSellerListings)
  assert.doesNotMatch(blob, /Parks|client|reviewer|quote/i)
})

test('the summary line uses the count, the three cities, 2021, and the exact median', () => {
  const days = williamsonSellerListings.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  assert.deepEqual(days, [0, 0, 1, 2, 2, 3, 5, 13, 14, 14, 15, 16, 17, 19, 19, 29, 29, 51, 60, 73])
  assert.equal(medianDaysOnMarket(williamsonSellerListings), 14.5)
  assert.equal(
    williamsonSellerListingsSummary(),
    "I've closed 20 listings in Franklin, Brentwood and Spring Hill since 2021, with a median of 14.5 days on market.",
  )
})

test('the public list is the six newest distinct streets, without house numbers', () => {
  const recent = recentWilliamsonSellerListings()
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
      ['N Berwick Ln, Franklin', 'August 2026', '$1,147,900', 0],
      ['New Bristol Ln, Brentwood', 'August 2026', '$1,800,000', 13],
      ['Dresden Sq, Brentwood', 'July 2026', '$1,225,000', 60],
      ['Duncaster Cir, Brentwood', 'May 2026', '$2,675,000', 17],
      ['Glass St, Franklin', 'January 2026', '$624,900', 15],
      ['Highgrove Cir, Franklin', 'March 2025', '$1,975,000', 2],
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
})

test('JSON-LD names Williamson County and the three cities and does not add reviews', () => {
  assert.deepEqual(
    williamsonRealEstateAgentAreaServed().map((area) => [area['@type'], area.name]),
    [
      ['AdministrativeArea', 'Williamson County'],
      ['City', 'Franklin'],
      ['City', 'Brentwood'],
      ['City', 'Spring Hill'],
    ],
  )

  const list = williamsonSellerListingsItemList(recentWilliamsonSellerListings())
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
    'N Berwick Ln, Franklin, TN',
    'New Bristol Ln, Brentwood, TN',
    'Dresden Sq, Brentwood, TN',
    'Duncaster Cir, Brentwood, TN',
    'Glass St, Franklin, TN',
    'Highgrove Cir, Franklin, TN',
  ])
})

test('the Franklin cash-offer page mounts the listings proof and the matching schema', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/WilliamsonSellerListings.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')

  assert.match(page, /slug === 'franklin-tn' \? <WilliamsonSellerListings \/> : null/)
  assert.match(page, /williamsonRealEstateAgentAreaServed\(\)/)
  assert.match(page, /williamsonSellerListingsItemList\(williamsonRows\)/)
  assert.doesNotMatch(page, /slug === 'franklin-tn' \? <RutherfordSellerListings/)
  assert.doesNotMatch(page, /I've closed 20/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)
  assert.match(wrapper, /county="Williamson County"/)
  assert.match(wrapper, /sellHref="\/sell\/franklin-tn"/)
  assert.match(wrapper, /headingId="williamson-listings-proof"/)
  assert.match(wrapper, /CountySellerListings/)
  assert.doesNotMatch(wrapper, /Parks/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)
  assert.match(component, /traditional listings I sold, not cash purchases/)
  assert.match(component, /full-market listing/)
  assert.match(component, /Compass Real Estate/)
  assert.match(component, /615-551-2727/)
  assert.doesNotMatch(component, /Parks/)

  const localAt = page.indexOf('Why Sell for Cash in')
  const proofAt = page.indexOf("slug === 'franklin-tn' ? <WilliamsonSellerListings /> : null")
  const situationsAt = page.indexOf('We Buy in Any Situation')
  assert.ok(localAt > 0 && proofAt > localAt && situationsAt > proofAt)
})
