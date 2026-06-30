import type { Metadata } from 'next'
import Link from 'next/link'
import { suburbs } from '@/lib/suburbs'

export const metadata: Metadata = {
  title: 'Middle Tennessee Real Estate Market Reports — 2026 | Joshua Fink',
  description:
    'Current real estate market reports for Franklin, Brentwood, Spring Hill, Nolensville, Nashville and every Middle Tennessee suburb. Median price, days on market, year-over-year change — updated for 2026.',
  alternates: { canonical: 'https://www.joshuafink.com/market' },
}

const SITE = 'https://www.joshuafink.com'

const faqs = [
  {
    q: 'How often are these Middle Tennessee market reports updated?',
    a: 'Each suburb report is reviewed and refreshed as new closings are reported through the Middle Tennessee MLS — typically monthly, with year-over-year benchmarks updated quarterly. Headline numbers (median price, days on market, $/sqft, YoY change) are kept current for 2026.',
  },
  {
    q: 'Where does the market data come from?',
    a: 'Numbers are pulled from RealTracs MLS closings and county assessor records, then filtered to single-family residential transactions in each named suburb. Joshua reviews the data manually — these are not algorithm-generated AVM estimates.',
  },
  {
    q: 'Is the Middle Tennessee housing market up or down right now?',
    a: 'Year-over-year direction varies by suburb. Higher-priced Williamson County submarkets (Franklin, Brentwood, Nolensville) and growing corridors (Spring Hill, Thompson’s Station, Nashville urban core) have generally appreciated through 2025–2026, while days-on-market has lengthened from the 2021–2022 peak. Open any suburb report for that specific market’s YoY change.',
  },
  {
    q: 'What does "days on market" mean on these reports?',
    a: 'Average days on market is the median time from list date to under-contract date for closed sales in the last reporting window. It is a stronger market-temperature signal than price alone — under 14 days indicates a seller’s market, 30+ days indicates buyers have negotiating room.',
  },
  {
    q: 'Can Joshua send a more detailed report for my specific street or subdivision?',
    a: 'Yes. Hyperlocal reports — narrowed to your subdivision, street, or a specific price band — are free on request. Call or text 615-551-2727 and tell Joshua the address and what decision the report is informing.',
  },
]

export default function MarketHubPage() {
  const all = Object.values(suburbs).sort((a, b) => b.medianPriceNum - a.medianPriceNum)

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: all.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/market/${s.slug}`,
      name: `${s.displayName} Real Estate Market Report`,
    })),
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Market Reports', item: `${SITE}/market` },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="bg-white">
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              Updated for 2026
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              Middle Tennessee{' '}
              <span style={{ color: '#C41E3A' }}>Real Estate Market Reports</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Median sale price, average days on market, price per square foot, and year-over-year
              appreciation for every Middle Tennessee suburb Joshua covers. Honest numbers, no
              algorithm guessing, updated as the market moves.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {all.map((s) => (
              <Link
                key={s.slug}
                href={`/market/${s.slug}`}
                className="block border border-[#E8E8E8] p-6 hover:border-black transition-colors bg-white group"
              >
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                  {s.county}
                </p>
                <h2 className="text-xl font-black text-black mb-3 group-hover:underline">
                  {s.displayName} Market Report
                </h2>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-[#A0A0A0] uppercase tracking-widest font-semibold">Median</p>
                    <p className="text-base font-black text-black">{s.medianPrice}</p>
                  </div>
                  <div>
                    <p className="text-[#A0A0A0] uppercase tracking-widest font-semibold">YoY</p>
                    <p className="text-base font-black" style={{ color: '#16a34a' }}>
                      {s.yoyChange}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#A0A0A0]">
                  Avg {s.avgDaysOnMarket} days on market · ${s.pricePerSqft}/sqft
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Market Report FAQ
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
