import type { Metadata } from 'next'
import Link from 'next/link'
import { FEATURED_PAIRS } from '@/lib/compare'
import { getSuburb } from '@/lib/suburbs'

const SITE = 'https://www.joshuafink.com'

export const metadata: Metadata = {
  title: 'Middle Tennessee Suburb Comparisons — Which Is Right for You? | Joshua Fink',
  description:
    'Side-by-side comparisons of Middle Tennessee suburbs: Franklin vs Brentwood, Spring Hill vs Nolensville, and more. Median price, schools, commute, days on market — honest head-to-head from Joshua Fink at Compass.',
  alternates: { canonical: `${SITE}/compare` },
}

export default function CompareHubPage() {
  const pairs = FEATURED_PAIRS.map(([a, b]) => {
    const sa = getSuburb(a)
    const sb = getSuburb(b)
    if (!sa || !sb) return null
    return { a: sa, b: sb, slug: `${a}-vs-${b}` }
  }).filter((p): p is { a: NonNullable<ReturnType<typeof getSuburb>>; b: NonNullable<ReturnType<typeof getSuburb>>; slug: string } => p !== null)

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: pairs.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/compare/${p.slug}`,
      name: `${p.a.displayName} vs ${p.b.displayName}`,
    })),
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Suburb Comparisons', item: `${SITE}/compare` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="bg-white">
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              Decision-Stage Buyer Guides
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              Middle Tennessee Suburb{' '}
              <span style={{ color: '#C41E3A' }}>Head-to-Head Comparisons</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Franklin vs Brentwood. Spring Hill vs Nolensville. Side-by-side reads on price,
              schools, commute, days on market, and the lifestyle differences that don&apos;t show
              up in a Zillow search. Honest editorial from Joshua, not a generic listicle.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pairs.map((p) => (
              <Link
                key={p.slug}
                href={`/compare/${p.slug}`}
                className="block border border-[#E8E8E8] p-6 hover:border-black transition-colors bg-white group"
              >
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                  Head-to-Head Comparison
                </p>
                <h2 className="text-2xl font-black text-black mb-4 group-hover:underline">
                  {p.a.displayName}{' '}
                  <span className="text-[#C41E3A]">vs</span> {p.b.displayName}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">{p.a.name}</p>
                    <p className="font-black text-black">{p.a.medianPrice}</p>
                    <p className="text-[#6B6B6B]">{p.a.avgDaysOnMarket} days · {p.a.yoyChange}</p>
                  </div>
                  <div>
                    <p className="text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">{p.b.name}</p>
                    <p className="font-black text-black">{p.b.medianPrice}</p>
                    <p className="text-[#6B6B6B]">{p.b.avgDaysOnMarket} days · {p.b.yoyChange}</p>
                  </div>
                </div>
                <p className="text-xs text-[#A0A0A0] mt-4">Read the comparison →</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
