import { NextResponse } from 'next/server'
import { blogPosts } from '@/lib/blog'

export const dynamic = 'force-static'
export const revalidate = 3600

const SITE = 'https://www.joshuafink.com'
const FEED_TITLE = 'Joshua Fink | Compass Real Estate — Middle Tennessee Blog'
const FEED_DESCRIPTION =
  "Market insights, buyer + seller guides, and neighborhood expertise from Joshua Fink, Affiliate Broker at Compass Real Estate. Nashville, Brentwood, Franklin, Spring Hill, and all of Middle Tennessee."

function toIso(human: string): string | undefined {
  const d = new Date(human)
  if (isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export async function GET() {
  const sorted = [...blogPosts].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )

  const items = sorted.map((post) => {
    const url = `${SITE}/blog/${post.slug}`
    const item: Record<string, unknown> = {
      id: url,
      url,
      title: post.title,
      summary: post.excerpt,
      content_text: post.excerpt,
      authors: [{ name: 'Joshua Fink', url: `${SITE}/about` }],
    }
    const published = toIso(post.date)
    if (published) item.date_published = published
    const modified = post.dateModified ? toIso(post.dateModified) : undefined
    if (modified) item.date_modified = modified
    if (post.category) item.tags = [post.category]
    return item
  })

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: FEED_TITLE,
    home_page_url: `${SITE}/blog`,
    feed_url: `${SITE}/blog/feed.json`,
    description: FEED_DESCRIPTION,
    language: 'en-us',
    authors: [{ name: 'Joshua Fink', url: `${SITE}/about` }],
    items,
  }

  return new NextResponse(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
