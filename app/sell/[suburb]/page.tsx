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
    title: `Sell My Home in ${suburb.displayName} | Free Market Valuation — Joshua Fink`,
    description: `What is my ${suburb.displayName} home worth? Get a free, no-obligation home valuation from Joshua Fink at Compass. Local ${suburb.name} market expert. Median price ${suburb.medianPrice} in 2026.`,
    keywords: [
      `sell my home in ${suburb.name}`,
      `sell my house ${suburb.name} TN`,
      `what is my ${suburb.name} home worth`,
      `${suburb.name} home value 2026`,
      `${suburb.name} real estate agent`,
      `sell home ${suburb.displayName}`,
      'Joshua Fink',
      'Compass Real Estate',
    ],
    openGraph: {
      title: `Sell Your Home in ${suburb.displayName} — Free Market Valuation | Joshua Fink`,
      description: `What is my ${suburb.name} home worth? The median price is ${suburb.medianPrice} in 2026. Get a free, personal valuation from Joshua Fink at Compass Real Estate.`,
      url: `https://joshuafink.com/sell/${slug}`,
      siteName: 'Joshua Fink Group',
      type: 'website',
    },
  }
}

export default async function SuburbPage({ params }: Props) {
  const { suburb: slug } = await params
  const suburb = getSuburb(slug)
  if (!suburb) notFound()

  const formspreeUrl = '/api/contact'
  const faqs = suburb.faqs

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
        description: `Joshua Fink is a top-producing Affiliate Broker at Compass Real Estate specializing in ${suburb.displayName} home sales. 13+ years of experience, 100+ homes sold annually.`,
        areaServed: {
          '@type': 'City',
          name: suburb.schemaCity,
          addressRegion: suburb.schemaState,
          addressCountry: 'US',
        },
        knowsAbout: [
          `Sell home in ${suburb.displayName}`,
          `${suburb.displayName} home valuation`,
          'Middle Tennessee real estate',
        ],
      },
      {
        '@type': 'LocalBusiness',
        name: 'Joshua Fink Group — Compass Real Estate',
        url: `https://joshuafink.com/sell/${slug}`,
        telephone: '+16155512727',
        email: 'joshua@joshuafink.com',
        address: {
          '@type': 'PostalAddress',
          addressLocality: suburb.schemaCity,
          addressRegion: suburb.schemaState,
          postalCode: suburb.schemaZip,
          addressCountry: 'US',
        },
        priceRange: '$$$',
        servesCuisine: undefined,
        description: `Top-rated real estate agent serving home sellers in ${suburb.displayName}. Free market valuations, professional marketing, proven results.`,
      },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="bg-white">

        {/* Hero */}
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              {suburb.county} · Middle Tennessee
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              Sell Your Home in {suburb.name} —{' '}
              <span style={{ color: '#C41E3A' }}>Free Market Valuation</span>
            </h1>
            <p className="text-lg mt-5 max-w-2xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Median home prices in {suburb.displayName} are <strong className="text-white">{suburb.medianPrice}</strong> in
              2026 — up <strong className="text-white">{suburb.yoyChange}</strong> year-over-year. Find out exactly what
              your home is worth with a free, no-obligation valuation from Joshua Fink at Compass.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="#valuation-form"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Get My Free Valuation
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
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">YoY Price Change</p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Description */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                The {suburb.name} Market
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-6">
                What Sellers Need to Know in 2026
              </h2>
              <p className="text-[#444] text-base leading-relaxed">
                {suburb.description}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/sell"
                  className="inline-block border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors text-center"
                >
                  ← Back to Seller Hub
                </Link>
                <Link
                  href="/cash-offer"
                  className="inline-block text-sm font-bold px-6 py-3 tracking-wide transition-colors text-center"
                  style={{ backgroundColor: '#0A1628', color: '#FFFFFF' }}
                >
                  Prefer a Cash Offer?
                </Link>
              </div>
            </div>

            {/* Quick stats sidebar */}
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
                    <dt className="text-sm text-[#A0A0A0]">Avg. DOM</dt>
                    <dd className="text-sm font-semibold text-white">{suburb.avgDaysOnMarket} days</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm text-[#A0A0A0]">Price/Sq Ft</dt>
                    <dd className="text-sm font-semibold text-white">${suburb.pricePerSqft}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm text-[#A0A0A0]">YoY Change</dt>
                    <dd className="text-sm font-bold" style={{ color: '#4ade80' }}>{suburb.yoyChange}</dd>
                  </div>
                </dl>
              </div>
              <div className="border border-[#E8E8E8] p-6">
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">Talk to Joshua</p>
                <a href="tel:6155512727" className="block text-2xl font-black text-black hover:underline mb-1">615-551-2727</a>
                <a href="mailto:joshua@joshuafink.com" className="block text-sm text-[#444] hover:underline">joshua@joshuafink.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Why Joshua — Hyperlocal */}
        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Why Work With Joshua in {suburb.name}
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              Hyperlocal Expertise. Real Results.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suburb.whyBullets.map((bullet, i) => {
                const [title, ...rest] = bullet.split(':')
                const body = rest.join(':').trim()
                return (
                  <div key={i} className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black mb-4" style={{ backgroundColor: '#0A1628' }}>
                      {i + 1}
                    </div>
                    <h3 className="text-base font-black text-black mb-3">{title.trim()}</h3>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{body || bullet}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Lead Capture Form */}
        <div id="valuation-form" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

            {/* Left — context */}
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Free Valuation
              </p>
              <h2 className="text-4xl font-black text-black tracking-tight leading-tight mb-6">
                What Is Your {suburb.name} Home Worth?
              </h2>
              <p className="text-[#6B6B6B] text-sm leading-relaxed mb-8">
                Fill out the form below and Joshua will personally reach out within a few hours with a
                no-obligation market analysis — real {suburb.name} comps, real numbers, no Zestimate guessing.
              </p>
              <div className="space-y-5">
                <div className="border-l-2 pl-5" style={{ borderColor: '#C41E3A' }}>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Phone</p>
                  <a href="tel:6155512727" className="text-xl font-black text-black hover:underline">
                    615-551-2727
                  </a>
                </div>
                <div className="border-l-2 pl-5" style={{ borderColor: '#C41E3A' }}>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Serving</p>
                  <p className="text-sm text-[#444]">
                    {suburb.displayName} · Franklin · Brentwood<br />
                    Spring Hill · Nolensville<br />
                    &amp; all of Middle Tennessee
                  </p>
                </div>
                <div className="border-l-2 pl-5" style={{ borderColor: '#C41E3A' }}>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Also Consider</p>
                  <div className="space-y-1">
                    <Link href="/cash-offer" className="block text-sm font-semibold text-black hover:underline">
                      → Request a cash offer instead
                    </Link>
                    <Link href="/sell" className="block text-sm font-semibold text-black hover:underline">
                      → Back to Seller Hub
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
                Tell Us About Your {suburb.name} Home
              </p>
              <form action={formspreeUrl} method="POST" className="space-y-5">
                {/* Hidden fields */}
                <input type="hidden" name="lead_type" value="sell" />
                <input type="hidden" name="subject" value="sell" />
                <input type="hidden" name="suburb" value={suburb.name} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text" id="name" name="name" required placeholder="Jane Smith"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel" id="phone" name="phone" required placeholder="615-555-0000"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email" id="email" name="email" required placeholder="you@example.com"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="property_address" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                    Property Address *
                  </label>
                  <input
                    type="text" id="property_address" name="property_address" required
                    placeholder={`123 Main St, ${suburb.name}, TN ${suburb.schemaZip}`}
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="bedrooms" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Bedrooms
                    </label>
                    <select
                      id="bedrooms" name="bedrooms"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="">—</option>
                      <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="bathrooms" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Bathrooms
                    </label>
                    <select
                      id="bathrooms" name="bathrooms"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="">—</option>
                      <option>1</option><option>1.5</option><option>2</option><option>2.5</option><option>3</option><option>3.5+</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timeline" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Timeline
                    </label>
                    <select
                      id="timeline" name="timeline"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="">—</option>
                      <option value="asap">ASAP</option>
                      <option value="1-3mo">1–3 months</option>
                      <option value="3-6mo">3–6 months</option>
                      <option value="6mo+">6+ months</option>
                      <option value="just-curious">Just curious</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                    Anything Else? (optional)
                  </label>
                  <textarea
                    id="body" name="body" rows={4}
                    placeholder="Condition, recent updates, your situation — anything helps Joshua give you a better analysis..."
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y"
                  />
                </div>

                <p className="text-xs text-[#A0A0A0]">
                  * Joshua responds same-day. No spam, no pressure. Just real {suburb.name} numbers.
                </p>

                <button
                  type="submit"
                  className="w-full sm:w-auto text-white text-sm font-bold px-10 py-4 tracking-wide transition-colors"
                  style={{ backgroundColor: '#C41E3A' }}
                >
                  Get My Free {suburb.name} Valuation →
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Block */}
        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Common Questions
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              {suburb.name} Home Selling FAQ
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

        {/* Bottom CTA strip */}
        <div className="text-white py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0A1628' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Ready to see your numbers?</h2>
              <p className="mt-2 text-sm" style={{ color: '#A0A0A0' }}>
                Free valuation, zero obligation. Joshua will tell you exactly what your {suburb.name} home is worth.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <a
                href="#valuation-form"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Get My Free Valuation
              </a>
              <Link
                href="/cash-offer"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
              >
                Request Cash Offer
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
