import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getAllCashOfferCitySlugs, getCashOfferCity, cashOfferContentLastUpdated, cashOfferSeo, cashOfferPath } from './cash-offer-cities.ts'
import { suburbs, citywideStatsCitation, formatStatsDate, suburbStatsAsOf } from './suburbs.ts'
import { neighborhoods } from './neighborhoods.ts'
import { blogPosts } from './blog.ts'

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

    const citation = citywideStatsCitation(suburb)
    const asOf = formatStatsDate(suburbStatsAsOf(suburb))

    assert.match(citation, /Redfin/)
    assert.match(citation, new RegExp(asOf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

    assert.match(
      city.localAngle,
      new RegExp(suburb.medianPrice.replace(/[$,]/g, (ch) => `\\${ch}`)),
      `${slug} localAngle should use exact median ${suburb.medianPrice}`,
    )
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
        assert.match(
          faq.a,
          new RegExp(suburb.medianPrice.replace(/[$,]/g, (ch) => `\\${ch}`)),
          `${slug} FAQ should use exact median ${suburb.medianPrice}`,
        )
        assert.match(faq.a, /Redfin/, `${slug} median FAQ should cite Redfin`)
      }
    }
  }
})

test('Franklin cash-offer copy stays pinned to the live Redfin $862,929', () => {
  const city = getCashOfferCity('franklin-tn')
  assert.ok(city)

  const franklin = suburbs['franklin-tn']
  const citation = citywideStatsCitation(franklin)

  assert.equal(franklin.medianPrice, '$862,929')
  assert.equal(franklin.avgDaysOnMarket, 49)
  assert.equal(franklin.pricePerSqft, 330.85)
  assert.equal(franklin.yoyChange, '+12.43%')
  assert.equal(citation, 'Source: Redfin, as of October 5, 2026')

  assert.match(city.localAngle, /\$862,929/)
  assert.match(city.localAngle, /Redfin/)
  assert.match(city.localAngle, /October 5, 2026/)
  assert.doesNotMatch(city.localAngle, /\$650,000/)
  assert.doesNotMatch(city.localAngle, /\$870,000/)

  const repairFaq = city.faqs.find((f) => /repairs/i.test(f.q))
  assert.ok(repairFaq)
  assert.match(repairFaq.a, /\$862,929-median/)
  assert.match(repairFaq.a, /Redfin/)
  assert.doesNotMatch(repairFaq.a, /\$650K/)
})

test('cash-offer freshness stamp is current after the Nashville fair-offer FAQ', () => {
  assert.equal(cashOfferContentLastUpdated, '2026-10-05')
})

test('Nashville fair-cash-offer FAQ reuses only figures already on the site', () => {
  const city = getCashOfferCity('nashville-tn')
  assert.ok(city)
  const faqs = city.fairOfferFaqs ?? []
  assert.ok(faqs.length >= 3, 'expected the Nashville fair-offer FAQ block')

  const nashville = suburbs['nashville-tn']
  const asOf = formatStatsDate(suburbStatsAsOf(nashville))

  const copy = faqs.map((f) => `${f.q} ${f.a}`).join('\n')
  // Median is quoted in compact form with its Redfin as-of citation.
  assert.match(copy, /\$475,538/)
  assert.match(copy, /Redfin/)
  assert.match(copy, new RegExp(asOf))
  // The shared 70–85% of after-repair value framing, no new percentages.
  assert.match(copy, /70–85% of after-repair value/)
  const percents = copy.match(/\d+(?:–\d+)?%/g) ?? []
  assert.deepEqual(Array.from(new Set(percents)), ['70–85%'])
  // Only the Redfin median — no other dollar figures.
  const dollars = copy.match(/\$[0-9][0-9,.]*[KM]?/g) ?? []
  assert.deepEqual(Array.from(new Set(dollars)), ['$475,538'])

  // Links to the September 2026 GNAR market update (published October 5, 2026).
  const links = faqs.flatMap((f) => (f.link ? [f.link.href] : []))
  const labels = faqs.flatMap((f) => (f.link ? [f.link.label] : []))
  assert.ok(links.includes('/blog/middle-tennessee-market-update-september-2026'))
  assert.ok(labels.includes('September 2026 Middle Tennessee market update'))
  assert.match(copy, /September 2026 Middle Tennessee market update/)
  assert.doesNotMatch(copy, /August 2026 Middle Tennessee market update/)
  const september = blogPosts.find((p) => p.slug === 'middle-tennessee-market-update-september-2026')
  assert.ok(september)
  assert.equal(september.date, 'October 5, 2026')

  // Does not duplicate the shared "agent who buys houses for cash" answer or existing city FAQs.
  const existing = new Set(city.faqs.map((f) => f.q))
  for (const f of faqs) {
    assert.ok(!existing.has(f.q), `duplicate question ${f.q}`)
    assert.doesNotMatch(f.q, /real estate agent who buys houses for cash/i)
  }
})

test('only Nashville ships the fair-cash-offer FAQ block for now', () => {
  for (const slug of getAllCashOfferCitySlugs()) {
    if (slug === 'nashville-tn') continue
    assert.equal(getCashOfferCity(slug)?.fairOfferFaqs, undefined, slug)
  }
})

test('Nashville cash-offer SEO leads with we buy houses and keeps sell-fast queries', () => {
  const city = getCashOfferCity('nashville-tn')
  assert.ok(city)
  const seo = cashOfferSeo(city)

  assert.equal(seo.title, 'We Buy Houses Nashville | 24-Hour Cash Offer | Compass')
  assert.equal(seo.absoluteTitle, true)
  assert.match(seo.title, /We Buy Houses Nashville/)
  assert.match(seo.title, /24-Hour Cash Offer/)
  assert.match(seo.title, /Compass/)
  assert.doesNotMatch(seo.title, /Parks/)
  assert.ok(seo.title.length <= 60, `title is ${seo.title.length} characters`)
  assert.match(seo.description, /We buy houses in Nashville/)
  assert.match(seo.description, /615-551-2727/)
  assert.match(seo.description, /licensed since 2008/)
  assert.doesNotMatch(seo.description, /Parks/)
  assert.ok(seo.description.length <= 160, `description is ${seo.description.length} characters`)
  assert.match(seo.ogTitle, /We Buy Houses Nashville/)
  assert.match(seo.eyebrow, /Nashville, TN · Cash Offer/)
  assert.ok(seo.keywords.includes('we buy houses Nashville'))
  assert.ok(seo.keywords.includes('cash offer Nashville TN'))
  assert.ok(seo.keywords.includes('sell my home fast Nashville'))
  assert.ok(seo.keywords.includes('sell my house fast Nashville'))
  assert.equal(city.headline?.lead, 'We Buy Houses')
  assert.equal(city.headline?.accent, 'in Nashville.')
  assert.equal(city.situationsHeading, 'We buy houses in Nashville — any situation')

  assert.match(city.intro, /sell your home fast in Nashville/)
  assert.match(city.localAngle, /\$475,538/)
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
  assert.ok(questions.some((q) => /we buy houses Nashville/i.test(q)))
  const buyerFaq = city.faqs.find((f) => /we buy houses Nashville/i.test(f.q))
  assert.ok(buyerFaq)
  assert.match(buyerFaq.a, /TREC #351484/)
  assert.match(buyerFaq.a, /licensed since 2008/)
  assert.match(buyerFaq.a, /8119 Isabella Lane Suite 105, Brentwood, TN 37027/)
  assert.match(buyerFaq.a, /615-551-2727/)
  assert.match(buyerFaq.a, /Compass/)
  assert.doesNotMatch(buyerFaq.a, /Parks/)
  assert.ok(questions.some((q) => /how fast can I sell my home in Nashville/i.test(q)))
  assert.ok(questions.some((q) => /sell my house fast in Nashville without listing/i.test(q)))
  assert.ok(questions.some((q) => /how do cash home buyers work in Nashville/i.test(q)))
  assert.ok(questions.some((q) => /live out of state/i.test(q)))
  assert.ok(questions.some((q) => /already listed with an agent/i.test(q)))

  assert.ok((city.relatedReading ?? []).some((l) => l.href.includes('cash-offer-vs-ibuyer')))
  assert.equal(cashOfferPath('nashville-tn'), '/cash-offer/nashville-tn')
})

test('Nashville market note reuses published Redfin, Census, and neighborhood bands', () => {
  const city = getCashOfferCity('nashville-tn')
  assert.ok(city?.marketNote)
  const note = city.marketNote
  const nashville = suburbs['nashville-tn']

  assert.match(note, new RegExp(nashville.medianPrice.replace(/[$,]/g, (ch) => `\\${ch}`)))
  assert.match(note, new RegExp(`${nashville.avgDaysOnMarket} days`))
  assert.match(note, /\$272\.16/)
  assert.equal(nashville.pricePerSqft, 272.16)
  assert.match(note, /down 0\.52%/)
  assert.equal(nashville.yoyChange, '-0.52%')
  assert.match(note, /Redfin, as of October 5, 2026/)
  assert.match(note, /715,884/)
  assert.match(note, /745,904/)
  assert.match(note, /4\.2%/)
  assert.match(note, /U\.S\. Census Bureau QuickFacts/)

  for (const slug of [
    'east-nashville-tn',
    '12-south-nashville-tn',
    'germantown-nashville-tn',
    'sylvan-park-nashville-tn',
    'the-gulch-nashville-tn',
    'green-hills-nashville-tn',
  ]) {
    const band = neighborhoods[slug].priceBand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(note, new RegExp(band), slug)
  }
})

test('Franklin cash-offer still uses the shared template strings (no mass city SEO rollout)', () => {
  const city = getCashOfferCity('franklin-tn')
  assert.ok(city)
  const seo = cashOfferSeo(city)
  assert.equal(seo.title, 'Sell My House Fast Franklin, TN | Cash Offer in 24 Hours')
  assert.equal(city.seo, undefined)
  assert.equal(city.headline, undefined)
  assert.equal(city.situationDetails, undefined)
  assert.equal(city.differentiator, undefined)
})

test('Columbia cash-offer SEO targets sell-fast and sell-for-cash queries without stale prices', () => {
  const city = getCashOfferCity('columbia-tn')
  assert.ok(city)
  const seo = cashOfferSeo(city)

  assert.equal(seo.title, 'Sell House Fast Columbia TN | Close in 7 Days | Compass')
  assert.equal(seo.absoluteTitle, true)
  assert.match(seo.title, /Sell House Fast Columbia TN/)
  assert.match(seo.title, /Close in 7 Days/)
  assert.match(seo.title, /Compass/)
  assert.doesNotMatch(seo.title, /Parks/)
  assert.ok(seo.title.length <= 60, `title is ${seo.title.length} characters`)
  assert.match(seo.description, /sell your house fast in Columbia, TN/i)
  assert.match(seo.description, /sell your house for cash/i)
  assert.match(seo.description, /24 hours/)
  assert.match(seo.description, /615-551-2727/)
  assert.doesNotMatch(seo.description, /Parks/)
  assert.ok(seo.description.length <= 160, `description is ${seo.description.length} characters`)
  assert.match(seo.ogTitle, /Sell House Fast Columbia TN/)
  assert.match(seo.eyebrow, /Columbia, TN · Cash Offer/)
  assert.ok(seo.keywords.includes('sell house fast Columbia TN'))
  assert.ok(seo.keywords.includes('sell house fast Columbia'))
  assert.ok(seo.keywords.includes('sell house for cash Columbia TN'))
  assert.ok(seo.keywords.includes('cash offer Columbia TN'))
  assert.ok(seo.keywords.includes('sell my house fast Columbia TN'))

  assert.equal(city.headline?.lead, 'Sell Your House Fast')
  assert.equal(city.headline?.accent, 'in Columbia, TN.')
  assert.equal(city.situationsHeading, 'When you need to sell your house fast in Columbia')
  assert.equal(city.faqHeading, 'Sell your house for cash in Columbia, TN')

  assert.match(city.intro, /sell your house fast in Columbia, TN/i)
  assert.match(city.intro, /divorce/i)
  assert.match(city.intro, /inherited/i)
  assert.match(city.intro, /relocation/i)
  assert.match(city.intro, /as-is/i)
  assert.match(city.intro, /form on this page/)

  assert.match(city.localAngle, /\$368,006/)
  assert.match(city.localAngle, /Redfin/)
  assert.match(city.localAngle, /October 5, 2026/)
  assert.match(city.localAngle, /78 days/)
  assert.doesNotMatch(
    [city.intro, city.localAngle, city.compareNote ?? '', ...city.faqs.map((f) => `${f.q} ${f.a}`)].join('\n'),
    /\$340,000/,
  )

  assert.ok(city.differentiator)
  assert.match(city.differentiator, /TREC #351484/)
  assert.match(city.differentiator, /Compass/)

  assert.ok(city.compareNote)
  assert.match(city.compareNote, /78 days/)
  assert.match(city.compareNote, /\$368,006/)
  assert.match(city.compareNote, /Redfin/)

  const situationIds = (city.situationDetails ?? []).map((s) => s.id)
  for (const id of ['inherited', 'divorce', 'relocation', 'as-is', 'speed']) {
    assert.ok(situationIds.includes(id), `missing situation ${id}`)
  }

  const hrefs = [
    ...(city.relatedReading ?? []).map((l) => l.href),
    ...(city.situationDetails ?? []).flatMap((s) => (s.href ? [s.href] : [])),
  ]
  for (const href of [
    '/buy/columbia-tn',
    '/sell/columbia-tn',
    '/market/columbia-tn',
    '/cash-offer',
    '/cash-offer/nashville-tn',
    '#cash-offer-form',
  ]) {
    assert.ok(hrefs.includes(href), `missing link ${href}`)
  }

  const questions = city.faqs.map((f) => f.q)
  assert.ok(questions.some((q) => /how do I sell my house fast in Columbia/i.test(q)))
  const fastFaq = city.faqs.find((f) => /how do I sell my house fast in Columbia/i.test(f.q))
  assert.ok(fastFaq)
  assert.match(fastFaq.a, /sell your house for cash in Columbia, TN/i)
  assert.match(fastFaq.a, /78/)
  assert.match(fastFaq.a, /Redfin/)
  assert.match(fastFaq.a, /TREC #351484/)
  assert.match(fastFaq.a, /licensed since 2008/)
  assert.match(fastFaq.a, /Compass/)
  assert.doesNotMatch(fastFaq.a, /Parks/)
  assert.ok(questions.some((q) => /how fast can I sell my house for cash in Columbia, TN/i.test(q)))
  assert.ok(questions.some((q) => /as-is/i.test(q)))
  assert.ok(questions.some((q) => /divorce/i.test(q)))
  assert.ok(questions.some((q) => /inherited/i.test(q)))
  assert.ok(questions.some((q) => /relocated/i.test(q)))
  assert.equal(cashOfferPath('columbia-tn'), '/cash-offer/columbia-tn')
})

test('cash-offer city canonicals are absolute www URLs and titles can skip the layout template', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /const url = `https:\/\/www\.joshuafink\.com\/cash-offer\/\$\{slug\}`/)
  assert.match(page, /alternates: \{ canonical: url \}/)
  assert.doesNotMatch(page, /canonical: ['"]https:\/\/joshuafink\.com/)
  assert.match(page, /seo\.absoluteTitle \? \{ absolute: seo\.title \} : seo\.title/)
  assert.match(page, /'@type': 'FAQPage'/)
})
