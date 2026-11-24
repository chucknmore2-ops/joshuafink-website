import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { formatCloseMonthYear } from './closings.ts'
import {
  franklinSellerListingsItemList,
  recentFranklinSellerListings,
} from './franklin-seller-listings.ts'
import { suburbs } from './suburbs.ts'

const SALE_PRICES = ['1147900', '624900', '1975000', '270000', '675000', '760000']
const HOUSE_NUMBERS = ['159', '931', '833', '601', '1012', '103']

test('the Franklin buyer ItemList names the street and the city and omits the price', () => {
  const rows = recentFranklinSellerListings()
  const list = franklinSellerListingsItemList(rows, { includePrice: false })
  const json = JSON.stringify(list)

  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 6)
  assert.equal(list.name, "Homes I've sold in Franklin")
  assert.doesNotMatch(json, /"price"|"priceCurrency"/)
  assert.doesNotMatch(json, /Review|AggregateRating/)
  assert.doesNotMatch(json, /Parks/)
  assert.match(json, /Traditional listing/)
  assert.doesNotMatch(json, /cash purchase|cash offer/i)
  for (const price of SALE_PRICES) assert.equal(json.includes(price), false, price)
  for (const number of HOUSE_NUMBERS) {
    assert.equal(json.includes(`"${number} `) || json.includes(` ${number},`) || json.includes('#H6'), false, number)
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
  assert.deepEqual(
    rows.map((row) => [formatCloseMonthYear(row.closeDate), row.daysOnMarket]),
    [
      ['August 2026', 0],
      ['January 2026', 15],
      ['March 2025', 2],
      ['January 2025', 19],
      ['July 2024', 29],
      ['March 2024', 16],
    ],
  )

  const priced = franklinSellerListingsItemList(rows)
  assert.equal(priced.itemListElement[0].item.price, 1147900)
  assert.equal(priced.itemListElement[0].item.priceCurrency, 'USD')
})

test('the Franklin buyer page mounts the sales section after the local intro', () => {
  const page = readFileSync(new URL('../app/buy/[suburb]/page.tsx', import.meta.url), 'utf8')
  const wrapper = readFileSync(new URL('../components/FranklinBuyerSales.tsx', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../components/CountySellerListings.tsx', import.meta.url), 'utf8')
  const faqs = (suburbs['franklin-tn'].buyerFaqs ?? []).map((faq) => `${faq.q} ${faq.a}`).join('\n')

  assert.match(page, /slug === 'franklin-tn' \? recentFranklinSellerListings\(\) : null/)
  assert.match(page, /franklinSellerListingsItemList\(franklinSales, \{ includePrice: false \}\)/)
  assert.match(page, /slug === 'franklin-tn' \? <FranklinBuyerSales \/> : null/)
  assert.doesNotMatch(page, /slug === 'murfreesboro-tn' \? <FranklinBuyerSales/)
  assert.doesNotMatch(page, /Parks/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)

  assert.match(wrapper, /county="Franklin"/)
  assert.match(wrapper, /heading="Joshua's recent Franklin sales"/)
  assert.match(wrapper, /headingId="franklin-buyer-sales"/)
  assert.match(wrapper, /sellHref="\/sell\/franklin-tn"/)
  assert.match(wrapper, /cashOfferHref="\/cash-offer\/franklin-tn"/)
  assert.match(wrapper, /showPrices=\{false\}/)
  assert.match(wrapper, /CountySellerListings/)
  assert.doesNotMatch(wrapper, /Parks|client|formatSoldPrice|soldPrice/)
  assert.doesNotMatch(wrapper, /615-551-3399|6155513399/)

  assert.match(component, /Homes I&apos;ve sold in \{county\}/)
  assert.match(component, /showPrices \? <span>Price<\/span> : null/)
  assert.match(component, /traditional listings I sold, not cash purchases/)
  assert.match(component, /full-market listing/)
  assert.match(component, /TREC #351484/)
  assert.match(component, /Compass Real Estate/)
  assert.match(component, /licensed\s+since 2008/)
  assert.match(component, /615-551-2727/)
  assert.match(component, /cashOfferHref = '#cash-offer-form'/)
  assert.doesNotMatch(component, /Parks/)
  assert.doesNotMatch(component, /615-551-3399|6155513399/)
  assert.doesNotMatch(component, /AggregateRating|@type': 'Review'/)

  const localAt = page.indexOf('What Buyers Need to Know')
  const proofAt = page.indexOf("slug === 'franklin-tn' ? <FranklinBuyerSales /> : null")
  const homesAt = page.indexOf('Homes Joshua has for sale')
  const faqAt = page.indexOf('Buying a Home in {suburb.name} — FAQ')
  assert.ok(localAt > 0 && proofAt > localAt && homesAt > proofAt && faqAt > homesAt)

  assert.match(faqs, /Redfin, as of November 19, 2026/)
  assert.doesNotMatch(faqs, /N Berwick|Glass St|Highgrove|Boyd Mill|Walton Rd|Moss Ln/)
})
