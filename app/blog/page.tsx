import type { Metadata } from 'next'
import BlogCard from '@/components/BlogCard'
import { blogPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Real Estate Blog',
  description:
    'Insights, tips, and market updates from Joshua Fink — Affiliate Broker at Compass Real Estate in Middle Tennessee. Stay informed about Nashville and Brentwood real estate.',
}

export default function BlogPage() {
  return (
    <div className="bg-white">
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
      </div>
    </div>
  )
}
