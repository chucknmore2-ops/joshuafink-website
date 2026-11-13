import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { medianDaysOnMarket } from './county-seller-listings.ts'
import { formatCloseMonthYear, formatSoldPrice } from './closings.ts'
import {
  recentDavidsonSellerListings,
  davidsonRealEstateAgentAreaServed,
  davidsonSellerListings,
  davidsonSellerListingsItemList,
  davidsonSellerListingsSummary,
} from './davidson-seller-listings.ts'

const HOUSE_NUMBERS = [
  '107',
  '6612',
  '131',
  '2420',
  '634',
  '709',
  '134',
  '4913',
  '2412',
  '121',
  '2206',
  '905',
  '3820',
  '4306',
  '635',
  '1216',
  '133',
  '632',
  '513',
  '1008',
  '4937',
  '2017',
  '2101',
  '1900',
  '6140',
  '820',
  '706',
  '1408',
  '4716',
  '627',
  '27',
  '4598',
  '4001',
  '1409',
  '927',
  '5821',
  '2304',
  '332',
  '2300',
  '3330',
  '217',
  '321',
  '5600B',
  '808',
  '3132',
  '585',
  '224',
  '2733',
  '3633',
  '830',
  '13336',
  '5825',
  '816',
  '5819',
  '1349',
  '8120',
  '548',
  '3025',
  '4700',
  '738',
  '106',
  '3688',
  '431',
  '2944',
  '6417',
]

test('Davidson seller listings are the sixty-seven supplied closings and nothing else', () => {
  assert.equal(davidsonSellerListings.length, 67)
  assert.ok(davidsonSellerListings.every((row) => row.side === 'Seller'))
  assert.deepEqual(
    davidsonSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['Garwood Dr', 'Nashville', '2026-07-02', 405000, 21],
      ['Fox Hollow Rd', 'Nashville', '2026-06-17', 905000, 16],
      ['Lakeside Dr', 'Nashville', '2026-04-30', 269900, 30],
      ['Pafford Dr', 'Nashville', '2026-04-28', 540000, 12],
      ['N 5th St', 'Nashville', '2026-03-31', 315000, 32],
      ['Neelys Bend Rd', 'Nashville', '2026-03-26', 319900, 131],
      ['Ray Ave', 'Nashville', '2025-07-23', 315000, 15],
      ['Boyd Dr', 'Nashville', '2025-05-23', 349900, 44],
      ['Kimberly Dr', 'Nashville', '2025-05-19', 515000, 10],
      ['Ray Ave', 'Nashville', '2025-05-16', 300000, 2],
      ['Fox Ave', 'Nashville', '2025-04-30', 399900, 7],
      ['Whiteheath Ct', 'Nashville', '2025-03-05', 950000, 22],
      ['Dubois Dr', 'Nashville', '2025-03-03', 350000, 10],
      ['Saunders Ave', 'Nashville', '2025-03-03', 489900, 10],
      ['Westboro Dr', 'Nashville', '2024-12-13', 465000, 14],
      ['Argle Ave', 'Nashville', '2024-11-25', 349900, 18],
      ['Luna Dr', 'Nashville', '2024-10-25', 405000, 25],
      ['Fedders Dr', 'Nashville', '2024-09-13', 369000, 6],
      ['Tobylynn Dr', 'Nashville', '2024-09-05', 477000, 21],
      ['Cheyenne Trce', 'Nashville', '2024-08-16', 325000, 34],
      ['Pebble Creek Dr', 'Nashville', '2024-08-06', 370000, 20],
      ['Kirkwall Dr', 'Nashville', '2024-07-19', 599900, 0],
      ['Jones Ave', 'Nashville', '2024-07-16', 535000, 21],
      ['Richard Jones Rd', 'Nashville', '2024-06-27', 330000, 5],
      ['Hampton Hall Way', 'Nashville', '2024-06-07', 405000, 30],
      ['Garrison Dr', 'Nashville', '2024-05-21', 350000, 5],
      ['Brook Hollow Rd', 'Nashville', '2024-05-10', 850000, 0],
      ['Elliston St', 'Nashville', '2023-12-08', 284900, 32],
      ['Arapaho Bnd', 'Nashville', '2023-11-22', 360000, 13],
      ['Nashua Ln', 'Nashville', '2023-10-27', 350000, 6],
      ['Jay St', 'Nashville', '2023-09-18', 438000, 12],
      ['Artelia Dr', 'Nashville', '2023-07-12', 339000, 9],
      ['Anderson Rd', 'Nashville', '2023-01-10', 269000, 27],
      ['Timber Valley Dr', 'Nashville', '2022-08-30', 339000, 8],
      ['Lemont Dr', 'Nashville', '2022-08-04', 397000, 16],
      ['Leslie Ave', 'Nashville', '2022-07-08', 480000, 29],
      ['Modena Dr', 'Nashville', '2022-06-27', 349900, 14],
      ['Ocala Drive', 'Nashville', '2022-06-25', 430000, 12],
      ['Kimberly Dr', 'Nashville', '2022-05-23', 499900, 5],
      ['Goodland Rd', 'Nashville', '2022-05-17', 480000, 1],
      ['Flora Maxwell Rd', 'Nashville', '2022-05-09', 309900, 33],
      ['53rd Ave N', 'Nashville', '2022-05-06', 475000, 40],
      ['Kendall Dr', 'Nashville', '2022-04-21', 549900, 2],
      ['Heritage Cir', 'Nashville', '2022-04-04', 280000, 0],
      ['Boulder Park Dr', 'Nashville', '2022-02-17', 345000, 10],
      ['Hill Creek Dr', 'Nashville', '2022-02-11', 415000, 7],
      ['Ridgeway Dr', 'Nashville', '2022-02-10', 338000, 4],
      ['Bullock Ave', 'Nashville', '2022-02-04', 340000, 10],
      ['Scott Ave', 'Nashville', '2022-01-12', 425000, 0],
      ['Donna Kay Dr', 'Nashville', '2022-01-10', 340000, 11],
      ['Douglas Ave', 'Nashville', '2021-12-21', 379900, 4],
      ['Old Hickory Blvd', 'Nashville', '2021-11-29', 500000, 4],
      ['Labrador Ln', 'Nashville', '2021-10-29', 325000, 1],
      ['Redfern Ct', 'Nashville', '2021-10-26', 350000, 13],
      ['Neelys Bend Rd', 'Nashville', '2021-10-15', 190000, 8],
      ['Leslie Ave', 'Nashville', '2021-09-29', 269900, 4],
      ['Apple Valley Rd', 'Nashville', '2021-09-10', 283000, 6],
      ['Bonnafair Dr', 'Nashville', '2021-06-30', 290000, 11],
      ['Rural Hill Rd', 'Nashville', '2021-06-29', 323422, 2],
      ['Cedarcliff Ct', 'Nashville', '2021-06-18', 305000, 0],
      ['Grinstead Pl', 'Nashville', '2021-04-30', 325000, 0],
      ['Croley Dr', 'Nashville', '2021-04-27', 319900, 7],
      ['Oak Park Dr', 'Nashville', '2021-04-14', 219000, 72],
      ['Tampa Dr', 'Nashville', '2021-04-05', 374900, 3],
      ['Hickman St', 'Nashville', '2021-03-16', 155000, 35],
      ['Lyndale Dr', 'Nashville', '2021-02-17', 260000, 10],
      ['Cloverbrook Dr', 'Nashville', '2021-02-09', 630000, 18],
    ],
  )

  const cities = davidsonSellerListings.reduce<Record<string, number>>((counts, row) => {
    counts[row.city] = (counts[row.city] ?? 0) + 1
    return counts
  }, {})
  assert.deepEqual(cities, { Nashville: 67 })

  const neelys = davidsonSellerListings.filter((row) => row.street === 'Neelys Bend Rd')
  assert.deepEqual(
    neelys.map((row) => [row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['2026-03-26', 319900, 131],
      ['2021-10-15', 190000, 8],
    ],
  )
  assert.equal(davidsonSellerListings.filter((row) => row.street === 'Ray Ave').length, 2)
  assert.equal(davidsonSellerListings.filter((row) => row.street === 'Kimberly Dr').length, 2)
  assert.equal(davidsonSellerListings.filter((row) => row.street === 'Leslie Ave').length, 2)

  for (const row of davidsonSellerListings) {
    assert.equal(/^\d/.test(row.street) && !/^\d+(?:st|nd|rd|th)\b/i.test(row.street), false, row.street)
  }
  const streets = davidsonSellerListings.map((row) => row.street).join('\n')
  for (const number of HOUSE_NUMBERS) {
    assert.equal(streets.includes(number), false, number)
  }
  assert.equal(streets.includes('H4'), false)
  assert.equal(streets.includes('S155'), false)
  assert.equal(streets.includes('#'), false)
  const blob = JSON.stringify(davidsonSellerListings)
  assert.doesNotMatch(blob, /Parks|client|reviewer|quote/i)
})

test('the summary line uses the count, Nashville, 2021, and the exact median', () => {
  const days = davidsonSellerListings.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  assert.equal(days.length, 67)
  assert.equal(days[33], 10)
  assert.equal(medianDaysOnMarket(davidsonSellerListings), 10)
  assert.equal(
    davidsonSellerListingsSummary(),
    "I've closed 67 listings in Nashville since 2021, with a median of 10 days on market.",
  )
})

test('the public list is the six newest distinct streets, without house numbers', () => {
  const recent = recentDavidsonSellerListings()
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
      ['Garwood Dr, Nashville', 'July 2026', '$405,000', 21],
      ['Fox Hollow Rd, Nashville', 'June 2026', '$905,000', 16],
      ['Lakeside Dr, Nashville', 'April 2026', '$269,900', 30],
      ['Pafford Dr, Nashville', 'April 2026', '$540,000', 12],
      ['N 5th St, Nashville', 'March 2026', '$315,000', 32],
      ['Neelys Bend Rd, Nashville', 'March 2026', '$319,900', 131],
    ],
  )
  assert.equal(
    recent.some((row) => row.street === 'Neelys Bend Rd' && row.closeDate === '2021-10-15'),
    false,
  )
  const allDistinct = recentDavidsonSellerListings(100)
  assert.equal(allDistinct.length, 63)
  assert.equal(new Set(allDistinct.map((row) => row.street)).size, 63)
})

test('JSON-LD names Davidson County and Nashville and does not add reviews', () => {
  assert.deepEqual(
    davidsonRealEstateAgentAreaServed().map((area) => [area['@type'], area.name]),
    [
      ['AdministrativeArea', 'Davidson County'],
      ['City', 'Nashville'],
    ],
  )

  const list = davidsonSellerListingsItemList(recentDavidsonSellerListings())
  const json = JSON.stringify(list)
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 6)
  assert.equal(list.name, "Homes I've sold in Davidson County")
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks/)
  assert.match(json, /Traditional listing/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const number of HOUSE_NUMBERS) {
    assert.equal(json.includes(`"${number} `) || json.includes(` ${number},`), false, number)
  }
  assert.equal(json.includes('H4'), false)
  assert.equal(json.includes('S155'), false)
  const names = list.itemListElement.map((item) => item.item.name)
  assert.deepEqual(names, [
    'Garwood Dr, Nashville, TN',
    'Fox Hollow Rd, Nashville, TN',
    'Lakeside Dr, Nashville, TN',
    'Pafford Dr, Nashville, TN',
    'N 5th St, Nashville, TN',
    'Neelys Bend Rd, Nashville, TN',
  ])
})

test('the Nashville cash-offer page mounts the listings proof and the matching schema', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/DavidsonSellerListings.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')

  assert.match(page, /slug === 'nashville-tn' \? <DavidsonSellerListings \/> : null/)
  assert.match(page, /davidsonRealEstateAgentAreaServed\(\)/)
  assert.match(page, /davidsonSellerListingsItemList\(davidsonRows\)/)
  assert.doesNotMatch(page, /slug === 'nashville-tn' \? <RutherfordSellerListings/)
  assert.doesNotMatch(page, /slug === 'nashville-tn' \? <WilliamsonSellerListings/)
  assert.doesNotMatch(page, /I've closed 67/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)
  assert.match(wrapper, /county="Davidson County"/)
  assert.match(wrapper, /sellHref="\/sell\/nashville-tn"/)
  assert.match(wrapper, /headingId="davidson-listings-proof"/)
  assert.match(wrapper, /CountySellerListings/)
  assert.doesNotMatch(wrapper, /Parks/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)
  assert.match(component, /traditional listings I sold, not cash purchases/)
  assert.match(component, /full-market listing/)
  assert.match(component, /Compass Real Estate/)
  assert.match(component, /615-551-2727/)
  assert.doesNotMatch(component, /Parks/)

  const localAt = page.indexOf('Why Sell for Cash in')
  const proofAt = page.indexOf("slug === 'nashville-tn' ? <DavidsonSellerListings /> : null")
  const situationsAt = page.indexOf('We Buy in Any Situation')
  assert.ok(localAt > 0 && proofAt > localAt && situationsAt > proofAt)
})
