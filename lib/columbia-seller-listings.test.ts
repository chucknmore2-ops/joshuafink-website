import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cityClosingProof, closingGroups } from './closings.ts'
import { medianDaysOnMarket } from './county-seller-listings.ts'
import { formatCloseMonthYear, formatSoldPrice } from './closings.ts'
import {
  recentColumbiaSellerListings,
  columbiaRealEstateAgentAreaServed,
  columbiaSellerListings,
  columbiaSellerListingsItemList,
  columbiaSellerListingsSummary,
} from './columbia-seller-listings.ts'

const HOUSE_NUMBERS = [
  '223',
  '513',
  '210',
  '804',
  '303',
  '1602',
  '407',
  '114',
  '434',
  '711',
  '1707',
  '514',
  '400',
  '214',
  '1000',
  '403',
  '219',
  '1503',
  '1608',
  '142',
  '103',
  '217',
  '1021',
  '200',
  '112',
  '803',
  '301',
  '1827',
  '515',
  '608',
  '448',
  '612',
  '111',
  '110',
  '1820',
  '2204',
  '1440',
]

test('Columbia seller listings are the 39 since-2022 closings and nothing else', () => {
  assert.equal(columbiaSellerListings.length, 39)
  assert.ok(columbiaSellerListings.every((row) => row.side === 'Seller'))
  assert.ok(columbiaSellerListings.every((row) => row.city === 'Columbia'))
  assert.ok(columbiaSellerListings.every((row) => row.closeDate >= '2022-01-01'))
  assert.equal(new Set(columbiaSellerListings.map((row) => row.street)).size, 39)
  assert.deepEqual(
    columbiaSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['Hampton Rd', 'Columbia', '2026-05-04', 325000, 6],
      ['Transit Ave', 'Columbia', '2026-02-26', 335000, 23],
      ['Porter Cir', 'Columbia', '2026-02-25', 339900, 20],
      ['Brown St', 'Columbia', '2026-02-11', 235000, 18],
      ['Lee Dr', 'Columbia', '2025-10-10', 285000, 10],
      ['Annie Ln', 'Columbia', '2025-08-19', 328050, 36],
      ['6th Ave', 'Columbia', '2025-07-17', 360000, 8],
      ['W Hardin Dr', 'Columbia', '2025-06-26', 317400, 1],
      ['Hickman St', 'Columbia', '2025-04-24', 215000, 1],
      ['Lookout Dr', 'Columbia', '2025-04-04', 359900, 19],
      ['Rayburn Ave', 'Columbia', '2025-01-29', 249900, 26],
      ['Spring Ln', 'Columbia', '2024-12-23', 315000, 13],
      ['Woods Dr', 'Columbia', '2024-07-31', 317500, 54],
      ['Stonewall Rd', 'Columbia', '2024-05-24', 337500, 19],
      ['Dalton St', 'Columbia', '2024-04-26', 160000, 8],
      ['W 15th St', 'Columbia', '2024-03-22', 284900, 19],
      ['Mockingbird Dr', 'Columbia', '2024-03-15', 232000, 7],
      ['Jewell Dr', 'Columbia', '2024-02-29', 450000, 12],
      ['Whatley St', 'Columbia', '2023-12-28', 195994, 17],
      ['E 17th St', 'Columbia', '2023-12-19', 200000, 32],
      ['Napier Dr', 'Columbia', '2023-11-30', 242500, 66],
      ['N Cayce Ln', 'Columbia', '2023-09-08', 395000, 15],
      ['Birchwood Dr', 'Columbia', '2023-07-26', 290000, 3],
      ['E Valley Dr', 'Columbia', '2023-03-30', 175000, 10],
      ['Creek Trl', 'Columbia', '2023-03-22', 288000, 34],
      ['W 18th St', 'Columbia', '2023-03-06', 229900, 9],
      ['Hickory Ridge Trl', 'Columbia', '2022-11-10', 433000, 30],
      ['Santa Fe Pike', 'Columbia', '2022-11-01', 245000, 24],
      ['Dimple Ct', 'Columbia', '2022-08-19', 225000, 19],
      ['E 9th St', 'Columbia', '2022-07-08', 180000, 15],
      ['Westover Dr', 'Columbia', '2022-06-17', 89900, 21],
      ['S Laurel Cir', 'Columbia', '2022-05-31', 355000, 11],
      ['Mooresville Pike', 'Columbia', '2022-05-12', 285000, 0],
      ['Carter St', 'Columbia', '2022-04-08', 398000, 2],
      ['Morningside Ln', 'Columbia', '2022-03-21', 250000, 17],
      ['Saint Margarett Cir', 'Columbia', '2022-02-17', 300000, 3],
      ['Scribner Ave', 'Columbia', '2022-02-10', 210000, 9],
      ['Fred White Rd', 'Columbia', '2022-02-09', 219900, 6],
      ['College Park Dr', 'Columbia', '2022-01-07', 385000, 2],
    ],
  )

  const streets = columbiaSellerListings.map((row) => row.street).join('\n')
  for (const number of HOUSE_NUMBERS) {
    assert.equal(streets.includes(number), false, number)
  }
  const blob = JSON.stringify(columbiaSellerListings)
  assert.doesNotMatch(blob, /Parks|client|reviewer|quote/i)
  assert.doesNotMatch(blob, /2020-|2021-/)
})

test('the summary uses 39 Columbia listings since 2022 and the exact median of 15', () => {
  const days = columbiaSellerListings.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  assert.equal(days.length, 39)
  assert.equal(medianDaysOnMarket(columbiaSellerListings), 15)
  assert.equal(days[19], 15)
  assert.equal(
    columbiaSellerListingsSummary(),
    "I've closed 39 listings in Columbia since 2022, with a median of 15 days on market.",
  )
  assert.doesNotMatch(columbiaSellerListingsSummary(), /65|2020|2021/)
})

test('the public list is the six newest streets from 2025 and 2026', () => {
  const recent = recentColumbiaSellerListings()
  assert.equal(recent.length, 6)
  assert.equal(new Set(recent.map((row) => row.street)).size, 6)
  assert.ok(recent.every((row) => row.closeDate >= '2025-01-01'))
  assert.deepEqual(
    recent.map((row) => [
      `${row.street}, ${row.city}`,
      formatCloseMonthYear(row.closeDate),
      formatSoldPrice(row.soldPrice),
      row.daysOnMarket,
    ]),
    [
      ['Hampton Rd, Columbia', 'May 2026', '$325,000', 6],
      ['Transit Ave, Columbia', 'February 2026', '$335,000', 23],
      ['Porter Cir, Columbia', 'February 2026', '$339,900', 20],
      ['Brown St, Columbia', 'February 2026', '$235,000', 18],
      ['Lee Dr, Columbia', 'October 2025', '$285,000', 10],
      ['Annie Ln, Columbia', 'August 2025', '$328,050', 36],
    ],
  )
  assert.equal(
    recent.some((row) => row.street === 'Lookout Dr'),
    false,
  )
  assert.equal(
    columbiaSellerListings.some((row) => row.street === 'Lookout Dr' && row.closeDate === '2025-04-04'),
    true,
  )
})

test('JSON-LD names Maury County and Columbia and does not add reviews', () => {
  assert.deepEqual(
    columbiaRealEstateAgentAreaServed().map((area) => [area['@type'], area.name]),
    [
      ['AdministrativeArea', 'Maury County'],
      ['City', 'Columbia'],
    ],
  )

  const list = columbiaSellerListingsItemList(recentColumbiaSellerListings())
  const json = JSON.stringify(list)
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 6)
  assert.equal(list.name, "Homes I've sold in Maury County")
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks/)
  assert.match(json, /Traditional listing/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const number of ['223', '513', '210', '804', '303', '1602']) {
    assert.equal(json.includes(`"${number} `) || json.includes(` ${number},`), false, number)
  }
  const names = list.itemListElement.map((item) => item.item.name)
  assert.deepEqual(names, [
    'Hampton Rd, Columbia, TN',
    'Transit Ave, Columbia, TN',
    'Porter Cir, Columbia, TN',
    'Brown St, Columbia, TN',
    'Lee Dr, Columbia, TN',
    'Annie Ln, Columbia, TN',
  ])
})

test('the Columbia cash-offer page mounts the listings proof and keeps the Maury closing list', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/ColumbiaSellerListings.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')
  const sold = readFileSync(new URL('../app/sold/page.tsx', import.meta.url), 'utf8')

  assert.equal(cityClosingProof('Columbia').href, '/sold#columbia')
  assert.equal(closingGroups().find((group) => group.city === 'Columbia')?.anchor, 'columbia')
  assert.match(sold, /id=\{group\.anchor\}/)

  assert.match(page, /slug === 'columbia-tn' \? <ColumbiaSellerListings \/> : null/)
  assert.match(page, /columbiaRealEstateAgentAreaServed\(\)/)
  assert.match(page, /columbiaSellerListingsItemList\(columbiaRows\)/)
  assert.match(page, /tennesseeClosingsInCities\(\['Columbia', 'Spring Hill', 'Mount Pleasant'\]\)/)
  assert.doesNotMatch(page, /slug === 'columbia-tn' \? <SpringHillSellerListings/)
  assert.doesNotMatch(page, /slug === 'columbia-tn' \? <WilliamsonSellerListings/)
  assert.doesNotMatch(page, /slug === 'columbia-tn' \? <BrentwoodSellerListings/)
  assert.doesNotMatch(page, /slug === 'spring-hill-tn' \? <ColumbiaSellerListings/)
  assert.doesNotMatch(page, /slug === 'brentwood-tn' \? <ColumbiaSellerListings/)
  assert.doesNotMatch(page, /I've closed 39/)
  assert.doesNotMatch(page, /65 since/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)
  assert.match(wrapper, /county="Maury County"/)
  assert.match(wrapper, /sellHref="\/sell\/columbia-tn"/)
  assert.match(wrapper, /cityClosingProof\('Columbia'\)/)
  assert.match(wrapper, /soldHref=\{sold\.href\}/)
  assert.match(wrapper, /headingId="columbia-listings-proof"/)
  assert.match(wrapper, /CountySellerListings/)
  assert.doesNotMatch(wrapper, /note=/)
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
  const proofAt = page.indexOf("slug === 'columbia-tn' ? <ColumbiaSellerListings /> : null")
  const situationsAt = page.indexOf('We Buy in Any Situation')
  assert.ok(localAt > 0 && proofAt > localAt && situationsAt > proofAt)
})
