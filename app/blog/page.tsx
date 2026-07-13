import type { Metadata } from 'next'
import Link from 'next/link'
import BlogCard from '@/components/BlogCard'
import { blogPosts } from '@/lib/blog'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.joshuafink.com/blog' },
  title: 'Real Estate Blog',
  description:
    'Insights, tips, and market updates from Joshua Fink — Affiliate Broker at Compass Real Estate in Middle Tennessee. Stay informed about Nashville and Brentwood real estate.',
}

function getArchiveYears(): number[] {
  const years = new Set<number>()
  for (const post of blogPosts) {
    const d = new Date(post.date)
    if (!isNaN(d.getTime())) years.add(d.getFullYear())
  }
  return Array.from(years).sort((a, b) => b - a)
}

export default function BlogPage() {
  const archiveYears = getArchiveYears()
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
  ])
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {/* Page header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Market Insights
          </p>
          <h1 className="text-5xl font-black tracking-tight">Real Estate Blog</h1>
          <p className="text-[#A0A0A0] text-lg mt-2">
            Tips, trends, and insights for Middle Tennessee buyers and sellers
          </p>
        </div>
      </div>

      {/* Posts grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {/* Related location pages — pushes blog readers into conversion-optimized
            /market and /buy pages so PageRank flows to the lead-form pages. */}
        <div className="mt-16 pt-10 border-t border-[#E8E8E8]">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4 text-center">
            Related Location Pages
          </p>
          <h2 className="text-2xl font-black text-black mb-6 text-center">
            Explore Middle Tennessee by City
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[
              { label: 'Franklin market', href: '/market/franklin-tn' },
              { label: 'Brentwood market', href: '/market/brentwood-tn' },
              { label: 'Nashville market', href: '/market/nashville-tn' },
              { label: 'Murfreesboro market', href: '/market/murfreesboro-tn' },
              { label: 'Buy in Franklin', href: '/buy/franklin-tn' },
              { label: 'Buy in Spring Hill', href: '/buy/spring-hill-tn' },
              { label: 'Buy in Nolensville', href: '/buy/nolensville-tn' },
              { label: 'All neighborhoods', href: '/neighborhoods' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-semibold text-center px-4 py-3 border border-[#E8E8E8] text-[#444] tracking-wide hover:border-black hover:text-black transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 border border-[#E8E8E8] p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-black mb-3">
            Have Questions About the Market?
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Get personalized insights from Joshua — no generic reports, real answers for your
            specific situation.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#222] transition-colors"
          >
            Talk to Joshua
          </a>
        </div>

        {/* Archive by year */}
        {archiveYears.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#E8E8E8] text-center">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
              Browse the Archive
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {archiveYears.map((y) => (
                <Link
                  key={y}
                  href={`/blog/archive/${y}`}
                  className="text-sm font-semibold px-4 py-2 border border-[#E8E8E8] text-[#444] tracking-wide hover:border-black hover:text-black transition-colors"
                >
                  {y}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
