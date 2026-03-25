import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSuburb, getAllSuburbSlugs } from '@/lib/suburbs'

type Props = {
  params: Promise<{ suburb: string }>
}

export async function generateStaticParams() {
  return getAllSuburbSlugs().map((slug) => ({ suburb: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { suburb: slug } = await params
  const suburb = getSuburb(slug)
  if (!suburb) return {}

  return {
    title: `Homes for Sale in ${suburb.displayName} | Buyer's Agent — Joshua Fink`,
    description: `Looking to buy a home in ${suburb.displayName}? Joshua Fink at Compass knows every neighborhood, every school zone, and every listing. Median price ${suburb.medianPrice}. Free buyer consultation.`,
    keywords: [
      `homes for sale ${suburb.name} TN`,
      `buy a home in ${suburb.name}`,
      `${suburb.name} real estate agent`,
      `${suburb.name} buyer agent`,
      `${suburb.name} homes 2026`,
      `moving to ${suburb.name} Tennessee`,
      'Joshua Fink',
      'Compass Real Estate',
    ],
    openGraph: {
      title: `Buy a Home in ${suburb.displayName} | Joshua Fink — Compass`,
      description: `Expert buyer representation in ${suburb.displayName}. Median price ${suburb.medianPrice}, ${suburb.avgDaysOnMarket} avg days on market. Get insider access with Joshua Fink at Compass.`,
      url: `https://joshuafink.com/buy/${slug}`,
      siteName: 'Joshua Fink Group',
      type: 'website',
    },
  }
}

export default async function BuySuburbPage({ params }: Props) {
  const { suburb: slug } = await params
  const suburb = getSuburb(slug)
  if (!suburb) notFound()

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateAgent',
        name: 'Joshua Fink — Compass Real Estate',
        url: 'https://joshuafink.com',
        telephone: '+16155512727',
        email: 'joshua@joshuafink.com',
        image: 'https://joshuafink.com/headshot.jpg',
        description: `Joshua Fink is a buyer&apos;s agent at Compass Real Estate specializing in ${suburb.displayName} home purchases. Local market expert, off-market access, proven negotiator.`,
        areaServed: {
          '@type': 'City',
          name: suburb.schemaCity,
          addressRegion: suburb.schemaState,
          addressCountry: 'US',
        },
      },
    ],
  }

  const whyBullets = suburb.buyerWhyBullets || suburb.whyBullets
  const faqs = suburb.buyerFaqs || suburb.faqs
  const description = suburb.buyerDescription || suburb.description

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="bg-white">

        {/* Hero */}
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              {suburb.county} · Middle Tennessee
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              Buy a Home in {suburb.name} —{' '}
              <span style={{ color: '#C41E3A' }}>Local Expert. Real Results.</span>
            </h1>
            <p className="text-lg mt-5 max-w-2xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Median home price in {suburb.displayName} is <strong className="text-white">{suburb.medianPrice}</strong> in
              2026. Homes sell in <strong className="text-white">{suburb.avgDaysOnMarket} days</strong> on average.
              Work with a buyer&apos;s agent who knows every neighborhood, every school zone, and how to win in this market.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="#buyer-form"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Start Your Home Search
              </a>
              <a
                href="tel:6155512727"
                className="inline-block border text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                style={{ borderColor: '#FFFFFF' }}
              >
                Call 615-551-2727
              </a>
            </div>
          </div>
        </div>

        {/* Market Snapshot */}
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

        {/* About the Market */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Buying in {suburb.name}
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-6">
                What Buyers Need to Know in 2026
              </h2>
              <p className="text-[#444] text-base leading-relaxed">{description}</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/listings"
                  className="inline-block border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors text-center"
                >
                  View Current Listings →
                </Link>
                <Link
                  href="/contact"
                  className="inline-block text-sm font-bold px-6 py-3 tracking-wide transition-colors text-center"
                  style={{ backgroundColor: '#0A1628', color: '#FFFFFF' }}
                >
                  Free Buyer Consultation
                </Link>
              </div>
            </div>

            {/* Quick facts sidebar */}
            <div className="space-y-4">
              <div className="p-6" style={{ backgroundColor: '#0A1628' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">Quick Facts</p>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm text-[#A0A0A0]">County</dt>
                    <dd className="text-sm font-semibold text-white">{suburb.county}</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm text-[#A0A0A0]">Median Price</dt>
                    <dd className="text-sm font-semibold text-white">{suburb.medianPrice}</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm text-[#A0A0A0]">Schools</dt>
                    <dd className="text-sm font-semibold text-white text-right">{suburb.schoolDistrict || 'See agent'}</dd>
                  </div>
                  {suburb.commuteNote && (
                    <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                      <dt className="text-sm text-[#A0A0A0]">Commute</dt>
                      <dd className="text-sm font-semibold text-white text-right">{suburb.commuteNote}</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-[#A0A0A0]">Appreciation</dt>
                    <dd className="text-sm font-bold" style={{ color: '#4ade80' }}>{suburb.yoyChange} YoY</dd>
                  </div>
                </dl>
              </div>

              {suburb.topNeighborhoods && (
                <div className="border border-[#E8E8E8] p-6">
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">Top Neighborhoods</p>
                  <ul className="space-y-2">
                    {suburb.topNeighborhoods.map((n) => (
                      <li key={n} className="text-sm text-[#444] flex items-center gap-2">
                        <span style={{ color: '#C41E3A' }}>→</span> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border border-[#E8E8E8] p-6">
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">Talk to Joshua</p>
                <a href="tel:6155512727" className="block text-2xl font-black text-black hover:underline mb-1">615-551-2727</a>
                <a href="mailto:joshua@joshuafink.com" className="block text-sm text-[#444] hover:underline">joshua@joshuafink.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Why Joshua */}
        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Why Work With Joshua in {suburb.name}
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              Your Unfair Advantage as a Buyer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {whyBullets.map((bullet, i) => {
                const colonIdx = bullet.indexOf(':')
                const title = colonIdx > -1 ? bullet.slice(0, colonIdx).trim() : `Advantage ${i + 1}`
                const body = colonIdx > -1 ? bullet.slice(colonIdx + 1).trim() : bullet
                return (
                  <div key={i} className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black mb-4" style={{ backgroundColor: '#0A1628' }}>
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

        {/* Buyer Inquiry Form */}
        <div id="buyer-form" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Free Buyer Consultation
              </p>
              <h2 className="text-4xl font-black text-black tracking-tight leading-tight mb-6">
                Ready to Buy in {suburb.name}?
              </h2>
              <p className="text-[#6B6B6B] text-sm leading-relaxed mb-8">
                Tell Joshua what you&apos;re looking for and he&apos;ll reach out within a few hours with a personalized search strategy — real {suburb.name} listings, real numbers, no pressure.
              </p>
              <div className="space-y-5">
                <div className="border-l-2 pl-5" style={{ borderColor: '#C41E3A' }}>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Phone</p>
                  <a href="tel:6155512727" className="text-xl font-black text-black hover:underline">615-551-2727</a>
                </div>
                <div className="border-l-2 pl-5" style={{ borderColor: '#C41E3A' }}>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Also Serving</p>
                  <p className="text-sm text-[#444]">Franklin · Brentwood · Spring Hill<br />Nolensville · Thompson&apos;s Station<br />&amp; all of Middle Tennessee</p>
                </div>
                <div className="border-l-2 pl-5" style={{ borderColor: '#C41E3A' }}>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Explore</p>
                  <div className="space-y-1">
                    <Link href="/listings" className="block text-sm font-semibold text-black hover:underline">→ View active listings</Link>
                    <Link href="/sell" className="block text-sm font-semibold text-black hover:underline">→ Also need to sell?</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
                Tell Joshua What You&apos;re Looking For
              </p>
              <form
                action="/api/contact"
                method="POST"
                className="space-y-5"
              >
                <input type="hidden" name="lead_type" value="buyer" />
                <input type="hidden" name="suburb" value={suburb.name} />

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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="budget" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Budget</label>
                    <select id="budget" name="budget"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors">
                      <option value="">—</option>
                      <option>Under $300K</option>
                      <option>$300K–$450K</option>
                      <option>$450K–$600K</option>
                      <option>$600K–$800K</option>
                      <option>$800K–$1M</option>
                      <option>$1M+</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="bedrooms" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Bedrooms</label>
                    <select id="bedrooms" name="bedrooms"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors">
                      <option value="">—</option>
                      <option>2+</option><option>3+</option><option>4+</option><option>5+</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timeline" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Timeline</label>
                    <select id="timeline" name="timeline"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors">
                      <option value="">—</option>
                      <option value="asap">ASAP</option>
                      <option value="1-3mo">1–3 months</option>
                      <option value="3-6mo">3–6 months</option>
                      <option value="6mo+">6+ months</option>
                      <option value="just-looking">Just exploring</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="pre_approved" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Pre-Approved?</label>
                  <select id="pre_approved" name="pre_approved"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors">
                    <option value="">—</option>
                    <option value="yes">Yes, I have pre-approval</option>
                    <option value="in-progress">In progress</option>
                    <option value="cash">Paying cash</option>
                    <option value="no">Not yet</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">What Are You Looking For? (optional)</label>
                  <textarea id="body" name="body" rows={4}
                    placeholder={`Tell Joshua your must-haves — school zone, neighborhood, lot size, style. Anything helps.`}
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
                </div>

                <p className="text-xs text-[#A0A0A0]">* Joshua responds same-day. No spam, no pressure.</p>

                <button type="submit"
                  className="w-full sm:w-auto text-white text-sm font-bold px-10 py-4 tracking-wide transition-colors"
                  style={{ backgroundColor: '#C41E3A' }}>
                  Start My {suburb.name} Home Search →
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">Common Questions</p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              Buying a Home in {suburb.name} — FAQ
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white p-8 border-l-4" style={{ borderColor: '#0A1628' }}>
                  <h3 className="text-base font-black text-black mb-3">{faq.q}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-white py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0A1628' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Ready to find your {suburb.name} home?</h2>
              <p className="mt-2 text-sm" style={{ color: '#A0A0A0' }}>
                Free consultation. Local expertise. Joshua knows {suburb.name} better than anyone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <a href="#buyer-form"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}>
                Start My Search
              </a>
              <a href="tel:6155512727"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center">
                Call 615-551-2727
              </a>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
