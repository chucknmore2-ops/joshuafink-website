import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getAllCashOfferCitySlugs, getCashOfferCity, cashOfferContentLastUpdated, cashOfferSeo, cashOfferPath, faqSchemaAnswerText } from './cash-offer-cities.ts'
import { latestSnapshot, marketUpdateSlug, monthLabel } from './market-snapshot.ts'
import { suburbs, citywideStatsCitation, formatStatsDate, suburbStatsAsOf } from './suburbs.ts'
import { neighborhoods } from './neighborhoods.ts'
import { blogPosts } from './blog.ts'
import { closings } from './closings-data.ts'
import { tennesseeClosingsInCities } from './closings.ts'
import { reviews } from './reviews.ts'

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

  // Points at the current GNAR market update and rolls when a new snapshot is checked in.
  const latest = latestSnapshot()
  assert.ok(latest)
  const updateLabel = `${monthLabel(latest.month)} Middle Tennessee market update`
  const updateHref = `/blog/${marketUpdateSlug(latest.month)}`
  const links = faqs.flatMap((f) => (f.link ? [f.link.href] : []))
  const labels = faqs.flatMap((f) => (f.link ? [f.link.label] : []))
  assert.ok(links.includes(updateHref))
  assert.ok(labels.includes(updateLabel))
  assert.match(copy, new RegExp(updateLabel))
  const citiesSource = readFileSync(new URL('./cash-offer-cities.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(citiesSource, /marketUpdateSlug\('2026-09'\)/)
  if (latest.month !== '2026-09') {
    assert.doesNotMatch(copy, /September 2026 Middle Tennessee market update/)
  }
  const update = blogPosts.find((p) => p.slug === marketUpdateSlug(latest.month))
  assert.ok(update)
  const schemaText = faqSchemaAnswerText(faqs.find((f) => f.link)!)
  assert.match(schemaText, new RegExp(`https://www.joshuafink.com${updateHref}`))
  assert.match(schemaText, new RegExp(updateLabel))

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

test('Nashville cash page keeps one FAQPage and adds only the closings line and sell links', () => {
  const city = getCashOfferCity('nashville-tn')
  assert.ok(city)
  const questions = [
    ...city.faqs.map((faq) => faq.q),
    ...(city.fairOfferFaqs ?? []).map((faq) => faq.q),
  ]
  assert.equal(new Set(questions).size, questions.length)
  assert.equal(questions.includes('How does a cash offer compare with listing my Nashville house?'), false)
  assert.equal(questions.includes('How fast can you buy a house in Nashville?'), false)

  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  assert.equal(page.match(/'@type': 'FAQPage'/g)?.length, 1)
  assert.match(page, /const schemaFaqs = \[\.\.\.fairOfferFaqs, \.\.\.sellerFaqs, \.\.\.allFaqs, \.\.\.\(byTheNumbers\?\.answers \?\? \[\]\)\]/)
  assert.doesNotMatch(page, /quickFaqs/)
  assert.equal(page.match(/id="nashville-closings-proof"/g)?.length, 1)
  const closingsAt = page.indexOf('id="nashville-closings-proof"')
  const localAt = page.indexOf('Why Sell for Cash in')
  assert.ok(closingsAt > 0 && localAt > closingsAt)
  const closings = page.slice(closingsAt, localAt)
  assert.match(closings, /TREC #351484/)
  assert.match(closings, /Compass Real Estate/)
  assert.match(closings, /Licensed since 2008/)
  assert.match(closings, /reviewStats\.total/)
  assert.doesNotMatch(closings, /Parks/)
  assert.doesNotMatch(closings, /\b49\b/)

  const image = readFileSync(new URL('../app/cash-offer/[city]/opengraph-image.tsx', import.meta.url), 'utf8')
  assert.match(image, /isNashville \? 'We Buy Houses' : 'Sell My House Fast'/)
  assert.match(image, /isNashville \? 'in Nashville'/)

  const sell = readFileSync(new URL('../app/sell/page.tsx', import.meta.url), 'utf8')
  const sellCity = readFileSync(new URL('../app/sell/[suburb]/page.tsx', import.meta.url), 'utf8')
  assert.match(sell, /href="\/cash-offer\/nashville-tn"/)
  assert.match(sell, /We Buy Houses in Nashville →/)
  assert.match(sellCity, /slug === 'nashville-tn' \? 'We Buy Houses in Nashville' : 'Prefer a Cash Offer\?'/)
  assert.doesNotMatch(sell + sellCity, /Parks/)
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

test('Franklin cash-offer keeps the shared title and adds a Williamson County section', () => {
  const city = getCashOfferCity('franklin-tn')
  assert.ok(city)
  const seo = cashOfferSeo(city)
  assert.equal(seo.title, 'Sell My House Fast Franklin, TN | Cash Offer in 24 Hours')
  assert.equal(city.seo, undefined)
  assert.equal(city.headline, undefined)
  assert.equal(city.localHeading, 'We Buy Houses in Franklin')
  assert.equal(city.countySection?.eyebrow, 'Williamson County')
  assert.match(city.countySection?.paragraphs.flat().join(' ') ?? '', /historic downtown/i)
  assert.equal(city.situationDetails, undefined)
  assert.equal(city.differentiator, undefined)
})

test('Columbia cash-offer SEO targets sell-fast and sell-for-cash queries without stale prices', () => {
  const city = getCashOfferCity('columbia-tn')
  assert.ok(city)
  const seo = cashOfferSeo(city)

  assert.equal(seo.title, 'Sell House Fast Columbia TN | We Buy Houses | Compass')
  assert.equal(seo.absoluteTitle, true)
  assert.match(seo.title, /Sell House Fast Columbia TN/)
  assert.match(seo.title, /We Buy Houses/)
  assert.match(seo.title, /Compass/)
  assert.doesNotMatch(seo.title, /Parks/)
  assert.ok(seo.title.length <= 60, `title is ${seo.title.length} characters`)
  assert.match(seo.description, /sell your house fast in Columbia, TN/i)
  assert.match(seo.description, /sell your house for cash/i)
  assert.match(seo.description, /24 hours/)
  assert.match(seo.description, /615-551-2727/)
  assert.doesNotMatch(seo.description, /Parks/)
  assert.ok(seo.description.length <= 160, `description is ${seo.description.length} characters`)
  assert.match(seo.ogTitle, /We Buy Houses/)
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

test('Columbia seller FAQ and neighborhood note reuse published places and one FAQPage', () => {
  const city = getCashOfferCity('columbia-tn')
  assert.ok(city)
  const faqs = city.sellerFaqs ?? []
  assert.equal(faqs.length, 5)
  assert.equal(city.sellerFaqHeading, 'Columbia seller FAQ')

  const existing = new Set(city.faqs.map((f) => f.q))
  for (const faq of faqs) {
    assert.equal(existing.has(faq.q), false, faq.q)
  }
  const copy = faqs.map((f) => `${f.q} ${f.a}`).join('\n')
  assert.match(copy, /Historic Downtown Columbia/)
  assert.match(copy, /Downtown Columbia Historic District/)
  assert.match(copy, /Sunnyside/)
  assert.match(copy, /The Crossings/)
  assert.match(copy, /Bear Creek Pike/)
  assert.match(copy, /James Campbell Blvd/)
  assert.match(copy, /Columbia Central High/)
  assert.match(copy, /Maury County Public Schools/)
  assert.match(copy, /TREC #351484/)
  assert.match(copy, /licensed since 2008/)
  assert.match(copy, /40\+ homes a year in Middle Tennessee/)
  assert.match(copy, /8119 Isabella Lane Suite 105, Brentwood, TN 37027/)
  assert.match(copy, /Compass/)
  assert.match(copy, /24 hours/)
  assert.match(copy, /7 days/)
  assert.doesNotMatch(copy, /Parks/)
  assert.doesNotMatch(copy, /\$/)
  assert.doesNotMatch(copy, /\d+%/)

  const note = city.marketNote ?? ''
  for (const place of [
    'Historic Downtown Columbia',
    'Downtown Columbia Historic District',
    'North Columbia / Carters Creek (Spring Hill-Adjacent)',
    'James K. Polk Home',
    'Duck River',
    'Riverwalk Park',
    'Mule Day',
    'Reserve at Silver Springs',
    'Overlook at Carters Creek',
    'Carters Station',
    'Sunnyside',
    'The Crossings',
    'Bear Creek Pike',
    'James Campbell Blvd',
    'Maury County Public Schools',
  ]) {
    assert.match(note, new RegExp(place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), place)
  }
  assert.match(note, /National Register of Historic Places in 1984/)
  assert.match(note, /roughly six miles/)
  assert.doesNotMatch(note, /\$/)
  assert.doesNotMatch(note, /Parks/)

  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  assert.equal(page.match(/'@type': 'FAQPage'/g)?.length, 1)
  assert.match(page, /const schemaFaqs = \[\.\.\.fairOfferFaqs, \.\.\.sellerFaqs, \.\.\.allFaqs, \.\.\.\(byTheNumbers\?\.answers \?\? \[\]\)\]/)
  assert.match(page, /id="seller-faq"/)
  assert.match(page, /slug === 'columbia-tn' \? 'maury-county'/)

  const spring = getCashOfferCity('spring-hill-tn')
  const thompson = getCashOfferCity('thompsons-station-tn')
  const franklin = getCashOfferCity('franklin-tn')
  assert.equal(spring?.asideLink?.href, '/cash-offer/columbia-tn')
  assert.equal(spring?.asideLink?.label, 'sell your house fast in Columbia, TN')
  assert.equal(thompson?.asideLink?.href, '/cash-offer/columbia-tn')
  assert.equal(thompson?.asideLink?.label, 'cash offer in Columbia')
  assert.equal(franklin?.asideLink?.href, '/cash-offer/columbia-tn')
  assert.equal(franklin?.asideLink?.label, 'sell your house for cash in Columbia, TN')
  assert.equal(franklin?.seo, undefined)
  assert.equal(franklin?.headline, undefined)

  const linkedFrom = [
    '../app/moving-to-middle-tennessee/page.tsx',
    '../app/sell/[suburb]/page.tsx',
    '../app/buy/[suburb]/page.tsx',
    '../app/market/[suburb]/page.tsx',
    '../app/neighborhoods/[slug]/page.tsx',
    '../app/homes-near/[school]/page.tsx',
    '../app/compare/[pair]/page.tsx',
  ]
  for (const rel of linkedFrom) {
    const source = readFileSync(new URL(rel, import.meta.url), 'utf8')
    assert.match(source, /columbia-tn/, rel)
    assert.match(source, /sell your house fast in Columbia, TN|cash offer in Columbia/, rel)
  }

  for (const slug of [
    'living-in-spring-hill-tn-guide',
    'spring-hill-tn-homes-for-sale',
    'selling-a-house-in-middle-tennessee-this-fall-2026',
    'may-2026-nashville-market-update',
    'nashville-real-estate-market-2025',
    'fix-and-flip-nashville-tn',
    'williamson-county-real-estate-2025',
    'first-time-home-buyer-nashville-middle-tennessee-2026',
    'how-much-house-can-i-afford-middle-tennessee-2026',
    'thda-great-choice-down-payment-assistance-tennessee-2026',
  ]) {
    const post = blogPosts.find((p) => p.slug === slug)
    assert.ok(post, slug)
    assert.match(post.content, /\]\(\/cash-offer\/columbia-tn\)/, slug)
  }
})

function closingStreet(address: string): string {
  return address.replace(/^\d+\s+/, '').replace(/\s+Lot\s+\d+$/i, '')
}

test('Columbia Maury County section reuses published facts, closings, and the one local review', () => {
  const city = getCashOfferCity('columbia-tn')
  assert.ok(city?.countySection)
  assert.equal(city.contentUpdated, '2026-11-04')
  assert.equal(city.countySection.eyebrow, 'Maury County')
  assert.equal(city.seo?.title, 'Sell House Fast Columbia TN | We Buy Houses | Compass')
  assert.equal(city.headline?.lead, 'Sell Your House Fast')
  assert.equal(city.headline?.accent, 'in Columbia, TN.')

  const copy = city.countySection.paragraphs
    .map((parts) => parts.map((part) => (typeof part === 'string' ? part : part.label)).join(''))
    .join('\n')
  assert.match(copy, /seat of Maury County/)
  assert.match(copy, /Maury County Courthouse/)
  assert.match(copy, /probate is handled at the county level/)
  assert.match(copy, /TREC #351484/)
  assert.match(copy, /licensed since 2008/)
  assert.match(copy, /Compass Real Estate/)
  assert.match(copy, /East 17th Street/)
  assert.match(copy, /Hickman Street/)
  assert.match(copy, /Mooresville Pike/)
  assert.match(copy, /Dimple Court/)
  assert.match(copy, /Lynn Drive/)
  assert.match(copy, /Scribner Avenue/)
  assert.match(copy, /Hampton Road/)
  assert.match(copy, /Lakeside Drive/)
  assert.match(copy, /Transit Avenue/)
  assert.match(copy, /Porter Circle/)
  assert.match(copy, /Brown Street/)
  assert.match(copy, /Shady Drive/)
  assert.match(copy, /Greens Mill Road/)
  assert.match(copy, /Nealcrest Circle/)
  assert.match(copy, /Kedron Road/)
  assert.match(copy, /1st Avenue/)
  assert.match(copy, /Lawrenceburg Highway/)
  assert.match(copy, /Mt\. Pleasant/)
  assert.doesNotMatch(copy, /Parks/)
  assert.doesNotMatch(copy, /James K\. Polk/)
  assert.doesNotMatch(copy, /Mule Day/)
  assert.doesNotMatch(copy, /Bear Creek Pike/)
  assert.doesNotMatch(copy, /James Campbell/)
  assert.doesNotMatch(copy, /Reserve at Silver Springs/)

  const columbia = suburbs['columbia-tn']
  const springHill = suburbs['spring-hill-tn']
  assert.match(copy, new RegExp(columbia.medianPrice.replace(/[$,]/g, (ch) => `\\${ch}`)))
  assert.match(copy, new RegExp(springHill.medianPrice.replace(/[$,]/g, (ch) => `\\${ch}`)))
  assert.match(copy, /\$195\.33 per square foot/)
  assert.equal(columbia.pricePerSqft, 195.33)
  assert.match(copy, /\$236\.44 per square foot/)
  assert.equal(springHill.pricePerSqft, 236.44)
  assert.match(copy, new RegExp(`${columbia.avgDaysOnMarket} days`))
  assert.match(copy, new RegExp(`${springHill.avgDaysOnMarket} days`))
  assert.match(copy, /down 1\.07%/)
  assert.equal(columbia.yoyChange, '-1.07%')
  assert.match(copy, /down 4\.14%/)
  assert.equal(springHill.yoyChange, '-4.14%')
  assert.match(copy, /Redfin, as of October 5, 2026/)
  assert.match(copy, new RegExp(`ZIP ${columbia.schemaZip}`))
  assert.match(copy, new RegExp(`ZIP ${springHill.schemaZip}`))

  const columbiaRows = closings.filter((row) => row.city === 'Columbia')
  assert.ok(columbiaRows.every((row) => row.state === 'TN' && row.status === 'Closed' && row.zip === columbia.schemaZip))
  const streetCounts = columbiaRows.reduce((map, row) => {
    const street = closingStreet(row.address)
    map.set(street, (map.get(street) ?? 0) + 1)
    return map
  }, new Map<string, number>())
  const repeated = Array.from(streetCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([street]) => street)
    .sort()
  assert.deepEqual(repeated, ['Dimple Ct', 'E 17th St', 'Hickman St', 'Lynn Dr', 'Mooresville Pike', 'Scribner Ave'])
  const soldIn2026 = Array.from(
    new Set(columbiaRows.filter((row) => row.closeDate.startsWith('2026')).map((row) => closingStreet(row.address))),
  ).sort()
  assert.deepEqual(soldIn2026, ['Brown St', 'Hampton Rd', 'Lakeside Dr', 'Porter Cir', 'Shady Dr', 'Transit Ave'])

  const springRows = closings.filter((row) => row.city === 'Spring Hill')
  assert.deepEqual(springRows.map((row) => closingStreet(row.address)).sort(), ['Greens Mill Rd', 'Kedron Rd', 'Nealcrest Cir'])
  assert.ok(springRows.every((row) => row.state === 'TN' && row.status === 'Closed' && row.zip === springHill.schemaZip))
  const pleasantRows = closings.filter((row) => row.city === 'Mount Pleasant')
  assert.equal(pleasantRows.length, 3)
  assert.ok(pleasantRows.every((row) => row.state === 'TN' && row.status === 'Closed' && row.zip === '38474'))
  assert.deepEqual(
    Array.from(new Set(pleasantRows.map((row) => closingStreet(row.address)))).sort(),
    ['1st Ave', 'Lawrenceburg Hwy'],
  )

  const shown = tennesseeClosingsInCities(['Columbia', 'Spring Hill', 'Mount Pleasant'])
  assert.deepEqual(shown.map((group) => [group.city, group.closings.length, group.anchor]), [
    ['Columbia', columbiaRows.length, 'columbia'],
    ['Spring Hill', springRows.length, 'spring-hill'],
    ['Mount Pleasant', pleasantRows.length, 'mount-pleasant'],
  ])
  assert.ok(shown.every((group) => group.closings.every((row) => row.state === 'TN' && row.status === 'Closed')))

  const localReviews = reviews.filter((review) =>
    /columbia, tn|maury county|spring hill, tn|mount pleasant/i.test(review.transaction),
  )
  assert.equal(localReviews.length, 1)
  assert.equal(localReviews[0].transaction, 'Bought and sold a home in Columbia, TN')
  assert.equal(
    localReviews[0].text,
    'Josh is very knowledgeable and his communication is top notch. Always answers or gets back to me real quick. We have used Josh in the past and we will continue to refer him to friends and family.',
  )

  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  const sectionStart = page.indexOf('city.countySection ? (')
  const sectionEnd = page.indexOf('id="seller-faq"')
  assert.ok(sectionStart > 0 && sectionEnd > sectionStart)
  const section = page.slice(sectionStart, sectionEnd)
  assert.match(page, /tennesseeClosingsInCities\(\['Columbia', 'Spring Hill', 'Mount Pleasant'\]\)/)
  assert.match(section, /closing\.address/)
  assert.match(section, /closing\.state/)
  assert.match(section, /formatSoldPrice\(closing\.soldPrice\)/)
  assert.doesNotMatch(section, /review\.reviewer/)
  assert.doesNotMatch(section, /Parks/)
  assert.equal(page.match(/'@type': 'FAQPage'/g)?.length, 1)
  assert.match(page, /alternates: \{ canonical: url \}/)

  const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  assert.match(home, /href="\/cash-offer\/columbia-tn"/)
  const sold = readFileSync(new URL('../app/sold/page.tsx', import.meta.url), 'utf8')
  assert.match(sold, /Sell your Columbia house for cash/)
  assert.match(sold, /group\.city === 'Mount Pleasant'/)
  assert.match(sold, /group\.city === 'Spring Hill'/)
  const neighborhoodsPage = readFileSync(new URL('../app/neighborhoods/[slug]/page.tsx', import.meta.url), 'utf8')
  assert.match(neighborhoodsPage, /n\.county === 'Maury County'/)
  assert.match(neighborhoodsPage, /sell your Columbia house for cash/)
})

test('cash-offer city canonicals are absolute www URLs and titles can skip the layout template', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /const url = `https:\/\/www\.joshuafink\.com\/cash-offer\/\$\{slug\}`/)
  assert.match(page, /alternates: \{ canonical: url \}/)
  assert.doesNotMatch(page, /canonical: ['"]https:\/\/joshuafink\.com/)
  assert.match(page, /seo\.absoluteTitle \? \{ absolute: seo\.title \} : seo\.title/)
  assert.match(page, /'@type': 'FAQPage'/)
})

test('page-2 cash-offer fixes keep one FAQPage, the live phone, and published figures only', () => {
  const page = readFileSync(new URL('../app/cash-offer/[city]/page.tsx', import.meta.url), 'utf8')
  assert.equal(page.match(/'@type': 'FAQPage'/g)?.length, 1)
  assert.match(page, /Sell My House Fast'\}\{' '\}/)
  assert.match(page, /we buy houses in Nashville/)
  assert.doesNotMatch(page, /615-551-3399|6155513399/)

  const nashville = getCashOfferCity('nashville-tn')
  assert.ok(nashville?.cashBuyersSection)
  assert.equal(nashville.cashBuyersSection.heading, 'Cash home buyers in Nashville')
  assert.ok(nashville.faqs.some((faq) => faq.q === 'Who are the best cash home buyers in Nashville?'))
  const seo = cashOfferSeo(nashville)
  assert.match(seo.description, /Cash home buyers in Nashville/)
  assert.ok(seo.description.length <= 160, seo.description)

  const gallatin = getCashOfferCity('gallatin-tn')
  assert.equal(cashOfferSeo(gallatin!).title, 'Sell My House Fast Gallatin TN | Cash Home Buyers')
  assert.equal(gallatin?.countySection?.eyebrow, 'Sumner County')
  assert.ok((gallatin?.faqs.length ?? 0) >= 4)

  const spring = getCashOfferCity('spring-hill-tn')
  assert.equal(spring?.headline?.accent, 'in Spring Hill. We Buy Houses.')
  assert.equal(spring?.listingSplit?.href, '/sell/spring-hill-tn')
  assert.match(spring?.listingSplit?.note ?? '', /cash path/)

  const columbia = getCashOfferCity('columbia-tn')
  assert.equal(columbia?.localHeading, 'We Buy Houses in Columbia')

  for (const slug of ['smyrna-tn', 'nolensville-tn', 'brentwood-tn', 'franklin-tn']) {
    const city = getCashOfferCity(slug)
    assert.ok(city?.countySection, slug)
    assert.ok((city?.faqs.length ?? 0) >= 4, slug)
  }

  const guide = blogPosts.find((post) => post.slug === 'we-buy-houses-nashville-how-it-works')
  assert.ok(guide)
  assert.equal(guide.title, "How 'We Buy Houses' Companies Work in Nashville: Red Flags & Fair Offers")
  assert.match(guide.content, /we buy houses in Nashville/i)
  assert.match(guide.content, /sell house fast Columbia TN/)
  const h2s = guide.content.split('\n').filter((line) => line.startsWith('## '))
  assert.ok(h2s.length >= 5)
  assert.ok(guide.leadCta?.href === '/cash-offer/nashville-tn')

  const inherited = blogPosts.find((post) => post.slug === 'selling-inherited-house-nashville-tennessee')
  assert.ok(inherited?.faq && inherited.faq.length >= 2)
  assert.match(inherited.faq.map((faq) => faq.q).join('\n'), /probate closes in Tennessee/)
  assert.match(inherited.faq.map((faq) => faq.q).join('\n'), /capital gains/)
  assert.equal(inherited.leadCta?.links?.[0]?.href, '/cash-offer/nashville-tn')
  assert.equal(inherited.leadCta?.links?.[1]?.href, '/cash-offer/franklin-tn')

  const footer = readFileSync(new URL('../components/Footer.tsx', import.meta.url), 'utf8')
  const nav = readFileSync(new URL('../components/Navbar.tsx', import.meta.url), 'utf8')
  assert.match(footer, /\/cash-offer#we-buy-houses/)
  assert.match(footer, /We buy houses across Middle Tennessee/)
  assert.match(nav, /href="\/cash-offer\/nashville-tn"/)
  assert.match(nav, /We buy houses in Nashville/)
  assert.doesNotMatch(footer + nav + guide.content + (inherited.content ?? ''), /615-551-3399|6155513399/)
  assert.doesNotMatch(
    [nashville, gallatin, spring, columbia].map((city) => JSON.stringify(city)).join('\n'),
    /Parks/,
  )
})
