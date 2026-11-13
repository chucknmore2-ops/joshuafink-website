import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { formatCloseMonthYear, formatSoldPrice } from './closings.ts'
import {
  medianDaysOnMarket,
  recentRutherfordSellerListings,
  rutherfordRealEstateAgentAreaServed,
  rutherfordSellerListings,
  rutherfordSellerListingsItemList,
  rutherfordSellerListingsSummary,
} from './rutherford-seller-listings.ts'

const HOUSE_NUMBERS = ['215', '320', '904', '624', '430', '588', '1516', '3319', '1009', '117']

test('Rutherford seller listings are the ten supplied rows and nothing else', () => {
  assert.equal(rutherfordSellerListings.length, 10)
  assert.ok(rutherfordSellerListings.every((row) => row.side === 'Seller'))
  assert.deepEqual(
    rutherfordSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['Kerr Ave', 'Murfreesboro', '2025-09-23', 315000, 8],
      ['Lake Forest Dr', 'La Vergne', '2024-11-12', 350000, 8],
      ['Jana Dr', 'Smyrna', '2024-08-05', 388000, 24],
      ['Hollandale Rd', 'La Vergne', '2022-11-01', 369000, 29],
      ['Stonetree Dr', 'Murfreesboro', '2022-06-20', 675000, 5],
      ['Woodcrest Dr', 'La Vergne', '2022-03-21', 339200, 2],
      ['Pearcy St', 'La Vergne', '2022-03-11', 257000, 2],
      ['Drysdale Dr', 'Murfreesboro', '2022-02-08', 407000, 4],
      ['Tom Hailey Blvd', 'La Vergne', '2021-12-22', 250000, 16],
      ['Brandon Trl', 'Smyrna', '2021-07-20', 284900, 1],
    ],
  )

  const cities = rutherfordSellerListings.reduce<Record<string, number>>((counts, row) => {
    counts[row.city] = (counts[row.city] ?? 0) + 1
    return counts
  }, {})
  assert.deepEqual(cities, { Murfreesboro: 3, 'La Vergne': 5, Smyrna: 2 })

  for (const row of rutherfordSellerListings) {
    assert.equal(/^\d/.test(row.street), false, row.street)
    assert.equal(/\d/.test(row.street), false, row.street)
  }
  const blob = JSON.stringify(rutherfordSellerListings)
  for (const number of HOUSE_NUMBERS) {
    assert.equal(blob.includes(number), false, number)
  }
  assert.doesNotMatch(blob, /Parks|client|reviewer|quote/i)
})

test('the summary line uses the count, the three cities, 2021, and the exact median', () => {
  const days = rutherfordSellerListings.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  assert.deepEqual(days, [1, 2, 2, 4, 5, 8, 8, 16, 24, 29])
  assert.equal(medianDaysOnMarket(rutherfordSellerListings), 6.5)
  assert.equal(
    rutherfordSellerListingsSummary(),
    "I've closed 10 listings in Murfreesboro, Smyrna and La Vergne since 2021, with a median of 6.5 days on market.",
  )
})

test('the public list is the six newest listings, without house numbers', () => {
  const recent = recentRutherfordSellerListings()
  assert.equal(recent.length, 6)
  assert.deepEqual(
    recent.map((row) => [
      `${row.street}, ${row.city}`,
      formatCloseMonthYear(row.closeDate),
      formatSoldPrice(row.soldPrice),
      row.daysOnMarket,
    ]),
    [
      ['Kerr Ave, Murfreesboro', 'September 2025', '$315,000', 8],
      ['Lake Forest Dr, La Vergne', 'November 2024', '$350,000', 8],
      ['Jana Dr, Smyrna', 'August 2024', '$388,000', 24],
      ['Hollandale Rd, La Vergne', 'November 2022', '$369,000', 29],
      ['Stonetree Dr, Murfreesboro', 'June 2022', '$675,000', 5],
      ['Woodcrest Dr, La Vergne', 'March 2022', '$339,200', 2],
    ],
  )
})

test('JSON-LD names Rutherford County and the three cities and does not add reviews', () => {
  assert.deepEqual(
    rutherfordRealEstateAgentAreaServed().map((area) => [area['@type'], area.name]),
    [
      ['AdministrativeArea', 'Rutherford County'],
      ['City', 'Murfreesboro'],
      ['City', 'Smyrna'],
      ['City', 'La Vergne'],
    ],
  )

  const list = rutherfordSellerListingsItemList(recentRutherfordSellerListings())
  const json = JSON.stringify(list)
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 6)
  assert.equal(list.name, "Homes I've sold in Rutherford County")
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks/)
  assert.match(json, /Traditional listing/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const number of HOUSE_NUMBERS) {
    assert.equal(json.includes(`"${number} `) || json.includes(` ${number},`), false, number)
  }
  const names = list.itemListElement.map((item) => item.item.name)
  assert.deepEqual(names, [
    'Kerr Ave, Murfreesboro, TN',
    'Lake Forest Dr, La Vergne, TN',
    'Jana Dr, Smyrna, TN',
    'Hollandale Rd, La Vergne, TN',
    'Stonetree Dr, Murfreesboro, TN',
    'Woodcrest Dr, La Vergne, TN',
  ])
})

test('the Murfreesboro cash-offer page mounts the listings proof and the matching schema', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/RutherfordSellerListings.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')

  assert.match(page, /slug === 'murfreesboro-tn' \? <RutherfordSellerListings \/> : null/)
  assert.match(page, /rutherfordRealEstateAgentAreaServed\(\)/)
  assert.match(page, /rutherfordSellerListingsItemList\(rutherfordRows\)/)
  assert.doesNotMatch(page, /I've closed 10/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)
  assert.match(wrapper, /county="Rutherford County"/)
  assert.match(wrapper, /sellHref="\/sell\/murfreesboro-tn"/)
  assert.match(wrapper, /headingId="rutherford-listings-proof"/)
  assert.match(wrapper, /CountySellerListings/)
  assert.doesNotMatch(wrapper, /Parks/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)
  assert.match(component, /Homes I&apos;ve sold in \{county\}/)
  assert.match(component, /traditional listings I sold, not cash purchases/)
  assert.match(component, /full-market listing/)
  assert.match(component, /TREC #351484/)
  assert.match(component, /Compass Real Estate/)
  assert.match(component, /licensed\s+since 2008/)
  assert.match(component, /615-551-2727/)
  assert.doesNotMatch(component, /Parks/)
  assert.doesNotMatch(component, /615-551-3399|6155513399/)
  assert.doesNotMatch(component, /AggregateRating|@type': 'Review'/)

  const localAt = page.indexOf('Why Sell for Cash in')
  const proofAt = page.indexOf("slug === 'murfreesboro-tn' ? <RutherfordSellerListings /> : null")
  const situationsAt = page.indexOf('We Buy in Any Situation')
  assert.ok(localAt > 0 && proofAt > localAt && situationsAt > proofAt)
})
