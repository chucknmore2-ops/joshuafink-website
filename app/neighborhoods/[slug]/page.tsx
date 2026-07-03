import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getNeighborhood,
  getAllNeighborhoodSlugs,
  getRelatedNeighborhoods,
} from '@/lib/neighborhoods'
import { getSuburb } from '@/lib/suburbs'
import { reviewStats } from '@/lib/reviews'
import { withUtm } from '@/lib/utm'
import SuburbLeadForm from '@/components/SuburbLeadForm'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllNeighborhoodSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const n = getNeighborhood(slug)
  if (!n) return {}

  return {
    title: n.metaTitle,
    description: n.metaDescription,
    keywords: [
      `${n.name} ${n.city} TN`,
      `${n.name} neighborhood`,
      `${n.name} ${n.city} homes`,
      `${n.name} ${n.city} real estate`,
      `${n.name} HOA`,
      `${n.name} schools`,
      `living in ${n.name}`,
      'Joshua Fink',
      'Compass Real Estate',
    ],
    alternates: {
      canonical: `https://www.joshuafink.com/neighborhoods/${n.slug}`,
    },
    openGraph: {
      title: n.metaTitle,
      description: n.metaDescription,
      url: `https://www.joshuafink.com/neighborhoods/${n.slug}`,
      siteName: 'Joshua Fink Group',
      type: 'article',
    },
  }
}

export default async function NeighborhoodPage({ params }: Props) {
  const { slug } = await params
  const n = getNeighborhood(slug)
  if (!n) notFound()

  const parentSuburb = getSuburb(n.citySlug)
  const compassUrl = withUtm(
    n.compassSearchUrl ||
      `https://www.compass.com/search/sale/cities/${encodeURIComponent(n.city)}/?keyword=${encodeURIComponent(n.name)}`,
    {
      source: 'joshuafink',
      medium: 'referral',
      campaign: 'neighborhood-guide',
      content: n.slug,
    }
  )
  const related = getRelatedNeighborhoods(n.slug, 3)

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${n.name}, ${n.city}, ${n.schemaState}`,
    description: n.metaDescription,
    url: `https://www.joshuafink.com/neighborhoods/${n.slug}`,
    image: 'https://www.joshuafink.com/headshot.webp',
    address: {
      '@type': 'PostalAddress',
      addressLocality: n.schemaCity,
      addressRegion: n.schemaState,
      addressCountry: 'US',
    },
    ...(typeof n.latitude === 'number' && typeof n.longitude === 'number'
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: n.latitude,
            longitude: n.longitude,
          },
          hasMap: `https://www.google.com/maps/search/?api=1&query=${n.latitude},${n.longitude}`,
        }
      : {}),
    containedInPlace: {
      '@type': 'City',
      name: n.schemaCity,
      addressRegion: n.schemaState,
    },
    provider: { '@id': 'https://www.joshuafink.com/#agent' },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: n.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  const agentSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': 'https://www.joshuafink.com/#agent',
    name: 'Joshua Fink — Compass Real Estate',
    url: `https://www.joshuafink.com/neighborhoods/${n.slug}`,
    telephone: '+16155512727',
    email: 'joshua@joshuafink.com',
    image: 'https://www.joshuafink.com/headshot.webp',
    description: `Joshua Fink is a Compass Real Estate agent covering the ${n.name} neighborhood in ${n.city}, ${n.schemaState}.`,
    areaServed: {
      '@type': 'City',
      name: n.schemaCity,
      addressRegion: n.schemaState,
      addressCountry: 'US',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.rating.toFixed(1),
      reviewCount: reviewStats.total,
      bestRating: '5',
      worstRating: '1',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.joshuafink.com' },
      { '@type': 'ListItem', position: 2, name: 'Neighborhoods', item: 'https://www.joshuafink.com/neighborhoods' },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${n.name}, ${n.city}`,
        item: `https://www.joshuafink.com/neighborhoods/${n.slug}`,
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="bg-white">
        {/* Hero */}
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              {n.county} · {n.city}, {n.schemaState}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              {n.name} —{' '}
              <span style={{ color: '#C41E3A' }}>Neighborhood Guide for {n.city}, TN Buyers</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              {n.intro}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href={compassUrl}
                target="_blank"
                rel="noopener"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                See Live {n.name} Listings on Compass →
              </a>
              <Link
                href="#contact"
                className="inline-block border text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                style={{ borderColor: '#FFFFFF' }}
              >
                Talk to Joshua
              </Link>
            </div>
            <p className="mt-4 text-xs" style={{ color: '#7B7B7B' }}>
              Listings are served live from compass.com. Joshua Fink is your attributed agent on Compass.
            </p>
          </div>
        </div>

        {/* Snapshot strip */}
        <div className="border-b border-[#E8E8E8] bg-[#F9F9F9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              {n.name} Quick Snapshot
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 border border-[#E8E8E8]">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-2">Price Range</p>
                <p className="text-xl font-black text-black">{n.priceBand}</p>
              </div>
              <div className="bg-white p-6 border border-[#E8E8E8]">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-2">Built</p>
                <p className="text-xl font-black text-black">{n.buildYears}</p>
              </div>
              <div className="bg-white p-6 border border-[#E8E8E8]">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-2">Vibe</p>
                <p className="text-sm font-semibold text-black leading-snug">{n.vibe}</p>
              </div>
              <div className="bg-white p-6 border border-[#E8E8E8]">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-2">Parent City</p>
                <Link href={`/buy/${n.citySlug}`} className="text-xl font-black text-black hover:underline">
                  {n.city}, TN →
                </Link>
              </div>
            </div>

            {parentSuburb && (
              <>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mt-10 mb-6">
                  {parentSuburb.name} Market — 2026
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 border border-[#E8E8E8]">
                    <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-2">Median Price</p>
                    <p className="text-xl font-black text-black">{parentSuburb.medianPrice}</p>
                  </div>
                  <div className="bg-white p-6 border border-[#E8E8E8]">
                    <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-2">Avg Days on Market</p>
                    <p className="text-xl font-black text-black">{parentSuburb.avgDaysOnMarket}</p>
                  </div>
                  <div className="bg-white p-6 border border-[#E8E8E8]">
                    <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-2">Price / Sq Ft</p>
                    <p className="text-xl font-black text-black">${parentSuburb.pricePerSqft}</p>
                  </div>
                  <div className="bg-white p-6 border border-[#E8E8E8]">
                    <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-2">YoY Change</p>
                    <p className="text-xl font-black text-black">{parentSuburb.yoyChange}</p>
                  </div>
                </div>
                <p className="text-xs text-[#7B7B7B] mt-3">
                  Source: Joshua Fink / Compass market data for {parentSuburb.displayName}. {n.name} sits within this market.
                </p>
              </>
            )}
          </div>
        </div>

        {/* About + sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                About {n.name}
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-6">
                What to Know About Living in {n.name}
              </h2>
              <p className="text-[#444] text-base leading-relaxed">{n.about}</p>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                    Amenities
                  </p>
                  <ul className="space-y-2">
                    {n.amenities.map((a) => (
                      <li key={a} className="text-sm text-[#444] flex gap-2">
                        <span style={{ color: '#C41E3A' }}>→</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                    Common Home Styles
                  </p>
                  <ul className="space-y-2">
                    {n.homeStyles.map((s) => (
                      <li key={s} className="text-sm text-[#444] flex gap-2">
                        <span style={{ color: '#C41E3A' }}>→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10 bg-[#F9F9F9] border-l-4 p-6" style={{ borderColor: '#0A1628' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">Schools</p>
                <p className="text-sm text-[#444] leading-relaxed">{n.schoolNotes}</p>
              </div>

              <div className="mt-6 bg-[#F9F9F9] border-l-4 p-6" style={{ borderColor: '#0A1628' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">HOA</p>
                <p className="text-sm text-[#444] leading-relaxed">{n.hoa}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6" style={{ backgroundColor: '#0A1628' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
                  At a Glance
                </p>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm text-[#A0A0A0]">City</dt>
                    <dd className="text-sm font-semibold text-white">{n.city}, {n.schemaState}</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm text-[#A0A0A0]">County</dt>
                    <dd className="text-sm font-semibold text-white">{n.county}</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm text-[#A0A0A0]">Price Range</dt>
                    <dd className="text-sm font-semibold text-white">{n.priceBand}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-[#A0A0A0]">Built</dt>
                    <dd className="text-sm font-semibold text-white text-right">{n.buildYears}</dd>
                  </div>
                </dl>
              </div>

              <div className="border border-[#E8E8E8] p-6 bg-white">
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                  See Live Listings
                </p>
                <p className="text-sm text-[#444] leading-relaxed mb-4">
                  Active {n.name} listings are served on Compass with Joshua as your attributed agent.
                </p>
                <a
                  href={compassUrl}
                  target="_blank"
                  rel="noopener"
                  className="block text-center text-sm font-bold px-6 py-3 tracking-wide transition-colors"
                  style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
                >
                  View on Compass →
                </a>
              </div>

              <div className="border border-[#E8E8E8] p-6 bg-white">
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">Talk to Joshua</p>
                <a href="tel:6155512727" className="block text-2xl font-black text-black hover:underline mb-1">
                  615-551-2727
                </a>
                <a href="sms:+16155512727" className="block text-sm font-semibold text-black hover:underline mb-1">
                  Text 615-551-2727
                </a>
                <a href="mailto:joshua@joshuafink.com" className="block text-sm text-[#444] hover:underline">
                  joshua@joshuafink.com
                </a>
              </div>

              {parentSuburb && (
                <div className="border border-[#E8E8E8] p-6 bg-white">
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                    More From {n.city}
                  </p>
                  <Link
                    href={`/buy/${n.citySlug}`}
                    className="block text-sm font-semibold text-black hover:underline mb-1"
                  >
                    → Buying a home in {n.city}
                  </Link>
                  <Link
                    href={`/sell/${n.citySlug}`}
                    className="block text-sm font-semibold text-black hover:underline"
                  >
                    → Selling in {n.city}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Why Joshua */}
        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Buying or Selling in {n.name}
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              Why Work With Joshua in {n.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {n.whyBullets.map((bullet, i) => {
                const colonIdx = bullet.indexOf(':')
                const title = colonIdx > -1 ? bullet.slice(0, colonIdx).trim() : `Reason ${i + 1}`
                const body = colonIdx > -1 ? bullet.slice(colonIdx + 1).trim() : bullet
                return (
                  <div key={i} className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black mb-4"
                      style={{ backgroundColor: '#0A1628' }}
                    >
                      {i + 1}
                    </div>
                    <h3 className="text-base font-black text-black mb-3">{title}</h3>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">Common Questions</p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-10">
            {n.name} — Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {n.faqs.map((faq, i) => (
              <div key={i} className="bg-white p-8 border-l-4" style={{ borderColor: '#0A1628' }}>
                <h3 className="text-base font-black text-black mb-3">{faq.q}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related neighborhoods — internal cross-links between guide pages */}
        {related.length > 0 && (
          <div className="bg-white border-t border-neutral-200 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Compare With Other Communities
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-3">
                Other neighborhoods Joshua covers
              </h2>
              <p className="text-sm text-[#6B6B6B] max-w-2xl mb-10 leading-relaxed">
                Buyers looking at {n.name} often compare to these other Middle Tennessee
                communities. Each guide has the same depth — pricing, schools, HOA, and
                what the lifestyle actually feels like on the ground.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/neighborhoods/${r.slug}`}
                    className="group block bg-neutral-50 border border-neutral-200 p-6 transition-all duration-200 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                  >
                    <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                      {r.city}, {r.schemaState}
                    </p>
                    <h3 className="text-lg font-black text-black mb-2 group-hover:underline">
                      {r.name}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] leading-relaxed mb-4">{r.vibe}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-black">{r.priceBand}</span>
                      <span className="text-[#A0A0A0] group-hover:text-black transition-colors">
                        Read guide →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact CTA */}
        <div id="contact" className="text-white py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0A1628' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Thinking about {n.name}?
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#A0A0A0' }}>
                Free consultation. Local Compass agent. Honest answers about {n.name} — pricing, schools, off-market opportunities.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <a
                href={compassUrl}
                target="_blank"
                rel="noopener"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                See Live Listings →
              </a>
              <a
                href="tel:6155512727"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
              >
                Call 615-551-2727
              </a>
              <a
                href="sms:+16155512727"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
              >
                Text 615-551-2727
              </a>
            </div>
          </div>

          {/* Inline lead-capture form */}
          <div className="max-w-3xl mx-auto mt-12 bg-white p-8 sm:p-10">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Get {n.name} Listings &amp; Local Advice
            </p>
            <SuburbLeadForm
              successTitle="Request Sent!"
              successMessage={
                <>
                  Joshua will reach out same-day with {n.name} insights and listings that fit. For anything urgent, call{' '}
                  <a href="tel:6155512727" className="text-black font-semibold underline">615-551-2727</a>.
                </>
              }
              resetLabel="Submit Another"
            >
              <input type="hidden" name="lead_type" value="buyer" />
              <input type="hidden" name="suburb" value={n.name} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Full Name *</label>
                  <input type="text" id="name" name="name" required placeholder="Jane Smith"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Phone *</label>
                  <input type="tel" id="phone" name="phone" required placeholder="615-555-0000"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Email Address *</label>
                <input type="email" id="email" name="email" required placeholder="you@example.com"
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
              </div>

              <div>
                <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">What can Joshua help with? (optional)</label>
                <textarea id="body" name="body" rows={4}
                  placeholder={`Buying or selling in ${n.name}? Tell Joshua your must-haves — school zone, budget, timeline. Anything helps.`}
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
              </div>

              <p className="text-xs text-[#A0A0A0]">* Joshua responds same-day. No spam, no pressure.</p>

              <button type="submit"
                className="w-full sm:w-auto text-white text-sm font-bold px-10 py-4 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A' }}>
                Talk to Joshua About {n.name} →
              </button>
            </SuburbLeadForm>
          </div>
        </div>
      </div>
    </>
  )
}
