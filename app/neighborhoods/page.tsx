import type { Metadata } from 'next'
import Link from 'next/link'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import TrackedTelLink from '@/components/TrackedTelLink'
import { neighborhoods } from '@/lib/neighborhoods'
import { reviewStats } from '@/lib/reviews'
import SoldPropertyExperience from '@/components/SoldPropertyExperience'
import { publishedSoldListings } from '@/lib/sold-proof'

export const metadata: Metadata = {
  title: 'Middle Tennessee Neighborhood Guides',
  description:
    'In-depth neighborhood guides for the most-searched subdivisions in Franklin, Brentwood, Spring Hill, Nolensville, and the broader Middle Tennessee market. Schools, HOA, amenities, price ranges — and live listings on Compass.',
  alternates: {
    canonical: 'https://www.joshuafink.com/neighborhoods',
  },
}

const faqs = [
  {
    q: 'What is the best Middle Tennessee neighborhood for families?',
    a: 'Family-first searches usually start with Brentwood, Franklin, and Nolensville — all anchored by top-rated Williamson County Schools, low crime, and strong long-term appreciation. Spring Hill and Thompson’s Station offer similar schools at a lower price band. Open any neighborhood guide for the specific school zones, HOA, and price range.',
  },
  {
    q: 'What are the best neighborhoods in Franklin, TN for families?',
    a: 'The Franklin neighborhoods families ask Joshua about most are Westhaven (a walkable master-planned community with a private golf course, resort-style pools, and a real town center), McKay’s Mill and Fieldstone Farms (large, established subdivisions with mature trees, pools, and clubhouses — the kind of place families put down roots for a decade or more), Berry Farms (a newer, walkable mixed-use community in south Franklin with its own town center), and The Highlands at Ladd Park (a newer upscale option on larger-than-builder lots). All five are zoned to Williamson County Schools. See the full guide for each above, or call or text 615-551-2727 and Joshua will match your must-haves — school zone, budget, HOA tolerance — to the right one.',
  },
  {
    q: 'Which Middle Tennessee neighborhoods have the best schools?',
    a: 'Williamson County Schools (Franklin, Brentwood, Nolensville, Thompson’s Station) consistently rank in the top tier of Tennessee public districts. Within that, neighborhoods zoned for Ravenwood High, Page High, and Independence High pull a meaningful school-zone premium — usually 5–15% over comparable homes in adjacent zones.',
  },
  {
    q: 'How are these neighborhood guides different from Zillow or Realtor.com?',
    a: 'Zillow and Realtor.com show listing data. These guides explain the neighborhood itself — HOA structure, build era, school zone, commute pattern, builder reputation, and how the subdivision actually compares to its neighbors. Joshua has shown or sold homes in every neighborhood featured here.',
  },
  {
    q: 'Where do I find live listings for a specific neighborhood?',
    a: 'Each guide links to Joshua’s Compass agent profile, which serves real-time inventory directly from the Middle Tennessee MLS. You can also call or text 615-551-2727 and Joshua will send a curated list filtered to your price, beds, and must-haves.',
  },
  {
    q: 'Can Joshua tour a specific neighborhood with me?',
    a: 'Yes — in-person neighborhood tours are free, with no obligation. Joshua will drive you through the subdivision, walk the streets that matter (cul-de-sacs, pool/clubhouse access, school routes), and show you 2–4 homes if you want to see interiors. Book at /contact or call 615-551-2727.',
  },
]

export default function NeighborhoodsIndexPage() {
  const all = Object.values(neighborhoods)
  const soldRecords = publishedSoldListings()

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
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.joshuafink.com' },
      { '@type': 'ListItem', position: 2, name: 'Neighborhoods', item: 'https://www.joshuafink.com/neighborhoods' },
    ],
  }

  const agentAndBusinessSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateAgent',
        '@id': 'https://www.joshuafink.com/#agent',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '8119 Isabella Lane, Suite 105',
          addressLocality: 'Brentwood',
          addressRegion: 'TN',
          postalCode: '37027',
          addressCountry: 'US',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 36.0234,
          longitude: -86.7838,
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Middle Tennessee',
          addressRegion: 'TN',
          addressCountry: 'US',
        },
        sameAs: [
          'https://www.facebook.com/profile.php?id=100064076493905',
          'https://www.instagram.com/joshuafinkgroup',
          'https://www.linkedin.com/in/joshuafinkgroup/',
          'https://x.com/JoshuaFinkGroup',
          'https://www.youtube.com/channel/UCc6j1NWgJeb00pT5xsenz3g',
          'https://www.compass.com/agents/joshua-fink/',
          'https://www.zillow.com/profile/JoshuaFinkGroup',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: reviewStats.rating.toFixed(1),
          reviewCount: reviewStats.total,
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'LocalBusiness',
        name: 'Joshua Fink Group — Compass Real Estate',
        url: 'https://www.joshuafink.com/neighborhoods',
        telephone: '+16155512727',
        email: 'joshua@joshuafink.com',
        parentOrganization: { '@id': 'https://www.joshuafink.com/#agent' },
        address: {
          '@type': 'PostalAddress',
          streetAddress: '8119 Isabella Lane, Suite 105',
          addressLocality: 'Brentwood',
          addressRegion: 'TN',
          postalCode: '37027',
          addressCountry: 'US',
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Middle Tennessee',
          addressRegion: 'TN',
          addressCountry: 'US',
        },
        priceRange: '$$$',
      },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agentAndBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="bg-white">
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
                  Middle Tennessee · Subdivision &amp; Neighborhood Guides
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                  Neighborhood Guides —{' '}
                  <span style={{ color: '#C41E3A' }}>Real Local Insight, Not Listing Data.</span>
                </h1>
                <p className="text-lg mt-5 leading-relaxed" style={{ color: '#A0A0A0' }}>
                  Honest, in-depth guides to the most-searched subdivisions and neighborhoods in
                  Franklin, Brentwood, Spring Hill, Nolensville, and the broader Middle Tennessee
                  market. Schools, HOA, amenities, home styles, and current price ranges — written
                  by Compass agent Joshua Fink.
                </p>
                <p className="mt-3 text-sm" style={{ color: '#7B7B7B' }}>
                  Need live inventory? Each guide funnels into Joshua&apos;s Compass agent profile
                  where listings are served in real time.
                </p>
                <p className="mt-5 text-sm" style={{ color: '#A0A0A0' }}>
                  New to the area?{' '}
                  <Link
                    href="/moving-to-middle-tennessee"
                    className="font-semibold text-white underline underline-offset-4 hover:no-underline"
                  >
                    Start with the Moving to Middle Tennessee relocation guide →
                  </Link>
                </p>
              </div>

              {/* Inline lead form (mobile: shown first for lead capture) */}
              <div id="neighborhoods-form" className="order-first lg:order-last bg-white text-black p-8 sm:p-10 rounded-2xl">
                <h2 className="text-2xl font-black tracking-tight mb-2">Ask Joshua About a Neighborhood</h2>
                <p className="text-sm text-neutral-600 mb-6">
                  Tell Joshua which subdivision or town you&apos;re considering — get a same-day reply
                  with school zones, HOA notes, current price range, and matching homes.
                </p>
                <SuburbLeadForm
                  successTitle="Message Sent!"
                  successMessage={
                    <>
                      Joshua will reach out same-day with neighborhood insight. For anything urgent, call{' '}
                      <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="neighborhoods-form-success-call">615-551-2727</TrackedTelLink>.
                    </>
                  }
                  resetLabel="Submit Another"
                >
                  <input type="hidden" name="lead_type" value="buyer" />
                  <input type="hidden" name="source" value="neighborhoods-index" />
                  {/* Honeypot — real users never see or fill this */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Full Name *</label>
                      <input type="text" id="name" name="name" required placeholder="Jane Smith"
                        className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Phone *</label>
                      <input type="tel" id="phone" name="phone" required placeholder="(615) 555-0123" autoComplete="tel"
                        className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Email Address *</label>
                    <input type="email" id="email" name="email" required placeholder="you@example.com" autoComplete="email"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                  </div>

                  <div>
                    <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Which Neighborhood? (optional)</label>
                    <textarea id="body" name="body" rows={3}
                      placeholder="Subdivision or town, price range, school zone, must-haves — anything helps Joshua send the right info."
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <button type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#222] transition-colors">
                      Send to Joshua →
                    </button>
                    <TrackedTelLink
                      href="tel:6155512727"
                      className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-4 tracking-wide hover:bg-black hover:text-white transition-colors"
                      data-cta="neighborhoods-form-inline-call"
                    >
                      Or Call 615-551-2727
                    </TrackedTelLink>
                  </div>
                </SuburbLeadForm>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {Object.entries(byCity).map(([city, items]) => (
            <div key={city} className="mb-16 last:mb-0">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">{city}</p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-4">
                {city.split(',')[0]} Neighborhoods
              </h2>
              <div className="flex flex-wrap gap-3 mb-8">
                <Link
                  href={`/buy/${items[0].citySlug}`}
                  className="text-sm font-bold px-5 py-3 tracking-wide bg-[#C41E3A] text-white hover:bg-black transition-colors"
                >
                  Homes for sale in {city.split(',')[0]} →
                </Link>
                <Link
                  href={`/sell/${items[0].citySlug}`}
                  className="text-sm font-bold px-5 py-3 tracking-wide border-2 border-black text-black hover:bg-black hover:text-white transition-colors"
                >
                  Sell your {city.split(',')[0]} home →
                </Link>
              </div>
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

          {soldRecords.length > 0 && (
            <div className="mt-16 mb-16 border border-[#E8E8E8] p-8 sm:p-10">
              <SoldPropertyExperience listings={soldRecords} />
            </div>
          )}

          <div className="mt-16 bg-[#F5F5F5] p-10 text-center">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              More Neighborhoods Coming
            </p>
            <h2 className="text-2xl font-black text-black tracking-tight mb-3">
              Don&apos;t See Your Neighborhood Yet?
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

          <div className="max-w-4xl mx-auto pt-20">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Neighborhood Guide FAQ
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
      </div>
    </>
  )
}
