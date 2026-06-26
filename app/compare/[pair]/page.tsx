import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { parsePairSlug, getAllPairSlugsForBuild, pairVerdict } from '@/lib/compare'

const SITE = 'https://www.joshuafink.com'

type Props = {
  params: Promise<{ pair: string }>
}

export async function generateStaticParams() {
  return getAllPairSlugsForBuild().map((pair) => ({ pair }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair: pairSlug } = await params
  const p = parsePairSlug(pairSlug)
  if (!p) return {}

  const { a, b } = p
  return {
    title: `${a.displayName} vs ${b.displayName} — Which Is Better in 2026? | Joshua Fink`,
    description: `${a.name} vs ${b.name}: median ${a.medianPrice} vs ${b.medianPrice}, ${a.avgDaysOnMarket} vs ${b.avgDaysOnMarket} days on market. Schools, commute, lifestyle, and which suburb is right for you. Honest comparison from Joshua Fink at Compass.`,
    alternates: { canonical: `${SITE}/compare/${pairSlug}` },
    keywords: [
      `${a.name} vs ${b.name}`,
      `${a.name} or ${b.name}`,
      `${a.name} ${b.name} comparison`,
      `which is better ${a.name} or ${b.name}`,
      `${a.name} TN vs ${b.name} TN`,
      `moving to ${a.name} or ${b.name}`,
    ],
    openGraph: {
      title: `${a.displayName} vs ${b.displayName} — 2026 Comparison`,
      description: `Side-by-side: price, schools, commute, market speed. Which Middle TN suburb is right for you?`,
      url: `${SITE}/compare/${pairSlug}`,
      type: 'article',
    },
  }
}

export default async function ComparePage({ params }: Props) {
  const { pair: pairSlug } = await params
  const p = parsePairSlug(pairSlug)
  if (!p) notFound()

  const { a, b } = p
  const verdict = pairVerdict(a, b)

  const aYoy = parseFloat(a.yoyChange.replace(/[+%]/g, ''))
  const bYoy = parseFloat(b.yoyChange.replace(/[+%]/g, ''))
  const cheaper = a.medianPriceNum < b.medianPriceNum ? a : b
  const pricier = a.medianPriceNum < b.medianPriceNum ? b : a
  const priceDiff = Math.abs(a.medianPriceNum - b.medianPriceNum)
  const priceDiffPct = Math.round((priceDiff / pricier.medianPriceNum) * 100)
  const faster = a.avgDaysOnMarket < b.avgDaysOnMarket ? a : b
  const slower = a.avgDaysOnMarket < b.avgDaysOnMarket ? b : a

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Suburb Comparisons', item: `${SITE}/compare` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${a.displayName} vs ${b.displayName}`,
        item: `${SITE}/compare/${pairSlug}`,
      },
    ],
  }

  const faqs = [
    {
      q: `Is ${a.name} or ${b.name} better for families?`,
      a: `${verdict.forFamilies} School district matters most for families — ${a.name} is in ${a.schoolDistrict || 'its local district'} and ${b.name} is in ${b.schoolDistrict || 'its local district'}. Within the same district, school assignment can still vary by neighborhood, so confirm zoning for any specific address before committing.`,
    },
    {
      q: `Which is more affordable, ${a.name} or ${b.name}?`,
      a: `${cheaper.displayName} is more affordable, with a median sale price of ${cheaper.medianPrice} compared to ${pricier.displayName}&apos;s ${pricier.medianPrice} — a difference of roughly ${priceDiffPct}%. ${verdict.forValue}`,
    },
    {
      q: `Which has the faster market — ${a.name} or ${b.name}?`,
      a: `${faster.displayName} moves faster, with homes averaging ${faster.avgDaysOnMarket} days on market compared to ${slower.avgDaysOnMarket} days in ${slower.displayName}. Faster markets favor sellers but pressure buyers to move quickly with pre-approval in hand.`,
    },
    {
      q: `Which is appreciating faster — ${a.name} or ${b.name}?`,
      a: `${aYoy > bYoy ? a.displayName : b.displayName} is appreciating faster at ${aYoy > bYoy ? a.yoyChange : b.yoyChange}, compared to ${aYoy > bYoy ? b.yoyChange : a.yoyChange} in ${aYoy > bYoy ? b.displayName : a.displayName}. Past appreciation isn&apos;t a guarantee of future returns, but it&apos;s a reasonable proxy for market demand right now.`,
    },
    {
      q: `Should I choose ${a.name} or ${b.name} for relocation?`,
      a: `Depends on budget, schools, and commute. ${a.name} is in ${a.county} (${a.commuteNote || 'standard Nashville-area commute'}); ${b.name} is in ${b.county} (${b.commuteNote || 'standard Nashville-area commute'}). Most relocating buyers benefit from touring both with a local agent who can show the lifestyle differences side-by-side — that&apos;s exactly what Joshua does for out-of-state clients.`,
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

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${a.displayName} vs ${b.displayName} — Which Middle Tennessee Suburb Is Right for You in 2026?`,
    description: `Side-by-side comparison of ${a.displayName} and ${b.displayName}: price, schools, commute, days on market, appreciation, and lifestyle.`,
    url: `${SITE}/compare/${pairSlug}`,
    datePublished: '2026-02-01',
    dateModified: new Date().toISOString().slice(0, 10),
    inLanguage: 'en-US',
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

  const rows: Array<{ label: string; av: string; bv: string; highlight?: 'a' | 'b' | 'none' }> = [
    { label: 'County', av: a.county, bv: b.county, highlight: 'none' },
    { label: 'Median Sale Price', av: a.medianPrice, bv: b.medianPrice, highlight: cheaper === a ? 'a' : 'b' },
    {
      label: 'Avg. Days on Market',
      av: `${a.avgDaysOnMarket} days`,
      bv: `${b.avgDaysOnMarket} days`,
      highlight: faster === a ? 'a' : 'b',
    },
    { label: 'Price Per Sq Ft', av: `$${a.pricePerSqft}`, bv: `$${b.pricePerSqft}`, highlight: a.pricePerSqft < b.pricePerSqft ? 'a' : 'b' },
    { label: 'YoY Appreciation', av: a.yoyChange, bv: b.yoyChange, highlight: aYoy > bYoy ? 'a' : 'b' },
    { label: 'School District', av: a.schoolDistrict || '—', bv: b.schoolDistrict || '—', highlight: 'none' },
    { label: 'Commute to Nashville', av: a.commuteNote || '—', bv: b.commuteNote || '—', highlight: 'none' },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
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
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                </li>
                <li aria-hidden="true">·</li>
                <li>
                  <Link href="/compare" className="hover:text-white transition-colors">Compare Suburbs</Link>
                </li>
              </ol>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              Head-to-Head · 2026
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-5xl">
              {a.displayName}{' '}
              <span style={{ color: '#C41E3A' }}>vs</span>{' '}
              {b.displayName}
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Two Middle Tennessee suburbs, two different lifestyles. Here&apos;s how{' '}
              {a.name} and {b.name} compare on price, schools, commute, and the market dynamics
              that actually matter when you&apos;re deciding where to live.
            </p>
          </div>
        </div>

        {/* Side-by-side stats */}
        <div className="bg-[#F9F9F9] border-b border-[#E8E8E8] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 border-t-4" style={{ borderColor: '#C41E3A' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                  {a.county}
                </p>
                <h2 className="text-2xl font-black text-black mb-1">{a.displayName}</h2>
                <p className="text-3xl font-black text-black mt-3">{a.medianPrice}</p>
                <p className="text-xs text-[#A0A0A0]">median sale price</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[#A0A0A0] uppercase font-semibold">Days</p>
                    <p className="font-black text-black">{a.avgDaysOnMarket}</p>
                  </div>
                  <div>
                    <p className="text-[#A0A0A0] uppercase font-semibold">YoY</p>
                    <p className="font-black" style={{ color: '#16a34a' }}>{a.yoyChange}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href={`/buy/${a.slug}`}
                    className="block text-center text-xs font-bold px-4 py-2 tracking-wide transition-colors"
                    style={{ backgroundColor: '#0A1628', color: '#FFFFFF' }}
                  >
                    Buy in {a.name}
                  </Link>
                  <Link
                    href={`/sell/${a.slug}`}
                    className="block text-center text-xs font-bold px-4 py-2 tracking-wide border border-black text-black hover:bg-black hover:text-white transition-colors"
                  >
                    Sell in {a.name}
                  </Link>
                </div>
              </div>

              <div className="bg-white p-6 border-t-4" style={{ borderColor: '#0A1628' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                  {b.county}
                </p>
                <h2 className="text-2xl font-black text-black mb-1">{b.displayName}</h2>
                <p className="text-3xl font-black text-black mt-3">{b.medianPrice}</p>
                <p className="text-xs text-[#A0A0A0]">median sale price</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[#A0A0A0] uppercase font-semibold">Days</p>
                    <p className="font-black text-black">{b.avgDaysOnMarket}</p>
                  </div>
                  <div>
                    <p className="text-[#A0A0A0] uppercase font-semibold">YoY</p>
                    <p className="font-black" style={{ color: '#16a34a' }}>{b.yoyChange}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href={`/buy/${b.slug}`}
                    className="block text-center text-xs font-bold px-4 py-2 tracking-wide transition-colors"
                    style={{ backgroundColor: '#0A1628', color: '#FFFFFF' }}
                  >
                    Buy in {b.name}
                  </Link>
                  <Link
                    href={`/sell/${b.slug}`}
                    className="block text-center text-xs font-bold px-4 py-2 tracking-wide border border-black text-black hover:bg-black hover:text-white transition-colors"
                  >
                    Sell in {b.name}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Side-by-Side
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-10">
            The Numbers, Compared
          </h2>
          <div className="overflow-hidden border border-[#E8E8E8]">
            <table className="w-full">
              <thead className="bg-[#F9F9F9]">
                <tr>
                  <th className="text-left text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase p-4">
                    Metric
                  </th>
                  <th className="text-left text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase p-4">
                    {a.name}
                  </th>
                  <th className="text-left text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase p-4">
                    {b.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                    <td className="p-4 text-sm font-semibold text-black border-t border-[#E8E8E8]">
                      {r.label}
                    </td>
                    <td className={`p-4 text-sm border-t border-[#E8E8E8] ${r.highlight === 'a' ? 'font-black text-black' : 'text-[#444]'}`}>
                      {r.av}
                      {r.highlight === 'a' && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}>
                          ←
                        </span>
                      )}
                    </td>
                    <td className={`p-4 text-sm border-t border-[#E8E8E8] ${r.highlight === 'b' ? 'font-black text-black' : 'text-[#444]'}`}>
                      {r.bv}
                      {r.highlight === 'b' && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}>
                          ←
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lifestyle commentary */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Living in {a.name}
              </p>
              <h3 className="text-2xl font-black text-black mb-4">{a.displayName}</h3>
              <p className="text-[#444] text-base leading-relaxed mb-4">{a.description}</p>
              {a.topNeighborhoods && (
                <div className="mt-6">
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                    Top Neighborhoods
                  </p>
                  <ul className="space-y-1">
                    {a.topNeighborhoods.slice(0, 5).map((n) => (
                      <li key={n} className="text-sm text-[#444] flex items-center gap-2">
                        <span style={{ color: '#C41E3A' }}>→</span> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Living in {b.name}
              </p>
              <h3 className="text-2xl font-black text-black mb-4">{b.displayName}</h3>
              <p className="text-[#444] text-base leading-relaxed mb-4">{b.description}</p>
              {b.topNeighborhoods && (
                <div className="mt-6">
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                    Top Neighborhoods
                  </p>
                  <ul className="space-y-1">
                    {b.topNeighborhoods.slice(0, 5).map((n) => (
                      <li key={n} className="text-sm text-[#444] flex items-center gap-2">
                        <span style={{ color: '#C41E3A' }}>→</span> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verdict cards */}
        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Which Suburb Wins?
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              {a.name} or {b.name} — It Depends on What You&apos;re Optimizing For
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">For Families</p>
                <p className="text-base text-[#444] leading-relaxed">{verdict.forFamilies}</p>
              </div>
              <div className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">For Value</p>
                <p className="text-base text-[#444] leading-relaxed">{verdict.forValue}</p>
              </div>
              <div className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">For Market Speed</p>
                <p className="text-base text-[#444] leading-relaxed">{verdict.forSpeed}</p>
              </div>
            </div>
            <div className="mt-10 bg-white border-l-4 p-6 max-w-3xl" style={{ borderColor: '#0A1628' }}>
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                Joshua&apos;s Take
              </p>
              <p className="text-sm text-[#444] leading-relaxed">
                There&apos;s no universal winner between {a.name} and {b.name} — there&apos;s only
                a winner for <em>your</em> priorities. Buyers who give me a budget, a school
                requirement, and a commute boundary can usually narrow this question to a clear
                answer within a 30-minute call. Tour both side-by-side and the right one usually
                becomes obvious.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Common Questions
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              {a.name} vs {b.name} — FAQ
            </h2>
            <div className="space-y-6">
              {faqs.map((f, i) => (
                <div key={i} className="bg-[#F9F9F9] p-8 border-l-4" style={{ borderColor: '#0A1628' }}>
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
                Still torn between {a.name} and {b.name}?
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#A0A0A0' }}>
                Joshua will tour both with you, side-by-side, and help you decide based on your
                actual life — not a generic listicle.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href="/contact"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Free Consultation
              </Link>
              <a
                href="tel:6155512727"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
              >
                Call 615-551-2727
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
