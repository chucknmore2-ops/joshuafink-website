import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { legacyRedirects } from '../lib/legacy-redirects.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function quotedSlugs(file, pattern) {
  const text = readFileSync(join(root, file), 'utf8')
  return new Set(text.match(pattern) ?? [])
}

test('legacy redirects are permanent, unique, and point at live city pages', () => {
  const rules = legacyRedirects()
  const sources = rules.map((rule) => rule.source)
  assert.equal(new Set(sources).size, sources.length, 'duplicate redirect source')

  const suburbSlugs = quotedSlugs('lib/suburbs.ts', /(?<=slug:\s')[^']+(?=')/g)
  assert.ok(suburbSlugs.size >= 14)

  for (const rule of rules) {
    assert.equal(rule.permanent, true)
    assert.notEqual(rule.source, rule.destination)
  }

  const bySource = new Map(rules.map((rule) => [rule.source, rule.destination]))
  for (const section of ['buy', 'sell', 'cash-offer', 'market']) {
    for (const slug of suburbSlugs) {
      assert.equal(bySource.has(`/${section}/${slug}`), false, `must not redirect live /${section}/${slug}`)
      const city = slug.replace(/-tn$/, '')
      assert.equal(bySource.get(`/${section}/${city}`), `/${section}/${slug}`)
    }
  }

  assert.equal(bySource.get('/buy/mt-juliet'), '/buy/mount-juliet-tn')
  assert.equal(bySource.get('/sell/lavergne-tn'), '/sell/la-vergne-tn')
  assert.equal(bySource.get('/market/thompson-station-tn'), '/market/thompsons-station-tn')
  assert.equal(bySource.get('/neighborhoods/westhaven'), '/neighborhoods/westhaven-franklin-tn')
  assert.equal(bySource.get('/neighborhoods/12-south'), '/neighborhoods/12-south-nashville-tn')
  assert.equal(bySource.get('/listings/159-n-berwick-ln-franklin'), '/buy/franklin-tn')
  assert.equal(bySource.get('/listings/870-reeves-rd-antioch'), '/sold')
  assert.equal(bySource.get('/listings/107-overlook-trail-goodlettsville'), '/sold')
  assert.equal(bySource.get('/listings/261-paragon-mills-rd-nashville'), '/buy/nashville-tn')
  assert.equal(bySource.get('/listings/1113-linn-cv-ct-gallatin'), '/sold')
  assert.equal(bySource.get('/listings/1100-gibson-dr-madison'), '/listings')
  assert.equal(bySource.get('/listings/8117-hilldale-dr-brentwood'), '/sold')
  assert.equal(bySource.get('/compare/murfreesboro-tn-smryna-tn'), '/compare/murfreesboro-tn-vs-smyrna-tn')
  assert.equal(bySource.get('/about-us'), '/about')
  assert.equal(bySource.get('/feed'), '/blog/rss.xml')
  assert.equal(bySource.has('/listings/undisclosed-address-nashville'), false)

  assert.equal(existsSync(join(root, 'app/sold/page.tsx')), true)
  assert.equal(existsSync(join(root, 'app/listings/page.tsx')), true)
  assert.equal(suburbSlugs.has('nashville-tn'), true)
  assert.equal(suburbSlugs.has('madison-tn'), false)
  assert.equal(suburbSlugs.has('antioch-tn'), false)
  assert.equal(suburbSlugs.has('goodlettsville-tn'), false)

  const neighborhoodSlugs = quotedSlugs('lib/neighborhoods.ts', /(?<=slug:\s')[^']+(?=')/g)
  for (const rule of rules) {
    if (!rule.source.startsWith('/neighborhoods/')) continue
    const dest = rule.destination.replace('/neighborhoods/', '')
    assert.equal(neighborhoodSlugs.has(dest), true, `${rule.destination} is not a neighborhood guide`)
  }
})
