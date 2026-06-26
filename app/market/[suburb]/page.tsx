import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSuburb, getAllSuburbSlugs, suburbs } from '@/lib/suburbs'
import SuburbLeadForm from '@/components/SuburbLeadForm'

const SITE = 'https://www.joshuafink.com'

type Props = {
  params: Promise<{ suburb: string }>
}

export async function generateStaticParams() {
  return getAllSuburbSlugs().map((slug) => ({ suburb: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { suburb: slug } = await params
  const s = getSuburb(slug)
  if (!s) return {}

  return {
    title: `${s.displayName} Real Estate Market Report 2026 — Median ${s.medianPrice} | Joshua Fink`,
    description: `${s.displayName} housing market 2026: median sale price ${s.medianPrice}, ${s.avgDaysOnMarket} avg days on market, ${s.yoyChange} YoY change. Should you buy or sell now? Honest analysis from Joshua Fink at Compass.`,
    alternates: { canonical: `${SITE}/market/${slug}` },
    keywords: [
      `${s.name} housing market 2026`,
      `${s.name} TN real estate market`,
      `${s.name} median home price`,
      `is ${s.name} a buyer or seller market`,
      `${s.name} home prices 2026`,
      `${s.displayName} market report`,
    ],
    openGraph: {
      title: `${s.displayName} Housing Market 2026 — ${s.yoyChange} YoY`,
      description: `Median ${s.medianPrice}, ${s.avgDaysOnMarket} days on market, ${s.yoyChange} appreciation. Read the full 2026 ${s.displayName} market report.`,
      url: `${SITE}/market/${slug}`,
      type: 'article',
    },
  }
}

// Derive seller/buyer leaning from DOM + YoY signal. Keeps the UI honest and
// hyperlocal rather than a one-size-fits-all "great time to sell" message.
function marketLean(s: ReturnType<typeof getSuburb>) {
  if (!s) return { lean: 'Balanced', tone: '#A0A0A0' as const }
  const yoy = parseFloat(s.yoyChange.replace('%', '').replace('+', '')) || 0
  if (s.avgDaysOnMarket <= 22 && yoy >= 4) return { lean: 'Strong Seller Market', tone: '#16a34a' as const }
  if (s.avgDaysOnMarket <= 30 && yoy >= 3) return { lean: 'Seller-Favored', tone: '#16a34a' as const }
  if (s.avgDaysOnMarket >= 40 || yoy < 2) return { lean: 'Balanced / Buyer-Friendly', tone: '#0A1628' as const }
  return { lean: 'Healthy / Balanced', tone: '#0A1628' as const }
}

function neighborSuburbs(slug: string) {
  const order = Object.values(suburbs).sort((a, b) => b.medianPriceNum - a.medianPriceNum)
  const idx = order.findIndex((s) => s.slug === slug)
  if (idx === -1) return []
  const around: typeof order = []
  if (order[idx - 1]) around.push(order[idx - 1])
  if (order[idx + 1]) around.push(order[idx + 1])
  if (order[idx - 2] && around.length < 3) around.push(order[idx - 2])
  if (order[idx + 2] && around.length < 3) around.push(order[idx + 2])
  return around.slice(0, 3)
}

export default async function MarketSuburbPage({ params }: Props) {
  const { suburb: slug } = await params
  const s = getSuburb(slug)
  if (!s) notFound()

  const lean = marketLean(s)
  const neighbors = neighborSuburbs(slug)

  const reportSchema = {
    '@context': 'https://schema.org',
    '@type': 'Report',
    name: `${s.displayName} Real Estate Market Report — 2026`,
    headline: `${s.displayName} housing market in 2026: median ${s.medianPrice}, ${s.yoyChange} YoY`,
    description: `2026 housing market report for ${s.displayName}: median sale price ${s.medianPrice}, ${s.avgDaysOnMarket} avg days on market, ${s.yoyChange} year-over-year appreciation. Market lean: ${lean.lean}.`,
    datePublished: '2026-01-15',
    dateModified: new Date().toISOString().slice(0, 10),
    inLanguage: 'en-US',
    url: `${SITE}/market/${slug}`,
    about: {
      '@type': 'Place',
      name: `${s.schemaCity}, ${s.schemaState}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: s.schemaCity,
        addressRegion: s.schemaState,
        addressCountry: 'US',
      },
    },
    author: {
      '@type': 'Person',
      name: 'Joshua Fink',
      url: `${SITE}/about`,
      jobTitle: 'Affiliate Broker',
      worksFor: { '@type': 'Organization', name: 'Compass Real Estate' },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Joshua Fink Group',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/compass-logo-black.png` },
    },
  }

  const faqs = [
    {
      q: `Is ${s.name}, TN a buyer's or seller's market in 2026?`,
      a: `${s.displayName} is currently ${lean.lean.toLowerCase()}. Homes are averaging ${s.avgDaysOnMarket} days on market with ${s.yoyChange} year-over-year appreciation. ${s.avgDaysOnMarket <= 25 ? 'Tight inventory and rapid turnover favor sellers — well-priced homes move quickly.' : 'Buyers have meaningful selection and time to be deliberate, while sellers should price competitively from launch.'} Talk to Joshua for a read on your specific block — citywide averages don't price a specific home.`,
    },
    {
      q: `What is the median home price in ${s.displayName} right now?`,
      a: `The current median sale price in ${s.displayName} is ${s.medianPrice}, with average price per square foot at $${s.pricePerSqft}. Your actual value depends on neighborhood, condition, lot size, and school zone — these averages set a baseline, not a final number.`,
    },
    {
      q: `Is ${s.name} appreciating in 2026?`,
      a: `Yes. ${s.displayName} is showing ${s.yoyChange} year-over-year price appreciation. ${parseFloat(s.yoyChange.replace(/[+%]/g, '')) >= 4 ? 'That places it among the stronger-performing submarkets in Middle Tennessee.' : 'That tracks with a normalized, healthy market — not the 2021–2022 frenzy, but consistent gain.'}`,
    },
    {
      q: `How fast do homes sell in ${s.name}?`,
      a: `Homes in ${s.displayName} average ${s.avgDaysOnMarket} days on market in 2026. Move-in-ready homes priced correctly often go faster — sometimes within a single weekend. Overpriced or under-presented homes routinely sit 60+ days and ultimately sell below their original list.`,
    },
    {
      q: `Should I wait to buy or sell in ${s.name}?`,
      a: `Timing the market is hard. What's controllable is preparation: pricing strategy if you're selling, pre-approval and clarity on must-haves if you're buying. ${lean.lean.includes('Seller') ? 'For sellers in this market, the data favors acting while inventory is tight and appreciation is strong. For buyers, getting in now means owning during a phase of continued appreciation.' : 'Sellers should focus on presentation and accurate pricing; buyers should use the breathing room to be selective and negotiate on terms.'}`,
    },
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
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
      { '@type': 'ListItem', position: 2, name: 'Market Reports', item: `${SITE}/market` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${s.displayName} Market Report`,
        item: `${SITE}/market/${slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reportSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-white">
        {/* Hero */}
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold" style={{ color: '#A0A0A0' }}>
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">·</li>
                <li>
                  <Link href="/market" className="hover:text-white transition-colors">
                    Market Reports
                  </Link>
                </li>
                <li aria-hidden="true">·</li>
                <li className="text-white">{s.displayName}</li>
              </ol>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              {s.county} · Updated for 2026
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              {s.displayName}{' '}
              <span style={{ color: '#C41E3A' }}>Housing Market Report — 2026</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Median sale price in {s.displayName} is{' '}
              <strong className="text-white">{s.medianPrice}</strong> with homes averaging{' '}
              <strong className="text-white">{s.avgDaysOnMarket} days on market</strong> and{' '}
              <strong className="text-white">{s.yoyChange}</strong> year-over-year appreciation.
              Here&apos;s what those numbers actually mean for buyers and sellers right now.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/sell/${s.slug}`}
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Sell My {s.name} Home →
              </Link>
              <Link
                href={`/buy/${s.slug}`}
                className="inline-block border text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                style={{ borderColor: '#FFFFFF' }}
              >
                Buy a Home in {s.name} →
              </Link>
            </div>
          </div>
        </div>

        {/* Top-line stats */}
        <div className="border-b border-[#E8E8E8] bg-[#F9F9F9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              {s.displayName} Market Snapshot · 2026
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 border border-[#E8E8E8]">
                <p className="text-3xl font-black text-black">{s.medianPrice}</p>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">Median Sale Price</p>
              </div>
              <div className="bg-white p-6 border border-[#E8E8E8]">
                <p className="text-3xl font-black text-black">{s.avgDaysOnMarket}</p>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">Avg. Days on Market</p>
              </div>
              <div className="bg-white p-6 border border-[#E8E8E8]">
                <p className="text-3xl font-black text-black">${s.pricePerSqft}</p>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">Price Per Sq Ft</p>
              </div>
              <div className="bg-white p-6 border border-[#E8E8E8]">
                <p className="text-3xl font-black" style={{ color: '#16a34a' }}>{s.yoyChange}</p>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">YoY Appreciation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Market lean callout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white border-l-4 p-8" style={{ borderColor: lean.tone }}>
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
              Current Market Lean
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-3">{lean.lean}</h2>
            <p className="text-[#444] text-base leading-relaxed max-w-3xl">
              With {s.avgDaysOnMarket} days on market and {s.yoyChange} appreciation,{' '}
              {s.displayName} is{' '}
              {s.avgDaysOnMarket <= 22
                ? `moving fast — inventory turns over before many buyers get a second weekend to decide. Sellers who price correctly are seeing competitive offers, often above list. Buyers need pre-approval in hand and an agent with off-market access to compete.`
                : s.avgDaysOnMarket <= 30
                  ? `healthy and seller-favored. Well-presented homes priced at market are moving in 3–4 weeks. Sellers can still expect strong outcomes; buyers have a touch more breathing room than the tightest submarkets but should still move decisively on the right home.`
                  : `more balanced. Buyers have time to be selective and can negotiate on terms; sellers must price right from launch and present meticulously to capture the buyer attention that&apos;s still very real in this market.`}
            </p>
          </div>
        </div>

        {/* Market commentary */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                What the Numbers Mean
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-6">
                The {s.name} Market in Context
              </h2>
              <p className="text-[#444] text-base leading-relaxed mb-6">{s.description}</p>

              <h3 className="text-xl font-black text-black mt-10 mb-4">For Sellers in {s.name}</h3>
              <p className="text-[#444] text-base leading-relaxed mb-4">
                With the median at {s.medianPrice} and homes moving in roughly{' '}
                {s.avgDaysOnMarket} days, sellers in {s.displayName} are positioned to capture
                strong outcomes when three things line up: an accurate launch price tied to recent
                comps within a half-mile of the property, professional presentation (photography,
                staging, deferred maintenance addressed), and a marketing plan that goes beyond MLS
                to reach the relocating buyers actively searching this area.
              </p>
              <p className="text-[#444] text-base leading-relaxed mb-4">
                The biggest risk for {s.name} sellers in 2026 is overpricing on the first week.
                The first 14 days are when buyer attention peaks — every day past that on an
                aspirational number is a day of compounding days-on-market stigma that ultimately
                costs more than a realistic launch price would have.{' '}
                <Link href={`/sell/${s.slug}`} className="text-black underline hover:no-underline">
                  Get a free, comp-backed {s.name} valuation
                </Link>{' '}
                before you commit to a number.
              </p>

              <h3 className="text-xl font-black text-black mt-10 mb-4">For Buyers in {s.name}</h3>
              <p className="text-[#444] text-base leading-relaxed mb-4">
                With {s.yoyChange} year-over-year appreciation in {s.displayName}, buyers who hold
                for 3–5 years are likely to see meaningful equity build assuming current trends
                continue. The market doesn&apos;t reward panic-buying, but it does reward decisive
                action on the right home — pre-approval in hand, must-haves clearly defined,
                ability to write inside 24 hours when a fit appears.
              </p>
              <p className="text-[#444] text-base leading-relaxed mb-4">
                Off-market access matters most in tight inventory pockets.{' '}
                <Link href={`/buy/${s.slug}`} className="text-black underline hover:no-underline">
                  Joshua&apos;s Compass network
                </Link>{' '}
                surfaces Coming Soon and pre-MLS listings in {s.name} that don&apos;t show on
                Zillow or public portals — a meaningful edge when the right home moves before the
                weekend showing.
              </p>

              {s.topNeighborhoods && (
                <>
                  <h3 className="text-xl font-black text-black mt-10 mb-4">
                    Hottest {s.name} Neighborhoods Right Now
                  </h3>
                  <p className="text-[#444] text-base leading-relaxed mb-4">
                    Inside {s.displayName}, demand isn&apos;t evenly distributed. The neighborhoods
                    currently seeing the strongest buyer activity:
                  </p>
                  <ul className="space-y-2 mb-4">
                    {s.topNeighborhoods.map((n) => (
                      <li key={n} className="text-sm text-[#444] flex items-start gap-2">
                        <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                        <span>
                          <strong>{n}</strong> — see{' '}
                          <Link
                            href={`/buy/${s.slug}`}
                            className="text-black underline hover:no-underline"
                          >
                            current activity in {s.name}
                          </Link>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3 className="text-xl font-black text-black mt-10 mb-4">What I&apos;m Watching</h3>
              <p className="text-[#444] text-base leading-relaxed mb-4">
                Three things I&apos;m tracking in {s.displayName} through the next quarter:
                inventory build (more listings = more buyer leverage), mortgage rate movement (the
                dominant variable for the past three years), and out-of-state relocation flows
                (still the dominant driver of demand for {s.county} from California, Texas, and
                Illinois). Any one of these moving meaningfully changes the math for both sides.
              </p>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="p-6" style={{ backgroundColor: '#0A1628' }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#A0A0A0' }}>
                  Quick Facts
                </p>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm" style={{ color: '#A0A0A0' }}>County</dt>
                    <dd className="text-sm font-semibold text-white">{s.county}</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm" style={{ color: '#A0A0A0' }}>Median</dt>
                    <dd className="text-sm font-semibold text-white">{s.medianPrice}</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm" style={{ color: '#A0A0A0' }}>Avg DOM</dt>
                    <dd className="text-sm font-semibold text-white">{s.avgDaysOnMarket} days</dd>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#ffffff22] pb-3">
                    <dt className="text-sm" style={{ color: '#A0A0A0' }}>$/Sqft</dt>
                    <dd className="text-sm font-semibold text-white">${s.pricePerSqft}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-sm" style={{ color: '#A0A0A0' }}>YoY</dt>
                    <dd className="text-sm font-bold" style={{ color: '#4ade80' }}>{s.yoyChange}</dd>
                  </div>
                </dl>
              </div>

              <div className="border border-[#E8E8E8] p-6 bg-white">
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                  Free, Honest Valuation
                </p>
                <p className="text-sm text-[#444] leading-relaxed mb-4">
                  No algorithm. Real comps from your block. Same-day in most cases.
                </p>
                <Link
                  href={`/sell/${s.slug}`}
                  className="block text-center text-sm font-bold px-6 py-3 tracking-wide transition-colors"
                  style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
                >
                  Get My Valuation →
                </Link>
              </div>

              <div className="border border-[#E8E8E8] p-6 bg-white">
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                  Talk to Joshua
                </p>
                <a href="tel:6155512727" className="block text-2xl font-black text-black hover:underline mb-1">
                  615-551-2727
                </a>
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
              {s.displayName} Market FAQ
            </h2>
            <div className="space-y-6">
              {faqs.map((f, i) => (
                <div key={i} className="bg-white p-8 border-l-4" style={{ borderColor: '#0A1628' }}>
                  <h3 className="text-base font-black text-black mb-3">{f.q}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Neighbor markets */}
        {neighbors.length > 0 && (
          <div className="bg-white border-t border-[#E8E8E8] py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Compare Nearby Markets
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-10">
                Other Middle Tennessee Markets
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {neighbors.map((n) => (
                  <Link
                    key={n.slug}
                    href={`/market/${n.slug}`}
                    className="block border border-[#E8E8E8] p-6 hover:border-black transition-colors bg-white group"
                  >
                    <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                      {n.county}
                    </p>
                    <h3 className="text-xl font-black text-black mb-3 group-hover:underline">
                      {n.displayName}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[#A0A0A0] uppercase tracking-widest font-semibold">Median</p>
                        <p className="text-base font-black text-black">{n.medianPrice}</p>
                      </div>
                      <div>
                        <p className="text-[#A0A0A0] uppercase tracking-widest font-semibold">YoY</p>
                        <p className="text-base font-black" style={{ color: '#16a34a' }}>{n.yoyChange}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-white py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0A1628' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Ready to make a move in {s.name}?
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#A0A0A0' }}>
                Free consultation. No pressure. Real {s.name} numbers from someone who actually
                works this market.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href={`/sell/${s.slug}`}
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Free Valuation
              </Link>
              <a
                href="tel:6155512727"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
              >
                Call 615-551-2727
              </a>
            </div>
          </div>

          {/* Inline lead-capture form */}
          <div className="max-w-3xl mx-auto mt-12 bg-white p-8 sm:p-10">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Get {s.displayName} Market Updates &amp; Local Advice
            </p>
            <SuburbLeadForm
              successTitle="Request Sent!"
              successMessage={
                <>
                  Joshua will reach out same-day with {s.displayName} market insights tailored to your move. For anything urgent, call{' '}
                  <a href="tel:6155512727" className="text-black font-semibold underline">615-551-2727</a>.
                </>
              }
              resetLabel="Submit Another"
            >
              <input type="hidden" name="lead_type" value="market" />
              <input type="hidden" name="suburb" value={s.name} />

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
                  placeholder={`Buying or selling in ${s.name}? Tell Joshua your timeline, budget, and what you're trying to figure out.`}
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
              </div>

              <p className="text-xs text-[#A0A0A0]">* Joshua responds same-day. No spam, no pressure.</p>

              <button type="submit"
                className="w-full sm:w-auto text-white text-sm font-bold px-10 py-4 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A' }}>
                Talk to Joshua About {s.name} →
              </button>
            </SuburbLeadForm>
          </div>
        </div>
      </div>
    </>
  )
}
