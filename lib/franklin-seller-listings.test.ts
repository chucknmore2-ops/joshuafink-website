import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { closings } from './closings-data.ts'
import { cityClosingProof, closingGroups, formatCloseMonthYear, formatSoldPrice } from './closings.ts'
import { medianDaysOnMarket } from './county-seller-listings.ts'
import {
  franklinBuyerSideNote,
  franklinClosingStreet,
  franklinRealEstateAgentAreaServed,
  franklinSellerListings,
  franklinSellerListingsItemList,
  franklinSellerListingsSummary,
  franklinWilliamsonSalesNote,
  recentFranklinSellerListings,
} from './franklin-seller-listings.ts'
import { williamsonSellerListings } from './williamson-seller-listings.ts'

const HOUSE_NUMBERS = ['159', '931', '833', '601', '1012', '103', '414', '111', '2016']

test('Franklin seller listings are the six since-2024 seller closings and nothing else', () => {
  assert.equal(franklinSellerListings.length, 6)
  assert.ok(franklinSellerListings.every((row) => row.side === 'Seller'))
  assert.ok(franklinSellerListings.every((row) => row.city === 'Franklin'))
  assert.deepEqual(
    franklinSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    [
      ['N Berwick Ln', 'Franklin', '2026-08-31', 1147900, 0],
      ['Glass St', 'Franklin', '2026-01-28', 624900, 15],
      ['Highgrove Cir', 'Franklin', '2025-03-31', 1975000, 2],
      ['Boyd Mill Ave', 'Franklin', '2025-01-30', 270000, 19],
      ['Walton Rd', 'Franklin', '2024-07-31', 675000, 29],
      ['Moss Ln', 'Franklin', '2024-03-19', 760000, 16],
    ],
  )

  const fromWilliamson = williamsonSellerListings
    .filter((row) => row.city === 'Franklin')
    .map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket])
  assert.deepEqual(
    franklinSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice, row.daysOnMarket]),
    fromWilliamson,
  )

  const fromClosingFile = closings
    .filter(
      (row) =>
        row.city === 'Franklin' &&
        row.state === 'TN' &&
        row.status === 'Closed' &&
        row.side === 'Listed and sold' &&
        row.closeDate >= '2024-01-01',
    )
    .sort((a, b) => b.closeDate.localeCompare(a.closeDate) || a.address.localeCompare(b.address))
  assert.equal(fromClosingFile.length, 6)
  assert.deepEqual(
    fromClosingFile.map((row) => [
      franklinClosingStreet(row.address),
      row.city,
      row.closeDate,
      row.soldPrice,
    ]),
    franklinSellerListings.map((row) => [row.street, row.city, row.closeDate, row.soldPrice]),
  )

  const streets = franklinSellerListings.map((row) => row.street).join('\n')
  for (const number of HOUSE_NUMBERS) {
    assert.equal(streets.includes(number), false, number)
  }
  assert.equal(streets.includes('H6'), false)
  const blob = JSON.stringify(franklinSellerListings)
  assert.doesNotMatch(blob, /Parks|client|reviewer|quote/i)
  assert.doesNotMatch(blob, /Brentwood|Spring Hill|Parish Pl|Battlefield|Glastonbury/)
})

test('the summary states six Franklin listings since 2024 and the exact 15.5 median', () => {
  const days = franklinSellerListings.map((row) => row.daysOnMarket).sort((a, b) => a - b)
  assert.deepEqual(days, [0, 2, 15, 16, 19, 29])
  assert.equal(medianDaysOnMarket(franklinSellerListings), 15.5)
  assert.equal(
    franklinSellerListingsSummary(),
    "I've closed 6 listings in Franklin since 2024, with a median of 15.5 days on market.",
  )
  assert.doesNotMatch(franklinSellerListingsSummary(), /20 listings|14\.5|Brentwood|Spring Hill|cash purchase/i)
})

test('the Williamson note uses the county catalog and does not inflate Franklin', () => {
  assert.equal(williamsonSellerListings.length, 20)
  assert.equal(
    franklinWilliamsonSalesNote(),
    'The full Williamson County record is 20 listings since 2021, including 10 in Brentwood and 4 in Spring Hill.',
  )
  assert.doesNotMatch(franklinWilliamsonSalesNote(), /15\.5|6 listings|cash purchase/i)
  assert.equal(franklinWilliamsonSalesNote(williamsonSellerListings), franklinWilliamsonSalesNote())
})

test('the buyer-side note names the three Franklin closings that are not this list', () => {
  const buyer = closings.filter((row) => row.city === 'Franklin' && row.side === 'Represented buyer')
  assert.equal(buyer.length, 3)
  assert.equal(
    franklinBuyerSideNote(),
    'The Tennessee closing file also has 3 Franklin closings where I represented the buyer (Parish Pl, Battlefield Dr and Glastonbury Dr). Those are not in this count or this median.',
  )
  assert.doesNotMatch(franklinBuyerSideNote(), /414|111 |2016|15\.5|Parks/)
  assert.equal(franklinBuyerSideNote(closings), franklinBuyerSideNote())
})

test('the public list is all six streets, newest first, without house numbers', () => {
  const recent = recentFranklinSellerListings()
  assert.equal(recent.length, 6)
  assert.equal(recent.length, franklinSellerListings.length)
  assert.deepEqual(
    recent.map((row) => [
      `${row.street}, ${row.city}`,
      formatCloseMonthYear(row.closeDate),
      formatSoldPrice(row.soldPrice),
      row.daysOnMarket,
    ]),
    [
      ['N Berwick Ln, Franklin', 'August 2026', '$1,147,900', 0],
      ['Glass St, Franklin', 'January 2026', '$624,900', 15],
      ['Highgrove Cir, Franklin', 'March 2025', '$1,975,000', 2],
      ['Boyd Mill Ave, Franklin', 'January 2025', '$270,000', 19],
      ['Walton Rd, Franklin', 'July 2024', '$675,000', 29],
      ['Moss Ln, Franklin', 'March 2024', '$760,000', 16],
    ],
  )
})

test('JSON-LD names Franklin only and does not add reviews', () => {
  assert.deepEqual(
    franklinRealEstateAgentAreaServed().map((area) => [area['@type'], area.name]),
    [
      ['AdministrativeArea', 'Franklin'],
      ['City', 'Franklin'],
    ],
  )

  const list = franklinSellerListingsItemList(recentFranklinSellerListings())
  const json = JSON.stringify(list)
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 6)
  assert.equal(list.name, "Homes I've sold in Franklin")
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks|Brentwood|Spring Hill|Williamson|Parish Pl/)
  assert.match(json, /Traditional listing/)
  assert.match(json, /0 days on market/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const number of HOUSE_NUMBERS) {
    assert.equal(json.includes(`"${number} `) || json.includes(` ${number},`), false, number)
  }
  const names = list.itemListElement.map((item) => item.item.name)
  assert.deepEqual(names, [
    'N Berwick Ln, Franklin, TN',
    'Glass St, Franklin, TN',
    'Highgrove Cir, Franklin, TN',
    'Boyd Mill Ave, Franklin, TN',
    'Walton Rd, Franklin, TN',
    'Moss Ln, Franklin, TN',
  ])
})

test('the Franklin cash-offer page mounts its own proof and not the Williamson list', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/FranklinSellerListings.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')
  const sold = readFileSync(new URL('../app/sold/page.tsx', import.meta.url), 'utf8')

  assert.equal(cityClosingProof('Franklin').href, '/sold#franklin')
  assert.equal(closingGroups().find((group) => group.city === 'Franklin')?.anchor, 'franklin')
  assert.match(sold, /id=\{group\.anchor\}/)

  assert.match(page, /slug === 'franklin-tn' \? <FranklinSellerListings \/> : null/)
  assert.match(page, /franklinRealEstateAgentAreaServed\(\)/)
  assert.match(page, /franklinSellerListingsItemList\(franklinRows\)/)
  assert.doesNotMatch(page, /slug === 'franklin-tn' \? <WilliamsonSellerListings/)
  assert.doesNotMatch(page, /slug === 'franklin-tn' \? <SpringHillSellerListings/)
  assert.doesNotMatch(page, /slug === 'brentwood-tn' \? <FranklinSellerListings/)
  assert.doesNotMatch(page, /I've closed 6/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)
  assert.match(wrapper, /county="Franklin"/)
  assert.match(wrapper, /sellHref="\/sell\/franklin-tn"/)
  assert.match(wrapper, /cityClosingProof\('Franklin'\)/)
  assert.match(wrapper, /soldHref=\{sold\.href\}/)
  assert.match(wrapper, /headingId="franklin-listings-proof"/)
  assert.match(wrapper, /CountySellerListings/)
  assert.match(wrapper, /franklinWilliamsonSalesNote\(\)/)
  assert.match(wrapper, /franklinBuyerSideNote\(\)/)
  assert.match(wrapper, /href="\/cash-offer\/brentwood-tn"/)
  assert.match(wrapper, /href="\/cash-offer\/spring-hill-tn"/)
  assert.match(wrapper, /See the Brentwood sales/)
  assert.match(wrapper, /the Spring Hill sales/)
  assert.doesNotMatch(wrapper, /WilliamsonSellerListings/)
  assert.doesNotMatch(wrapper, /Parks/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)
  assert.match(component, /note \?/)
  assert.match(component, /615-551-2727/)
  assert.match(component, /Compass Real Estate/)
  assert.doesNotMatch(component, /615-551-3399|6155513399/)

  const localAt = page.indexOf('Why Sell for Cash in')
  const proofAt = page.indexOf("slug === 'franklin-tn' ? <FranklinSellerListings /> : null")
  const situationsAt = page.indexOf('We Buy in Any Situation')
  assert.ok(localAt > 0 && proofAt > localAt && situationsAt > proofAt)
})
