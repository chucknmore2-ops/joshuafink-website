import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { formatCloseMonthYear } from './closings.ts'
import {
  brentwoodSellerListingsItemList,
  brentwoodSellerListingsSummary,
  recentBrentwoodSellerListings,
} from './brentwood-seller-listings.ts'
import { citywideStatsCitation, suburbs } from './suburbs.ts'

const SALE_PRICES = [
  '1800000',
  '1225000',
  '2675000',
  '1550000',
  '1960000',
  '1100000',
  '3500000',
  '1599000',
  '1299000',
]
const HOUSE_NUMBERS = ['1901', '9560', '9209', '9208', '8117', '9242', '9499', '1743', '9407']

test('the Brentwood buyer ItemList names the street and the city and omits the price', () => {
  const rows = recentBrentwoodSellerListings()
  const list = brentwoodSellerListingsItemList(rows, { includePrice: false })
  const json = JSON.stringify(list)

  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 6)
  assert.equal(list.name, "Homes I've sold in Williamson County")
  assert.doesNotMatch(json, /"price"|"priceCurrency"/)
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks/)
  assert.match(json, /Traditional listing/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const price of SALE_PRICES) assert.equal(json.includes(price), false, price)
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
  assert.deepEqual(
    rows.map((row) => [formatCloseMonthYear(row.closeDate), row.daysOnMarket]),
    [
      ['August 2026', 13],
      ['July 2026', 60],
      ['May 2026', 17],
      ['June 2024', 29],
      ['June 2023', 51],
      ['March 2023', 3],
    ],
  )
  assert.equal(
    brentwoodSellerListingsSummary(),
    "I've closed 10 listings in Brentwood since 2022, with a median of 15.5 days on market.",
  )

  const priced = brentwoodSellerListingsItemList(rows)
  assert.equal(priced.itemListElement[0].item.price, 1800000)
  assert.equal(priced.itemListElement[0].item.priceCurrency, 'USD')
})

test('the Brentwood buyer page mounts the sales section after the local intro', () => {
  const page = readFileSync(new URL('../app/buy/[suburb]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/BrentwoodBuyerSales.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')
  const faqs = (suburbs['brentwood-tn'].buyerFaqs ?? []).map((faq) => `${faq.q} ${faq.a}`).join('\n')

  assert.match(page, /slug === 'brentwood-tn' \? recentBrentwoodSellerListings\(\) : null/)
  assert.match(page, /brentwoodSellerListingsItemList\(brentwoodSales, \{ includePrice: false \}\)/)
  assert.match(page, /slug === 'brentwood-tn' \? <BrentwoodBuyerSales \/> : null/)
  assert.doesNotMatch(page, /slug === 'murfreesboro-tn' \? <BrentwoodBuyerSales/)
  assert.doesNotMatch(page, /slug === 'franklin-tn' \? <BrentwoodBuyerSales/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)

  assert.match(wrapper, /county="Williamson County"/)
  assert.match(wrapper, /heading="Joshua's recent Brentwood sales"/)
  assert.match(wrapper, /headingId="brentwood-buyer-sales"/)
  assert.match(wrapper, /sellHref="\/sell\/brentwood-tn"/)
  assert.match(wrapper, /cashOfferHref="\/cash-offer\/brentwood-tn"/)
  assert.match(wrapper, /showPrices=\{false\}/)
  assert.match(wrapper, /CountySellerListings/)
  assert.doesNotMatch(wrapper, /Parks|client|formatSoldPrice|soldPrice/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)

  assert.match(component, /Homes I&apos;ve sold in \{county\}/)
  assert.match(component, /showPrices \? <span>Price<\/span> : null/)
  assert.match(component, /traditional listings I sold, not cash purchases/)
  assert.match(component, /full-market listing/)
  assert.match(component, /TREC #351484/)
  assert.match(component, /licensed\s+since 2008/)
  assert.match(component, /615-551-2727/)
  assert.match(component, /cashOfferHref = '#cash-offer-form'/)
  assert.doesNotMatch(component, /Parks/)
  assert.doesNotMatch(component, /615-551-3399|6155513399/)
  assert.doesNotMatch(component, /AggregateRating|@type': 'Review'/)

  const localAt = page.indexOf('What Buyers Need to Know')
  const proofAt = page.indexOf("slug === 'brentwood-tn' ? <BrentwoodBuyerSales /> : null")
  const homesAt = page.indexOf('Homes for Sale in {suburb.name}')
  const faqAt = page.indexOf('Buying a Home in {suburb.name} — FAQ')
  assert.ok(localAt > 0 && proofAt > localAt && homesAt > proofAt && faqAt > homesAt)

  assert.equal(citywideStatsCitation(suburbs['brentwood-tn']), 'Source: Redfin, as of November 19, 2026')
  assert.equal(suburbs['brentwood-tn'].medianPrice, '$1,281,609')
  assert.equal(suburbs['brentwood-tn'].avgDaysOnMarket, 62)
  assert.match(page, /citywideStatsCitation\(suburb\)/)
  assert.match(page, /\{suburb\.medianPrice\}/)
  assert.match(page, /\{suburb\.avgDaysOnMarket\}/)
  assert.doesNotMatch(faqs, /New Bristol|Dresden Sq|Duncaster|Hilldale Dr|Lehigh Dr|Stillbrook/)
})
