import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { suburbs } from './suburbs.ts'
import { GEO_QUERIES } from './geo-queries.ts'
import { getSiteUrlCatalog } from './site-urls.ts'
import {
  FRANKLIN_FAMILY_GUIDE_PATH,
  FRANKLIN_MEAN_TRAVEL_MINUTES,
  franklinAreas,
  franklinFamilyFaqs,
  franklinFamilyGuideText,
  franklinFamilySources,
  franklinPriceSentence,
} from './franklin-family-guide.ts'

const guide = franklinFamilyGuideText()
const page = readFileSync(new URL('../app/neighborhoods/franklin-tn/page.tsx', import.meta.url), 'utf8')
const franklin = suburbs['franklin-tn']

test('Franklin family guide is in the sitemap and is the GEO target', () => {
  const matches = getSiteUrlCatalog().filter((row) => row.path === FRANKLIN_FAMILY_GUIDE_PATH)
  assert.equal(matches.length, 1)
  assert.equal(matches[0]?.changeFrequency, 'monthly')
  const query = GEO_QUERIES.find((row) => row.id === 'neighborhoods-franklin')
  assert.equal(query?.targetPath, FRANKLIN_FAMILY_GUIDE_PATH)
})

test('citywide figures match suburbs.ts and name the source and date', () => {
  assert.match(franklinPriceSentence(), new RegExp(franklin.medianPrice.replace(/[$,]/g, (ch) => `\\${ch}`)))
  assert.match(guide, /median days on market is 49/)
  assert.match(guide, /\$330\.85/)
  assert.match(guide, /up 12\.43%/)
  assert.match(guide, /Source: Redfin, as of October 5, 2026/)
  assert.match(guide, /83,454/)
  assert.match(guide, /90,226/)
  assert.match(guide, /8\.0%/)
  assert.match(guide, new RegExp(String(FRANKLIN_MEAN_TRAVEL_MINUTES)))
  assert.match(guide, /2020–2024/)
  assert.match(franklin.description, /83,454/)
  assert.match(franklin.description, /90,226/)
})

test('school, park, and commute facts cite official pages with an as-of date', () => {
  for (const url of [
    'https://www.fssd.org/',
    'https://www.fssd.org/faq',
    'https://www.fssd.org/new-to-fsd',
    'https://www.wcs.edu/schools',
    'https://www.wcs.edu/schools/high-schools',
    'https://www.franklintn.gov/government/departments-k-z/parks',
    'https://www.census.gov/quickfacts/fact/table/franklincitytennessee/PST045224',
    'https://www.redfin.com/news/data-center/downloads/',
  ]) {
    assert.ok(franklinFamilySources.some((source) => source.url === url), url)
    assert.match(guide, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(guide, /3,130/)
  assert.match(guide, /42,000/)
  assert.match(guide, /25\.3/)
  assert.match(guide, /18 city parks/)
  assert.match(guide, /900 acres/)
  assert.match(guide, /October 17, 2026/)
  assert.match(guide, /Johnson Elementary/)
  assert.match(guide, /Freedom Middle/)
  assert.match(guide, /Ninth Special District/)
})

test('the guide links out instead of repeating subdivision price bands', () => {
  for (const slug of [
    'westhaven-franklin-tn',
    'mckays-mill-franklin-tn',
    'fieldstone-farms-franklin-tn',
    'berry-farms-franklin-tn',
    'highlands-at-ladd-park-franklin-tn',
    'cool-springs-franklin-tn',
  ]) {
    assert.equal(franklinAreas.some((area) => area.href === `/neighborhoods/${slug}`), true, slug)
  }
  assert.match(guide, /\/buy\/franklin-tn/)
  assert.match(guide, /\/market\/franklin-tn/)
  assert.match(guide, /\/blog\/living-in-franklin-tn-guide/)
  assert.match(guide, /\/blog\/moving-to-franklin-tn/)
  assert.doesNotMatch(guide, /\$650K|\$2\.5M|\$550K|\$1\.8M|\$900K|\$400K|mid-\$600s/)
  assert.doesNotMatch(guide, /20 min|20–22 miles/)
  assert.doesNotMatch(guide.replaceAll('Parks and Recreation', ''), /\bParks\b/)
  assert.doesNotMatch(guide, /RE\/MAX/)
})

test('the page publishes FAQ, breadcrumb, and webpage schema plus a CTA', () => {
  assert.match(page, /FAQPage/)
  assert.match(page, /BreadcrumbList/)
  assert.match(page, /WebPage/)
  assert.match(page, /RealEstateAgent/)
  assert.match(page, /franklin-family-guide/)
  assert.match(page, /615-551-2727/)
  assert.match(page, /\/buy\/franklin-tn/)
  assert.equal(franklinFamilyFaqs[0].q, 'What are the best neighborhoods in Franklin, TN for families?')
  assert.match(page, /dangerouslySetInnerHTML/)
})
