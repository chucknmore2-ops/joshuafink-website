// Pin Nolensville buyer-GEO guides that /buy/nolensville-tn already names.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getNeighborhood, getNeighborhoodsByCitySlug } from './neighborhoods.ts'
import { getSuburb } from './suburbs.ts'

test('Nolensville buy-page place names have neighborhood guides (no 404 slugs)', () => {
  const suburb = getSuburb('nolensville-tn')
  assert.ok(suburb?.buyerDescription)
  const guides = getNeighborhoodsByCitySlug('nolensville-tn')
  const names = new Set(guides.map((g) => g.name))

  for (const name of ['Bent Creek', 'Scales Farmstead', 'Benington', 'Burberry Glen']) {
    assert.ok(names.has(name), `missing ${name} guide`)
    assert.ok(suburb.buyerDescription!.includes(name), `buyerDescription should name ${name} so linkify can attach`)
  }

  assert.ok(getNeighborhood('scales-farmstead-nolensville-tn'))
  assert.ok(getNeighborhood('benington-nolensville-tn'))
  // Approximate bands only — do not invent a Redfin/GNAR subdivision median.
  assert.match(getNeighborhood('scales-farmstead-nolensville-tn')!.priceBand, /approx/i)
  assert.match(getNeighborhood('benington-nolensville-tn')!.priceBand, /approx/i)
  assert.match(getNeighborhood('scales-farmstead-nolensville-tn')!.faqs[0].a, /no published Redfin or GNAR median/i)
  assert.match(getNeighborhood('benington-nolensville-tn')!.faqs[0].a, /no published Redfin or GNAR median/i)
})
