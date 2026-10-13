import { test } from 'node:test'
import assert from 'node:assert/strict'
import { suburbs } from './suburbs.ts'

const franklin = suburbs['franklin-tn']
const blob = [
  franklin.description,
  franklin.buyerDescription ?? '',
  ...(franklin.whyBullets ?? []),
  ...(franklin.buyerWhyBullets ?? []),
  ...franklin.faqs.map((f) => `${f.q} ${f.a}`),
  ...(franklin.buyerFaqs ?? []).map((f) => `${f.q} ${f.a}`),
].join('\n')

test('Franklin copy does not place Governors Club in Franklin or claim a weekend seller market', () => {
  assert.doesNotMatch(blob, /Governors Club/)
  assert.doesNotMatch(blob, /first weekend/)
  assert.doesNotMatch(blob, /seller's market/i)
  assert.doesNotMatch(blob, /overwhelming buyer demand/)
  assert.match(blob, /83,454/)
  assert.match(blob, /90,226/)
  assert.match(blob, /\$862,929/)
  assert.match(blob, /Redfin, as of October 5, 2026/)
  assert.match(blob, /median days on market is 49/)
  assert.match(blob, /Westhaven/)
  assert.match(blob, /Cool Springs/)
  assert.match(blob, /Fieldstone Farms/)
  assert.match(blob, /Who should I hire in Franklin, TN/)
  assert.match(blob, /8119 Isabella Lane, Suite 105, Brentwood, TN 37027/)
  assert.match(blob, /TREC #351484/)
  assert.match(blob, /Licensed since 2008/)
  assert.match(blob, /40\+ homes a year in Middle Tennessee/)
  assert.match(blob, /615-551-2727/)
  assert.match(blob, /Centennial High corridor/)
  assert.match(blob, /walkable master-planned community with a town center/)
  assert.match(blob, /larger lots and mature trees/)
})

test('Franklin buy and sell pages render the who-to-hire section', async () => {
  const { readFileSync } = await import('node:fs')
  const buy = readFileSync(new URL('../app/buy/[suburb]/page.tsx', import.meta.url), 'utf8')
  const sell = readFileSync(new URL('../app/sell/[suburb]/page.tsx', import.meta.url), 'utf8')
  const section = readFileSync(new URL('../components/FranklinWhoToHire.tsx', import.meta.url), 'utf8')
  assert.match(buy, /slug === 'franklin-tn' && <FranklinWhoToHire/)
  assert.match(sell, /slug === 'franklin-tn' && <FranklinWhoToHire/)
  assert.match(section, /Who to hire in Franklin/)
  assert.match(section, /Compass Brentwood office/)
  assert.match(section, /8119 Isabella Lane, Suite 105, Brentwood, TN 37027/)
  assert.match(section, /TREC #351484/)
  assert.match(section, /Licensed since 2008/)
  assert.match(section, /40\+ homes a year in Middle Tennessee/)
  assert.match(section, /615-551-2727/)
  assert.match(section, /Cool Springs/)
  assert.match(section, /Westhaven/)
  assert.match(section, /Fieldstone Farms/)
  assert.doesNotMatch(section, /Governors Club/)
})

test('Brentwood still owns the Governors Club mention', () => {
  const brentwood = [
    suburbs['brentwood-tn'].description,
    ...suburbs['brentwood-tn'].faqs.map((f) => f.a),
  ].join('\n')
  assert.match(brentwood, /Governors Club/)
})
