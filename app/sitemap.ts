import type { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog'
import { getAllSuburbSlugs } from '@/lib/suburbs'

const SITE = 'https://www.joshuafink.com'

// Dynamic sitemap — Next.js App Router serves this at /sitemap.xml automatically
// and re-generates on every deploy. Replaces the previous static
// public/sitemap.xml which went stale whenever the content engine shipped a new
// blog post or a suburb was added to lib/suburbs.ts.

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // ── Core static routes ────────────────────────────────────────────
  const core: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, priority: 1.0, changeFrequency: 'weekly', lastModified: now },
    { url: `${SITE}/listings`, priority: 0.9, changeFrequency: 'daily', lastModified: now },
    { url: `${SITE}/sell`, priority: 0.9, changeFrequency: 'weekly', lastModified: now },
    { url: `${SITE}/cash-offer`, priority: 0.9, changeFrequency: 'monthly', lastModified: now },
    { url: `${SITE}/about`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
    { url: `${SITE}/blog`, priority: 0.8, changeFrequency: 'weekly', lastModified: now },
    { url: `${SITE}/reviews`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
    { url: `${SITE}/contact`, priority: 0.7, changeFrequency: 'monthly', lastModified: now },
  ]

  // ── Blog posts — parse date strings with a defensive fallback ─────
  const blog: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const dateStr = post.dateModified || post.date
    const parsed = new Date(dateStr)
    const lastModified = isNaN(parsed.getTime()) ? now : parsed
    return {
      url: `${SITE}/blog/${post.slug}`,
      priority: 0.75,
      changeFrequency: 'monthly' as const,
      lastModified,
    }
  })

  // ── Suburb pages (buy + sell) ─────────────────────────────────────
  const suburbSlugs = getAllSuburbSlugs()
  const sellSuburbs: MetadataRoute.Sitemap = suburbSlugs.map((slug) => ({
    url: `${SITE}/sell/${slug}`,
    priority: 0.95, // seller-lead-focused pages
    changeFrequency: 'weekly' as const,
    lastModified: now,
  }))
  const buySuburbs: MetadataRoute.Sitemap = suburbSlugs.map((slug) => ({
    url: `${SITE}/buy/${slug}`,
    priority: 0.85,
    changeFrequency: 'weekly' as const,
    lastModified: now,
  }))

  return [...core, ...blog, ...sellSuburbs, ...buySuburbs]
}
