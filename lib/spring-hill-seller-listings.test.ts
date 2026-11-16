import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cityClosingProof, closingGroups } from './closings.ts'
import { medianDaysOnMarket } from './county-seller-listings.ts'
import { formatCloseMonthYear, formatSoldPrice } from './closings.ts'
import { columbiaSellerListings } from './columbia-seller-listings.ts'
import {
  recentSpringHillSellerListings,
  springHillNearbyColumbiaNote,
  springHillRealEstateAgentAreaServed,
  springHillSellerListings,
  springHillSellerListingsItemList,
  springHillSellerListingsSummary,
} from './spring-hill-seller-listings.ts'
import { williamsonSellerListings } from './williamson-seller-listings.ts'

const HOUSE_NUMBERS = ['3516', '1122', '1026', '3932']

test('Spring Hill seller listings are the four supplied closings and nothing else', () => {
  assert.equal(springHillSellerListings.length, 4)
  assert.ok(springHillSellerListings.every((row) => row.side === 'Seller'))
  assert.ok(springHillSellerListings.every((row) => row.city === 'Spring Hill'))
  assert.deepEqual(
    springHillSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['Greens Mill Rd', 'Spring Hill', '2022-10-13', 470000, 14],
      ['John Sharp Rd', 'Spring Hill', '2021-12-06', 284900, 5],
      ['Nealcrest Cir', 'Spring Hill', '2021-05-17', 475000, 19],
      ['Kedron Rd', 'Spring Hill', '2021-03-16', 335000, 1],
    ],
  )

  const fromWilliamson = williamsonSellerListings
    .filter((row) => row.city === 'Spring Hill')
    .map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket])
  assert.deepEqual(
    springHillSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    fromWilliamson,
  )

  const streets = springHillSellerListings.map((row) => row.street).join('\n')
  for (const number of HOUSE_NUMBERS) {
    assert.equal(streets.includes(number), false, number)
  }
  const blob = JSON.stringify(springHillSellerListings)
  assert.doesNotMatch(blob, /Parks|client|reviewer|quote/i)
  assert.doesNotMatch(blob, /Columbia|Franklin|Brentwood/)
})

test('the summary states four Spring Hill listings and the exact 9.5 median', () => {
  const days = springHillSellerListings.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  assert.deepEqual(days, [1, 5, 14, 19])
  assert.equal(medianDaysOnMarket(springHillSellerListings), 9.5)
  assert.equal(
    springHillSellerListingsSummary(),
    "I've closed 4 listings in Spring Hill since 2021, with a median of 9.5 days on market.",
  )
  assert.doesNotMatch(springHillSellerListingsSummary(), /39|65|Williamson|Maury|Franklin|Brentwood|2022/)
})

test('the Columbia note uses the since-2022 Columbia count and does not inflate Spring Hill', () => {
  assert.equal(columbiaSellerListings.length, 39)
  assert.equal(
    springHillNearbyColumbiaNote(),
    "Nearby in Maury County, I've closed 39 homes in Columbia since 2022.",
  )
  assert.doesNotMatch(springHillNearbyColumbiaNote(), /65|2020|Williamson|Franklin|Brentwood|Spring Hill/)
  assert.equal(springHillNearbyColumbiaNote(columbiaSellerListings), springHillNearbyColumbiaNote())
})

test('the public list is all four streets, newest first', () => {
  const recent = recentSpringHillSellerListings()
  assert.equal(recent.length, 4)
  assert.equal(recent.length, springHillSellerListings.length)
  assert.deepEqual(
    recent.map((row) => [
      `${row.street}, ${row.city}`,
      formatCloseMonthYear(row.closeDate),
      formatSoldPrice(row.soldPrice),
      row.daysOnMarket,
    ]),
    [
      ['Greens Mill Rd, Spring Hill', 'October 2022', '$470,000', 14],
      ['John Sharp Rd, Spring Hill', 'December 2021', '$284,900', 5],
      ['Nealcrest Cir, Spring Hill', 'May 2021', '$475,000', 19],
      ['Kedron Rd, Spring Hill', 'March 2021', '$335,000', 1],
    ],
  )
})

test('JSON-LD names Spring Hill only and does not add reviews', () => {
  assert.deepEqual(
    springHillRealEstateAgentAreaServed().map((area) => [area['@type'], area.name]),
    [
      ['AdministrativeArea', 'Spring Hill'],
      ['City', 'Spring Hill'],
    ],
  )

  const list = springHillSellerListingsItemList(recentSpringHillSellerListings())
  const json = JSON.stringify(list)
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 4)
  assert.equal(list.name, "Homes I've sold in Spring Hill")
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks|Columbia|Maury|Williamson/)
  assert.match(json, /Traditional listing/)
  assert.match(json, /1 day on market/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const number of HOUSE_NUMBERS) {
    assert.equal(json.includes(`"${number} `) || json.includes(` ${number},`), false, number)
  }
  const names = list.itemListElement.map((item) => item.item.name)
  assert.deepEqual(names, [
    'Greens Mill Rd, Spring Hill, TN',
    'John Sharp Rd, Spring Hill, TN',
    'Nealcrest Cir, Spring Hill, TN',
    'Kedron Rd, Spring Hill, TN',
  ])
})

test('the Spring Hill cash-offer page mounts its own proof and not the Williamson list', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/SpringHillSellerListings.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')
  const sold = readFileSync(new URL('../app/sold/page.tsx', import.meta.url), 'utf8')

  assert.equal(cityClosingProof('Spring Hill').href, '/sold#spring-hill')
  assert.equal(closingGroups().find((group) => group.city === 'Spring Hill')?.anchor, 'spring-hill')
  assert.match(sold, /id=\{group\.anchor\}/)

  assert.match(page, /slug === 'spring-hill-tn' \? <SpringHillSellerListings \/> : null/)
  assert.match(page, /springHillRealEstateAgentAreaServed\(\)/)
  assert.match(page, /springHillSellerListingsItemList\(springHillRows\)/)
  assert.doesNotMatch(page, /slug === 'spring-hill-tn' \? <WilliamsonSellerListings/)
  assert.doesNotMatch(page, /slug === 'spring-hill-tn' \? <ColumbiaSellerListings/)
  assert.doesNotMatch(page, /slug === 'spring-hill-tn' \? <BrentwoodSellerListings/)
  assert.doesNotMatch(page, /slug === 'columbia-tn' \? <SpringHillSellerListings/)
  assert.doesNotMatch(page, /slug === 'franklin-tn' \? <SpringHillSellerListings/)
  assert.doesNotMatch(page, /I've closed 4/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)
  assert.match(wrapper, /county="Spring Hill"/)
  assert.match(wrapper, /sellHref="\/sell\/spring-hill-tn"/)
  assert.match(wrapper, /cityClosingProof\('Spring Hill'\)/)
  assert.match(wrapper, /soldHref=\{sold\.href\}/)
  assert.match(wrapper, /headingId="spring-hill-listings-proof"/)
  assert.match(wrapper, /CountySellerListings/)
  assert.match(wrapper, /springHillNearbyColumbiaNote\(\)/)
  assert.match(wrapper, /href="\/cash-offer\/columbia-tn"/)
  assert.match(wrapper, /See the Columbia cash offer/)
  assert.doesNotMatch(wrapper, /WilliamsonSellerListings/)
  assert.doesNotMatch(wrapper, /Parks/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)
  assert.match(component, /note \?/)
  assert.match(component, /615-551-2727/)
  assert.match(component, /Compass Real Estate/)
  assert.doesNotMatch(component, /615-551-3399|6155513399/)

  const localAt = page.indexOf('Why Sell for Cash in')
  const proofAt = page.indexOf("slug === 'spring-hill-tn' ? <SpringHillSellerListings /> : null")
  const situationsAt = page.indexOf('We Buy in Any Situation')
  assert.ok(localAt > 0 && proofAt > localAt && situationsAt > proofAt)
})
