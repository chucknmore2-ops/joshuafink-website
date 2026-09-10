import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getAllCashOfferCitySlugs, getCashOfferCity, cashOfferContentLastUpdated, cashOfferSeo, cashOfferPath } from './cash-offer-cities.ts'
import { suburbs, citywideStatsCitation, formatStatsDate, suburbStatsAsOf } from './suburbs.ts'
import { compactMedian } from './moving-faqs.ts'

/** Expand compactMedian ($870K / $1.40M) the way Franklin body copy writes it ($870,000 / $1,400,000). */
function expandedMedian(compact: string): string {
  const m = compact.match(/^\$([0-9.]+)([KM])$/)
  if (!m) throw new Error(`unexpected compact median ${compact}`)
  const n = Number(m[1])
  if (m[2] === 'M') return `$${(n * 1_000_000).toLocaleString('en-US')}`
  return `$${(n * 1_000).toLocaleString('en-US')}`
}

/** Stale cash-offer ballparks that disagreed with live /buy/[suburb] Redfin medians. */
const staleBySlug: Record<string, RegExp[]> = {
  'franklin-tn': [/\$650,000/, /\$650K/],
  'brentwood-tn': [/\$900,000/, /\$900K/],
  'spring-hill-tn': [/\$450,000/],
  'nolensville-tn': [/\$580,000/],
  'thompsons-station-tn': [/\$420,000/, /\$420K/],
  'nashville-tn': [/\$425,000/],
  'murfreesboro-tn': [/\$380,000/],
  'gallatin-tn': [/\$350,000/, /\$350K/],
  'hendersonville-tn': [/\$410,000/],
  'columbia-tn': [/\$340,000/],
  'mount-juliet-tn': [/\$480,000/],
  'lebanon-tn': [/\$380,000/],
  'smyrna-tn': [/\$370,000/],
  'la-vergne-tn': [/\$330,000/],
}

test('every cash-offer city quotes the same Redfin median as /buy/[suburb]', () => {
  const slugs = getAllCashOfferCitySlugs()
  assert.ok(slugs.length >= 14, 'expected the full cash-offer city set')

  for (const slug of slugs) {
    const city = getCashOfferCity(slug)
    assert.ok(city, slug)

    const suburb = suburbs[slug]
    assert.ok(suburb, slug)

    const compact = compactMedian(suburb.medianPriceNum)
    const expanded = expandedMedian(compact)
    const citation = citywideStatsCitation(suburb)
    const asOf = formatStatsDate(suburbStatsAsOf(suburb))

    assert.match(citation, /Redfin/)
    assert.match(citation, new RegExp(asOf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

    assert.match(city.localAngle, new RegExp(expanded.replace(/[$,]/g, (ch) => `\\${ch}`)), `${slug} localAngle should use ${expanded}`)
    assert.match(city.localAngle, /Redfin/, `${slug} localAngle should cite Redfin`)
    assert.match(city.localAngle, new RegExp(asOf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${slug} localAngle should cite ${asOf}`)

    const copy = [city.intro, city.localAngle, ...city.faqs.map((f) => `${f.q} ${f.a}`)].join('\n')
    for (const stale of staleBySlug[slug] ?? []) {
      assert.doesNotMatch(copy, stale, `${slug} still quotes stale ${stale}`)
    }

    for (const faq of city.faqs) {
      if (!/median|\$[0-9]/.test(faq.a)) continue
      if (!/\$[0-9]/.test(faq.a)) continue
      // FAQ dollar figures that name the city median should use compact form + Redfin.
      if (/median|market/.test(faq.a)) {
        assert.match(faq.a, new RegExp(compact.replace(/[$.]/g, (ch) => `\\${ch}`)), `${slug} FAQ should use compact ${compact}`)
        assert.match(faq.a, /Redfin/, `${slug} median FAQ should cite Redfin`)
      }
    }
  }
})

test('Franklin cash-offer copy stays pinned to the live Redfin $869,565 (~$870K)', () => {
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

test('cash-offer freshness stamp is current after the Nashville SEO pass', () => {
  assert.equal(cashOfferContentLastUpdated, '2026-09-10')
})

test('Nashville cash-offer SEO targets both house and home sell-fast queries', () => {
  const city = getCashOfferCity('nashville-tn')
  assert.ok(city)
  const seo = cashOfferSeo(city)

  assert.match(seo.title, /Sell My House Fast Nashville/)
  assert.match(seo.title, /Sell My Home Fast/)
  assert.match(seo.description, /sell my home fast in Nashville/i)
  assert.match(seo.ogTitle, /Sell My Home Fast in Nashville/)
  assert.match(seo.eyebrow, /Sell My Home Fast/)
  assert.ok(seo.keywords.includes('sell my home fast Nashville'))
  assert.ok(seo.keywords.includes('sell my house fast Nashville'))

  assert.match(city.intro, /sell your home fast in Nashville/)
  assert.match(city.localAngle, /\$480,000/)
  assert.match(city.localAngle, /Redfin/)
  assert.doesNotMatch(city.localAngle, /\$425,000/)

  assert.ok(city.differentiator)
  assert.match(city.differentiator, /TREC #351484/)
  assert.match(city.differentiator, /Compass/)

  assert.ok(city.compareNote)
  assert.match(city.compareNote, /sell your house fast in Nashville/)

  const situationIds = (city.situationDetails ?? []).map((s) => s.id)
  for (const id of ['inherited', 'divorce', 'foreclosure', 'vacant', 'liens', 'as-is', 'tenants']) {
    assert.ok(situationIds.includes(id), `missing situation ${id}`)
  }

  const questions = city.faqs.map((f) => f.q)
  assert.ok(questions.some((q) => /how fast can I sell my home in Nashville/i.test(q)))
  assert.ok(questions.some((q) => /sell my house fast in Nashville without listing/i.test(q)))
  assert.ok(questions.some((q) => /how do cash home buyers work in Nashville/i.test(q)))
  assert.ok(questions.some((q) => /live out of state/i.test(q)))
  assert.ok(questions.some((q) => /already listed with an agent/i.test(q)))

  assert.ok((city.relatedReading ?? []).some((l) => l.href.includes('cash-offer-vs-ibuyer')))
  assert.equal(cashOfferPath('nashville-tn'), '/cash-offer/nashville-tn')
})

test('Franklin cash-offer still uses the shared template strings (no mass city SEO rollout)', () => {
  const city = getCashOfferCity('franklin-tn')
  assert.ok(city)
  const seo = cashOfferSeo(city)
  assert.equal(seo.title, 'Sell My House Fast Franklin, TN | Cash Offer in 24 Hours')
  assert.equal(city.seo, undefined)
  assert.equal(city.situationDetails, undefined)
  assert.equal(city.differentiator, undefined)
})
