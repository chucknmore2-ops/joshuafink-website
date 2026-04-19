import { NextResponse } from 'next/server'
import { blogPosts } from '@/lib/blog'

export const dynamic = 'force-static'
export const revalidate = 3600 // 1 hour

const SITE = 'https://joshuafink.com'
const FEED_TITLE = 'Joshua Fink | Compass Real Estate — Middle Tennessee Blog'
const FEED_DESCRIPTION =
  "Market insights, buyer + seller guides, and neighborhood expertise from Joshua Fink, Affiliate Broker at Compass Real Estate. Nashville, Brentwood, Franklin, Spring Hill, and all of Middle Tennessee."

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(human: string): string {
  const d = new Date(human)
  if (isNaN(d.getTime())) return new Date().toUTCString()
  return d.toUTCString()
}

export async function GET() {
  const sorted = [...blogPosts].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )
  const lastBuild = sorted[0] ? toRfc822(sorted[0].dateModified || sorted[0].date) : new Date().toUTCString()

  const items = sorted.map((post) => {
    const url = `${SITE}/blog/${post.slug}`
    const pub = toRfc822(post.date)
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pub}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
      <dc:creator>Joshua Fink</dc:creator>${post.category ? `
      <category>${escapeXml(post.category)}</category>` : ''}
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <copyright>Copyright ${new Date().getFullYear()} Joshua Fink Group</copyright>
    <managingEditor>joshua@joshuafink.com (Joshua Fink)</managingEditor>
    <webMaster>joshua@joshuafink.com (Joshua Fink)</webMaster>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <pubDate>${lastBuild}</pubDate>
    <ttl>60</ttl>
    <generator>joshuafink.com (Next.js)</generator>
${items}
  </channel>
</rss>
`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
