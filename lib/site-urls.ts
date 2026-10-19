import { blogDateToUtcDate, blogPosts, getAuditTier } from '@/lib/blog'
import { getAllSuburbSlugs, getSuburb, suburbStatsAsOf } from '@/lib/suburbs'
import { cashOfferContentLastUpdated, cashOfferHubLastUpdated, getAllCashOfferCitySlugs, getCashOfferCity } from '@/lib/cash-offer-cities'
import { getAllNeighborhoodSlugs } from '@/lib/neighborhoods'
import { allFeaturedPairSlugs } from '@/lib/compare'
import { getAllSchoolSlugs } from '@/lib/schools'
import { getListingBySlug, isSoldStatus, listingDetailSlugs } from '@/lib/listing-detail'
import { cityMonthParams, cityMonthPath } from '@/lib/city-gnar-months'
import { marketSnapshots } from '@/lib/market-snapshot'

export const SITE_ORIGIN = 'https://www.joshuafink.com'

type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export interface SiteUrlEntry {
  /** Site-relative path beginning with '/', e.g. '/cash-offer/franklin'. */
  path: string
  priority: number
  changeFrequency: ChangeFrequency
  /** Only set where a real modification date exists (blog posts). */
  lastModified?: Date
}

/**
 * Single source of truth for every indexable canonical URL on the site.
 *
 * Both the XML sitemap (`app/sitemap.ts`) and the IndexNow submitter
 * (`app/api/cron/indexnow/route.ts`) derive their URL sets from this list so
 * the two can never drift. IndexNow submits only entries whose lastModified
 * falls inside its lookback window. A page with no lastModified stays in the
 * sitemap and is not pinged until it has a real content date.
 *
 * When you add a new programmatic page type, add it here once and both
 * consumers pick it up automatically.
 */
/** Noon UTC so a calendar day does not shift across time zones. */
function noonUtc(day: string): Date {
  return new Date(`${day}T12:00:00.000Z`)
}

function suburbContentDate(slug: string): Date | undefined {
  const suburb = getSuburb(slug)
  return suburb ? noonUtc(suburbStatsAsOf(suburb)) : undefined
}

export function getSiteUrlCatalog(): SiteUrlEntry[] {
  const suburbSlugs = getAllSuburbSlugs()

  // ── Core static routes ────────────────────────────────────────────
  const core: SiteUrlEntry[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/listings', priority: 0.9, changeFrequency: 'daily' },
    { path: '/buy', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/sell', priority: 0.9, changeFrequency: 'weekly', lastModified: noonUtc('2026-10-17') },
    { path: '/cash-offer', priority: 0.9, changeFrequency: 'monthly', lastModified: noonUtc(cashOfferHubLastUpdated) },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/neighborhoods', priority: 0.85, changeFrequency: 'weekly' },
    // Static chooser. Not a subdivision slug, so it is not emitted by the
    // neighborhood loop below. Sits beside app/neighborhoods/[slug].
    { path: '/neighborhoods/franklin-tn', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/reviews', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly', lastModified: noonUtc('2026-10-17') },
    { path: '/alerts', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/market', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/compare', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/homes-near', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/guide/buyer', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/guide/seller', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/moving-to-middle-tennessee', priority: 0.85, changeFrequency: 'monthly' },
    // Legal page — indexable and footer-linked, so include it here to keep this
    // catalog a true single source of truth for the sitemap + IndexNow. Low
    // priority / yearly so it doesn't compete with commercial pages.
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ]

  // ── Blog posts — parse date strings with a defensive fallback ─────
  // Rewrite-tier posts are noindexed (see app/blog/[slug]/page.tsx), so listing
  // them here would ask Google to crawl a page we are telling it not to index.
  const blog: SiteUrlEntry[] = blogPosts
    .filter((post) => getAuditTier(post.slug) !== 'rewrite')
    .map((post) => {
    const dateStr = post.dateModified || post.date
    return {
      path: `/blog/${post.slug}`,
      priority: 0.75,
      changeFrequency: 'monthly',
      lastModified: blogDateToUtcDate(dateStr),
    }
  })

  // ── Suburb pages (sell + buy) ─────────────────────────────────────
  const sellSuburbs: SiteUrlEntry[] = suburbSlugs.map((slug) => ({
    path: `/sell/${slug}`,
    priority: 0.95, // seller-lead-focused pages
    changeFrequency: 'weekly',
    lastModified: suburbContentDate(slug),
  }))
  const buySuburbs: SiteUrlEntry[] = suburbSlugs.map((slug) => ({
    path: `/buy/${slug}`,
    priority: 0.85,
    changeFrequency: 'weekly',
    lastModified: suburbContentDate(slug),
  }))

  // ── Cash-offer city landing pages (high-intent seller leads) ──────
  const cashOfferCities: SiteUrlEntry[] = getAllCashOfferCitySlugs().map((slug) => ({
    path: `/cash-offer/${slug}`,
    priority: 0.9,
    changeFrequency: 'monthly',
    lastModified: noonUtc(getCashOfferCity(slug)?.contentUpdated ?? cashOfferContentLastUpdated),
  }))

  // ── Neighborhood guide pages ──────────────────────────────────────
  const neighborhoodPages: SiteUrlEntry[] = getAllNeighborhoodSlugs().map((slug) => ({
    path: `/neighborhoods/${slug}`,
    priority: 0.8,
    changeFrequency: 'monthly',
  }))

  // ── Market reports (one per suburb) ───────────────────────────────
  const marketReports: SiteUrlEntry[] = suburbSlugs.map((slug) => ({
    path: `/market/${slug}`,
    priority: 0.85,
    changeFrequency: 'weekly',
    lastModified: suburbContentDate(slug),
  }))

  // Per-city pages for each month in lib/market-snapshot.ts. A new GNAR
  // month adds these URLs on the next build.
  const cityMonthPages: SiteUrlEntry[] = cityMonthParams().map(({ suburb, month }) => {
    const snapshot = marketSnapshots.find((row) => row.month === month)
    return {
      path: cityMonthPath(suburb, month),
      priority: 0.7,
      changeFrequency: 'monthly' as const,
      lastModified: snapshot ? new Date(`${snapshot.reportDate}T12:00:00.000Z`) : undefined,
    }
  })

  // ── Suburb head-to-head comparison pages (featured pairs only) ────
  const comparePages: SiteUrlEntry[] = allFeaturedPairSlugs().map((slug) => ({
    path: `/compare/${slug}`,
    priority: 0.75,
    changeFrequency: 'monthly',
  }))

  // ── Homes-near-[school] landing pages ─────────────────────────────
  const schoolPages: SiteUrlEntry[] = getAllSchoolSlugs().map((slug) => ({
    path: `/homes-near/${slug}`,
    priority: 0.8,
    changeFrequency: 'monthly',
  }))

  // ── On-site listing detail pages (active + indexable sold) ────────
  // These capture address-level search intent on joshuafink.com instead of
  // ceding it to compass.com. Active inventory turns over fast (daily);
  // sold proof pages change only when the Compass sold sync rewrites the file.
  const listingDetailPages: SiteUrlEntry[] = Array.from(listingDetailSlugs).map((slug) => {
    const listing = getListingBySlug(slug)
    const sold = listing ? isSoldStatus(listing.status) : false
    return {
      path: `/listings/${slug}`,
      priority: sold ? 0.65 : 0.7,
      changeFrequency: sold ? 'monthly' : 'daily',
      lastModified: listing?.lastVerified ? new Date(listing.lastVerified) : undefined,
    }
  })

  return [
    ...core,
    ...blog,
    ...sellSuburbs,
    ...buySuburbs,
    ...cashOfferCities,
    ...neighborhoodPages,
    ...marketReports,
    ...cityMonthPages,
    ...comparePages,
    ...schoolPages,
    ...listingDetailPages,
  ]
}

/**
 * Build the absolute URL for a catalog path. The root path '/' collapses to the
 * bare origin (no trailing slash) so the sitemap/IndexNow URL matches the
 * homepage's declared canonical (`https://www.joshuafink.com`). Emitting
 * `.../ ` in the sitemap while the page canonicalizes to no-slash creates an
 * "alternate page with proper canonical tag" split on the most important page.
 */
export function absoluteUrl(path: string): string {
  return path === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`
}

/** Absolute URLs for every catalog entry. */
export function getAllSiteUrls(): string[] {
  return getSiteUrlCatalog().map((entry) => absoluteUrl(entry.path))
}

/**
 * IndexNow lookback. The cron runs at 02:00 UTC. Thirty hours covers that
 * run plus a deploy that lands just after the previous night's ping, without
 * resubmitting the whole catalog.
 */
export const INDEXNOW_LOOKBACK_MS = 30 * 60 * 60 * 1000

/**
 * Catalog URLs whose real lastmod is at or after `since`. Pages with no
 * lastmod are omitted — a missing date means we do not know they changed.
 */
export function getSiteUrlsModifiedSince(since: Date): string[] {
  const cutoff = since.getTime()
  return getSiteUrlCatalog()
    .filter((entry) => entry.lastModified != null && entry.lastModified.getTime() >= cutoff)
    .map((entry) => absoluteUrl(entry.path))
}
