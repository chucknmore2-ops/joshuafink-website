import type { Metadata } from 'next'
import Link from 'next/link'
import { schools, getSchoolSuburb } from '@/lib/schools'

const SITE = 'https://www.joshuafink.com'

export const metadata: Metadata = {
  title: 'Homes Near Top Middle Tennessee Schools — Search by School Zone | Joshua Fink',
  description:
    'Find homes for sale near Ravenwood, Brentwood, Page, Independence, Centennial, Nolensville, Blackman, and Beech High Schools. School-zone-first home search from Joshua Fink at Compass Real Estate.',
  alternates: { canonical: `${SITE}/homes-near` },
}

const faqs = [
  {
    q: 'How do I search Middle Tennessee homes by school zone?',
    a: 'Pick the school below — each page lists active inventory inside that attendance zone, plus the feeder elementary and middle schools, typical home styles, and current price band. School-zone search is the right starting filter when zone is non-negotiable, because address-level zoning does not always line up with city or subdivision boundaries.',
  },
  {
    q: 'What are the highest-rated public high schools in Middle Tennessee?',
    a: 'In Williamson County: Ravenwood (Brentwood), Page (Franklin/Thompson’s Station), Independence (Thompson’s Station), Centennial (Franklin), Brentwood, Nolensville, and Summit (Spring Hill) all consistently rank in the top tier of Tennessee public high schools by test scores, graduation rate, and AP performance. In Rutherford County, Blackman High School (Murfreesboro) carries a 4-star SchoolDigger rating and an A on Niche. In Sumner County, Beech Senior High School (Hendersonville) ranks 26th of 389 Tennessee public high schools by SchoolDigger. Each school page links to its current rating notes and feeder subdivisions.',
  },
  {
    q: 'How much do top school zones add to home prices in Middle Tennessee?',
    a: 'Premium school zones (Ravenwood, Page, Independence, Nolensville) typically command a 5–15% price premium over otherwise-comparable homes in adjacent zones, and resell faster in any market. The premium is largest at the entry price point of each zone, where school-zone buyers concentrate.',
  },
  {
    q: 'Are these school zone boundaries accurate?',
    a: 'Boundary maps are reviewed against each district’s published zone files (WCS, Davidson MNPS, Rutherford, Wilson) and refreshed when boards rezone. Williamson County rezones periodically — Joshua double-checks the assigned zone for any specific address before you write an offer, since one street can split between two schools.',
  },
  {
    q: 'Can you send me a list of homes inside a specific school zone?',
    a: 'Yes. Joshua maintains live, address-verified zone alerts — call or text 615-551-2727 with the school you want and a price range, and you’ll get a curated list (not a generic MLS dump) plus alerts when new homes hit that zone.',
  },
]

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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            School-Zone Search FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-[#E8E8E8] pb-6">
                <h3 className="text-lg font-black text-black mb-2">{faq.q}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
