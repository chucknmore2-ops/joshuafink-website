/**
 * Permanent redirects for paths that returned 404 on
 * https://www.joshuafink.com on 2026-09-23.
 *
 * Next.js `permanent: true` responds with 308. Destinations are current
 * routes (city pages use the `-tn` suffix). Live listing detail slugs must
 * not appear here — see lib/listing-detail.test.ts. Slugs the Compass sync
 * removes are appended to lib/removed-listing-redirects.json and merged in
 * below; a slug that is back in inventory is skipped so the live page wins.
 */

import {
  listingRedirectsFromRemoved,
  liveListingSlugsFromRepo,
  readRemovedListings,
  suburbSlugsFromRepo,
} from './removed-listing-redirects.mjs'

const SECTIONS = ['buy', 'sell', 'cash-offer', 'market']

/** City keys whose live routes are `/{section}/{city}-tn`. */
const CITIES = [
  'franklin',
  'brentwood',
  'spring-hill',
  'nolensville',
  'thompsons-station',
  'nashville',
  'murfreesboro',
  'gallatin',
  'hendersonville',
  'columbia',
  'mount-juliet',
  'lebanon',
  'smyrna',
  'la-vergne',
]

/** Common misspellings of a city slug, mapped to the live `-tn` slug. */
const CITY_SPELLING = {
  'mt-juliet': 'mount-juliet-tn',
  'mt-juliet-tn': 'mount-juliet-tn',
  'lavergne-tn': 'la-vergne-tn',
  'thompson-station-tn': 'thompsons-station-tn',
}

/** Short neighborhood paths people guess, mapped to the published guide slug. */
const NEIGHBORHOODS = {
  westhaven: 'westhaven-franklin-tn',
  'cool-springs': 'cool-springs-franklin-tn',
  'east-nashville': 'east-nashville-tn',
  '12-south': '12-south-nashville-tn',
  germantown: 'germantown-nashville-tn',
  'sylvan-park': 'sylvan-park-nashville-tn',
}

/**
 * One-off paths with a single modern page.
 * 159 N Berwick Ln left Compass inventory on 2026-09-04. That URL stays on
 * the Franklin buyer page.
 * Search Console 404s from 2026-11: a delisted /listings/<slug> goes to /sold
 * when lib/closings-data.ts has the address, otherwise to /buy/{city}-tn when
 * that page exists, otherwise to /listings. The compare source is the
 * Murfreesboro/Smyrna pair with "-vs-" missing and smyrna misspelled.
 * Later removals land in lib/removed-listing-redirects.json.
 */
const EXACT = [
  ['/about-us', '/about'],
  ['/contact-us', '/contact'],
  ['/sell-my-house', '/sell'],
  ['/home-value', '/sell'],
  ['/home-valuation', '/sell'],
  ['/whats-my-home-worth', '/sell'],
  ['/testimonials', '/reviews'],
  ['/privacy-policy', '/privacy'],
  ['/properties', '/listings'],
  ['/property', '/listings'],
  ['/homes', '/listings'],
  ['/homes-for-sale', '/listings'],
  ['/sitemap', '/sitemap.xml'],
  ['/misc/sitemap', '/sitemap.xml'],
  ['/feed', '/blog/rss.xml'],
  ['/rss', '/blog/rss.xml'],
  ['/listings/159-n-berwick-ln-franklin', '/buy/franklin-tn'],
  ['/listings/870-reeves-rd-antioch', '/sold'],
  ['/listings/107-overlook-trail-goodlettsville', '/sold'],
  ['/listings/261-paragon-mills-rd-nashville', '/buy/nashville-tn'],
  ['/listings/1113-linn-cv-ct-gallatin', '/sold'],
  ['/listings/1100-gibson-dr-madison', '/listings'],
  ['/listings/8117-hilldale-dr-brentwood', '/sold'],
  ['/compare/murfreesboro-tn-smryna-tn', '/compare/murfreesboro-tn-vs-smyrna-tn'],
  ['/buyers-sellers/whats-my-home-worth', '/sell'],
  ['/real-estate/featured-listings', '/listings'],
  ['/real-estate/short-sale-listings', '/listings'],
  ['/real-estate/testimonials', '/reviews'],
  ['/real-estate/virtual-tours', '/listings'],
  ['/real-estate/uncategorized', '/blog'],
  ['/real-estate/tumblr-blogs', '/blog'],
  ['/search-properties', '/listings'],
]

/** Patterns covering the old WordPress blog archive, pagination, and testimonials. */
const PATTERNS = [
  { source: '/blog/page/:page', destination: '/blog', permanent: true },
  { source: '/page/:page(\\d+)', destination: '/blog', permanent: true },
  { source: '/:year(\\d{4})/:month(\\d{2})', destination: '/blog', permanent: true },
  { source: '/testimonial-:slug', destination: '/reviews', permanent: true },
]

function isLiveListingPath(source, liveSlugs) {
  if (!source.startsWith('/listings/')) return false
  const slug = source.slice('/listings/'.length)
  return liveSlugs.has(slug)
}

export function legacyRedirects(options = {}) {
  const liveSlugs = options.liveSlugs ?? liveListingSlugsFromRepo()
  const suburbSlugs = options.suburbSlugs ?? suburbSlugsFromRepo()
  const removed = options.removed ?? readRemovedListings()
  const redirects = []

  for (const section of SECTIONS) {
    for (const city of CITIES) {
      redirects.push({
        source: `/${section}/${city}`,
        destination: `/${section}/${city}-tn`,
        permanent: true,
      })
    }
    for (const [from, to] of Object.entries(CITY_SPELLING)) {
      redirects.push({
        source: `/${section}/${from}`,
        destination: `/${section}/${to}`,
        permanent: true,
      })
    }
  }

  for (const [from, to] of Object.entries(NEIGHBORHOODS)) {
    redirects.push({
      source: `/neighborhoods/${from}`,
      destination: `/neighborhoods/${to}`,
      permanent: true,
    })
  }

  const taken = new Set()
  for (const [source, destination] of EXACT) {
    if (isLiveListingPath(source, liveSlugs)) continue
    redirects.push({ source, destination, permanent: true })
    taken.add(source)
  }

  for (const rule of listingRedirectsFromRemoved(removed, { liveSlugs, suburbSlugs })) {
    if (taken.has(rule.source)) continue
    redirects.push(rule)
    taken.add(rule.source)
  }

  redirects.push(...PATTERNS)
  return redirects
}
