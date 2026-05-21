import type { Metadata } from 'next'
import Link from 'next/link'
import { schools, getSchoolSuburb } from '@/lib/schools'

const SITE = 'https://joshuafink.com'

export const metadata: Metadata = {
  title: 'Homes Near Top Middle Tennessee Schools — Search by School Zone | Joshua Fink',
  description:
    'Find homes for sale near Ravenwood, Brentwood, Page, Independence, Centennial, and Nolensville High Schools. School-zone-first home search from Joshua Fink at Compass Real Estate.',
  alternates: { canonical: `${SITE}/homes-near` },
}

export default function HomesNearHubPage() {
  const list = Object.values(schools)

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: list.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/homes-near/${s.slug}`,
      name: `Homes Near ${s.name}`,
    })),
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Homes Near Schools', item: `${SITE}/homes-near` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="bg-white">
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              School-Zone-First Home Search
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              Homes Near Top{' '}
              <span style={{ color: '#C41E3A' }}>Middle Tennessee Schools</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              For most relocating families, school zone is the first filter — not the last. Browse
              home pricing, feeder subdivisions, and live listings for the highest-rated public
              high schools in Williamson County and the broader Middle Tennessee area.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((s) => {
              const suburb = getSchoolSuburb(s)
              return (
                <Link
                  key={s.slug}
                  href={`/homes-near/${s.slug}`}
                  className="block border border-[#E8E8E8] p-6 hover:border-black transition-colors bg-white group"
                >
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                    {s.district}
                  </p>
                  <h2 className="text-xl font-black text-black mb-2 group-hover:underline">{s.name}</h2>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-3">{s.ratingNote}</p>
                  {suburb && (
                    <p className="text-xs font-semibold text-black">
                      Suburb: {suburb.displayName} · Median {suburb.medianPrice}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
