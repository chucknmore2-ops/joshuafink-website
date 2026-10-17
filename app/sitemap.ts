import type { MetadataRoute } from 'next'
import { getSiteUrlCatalog, absoluteUrl } from '@/lib/site-urls'

// Dynamic sitemap — Next.js App Router serves this at /sitemap.xml automatically
// and re-generates on every deploy. The URL set comes from lib/site-urls.ts,
// the single source of truth shared with the IndexNow submitter
// (app/api/cron/indexnow/route.ts) so the sitemap and the fast-indexing ping
// can never drift apart.

export default function sitemap(): MetadataRoute.Sitemap {
  return getSiteUrlCatalog().map((entry) => ({
    url: absoluteUrl(entry.path),
    priority: entry.priority,
    changeFrequency: entry.changeFrequency,
    // Omit lastmod when the page has no real content date. A shared build
    // timestamp on every URL teaches crawlers to ignore lastmod.
    ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
  }))
}
