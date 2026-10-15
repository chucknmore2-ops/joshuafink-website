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

test('Green Hills guide keeps sourced claims and drops unsourced price language', () => {
  const n = getNeighborhood('green-hills-nashville-tn')
  assert.ok(n)
  const blob = [
    n.metaDescription,
    n.intro,
    n.about,
    n.vibe,
    n.priceBand,
    n.buildYears,
    n.hoa,
    n.schoolNotes,
    ...n.amenities,
    ...n.homeStyles,
    ...n.whyBullets,
    ...n.faqs.flatMap((faq) => [faq.q, faq.a]),
  ].join('\n')

  assert.equal(n.priceBand, 'No published median')
  assert.doesNotMatch(blob, /\$/)
  assert.doesNotMatch(blob, /price floor|resale value|holds value|Parks/i)
  assert.match(blob, /2020/)
  assert.match(blob, /National Blue Ribbon/)
  assert.match(n.faqs[0].a, /no published Redfin or GNAR median/i)
  assert.equal(n.latitude, 36.10361)
  assert.equal(n.longitude, -86.81667)
})
