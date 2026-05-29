import type { Metadata } from 'next'
import Link from 'next/link'
import { neighborhoods } from '@/lib/neighborhoods'

export const metadata: Metadata = {
  title: 'Middle Tennessee Neighborhood Guides | Joshua Fink — Compass',
  description:
    'In-depth neighborhood guides for the most-searched subdivisions in Franklin, Brentwood, Spring Hill, Nolensville, and the broader Middle Tennessee market. Schools, HOA, amenities, price ranges — and live listings on Compass.',
  alternates: {
    canonical: 'https://joshuafink.com/neighborhoods',
  },
}

export default function NeighborhoodsIndexPage() {
  const all = Object.values(neighborhoods)

  const byCity = all.reduce<Record<string, typeof all>>((acc, n) => {
    const key = `${n.city}, ${n.schemaState}`
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://joshuafink.com' },
      { '@type': 'ListItem', position: 2, name: 'Neighborhoods', item: 'https://joshuafink.com/neighborhoods' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="bg-white">
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              Middle Tennessee · Subdivision &amp; Neighborhood Guides
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              Neighborhood Guides —{' '}
              <span style={{ color: '#C41E3A' }}>Real Local Insight, Not Listing Data.</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Honest, in-depth guides to the most-searched subdivisions and neighborhoods in
              Franklin, Brentwood, Spring Hill, Nolensville, and the broader Middle Tennessee
              market. Schools, HOA, amenities, home styles, and current price ranges — written
              by Compass agent Joshua Fink.
            </p>
            <p className="mt-3 text-sm" style={{ color: '#7B7B7B' }}>
              Need live inventory? Each guide funnels into Joshua&apos;s Compass agent profile
              where listings are served in real time.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {Object.entries(byCity).map(([city, items]) => (
            <div key={city} className="mb-16 last:mb-0">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">{city}</p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-8">
                {city.split(',')[0]} Neighborhoods
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((n) => (
                  <Link
                    key={n.slug}
                    href={`/neighborhoods/${n.slug}`}
                    className="block border border-[#E8E8E8] p-6 hover:border-black transition-colors bg-white"
                  >
                    <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                      {n.county}
                    </p>
                    <h3 className="text-xl font-black text-black mb-2">{n.name}</h3>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed mb-4">{n.vibe}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-black">{n.priceBand}</span>
                      <span className="text-[#A0A0A0]">Read guide →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-16 bg-[#F5F5F5] p-10 text-center">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              More Neighborhoods Coming
            </p>
            <h2 className="text-2xl font-black text-black tracking-tight mb-3">
              Don't See Your Neighborhood Yet?
            </h2>
            <p className="text-sm text-[#444] max-w-2xl mx-auto mb-6">
              New subdivision and neighborhood guides are added regularly — covering
              top-searched communities across Franklin, Brentwood, Spring Hill, Nolensville,
              Nashville, and beyond. Tell Joshua which one you want next.
            </p>
            <Link
              href="/contact"
              className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
              style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
            >
              Request a Specific Neighborhood
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
