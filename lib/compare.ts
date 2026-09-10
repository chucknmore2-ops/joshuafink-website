// Explicit .ts extension so Node's built-in test runner can resolve this
// module directly (it does not do extensionless resolution). Webpack and
// TypeScript both handle the explicit form fine — see compare.test.ts.
import { getSuburb, suburbs, type Suburb } from './suburbs.ts'

// Curated head-to-head pairs that capture genuine decision-stage queries
// from Middle Tennessee buyers. These get sitemap entries + the hub page.
// Any other valid pair still renders on /compare/[a]-vs-[b] — this is just
// the "featured" set for indexing and discoverability.
export const FEATURED_PAIRS: Array<[string, string]> = [
  ['franklin-tn', 'brentwood-tn'],
  ['franklin-tn', 'spring-hill-tn'],
  ['brentwood-tn', 'nashville-tn'],
  ['spring-hill-tn', 'nolensville-tn'],
  ['nolensville-tn', 'thompsons-station-tn'],
  ['hendersonville-tn', 'mount-juliet-tn'],
  ['murfreesboro-tn', 'smyrna-tn'],
  ['spring-hill-tn', 'thompsons-station-tn'],
  ['franklin-tn', 'nolensville-tn'],
  ['gallatin-tn', 'hendersonville-tn'],
  ['mount-juliet-tn', 'lebanon-tn'],
  ['columbia-tn', 'spring-hill-tn'],
  ['franklin-tn', 'nashville-tn'],
  ['nashville-tn', 'murfreesboro-tn'],
]

export type ComparePair = {
  a: Suburb
  b: Suburb
  slug: string
}

export function parsePairSlug(pairSlug: string): ComparePair | null {
  // Slug shape: "<suburb-slug-a>-vs-<suburb-slug-b>" where each suburb-slug
  // already ends in "-tn". So we split on "-vs-" exactly once.
  const parts = pairSlug.split('-vs-')
  if (parts.length !== 2) return null
  const a = getSuburb(parts[0])
  const b = getSuburb(parts[1])
  if (!a || !b) return null
  if (a.slug === b.slug) return null
  return { a, b, slug: `${a.slug}-vs-${b.slug}` }
}

export function allFeaturedPairSlugs(): string[] {
  return FEATURED_PAIRS.map(([a, b]) => `${a}-vs-${b}`)
}

// Map either direction of a pair onto ONE canonical slug.
//
// Both `a-vs-b` and `b-vs-a` are built with mirrored content, and each page
// used to declare itself canonical — so every comparison shipped as two
// self-canonicalizing duplicates competing with each other. Each direction
// still RENDERS in the order the visitor asked for (their wording is a real
// intent signal), but they now agree on a single canonical URL.
//
// Featured pairs canonicalize to their curated order; everything else to
// higher-median-price first, matching how the long-tail pairs are generated.
// Alphabetical tie-break keeps it deterministic when prices are equal.
export function canonicalPairSlug(pairSlug: string): string {
  const p = parsePairSlug(pairSlug)
  if (!p) return pairSlug

  for (const [x, y] of FEATURED_PAIRS) {
    if ((x === p.a.slug && y === p.b.slug) || (x === p.b.slug && y === p.a.slug)) {
      return `${x}-vs-${y}`
    }
  }

  const [first, second] =
    p.a.medianPriceNum !== p.b.medianPriceNum
      ? (p.a.medianPriceNum > p.b.medianPriceNum ? [p.a, p.b] : [p.b, p.a])
      : (p.a.slug < p.b.slug ? [p.a, p.b] : [p.b, p.a])

  return `${first.slug}-vs-${second.slug}`
}

// Generate the same comparison from either direction (a-vs-b and b-vs-a both
// resolve to a canonical pair) for sitemap purposes — but we render whichever
// order the URL specifies, since user intent matters for the headline.
export function getAllPairSlugsForBuild(): string[] {
  const slugs = new Set<string>()
  for (const [a, b] of FEATURED_PAIRS) {
    slugs.add(`${a}-vs-${b}`)
    slugs.add(`${b}-vs-${a}`)
  }
  // Also generate every adjacent-price-tier pair across the full suburb list,
  // so users searching less-common comparisons (e.g. murfreesboro vs gallatin)
  // get indexable pages too. This balloons the route count by ~30 but each is
  // a legitimate long-tail query.
  const ordered = Object.values(suburbs).sort((x, y) => y.medianPriceNum - x.medianPriceNum)
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i].slug
    const b = ordered[i + 1].slug
    slugs.add(`${a}-vs-${b}`)
    slugs.add(`${b}-vs-${a}`)
  }
  return Array.from(slugs)
}

// Derive an editorial "verdict" for the head-to-head based on the two suburbs'
// stats. Used in the page hero + meta description. Heuristic, not personalized.
export function pairVerdict(a: Suburb, b: Suburb): {
  forFamilies: string
  forValue: string
  forSpeed: string
} {
  const cheaper = a.medianPriceNum < b.medianPriceNum ? a : b
  const faster = a.avgDaysOnMarket < b.avgDaysOnMarket ? a : b
  const higherAppreciation =
    parseFloat(a.yoyChange.replace(/[+%]/g, '')) > parseFloat(b.yoyChange.replace(/[+%]/g, ''))
      ? a
      : b

  return {
    forFamilies: `${a.schoolDistrict?.includes('Williamson') ? a.name : b.schoolDistrict?.includes('Williamson') ? b.name : a.name} typically wins for top-rated public schools.`,
    forValue: `${cheaper.name} offers the lower entry point at ${cheaper.medianPrice}, with ${higherAppreciation.name} showing stronger ${higherAppreciation.yoyChange} appreciation.`,
    forSpeed: `${faster.name} moves faster — homes average ${faster.avgDaysOnMarket} days on market.`,
  }
}
