import { test } from 'node:test'
import assert from 'node:assert/strict'
import { suburbs } from './suburbs.ts'
import { latestSnapshot, marketUpdateSlug } from './market-snapshot.ts'
import { cityMedian, compactMedian, homesCostFaqAnswer } from './moving-faqs.ts'

test('homes-cost FAQ quotes the same Redfin city medians as the city cards', () => {
  const answer = homesCostFaqAnswer()
  const williamson = [
    'spring-hill-tn',
    'franklin-tn',
    'nolensville-tn',
    'brentwood-tn',
  ] as const

  for (const slug of williamson) {
    assert.ok(
      answer.includes(cityMedian(slug)),
      `FAQ should include ${slug} compact median ${cityMedian(slug)}`,
    )
  }

  // Pin the rounded figures the city cards currently display.
  assert.equal(compactMedian(suburbs['spring-hill-tn'].medianPriceNum), '$532K')
  assert.equal(compactMedian(suburbs['nolensville-tn'].medianPriceNum), '$935K')
  assert.equal(compactMedian(suburbs['franklin-tn'].medianPriceNum), '$870K')
  assert.equal(compactMedian(suburbs['brentwood-tn'].medianPriceNum), '$1.40M')

  assert.match(answer, /Source: Redfin|same Redfin city medians/)
  assert.match(answer, /Greater Nashville REALTORS/)
  assert.ok(answer.includes(`/blog/${marketUpdateSlug(latestSnapshot()!.month)}`))
})

test('homes-cost FAQ no longer quotes the old Williamson ballparks', () => {
  const answer = homesCostFaqAnswer()
  assert.doesNotMatch(answer, /\$450Ks/)
  assert.doesNotMatch(answer, /near \$580K/)
  assert.doesNotMatch(answer, /Franklin around \$650K/)
  assert.doesNotMatch(answer, /Brentwood around \$900K/)
})
