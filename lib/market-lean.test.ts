import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { suburbs } from './suburbs.ts'
import { marketConditionSentence, marketLean, type MarketLeanInput } from './market-lean.ts'

const CENSUS =
  'Population is not what is loosening that inventory: the April 1, 2020 Census counted 45,373 residents, and the U.S. Census Bureau estimates 45,313 as of July 1, 2025, a change of -0.1% from the April 1, 2020 estimates base (U.S. Census Bureau QuickFacts; Population Estimates, Vintage 2025).'

// Explicit market-condition claims. "Rewards sellers who present correctly"
// and "first-time-buyer-friendly" are not a citywide lean, so they stay out.
const SELLER_CONDITION =
  /seller-favor|seller's market|sellers' market|seller-friendly|strong seller market|inventory remains tight|tight relative to demand|squarely in seller/i
const BUYER_CONDITION =
  /buyer's market|buyers' market|(?<!first-time-)buyer-friendly|buyer-favorable/i

function contradiction(description: string, lean: string): string | null {
  const sellerLean = lean === 'Strong Seller Market' || lean === 'Seller-Favored'
  if (SELLER_CONDITION.test(description) && !sellerLean) {
    return `seller-market wording against ${lean}`
  }
  if (BUYER_CONDITION.test(description) && lean !== 'Balanced / Buyer-Friendly') {
    return `buyer-friendly wording against ${lean}`
  }
  return null
}

test('marketLean is the market report rule for days on market and price change', () => {
  const cases: Array<[MarketLeanInput, string]> = [
    [{ avgDaysOnMarket: 63, yoyChange: '+5.1%' }, 'Balanced / Buyer-Friendly'],
    [{ avgDaysOnMarket: 22, yoyChange: '+4%' }, 'Strong Seller Market'],
    [{ avgDaysOnMarket: 23, yoyChange: '+4%' }, 'Seller-Favored'],
    [{ avgDaysOnMarket: 30, yoyChange: '+3%' }, 'Seller-Favored'],
    [{ avgDaysOnMarket: 31, yoyChange: '+3%' }, 'Healthy / Balanced'],
    [{ avgDaysOnMarket: 39, yoyChange: '+2%' }, 'Healthy / Balanced'],
    [{ avgDaysOnMarket: 40, yoyChange: '+12.43%' }, 'Balanced / Buyer-Friendly'],
    [{ avgDaysOnMarket: 20, yoyChange: '+1%' }, 'Balanced / Buyer-Friendly'],
  ]
  for (const [input, lean] of cases) {
    assert.equal(marketLean(input).lean, lean)
    const sentence = marketConditionSentence(input)
    assert.equal(sentence, `The market is currently ${lean.toLowerCase()}.`)
    assert.doesNotMatch(sentence, /\d/)
  }
  assert.equal(marketLean(null).lean, 'Balanced')
})

test('Brentwood context sentence follows the same label as the summary', () => {
  const brentwood = suburbs['brentwood-tn']
  const lean = marketLean(brentwood)
  const sentence = marketConditionSentence(brentwood)

  assert.equal(brentwood.avgDaysOnMarket, 63)
  assert.equal(brentwood.yoyChange, '+5.1%')
  assert.equal(lean.lean, 'Balanced / Buyer-Friendly')
  assert.equal(sentence, 'The market is currently balanced / buyer-friendly.')
  assert.equal(brentwood.description.split(sentence).length - 1, 1)
  assert.doesNotMatch(brentwood.description, /seller-favoring/)
  assert.doesNotMatch(brentwood.description, /Inventory remains tight relative to demand/)
  assert.doesNotMatch(brentwood.description, /\{\{marketCondition\}\}/)
  assert.match(brentwood.description, /Working with the right agent isn't just helpful in Brentwood/)
  assert.ok(brentwood.description.includes(CENSUS), 'census population line should be unchanged')
  assert.ok(
    brentwood.description.indexOf(sentence) < brentwood.description.indexOf(CENSUS),
    'condition sentence stays ahead of the census line',
  )
})

test('no market context paragraph contradicts its computed label', () => {
  for (const suburb of Object.values(suburbs)) {
    assert.equal(suburb.description.includes('{{marketCondition}}'), false, suburb.slug)
    const lean = marketLean(suburb).lean
    const problem = contradiction(suburb.description, lean)
    assert.equal(problem, null, `${suburb.slug}: ${problem}`)
  }
})

test('market report page uses the shared marketLean helper', () => {
  const page = readFileSync(new URL('../app/market/[suburb]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /import \{ marketLean \} from '@\/lib\/market-lean'/)
  assert.match(page, /const lean = marketLean\(s\)/)
  assert.match(page, /\{lean\.lean\}/)
  assert.match(page, /The \{s\.name\} Market in Context/)
  assert.match(page, /\{s\.description\}/)
  assert.doesNotMatch(page, /function marketLean/)
})
