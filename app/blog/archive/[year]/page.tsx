import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BlogCard from '@/components/BlogCard'
import { blogPosts } from '@/lib/blog'

interface Props {
  params: { year: string }
}

const SITE = 'https://www.joshuafink.com'

function postYear(human: string): number | undefined {
  const d = new Date(human)
  if (isNaN(d.getTime())) return undefined
  return d.getFullYear()
}

function getYears(): number[] {
  const years = new Set<number>()
  for (const post of blogPosts) {
    const y = postYear(post.date)
    if (y !== undefined) years.add(y)
  }
  return Array.from(years).sort((a, b) => b - a)
}

function getPostsForYear(year: number) {
  return blogPosts
    .filter((p) => postYear(p.date) === year)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

export async function generateStaticParams() {
  return getYears().map((y) => ({ year: String(y) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = Number(params.year)
  if (!Number.isFinite(year)) return { title: 'Blog Archive' }
  const count = getPostsForYear(year).length
  return {
    title: `Blog Archive — ${year}`,
    description: `Browse all ${count} real estate blog post${count === 1 ? '' : 's'} Joshua Fink published in ${year} — Nashville and Middle Tennessee market insights, buyer + seller guides, and neighborhood deep-dives.`,
    alternates: { canonical: `${SITE}/blog/archive/${year}` },
  }
}

export default function YearArchivePage({ params }: Props) {
  const year = Number(params.year)
  if (!Number.isFinite(year) || !/^\d{4}$/.test(params.year)) notFound()

  const posts = getPostsForYear(year)
  if (posts.length === 0) notFound()

  const allYears = getYears()

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Archive ${year}`,
        item: `${SITE}/blog/archive/${year}`,
      },
    ],
  }

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Blog Archive
          </p>
          <h1 className="text-5xl font-black tracking-tight">{year}</h1>
          <p className="text-[#A0A0A0] text-lg mt-2">
            {posts.length} post{posts.length === 1 ? '' : 's'} published in {year}
          </p>
        </div>
      </div>

      {allYears.length > 1 && (
        <div className="border-b border-[#E8E8E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase">
              Browse Year:
            </span>
            {allYears.map((y) => {
              const active = y === year
              return (
                <Link
                  key={y}
                  href={`/blog/archive/${y}`}
                  className={
                    active
                      ? 'text-sm font-bold px-3 py-1.5 bg-black text-white tracking-wide'
                      : 'text-sm font-semibold px-3 py-1.5 border border-[#E8E8E8] text-[#444] tracking-wide hover:border-black hover:text-black transition-colors'
                  }
                  aria-current={active ? 'page' : undefined}
                >
                  {y}
                </Link>
              )
            })}
            <Link
              href="/blog"
              className="text-sm font-semibold px-3 py-1.5 text-[#666] hover:text-black tracking-wide ml-auto"
            >
              All Posts →
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </div>
  )
}
