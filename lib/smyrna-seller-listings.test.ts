import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cityClosingProof, closingGroups } from './closings.ts'
import { medianDaysOnMarket } from './county-seller-listings.ts'
import { formatCloseMonthYear, formatSoldPrice } from './closings.ts'
import { rutherfordSellerListings } from './rutherford-seller-listings.ts'
import {
  recentSmyrnaSellerListings,
  smyrnaRealEstateAgentAreaServed,
  smyrnaRutherfordSalesNote,
  smyrnaSellerListings,
  smyrnaSellerListingsItemList,
  smyrnaSellerListingsSummary,
} from './smyrna-seller-listings.ts'

const HOUSE_NUMBERS = ['320', '904', '624', '588', '1516', '1009', '117']

test('Smyrna seller listings are the seven supplied closings and nothing else', () => {
  assert.equal(smyrnaSellerListings.length, 7)
  assert.ok(smyrnaSellerListings.every((row) => row.side === 'Seller'))
  assert.deepEqual(
    smyrnaSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['Lake Forest Dr', 'La Vergne', '2024-11-12', 350000, 8],
      ['Jana Dr', 'Smyrna', '2024-08-05', 388000, 24],
      ['Hollandale Rd', 'La Vergne', '2022-11-01', 369000, 29],
      ['Woodcrest Dr', 'La Vergne', '2022-03-21', 339200, 2],
      ['Pearcy St', 'La Vergne', '2022-03-11', 257000, 2],
      ['Tom Hailey Blvd', 'La Vergne', '2021-12-22', 250000, 16],
      ['Brandon Trl', 'Smyrna', '2021-07-20', 284900, 1],
    ],
  )

  const fromRutherford = rutherfordSellerListings
    .filter((row) => row.city === 'Smyrna' || row.city === 'La Vergne')
    .map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket])
  assert.deepEqual(
    smyrnaSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    fromRutherford,
  )
  assert.equal(rutherfordSellerListings.length, 10)

  const cities = smyrnaSellerListings.reduce<Record<string, number>>((counts, row) => {
    counts[row.city] = (counts[row.city] ?? 0) + 1
    return counts
  }, {})
  assert.deepEqual(cities, { Smyrna: 2, 'La Vergne': 5 })

  for (const row of smyrnaSellerListings) {
    assert.equal(/^\d/.test(row.street), false, row.street)
    assert.equal(/\d/.test(row.street), false, row.street)
  }
  const streets = smyrnaSellerListings.map((row) => row.street).join('\n')
  for (const number of HOUSE_NUMBERS) {
    assert.equal(streets.includes(number), false, number)
  }
  const blob = JSON.stringify(smyrnaSellerListings)
  assert.doesNotMatch(blob, /Parks|client|reviewer|quote/i)
  assert.doesNotMatch(blob, /Murfreesboro|Kerr Ave|Stonetree Dr|Drysdale Dr|Elm St/)
})

test('the summary states the seven-listing split and the exact 8-day median', () => {
  const days = smyrnaSellerListings.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  assert.deepEqual(days, [1, 2, 2, 8, 16, 24, 29])
  assert.equal(medianDaysOnMarket(smyrnaSellerListings), 8)
  assert.equal(
    smyrnaSellerListingsSummary(),
    "I've closed 7 listings in Smyrna and next-door La Vergne since 2021 (2 in Smyrna, 5 in La Vergne), with a median of 8 days on market.",
  )
  assert.doesNotMatch(smyrnaSellerListingsSummary(), /6\.5|10 listings|Murfreesboro|cash purchase/i)
})

test('the Rutherford note uses the county catalog and does not inflate Smyrna', () => {
  assert.equal(rutherfordSellerListings.length, 10)
  assert.equal(
    smyrnaRutherfordSalesNote(),
    "The full Rutherford County record is 10 listings since 2021, including 3 in Murfreesboro.",
  )
  assert.doesNotMatch(smyrnaRutherfordSalesNote(), /6\.5|cash purchase|7 listings/i)
  assert.equal(smyrnaRutherfordSalesNote(rutherfordSellerListings), smyrnaRutherfordSalesNote())
})

test('the public list is the six newest streets, and Brandon Trl stays in the count only', () => {
  const recent = recentSmyrnaSellerListings()
  assert.equal(recent.length, 6)
  assert.ok(recent.length < smyrnaSellerListings.length)
  assert.deepEqual(
    recent.map((row) => [
      `${row.street}, ${row.city}`,
      formatCloseMonthYear(row.closeDate),
      formatSoldPrice(row.soldPrice),
      row.daysOnMarket,
    ]),
    [
      ['Lake Forest Dr, La Vergne', 'November 2024', '$350,000', 8],
      ['Jana Dr, Smyrna', 'August 2024', '$388,000', 24],
      ['Hollandale Rd, La Vergne', 'November 2022', '$369,000', 29],
      ['Woodcrest Dr, La Vergne', 'March 2022', '$339,200', 2],
      ['Pearcy St, La Vergne', 'March 2022', '$257,000', 2],
      ['Tom Hailey Blvd, La Vergne', 'December 2021', '$250,000', 16],
    ],
  )
  assert.equal(
    recent.some((row) => row.street === 'Brandon Trl'),
    false,
  )
  assert.equal(
    smyrnaSellerListings.some((row) => row.street === 'Brandon Trl' && row.daysOnMarket === 1),
    true,
  )
})

test('JSON-LD names Smyrna and La Vergne and does not add reviews', () => {
  assert.deepEqual(
    smyrnaRealEstateAgentAreaServed().map((area) => [area['@type'], area.name]),
    [
      ['AdministrativeArea', 'Smyrna and La Vergne'],
      ['City', 'Smyrna'],
      ['City', 'La Vergne'],
    ],
  )

  const list = smyrnaSellerListingsItemList(recentSmyrnaSellerListings())
  const json = JSON.stringify(list)
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 6)
  assert.equal(list.name, "Homes I've sold in Smyrna and La Vergne")
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks|Murfreesboro|Brandon Trl/)
  assert.match(json, /Traditional listing/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const number of HOUSE_NUMBERS) {
    assert.equal(json.includes(`"${number} `) || json.includes(` ${number},`), false, number)
  }
  const names = list.itemListElement.map((item) => item.item.name)
  assert.deepEqual(names, [
    'Lake Forest Dr, La Vergne, TN',
    'Jana Dr, Smyrna, TN',
    'Hollandale Rd, La Vergne, TN',
    'Woodcrest Dr, La Vergne, TN',
    'Pearcy St, La Vergne, TN',
    'Tom Hailey Blvd, La Vergne, TN',
  ])
})

test('the Smyrna cash-offer page mounts its own proof and not the Rutherford list', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/SmyrnaSellerListings.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')
  const sold = readFileSync(new URL('../app/sold/page.tsx', import.meta.url), 'utf8')

  assert.equal(cityClosingProof('Smyrna').href, '/sold#smyrna')
  assert.equal(cityClosingProof('La Vergne').href, '/sold#la-vergne')
  assert.equal(closingGroups().find((group) => group.city === 'Smyrna')?.anchor, 'smyrna')
  assert.equal(closingGroups().find((group) => group.city === 'La Vergne')?.anchor, 'la-vergne')
  assert.match(sold, /id=\{group\.anchor\}/)

  assert.match(page, /slug === 'smyrna-tn' \? <SmyrnaSellerListings \/> : null/)
  assert.match(page, /smyrnaRealEstateAgentAreaServed\(\)/)
  assert.match(page, /smyrnaSellerListingsItemList\(smyrnaRows\)/)
  assert.doesNotMatch(page, /slug === 'smyrna-tn' \? <RutherfordSellerListings/)
  assert.doesNotMatch(page, /slug === 'smyrna-tn' \? <SpringHillSellerListings/)
  assert.doesNotMatch(page, /slug === 'la-vergne-tn' \? <SmyrnaSellerListings/)
  assert.doesNotMatch(page, /slug === 'murfreesboro-tn' \? <SmyrnaSellerListings/)
  assert.doesNotMatch(page, /I've closed 7/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)
  assert.match(wrapper, /county="Smyrna and La Vergne"/)
  assert.match(wrapper, /sellHref="\/sell\/smyrna-tn"/)
  assert.match(wrapper, /cityClosingProof\('Smyrna'\)/)
  assert.match(wrapper, /soldHref=\{sold\.href\}/)
  assert.match(wrapper, /headingId="smyrna-listings-proof"/)
  assert.match(wrapper, /CountySellerListings/)
  assert.match(wrapper, /smyrnaRutherfordSalesNote\(\)/)
  assert.match(wrapper, /href="\/cash-offer\/murfreesboro-tn"/)
  assert.match(wrapper, /See the Rutherford County sales/)
  assert.doesNotMatch(wrapper, /RutherfordSellerListings/)
  assert.doesNotMatch(wrapper, /Parks/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)
  assert.match(component, /note \?/)
  assert.match(component, /615-551-2727/)
  assert.match(component, /Compass Real Estate/)
  assert.doesNotMatch(component, /615-551-3399|6155513399/)

  const localAt = page.indexOf('Why Sell for Cash in')
  const proofAt = page.indexOf("slug === 'smyrna-tn' ? <SmyrnaSellerListings /> : null")
  const situationsAt = page.indexOf('We Buy in Any Situation')
  assert.ok(localAt > 0 && proofAt > localAt && situationsAt > proofAt)
})
