/**
 * Permanent redirects for paths that returned 404 on
 * https://www.joshuafink.com on 2026-09-23.
 *
 * Next.js `permanent: true` responds with 308. Destinations are current
 * routes (city pages use the `-tn` suffix). Live listing detail slugs must
 * not appear here — see lib/listing-detail.test.ts.
 */

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
 * The Berwick listing was on-site after detail pages shipped (2026-09-03)
 * and left Compass inventory on 2026-09-04, so /listings/159-n-berwick-ln-franklin
 * 404s. Send it to the Franklin buyer hub.
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

export function legacyRedirects() {
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

  for (const [source, destination] of EXACT) {
    redirects.push({ source, destination, permanent: true })
  }

  redirects.push(...PATTERNS)
  return redirects
}
