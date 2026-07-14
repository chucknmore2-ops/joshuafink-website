import { blogPosts } from '@/lib/blog'
import { getAllSuburbSlugs } from '@/lib/suburbs'
import { getAllCashOfferCitySlugs } from '@/lib/cash-offer-cities'
import { getAllNeighborhoodSlugs } from '@/lib/neighborhoods'
import { allFeaturedPairSlugs } from '@/lib/compare'
import { getAllSchoolSlugs } from '@/lib/schools'
import { listings } from '@/lib/listings'
import { listingSlug } from '@/lib/listing-detail'

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
 * the two can never drift. Previously IndexNow hand-maintained a shorter list
 * and silently omitted cash-offer cities, neighborhood guides, school pages,
 * market reports and comparison pages from instant Bing/Yandex submission —
 * those pages were in the sitemap but never got the fast-indexing ping.
 *
 * When you add a new programmatic page type, add it here once and both
 * consumers pick it up automatically.
 */
export function getSiteUrlCatalog(): SiteUrlEntry[] {
  const suburbSlugs = getAllSuburbSlugs()

  // ── Core static routes ────────────────────────────────────────────
  const core: SiteUrlEntry[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/listings', priority: 0.9, changeFrequency: 'daily' },
    { path: '/buy', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/sell', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/cash-offer', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/neighborhoods', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/reviews', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/market', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/compare', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/homes-near', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/guide/buyer', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/moving-to-middle-tennessee', priority: 0.85, changeFrequency: 'monthly' },
    // Legal page — indexable and footer-linked, so include it here to keep this
    // catalog a true single source of truth for the sitemap + IndexNow. Low
    // priority / yearly so it doesn't compete with commercial pages.
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ]

  // ── Blog posts — parse date strings with a defensive fallback ─────
  const blog: SiteUrlEntry[] = blogPosts.map((post) => {
    const dateStr = post.dateModified || post.date
    const parsed = new Date(dateStr)
    return {
      path: `/blog/${post.slug}`,
      priority: 0.75,
      changeFrequency: 'monthly',
      lastModified: isNaN(parsed.getTime()) ? undefined : parsed,
    }
  })

  // ── Suburb pages (sell + buy) ─────────────────────────────────────
  const sellSuburbs: SiteUrlEntry[] = suburbSlugs.map((slug) => ({
    path: `/sell/${slug}`,
    priority: 0.95, // seller-lead-focused pages
    changeFrequency: 'weekly',
  }))
  const buySuburbs: SiteUrlEntry[] = suburbSlugs.map((slug) => ({
    path: `/buy/${slug}`,
    priority: 0.85,
    changeFrequency: 'weekly',
  }))

  // ── Cash-offer city landing pages (high-intent seller leads) ──────
  const cashOfferCities: SiteUrlEntry[] = getAllCashOfferCitySlugs().map((slug) => ({
    path: `/cash-offer/${slug}`,
    priority: 0.9,
    changeFrequency: 'monthly',
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
  }))

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

  // ── On-site listing detail pages (one per active listing) ─────────
  // These capture address-level search intent on joshuafink.com instead of
  // ceding it to compass.com. Inventory turns over fast, so ping daily.
  const listingDetailPages: SiteUrlEntry[] = listings.map((l) => ({
    path: `/listings/${listingSlug(l)}`,
    priority: 0.7,
    changeFrequency: 'daily',
  }))

  return [
    ...core,
    ...blog,
    ...sellSuburbs,
    ...buySuburbs,
    ...cashOfferCities,
    ...neighborhoodPages,
    ...marketReports,
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

/** Absolute URLs for every catalog entry — used by the IndexNow submitter. */
export function getAllSiteUrls(): string[] {
  return getSiteUrlCatalog().map((entry) => absoluteUrl(entry.path))
}
