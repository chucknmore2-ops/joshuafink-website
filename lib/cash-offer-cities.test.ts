import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getCashOfferCity } from './cash-offer-cities.ts'
import { suburbs, citywideStatsCitation } from './suburbs.ts'
import { compactMedian } from './moving-faqs.ts'

test('Franklin cash-offer copy uses the same Redfin median as /buy/franklin-tn', () => {
  const city = getCashOfferCity('franklin-tn')
  assert.ok(city)

  const franklin = suburbs['franklin-tn']
  const compact = compactMedian(franklin.medianPriceNum)
  const citation = citywideStatsCitation(franklin)

  assert.equal(franklin.medianPrice, '$869,565')
  assert.equal(compact, '$870K')
  assert.equal(citation, 'Source: Redfin, as of August 20, 2026')

  assert.match(city.localAngle, /\$870,000/)
  assert.match(city.localAngle, /Redfin/)
  assert.match(city.localAngle, /August 20, 2026/)
  assert.doesNotMatch(city.localAngle, /\$650,000/)

  const repairFaq = city.faqs.find((f) => /repairs/i.test(f.q))
  assert.ok(repairFaq)
  assert.match(repairFaq.a, /\$870K-median/)
  assert.match(repairFaq.a, /Redfin/)
  assert.doesNotMatch(repairFaq.a, /\$650K/)
})
