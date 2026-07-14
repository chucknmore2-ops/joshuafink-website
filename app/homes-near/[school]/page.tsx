import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSchool, getAllSchoolSlugs, getSchoolSuburb } from '@/lib/schools'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import TrackedTelLink from '@/components/TrackedTelLink'

const SITE = 'https://www.joshuafink.com'

type Props = {
  params: Promise<{ school: string }>
}

export async function generateStaticParams() {
  return getAllSchoolSlugs().map((school) => ({ school }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school: slug } = await params
  const s = getSchool(slug)
  if (!s) return {}
  const suburb = getSchoolSuburb(s)

  return {
    title: `Homes for Sale Near ${s.name} — ${s.district} | Joshua Fink`,
    description: `Looking for a home in the ${s.name} zone? Browse pricing, top feeder neighborhoods${suburb ? `, and current ${suburb.displayName} market data (median ${suburb.medianPrice})` : ''}. School-zone-first home search from Joshua Fink at Compass.`,
    alternates: { canonical: `${SITE}/homes-near/${slug}` },
    keywords: [
      `homes near ${s.name}`,
      `${s.name} school zone homes`,
      `${s.name} feeder neighborhoods`,
      `${s.name} TN real estate`,
      `homes zoned to ${s.name}`,
      suburb ? `${suburb.name} ${s.level.toLowerCase()} school zone` : '',
    ].filter(Boolean) as string[],
    openGraph: {
      title: `Homes Near ${s.name}`,
      description: `Homes for sale in the ${s.name} zone. ${s.ratingNote}`,
      url: `${SITE}/homes-near/${slug}`,
      type: 'article',
    },
  }
}

export default async function HomesNearSchoolPage({ params }: Props) {
  const { school: slug } = await params
  const s = getSchool(slug)
  if (!s) notFound()

  const suburb = getSchoolSuburb(s)

  const schoolSchema = {
    '@context': 'https://schema.org',
    '@type': s.level === 'High' ? 'HighSchool' : s.level === 'Middle' ? 'MiddleSchool' : 'ElementarySchool',
    name: s.name,
    description: s.blurb,
    url: `${SITE}/homes-near/${slug}`,
    address: suburb
      ? {
          '@type': 'PostalAddress',
          addressLocality: suburb.schemaCity,
          addressRegion: suburb.schemaState,
          addressCountry: 'US',
        }
      : undefined,
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: s.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Homes Near Schools', item: `${SITE}/homes-near` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Homes Near ${s.name}`,
        item: `${SITE}/homes-near/${slug}`,
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="bg-white">
        {/* Hero */}
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold" style={{ color: '#A0A0A0' }}>
                <li>
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                </li>
                <li aria-hidden="true">·</li>
                <li>
                  <Link href="/homes-near" className="hover:text-white transition-colors">Homes Near Schools</Link>
                </li>
              </ol>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              {s.district} · {s.level} School Zone
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-5xl">
              Homes for Sale Near{' '}
              <span style={{ color: '#C41E3A' }}>{s.name}</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              {s.ratingNote} Browse feeder subdivisions, current pricing
              {suburb ? `, and live ${suburb.displayName} market data` : ''} — all the home-shopping
              context you need with school zone as your starting filter, not an afterthought.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {suburb && (
                <Link
                  href={`/buy/${suburb.slug}`}
                  className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                  style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
                >
                  See {suburb.name} Listings →
                </Link>
              )}
              <Link
                href="/contact"
                className="inline-block border text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                style={{ borderColor: '#FFFFFF' }}
              >
                Talk to Joshua
              </Link>
            </div>

            {/* Compact above-the-fold lead capture — mirrors /buy/[suburb] hero form */}
            <div className="mt-10 max-w-xl bg-white p-6 sm:p-7">
              <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#A0A0A0' }}>
                Quick start — text Joshua
              </p>
              <p className="text-sm font-semibold text-black mb-4">
                He&apos;ll reply same-day with zone-verified {s.name} listings.
              </p>
              <SuburbLeadForm
                successTitle="Got it!"
                successMessage={
                  <>
                    Joshua will text you shortly with {s.name}-zoned listings. Or call{' '}
                    <a href="tel:6155512727" className="text-black font-semibold underline">615-551-2727</a>.
                  </>
                }
                resetLabel="Send another"
              >
                <input type="hidden" name="lead_type" value="school-zone" />
                <input type="hidden" name="school" value={s.name} />
                {suburb && <input type="hidden" name="suburb" value={suburb.name} />}
                <input type="hidden" name="source" value={`homes-near-hero:${slug}`} />

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text" name="name" required placeholder="First name" autoComplete="given-name"
                    className="flex-1 border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                  <input
                    type="tel" name="phone" required placeholder="615-555-0000" autoComplete="tel"
                    className="flex-1 border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-white text-sm font-bold px-6 py-3 tracking-wide transition-colors"
                  style={{ backgroundColor: '#C41E3A' }}
                >
                  Text Me {s.name} Zone Listings →
                </button>
              </SuburbLeadForm>
            </div>
          </div>
        </div>

        {/* Snapshot */}
        {suburb && (
          <div className="border-b border-[#E8E8E8] bg-[#F9F9F9]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
                {suburb.displayName} Market Snapshot · 2026
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 border border-[#E8E8E8]">
                  <p className="text-3xl font-black text-black">{suburb.medianPrice}</p>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">Median Sale Price</p>
                </div>
                <div className="bg-white p-6 border border-[#E8E8E8]">
                  <p className="text-3xl font-black text-black">{suburb.avgDaysOnMarket}</p>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">Avg. Days on Market</p>
                </div>
                <div className="bg-white p-6 border border-[#E8E8E8]">
                  <p className="text-3xl font-black text-black">${suburb.pricePerSqft}</p>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">Price Per Sq Ft</p>
                </div>
                <div className="bg-white p-6 border border-[#E8E8E8]">
                  <p className="text-3xl font-black" style={{ color: '#16a34a' }}>{suburb.yoyChange}</p>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">YoY Appreciation</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About the school + zone */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                About the Zone
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-6">
                Why Families Search the {s.name} Zone
              </h2>
              <p className="text-[#444] text-base leading-relaxed mb-8">{s.blurb}</p>

              <h3 className="text-xl font-black text-black mt-8 mb-4">Feeder Subdivisions</h3>
              <p className="text-[#444] text-base leading-relaxed mb-4">
                These are the most popular subdivisions that feed {s.name}. Zoning lines can run
                inside larger communities, so confirm with {s.district} for any specific address
                before writing an offer:
              </p>
              <ul className="space-y-2 mb-8">
                {s.neighborhoods.map((n) => (
                  <li key={n} className="text-sm text-[#444] flex items-start gap-2">
                    <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                    <span><strong>{n}</strong></span>
                  </li>
                ))}
              </ul>

              <div className="bg-[#F9F9F9] border-l-4 p-6 mb-8" style={{ borderColor: '#0A1628' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                  Important: Always Verify Zoning
                </p>
                <p className="text-sm text-[#444] leading-relaxed">
                  Public school zoning can change at the district level. Before writing an offer
                  on a home for the school zone, verify the current assignment against the{' '}
                  {s.district} zoning map for the exact address. Joshua confirms zoning for every
                  home before a tour.
                </p>
              </div>

              {suburb && (
                <>
                  <h3 className="text-xl font-black text-black mt-10 mb-4">
                    Search Homes in {suburb.displayName}
                  </h3>
                  <p className="text-[#444] text-base leading-relaxed mb-4">
                    {s.name}-zoned homes are part of the broader {suburb.displayName} market —
                    median {suburb.medianPrice}, {suburb.avgDaysOnMarket} days on market, and{' '}
                    {suburb.yoyChange} year-over-year appreciation. Browse the full local market
                    or filter by school zone with Joshua&apos;s help.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/buy/${suburb.slug}`}
                      className="inline-block text-sm font-bold px-6 py-3 tracking-wide transition-colors"
                      style={{ backgroundColor: '#0A1628', color: '#FFFFFF' }}
                    >
                      View {suburb.name} Buyer Guide →
                    </Link>
                    <Link
                      href={`/market/${suburb.slug}`}
                      className="inline-block border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors"
                    >
                      {suburb.name} Market Report →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="p-6" style={{ backgroundColor: '#0A1628' }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#A0A0A0' }}>
                  Quick Facts
                </p>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm" style={{ color: '#A0A0A0' }}>District</dt>
                    <dd className="text-sm font-semibold text-white text-right">{s.district}</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm" style={{ color: '#A0A0A0' }}>Level</dt>
                    <dd className="text-sm font-semibold text-white">{s.level}</dd>
                  </div>
                  {suburb && (
                    <>
                      <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                        <dt className="text-sm" style={{ color: '#A0A0A0' }}>Suburb</dt>
                        <dd className="text-sm font-semibold text-white">{suburb.displayName}</dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-sm" style={{ color: '#A0A0A0' }}>Median Home</dt>
                        <dd className="text-sm font-semibold text-white">{suburb.medianPrice}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>

              <div className="border border-[#E8E8E8] p-6 bg-white">
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                  Search by School Zone
                </p>
                <p className="text-sm text-[#444] leading-relaxed mb-4">
                  Tell Joshua which school zone you&apos;re targeting and he&apos;ll send you
                  curated, zone-verified listings — no Zestimate guessing on zoning.
                </p>
                <Link
                  href="#lead-form"
                  className="block text-center text-sm font-bold px-6 py-3 tracking-wide transition-colors"
                  style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
                >
                  Get Zone-Verified Listings →
                </Link>
              </div>

              <div className="border border-[#E8E8E8] p-6 bg-white">
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                  Talk to Joshua
                </p>
                <TrackedTelLink
                  href="tel:6155512727"
                  className="block text-2xl font-black text-black hover:underline mb-1"
                  data-cta="homes-near-panel-call"
                >
                  615-551-2727
                </TrackedTelLink>
                <a href="mailto:joshua@joshuafink.com" className="block text-sm text-[#444] hover:underline">
                  joshua@joshuafink.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Common Questions
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              {s.name} Zone — FAQ
            </h2>
            <div className="space-y-6">
              {s.faqs.map((f, i) => (
                <div key={i} className="bg-white p-8 border-l-4" style={{ borderColor: '#0A1628' }}>
                  <h3 className="text-base font-black text-black mb-3">{f.q}</h3>
                  <p
                    className="text-sm text-[#6B6B6B] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: f.a }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-white py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0A1628' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Targeting the {s.name} zone?
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#A0A0A0' }}>
                Joshua verifies school zoning before every tour. No surprises after closing.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href="#lead-form"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Start Your Search
              </Link>
              <TrackedTelLink
                href="tel:6155512727"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                data-cta="homes-near-final-cta-call"
              >
                Call 615-551-2727
              </TrackedTelLink>
            </div>
          </div>

          {/* Inline lead-capture form */}
          <div id="lead-form" className="max-w-3xl mx-auto mt-12 bg-white p-8 sm:p-10 scroll-mt-24">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Get Zone-Verified {s.name} Listings
            </p>
            <SuburbLeadForm
              successTitle="Request Sent!"
              successMessage={
                <>
                  Joshua will reach out same-day with zone-verified {s.name} listings and feeder-neighborhood options. For anything urgent, call{' '}
                  <TrackedTelLink
                    href="tel:6155512727"
                    className="text-black font-semibold underline"
                    data-cta="homes-near-success-call"
                  >
                    615-551-2727
                  </TrackedTelLink>.
                </>
              }
              resetLabel="Submit Another"
            >
              <input type="hidden" name="lead_type" value="school-zone" />
              <input type="hidden" name="school" value={s.name} />
              {suburb && <input type="hidden" name="suburb" value={suburb.name} />}

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
                  placeholder={`Targeting ${s.name}? Tell Joshua your timeline, budget, must-haves — bedrooms, lot size, feeder neighborhood preferences.`}
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
              </div>

              <p className="text-xs text-[#A0A0A0]">* Joshua responds same-day. No spam, no pressure.</p>

              <button type="submit"
                className="w-full sm:w-auto text-white text-sm font-bold px-10 py-4 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A' }}>
                Get {s.name} Zone Listings →
              </button>
            </SuburbLeadForm>
          </div>
        </div>
      </div>
    </>
  )
}
