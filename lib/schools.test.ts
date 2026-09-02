// Regression tests for /homes-near/[school] copy helpers.
//
// Run: npm test
//
// School-zone pages used to stamp citywide Redfin medians from lib/suburbs.ts
// as if they were attendance-zone figures, and title/meta/hero were a
// school-name swap on the same skeleton. These tests pin the first-PR fix:
//
//   1. Titles, meta, and hero lines differ across Ravenwood / Brentwood High /
//      Julia Green (and are unique across the full set).
//   2. Meta never presents the suburb median as a school-zone median.
//   3. Related-page links come only from existing mention / neighborhood fields.
//   4. Citywide citations use the date/source already on suburbs.ts.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getSchool,
  getAllSchoolSlugs,
  getSchoolSuburb,
  getRelatedSchools,
  schoolPageTitle,
  schoolPageDescription,
  schoolHeroLine,
  schoolHeroKicker,
} from './schools.ts'
import { citywideStatsCitation, marketStatsSource, marketStatsLastUpdated } from './suburbs.ts'

const RAVENWOOD = 'ravenwood-high-school-brentwood-tn'
const BRENTWOOD_HIGH = 'brentwood-high-school-brentwood-tn'
const JULIA_GREEN = 'julia-green-elementary-nashville-tn'
const WOODLAND = 'woodland-middle-school-brentwood-tn'
const CROCKETT = 'crockett-elementary-brentwood-tn'
const BEECH = 'beech-senior-high-school-hendersonville-tn'
const STATION_CAMP = 'station-camp-high-school-gallatin-tn'
const NOLENSVILLE = 'nolensville-high-school-nolensville-tn'
const MILL_CREEK = 'mill-creek-elementary-nolensville-tn'

function copyFor(slug: string) {
  const s = getSchool(slug)
  assert.ok(s, slug)
  const suburb = getSchoolSuburb(s)
  return {
    s,
    suburb,
    title: schoolPageTitle(s, suburb),
    description: schoolPageDescription(s, suburb),
    hero: schoolHeroLine(s, suburb),
    kicker: schoolHeroKicker(s, suburb),
    related: getRelatedSchools(s).map((r) => r.slug),
  }
}

test('Ravenwood, Brentwood High, and Julia Green titles / meta / hero all differ', () => {
  const ravenwood = copyFor(RAVENWOOD)
  const brentwood = copyFor(BRENTWOOD_HIGH)
  const julia = copyFor(JULIA_GREEN)

  assert.notEqual(ravenwood.title, brentwood.title)
  assert.notEqual(ravenwood.title, julia.title)
  assert.notEqual(brentwood.title, julia.title)

  assert.notEqual(ravenwood.description, brentwood.description)
  assert.notEqual(ravenwood.description, julia.description)
  assert.notEqual(brentwood.description, julia.description)

  assert.notEqual(ravenwood.hero, brentwood.hero)
  assert.notEqual(ravenwood.hero, julia.hero)
  assert.notEqual(brentwood.hero, julia.hero)

  assert.match(ravenwood.title, /Ravenwood/)
  assert.match(ravenwood.title, /Governors Club/)
  assert.match(brentwood.title, /Brentwood High/)
  assert.match(brentwood.title, /Brentwood Hills/)
  assert.match(julia.title, /Julia Green/)
  assert.match(julia.title, /Green Hills/)
})

test('every school page title, description, and hero line is unique', () => {
  const titles = new Set<string>()
  const descriptions = new Set<string>()
  const heroes = new Set<string>()
  const kickers = new Set<string>()

  for (const slug of getAllSchoolSlugs()) {
    const c = copyFor(slug)
    assert.equal(titles.has(c.title), false, `duplicate title: ${c.title}`)
    assert.equal(descriptions.has(c.description), false, `duplicate description: ${c.description}`)
    assert.equal(heroes.has(c.hero), false, `duplicate hero: ${c.hero}`)
    assert.equal(kickers.has(c.kicker), false, `duplicate kicker: ${c.kicker}`)
    titles.add(c.title)
    descriptions.add(c.description)
    heroes.add(c.hero)
    kickers.add(c.kicker)
  }

  assert.equal(titles.size, getAllSchoolSlugs().length)
})

test('meta describes the suburb median as citywide, not a zone median', () => {
  for (const slug of getAllSchoolSlugs()) {
    const { description, suburb, s } = copyFor(slug)
    assert.match(description, /citywide/i)
    assert.match(description, /not a .+ attendance-zone median/i)
    assert.doesNotMatch(
      description,
      new RegExp(`${s.name} (zone )?median`, 'i'),
    )
    if (suburb) {
      assert.match(description, new RegExp(suburb.medianPrice.replace(/[$,]/g, (ch) => `\\${ch}`)))
    }
  }
})

test('related feeder links follow existing mentions and shared neighborhoods', () => {
  const ravenwood = copyFor(RAVENWOOD)
  assert.ok(ravenwood.related.includes(WOODLAND), 'Woodland copy already names Ravenwood')
  assert.ok(ravenwood.related.includes(CROCKETT), 'Crockett copy already names the Ravenwood feeder')
  assert.ok(ravenwood.related.includes(BRENTWOOD_HIGH), 'Brentwood High copy already compares to Ravenwood')
  assert.equal(ravenwood.related.includes(JULIA_GREEN), false)

  const woodland = copyFor(WOODLAND)
  assert.ok(woodland.related.includes(RAVENWOOD))

  const millCreek = copyFor(MILL_CREEK)
  assert.ok(millCreek.related.includes(NOLENSVILLE))

  const beech = copyFor(BEECH)
  assert.ok(beech.related.includes(STATION_CAMP))

  const julia = copyFor(JULIA_GREEN)
  assert.equal(julia.related.includes(RAVENWOOD), false)
  assert.equal(julia.related.includes(BRENTWOOD_HIGH), false)
})

test('citywide citation uses suburbs.ts source and as-of date', () => {
  const ravenwood = copyFor(RAVENWOOD)
  assert.ok(ravenwood.suburb)
  const citation = citywideStatsCitation(ravenwood.suburb)
  assert.match(citation, new RegExp(marketStatsSource))
  assert.match(citation, /as of/i)
  assert.match(citation, /August 20, 2026/)
  assert.equal(marketStatsLastUpdated, '2026-08-20')
})
