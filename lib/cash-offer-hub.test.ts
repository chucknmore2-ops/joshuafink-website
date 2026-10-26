import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cashOfferHubLastUpdated } from './cash-offer-cities.ts'
import {
  cashOfferHubFaqs,
  cashOfferHubUpdatedLabel,
  nashvilleCashOfferCalculationAnswer,
} from './cash-offer-hub.ts'
import { OFFICE_ADDRESS } from './office.ts'
import { formatStatsDate, getSuburb, marketStatsSource, suburbStatsAsOf } from './suburbs.ts'

const PAGE = readFileSync(new URL('../app/cash-offer/page.tsx', import.meta.url), 'utf8')

test('cash-offer hub stamp reads Updated October 2026 from the content date', () => {
  assert.equal(cashOfferHubLastUpdated, '2026-10-26')
  assert.equal(cashOfferHubUpdatedLabel(), 'October 2026')
  assert.match(PAGE, /Updated \{cashOfferHubUpdatedLabel\(\)\}/)
  assert.match(PAGE, /dateModified: cashOfferHubLastUpdated/)
})

test('cash-offer proof block reuses on-site credentials and offer timing', () => {
  assert.equal(OFFICE_ADDRESS, '8119 Isabella Lane Suite 105, Brentwood, TN 37027')
  assert.match(PAGE, /TREC #351484/)
  assert.match(PAGE, /Compass Real Estate/)
  assert.match(PAGE, /Office: Compass, \{OFFICE_ADDRESS\}/)
  assert.match(PAGE, /615-551-2727/)
  assert.match(PAGE, /licensed since 2008/)
  assert.match(PAGE, /40\+ homes a year in Middle Tennessee/)
  assert.match(PAGE, /Fair cash offer in 24 hours/)
  assert.match(PAGE, /Close in as little as 7 days/)
  assert.match(PAGE, /TennesseeClosingsProof/)
  assert.doesNotMatch(PAGE, /Parks/)
  assert.doesNotMatch(PAGE, /17\+ years|17 years|17-year/)
  assert.doesNotMatch(PAGE, /\$480K|August 20, 2026/)
  assert.doesNotMatch(PAGE, /name="website"/)
})

test('cash-offer hub FAQ is 7 answers, one FAQPage, and only published figures', () => {
  const faqs = cashOfferHubFaqs()
  assert.ok(faqs.length >= 5 && faqs.length <= 7, `expected 5–7 FAQs, got ${faqs.length}`)
  const questions = faqs.map((faq) => faq.q)
  assert.deepEqual(questions, [
    'How fast is a cash offer if I want to sell my house fast in Nashville?',
    'How is a Nashville cash offer calculated?',
    'How does a cash offer compare with listing my Nashville house?',
    'Are there fees or commissions on a cash offer?',
    'Do I have to repair the house before a cash offer?',
    'Which areas do you buy houses in?',
    'How can I tell if a Nashville cash offer is fair?',
  ])

  const fast = faqs[0].a
  assert.match(fast, /within 24 hours/)
  assert.match(fast, /as fast as 7 days/)

  const nashville = getSuburb('nashville-tn')
  assert.ok(nashville)
  const calculation = nashvilleCashOfferCalculationAnswer()
  assert.equal(faqs[1].a, calculation)
  assert.match(calculation, /70–85% of after-repair market value/)
  assert.match(calculation, new RegExp(nashville.medianPrice.replace(/[$.]/g, (ch) => `\\${ch}`)))
  assert.match(calculation, new RegExp(marketStatsSource))
  assert.match(calculation, new RegExp(formatStatsDate(suburbStatsAsOf(nashville))))
  const percents = calculation.match(/\d+(?:–\d+)?%/g) ?? []
  assert.deepEqual(Array.from(new Set(percents)), ['70–85%'])
  const dollars = calculation.match(/\$[0-9][0-9,.]*[KM]?/g) ?? []
  assert.deepEqual(Array.from(new Set(dollars)), [nashville.medianPrice])
  assert.doesNotMatch(calculation, /\$480K|August 20, 2026|August 2026/)
  assert.doesNotMatch(calculation, /Parks/)

  const compare = faqs[2].a
  assert.match(compare, /30–90 days/)
  assert.match(compare, /traditional-listing estimate side by side/)

  assert.match(faqs[3].a, /No agent commissions, no closing costs, no hidden fees/)
  assert.match(faqs[4].a, /completely as-is/)
  assert.match(faqs[5].a, /Nashville, Franklin, Brentwood/)
  assert.match(faqs[6].a, /after-repair value/)
  assert.match(faqs[6].a, /Compass/)
  assert.doesNotMatch(faqs.map((faq) => faq.a).join('\n'), /Parks|17\+ years|17 years/)

  assert.match(PAGE, /cashOfferHubFaqs\(\)/)
  assert.match(PAGE, /const schemaFaqs = \[\.\.\.hubFaqs, \.\.\.faqs\]/)
  assert.match(PAGE, /mainEntity: schemaFaqs\.map/)
  assert.equal(PAGE.match(/'@type': 'FAQPage'/g)?.length, 1)
})
