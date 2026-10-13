import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listingQuestions } from './listing-qa.ts'

const base = {
  address: '10 Oak St',
  city: 'Franklin',
  priceLabel: '$900,000',
  specLine: '4 bd · 3 ba · 2,400 sqft',
  suburbName: 'Franklin',
  hasSimilar: true,
}

test('an active listing says it is available and repeats only the given facts', () => {
  const faqs = listingQuestions({ ...base, status: 'Active' })
  const blob = faqs.map((f) => f.a).join('\n')
  assert.match(faqs[0].a, /active Compass listing at \$900,000/)
  assert.match(blob, /4 bd · 3 ba · 2,400 sqft/)
  assert.match(blob, /615-551-2727/)
  assert.match(blob, /Franklin homes-for-sale page/)
  assert.equal(faqs.length, 4)
  assert.doesNotMatch(blob, /Parks|school zone|HOA|median/i)
})

test('sold, coming soon, and under contract do not say the home is available', () => {
  const sold = listingQuestions({ ...base, status: 'Sold', hasSimilar: false })
  assert.match(sold[0].a, /has sold/)
  assert.doesNotMatch(sold[0].a, /active Compass listing/)
  assert.equal(sold.length, 3)

  const soon = listingQuestions({ ...base, status: 'Coming Soon', hasSimilar: false })
  assert.match(soon[0].a, /not open for showings/)

  const pending = listingQuestions({ ...base, status: 'Active Under Contract', hasSimilar: false })
  assert.match(pending[0].a, /under contract/)
  assert.match(pending.map((f) => f.a).join('\n'), /Status: Under Contract/)
})
