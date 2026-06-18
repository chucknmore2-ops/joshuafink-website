import type { MetadataRoute } from 'next'
import { getSiteUrlCatalog, SITE_ORIGIN } from '@/lib/site-urls'

// Dynamic sitemap — Next.js App Router serves this at /sitemap.xml automatically
// and re-generates on every deploy. The URL set comes from lib/site-urls.ts,
// the single source of truth shared with the IndexNow submitter
// (app/api/cron/indexnow/route.ts) so the sitemap and the fast-indexing ping
// can never drift apart.

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return getSiteUrlCatalog().map((entry) => ({
    url: `${SITE_ORIGIN}${entry.path}`,
    priority: entry.priority,
    changeFrequency: entry.changeFrequency,
    lastModified: entry.lastModified ?? now,
  }))
}
