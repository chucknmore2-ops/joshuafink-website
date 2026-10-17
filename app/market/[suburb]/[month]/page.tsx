import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  cityMonthCitation,
  cityMonthFaq,
  cityMonthIntro,
  cityMonthParams,
  cityMonthPath,
  getCityMonthPage,
} from '@/lib/city-gnar-months'
import { marketSnapshots, marketUpdateSlug, monthLabel, snapshotStatLines } from '@/lib/market-snapshot'
import TrackedTelLink from '@/components/TrackedTelLink'

const SITE = 'https://www.joshuafink.com'

type Props = {
  params: Promise<{ suburb: string; month: string }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  return cityMonthParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { suburb: slug, month } = await params
  const page = getCityMonthPage(slug, month)
  if (!page) return {}
  const label = monthLabel(page.snapshot.month)
  const path = cityMonthPath(slug, month)
  const description =
    `${page.suburb.displayName} in ${label}: nine-county figures from ${page.snapshot.source}. ` +
    `Residential median ${page.snapshot.medianSalePrice}. Not the ${page.suburb.name} city median.`
  return {
    title: `${page.suburb.displayName} market context — ${label}`,
    description,
    alternates: { canonical: `${SITE}${path}` },
    openGraph: {
      title: `${page.suburb.displayName} and the ${label} GNAR report`,
      description,
      url: `${SITE}${path}`,
      type: 'article',
    },
  }
}

export default async function CityMonthMarketPage({ params }: Props) {
  const { suburb: slug, month } = await params
  const page = getCityMonthPage(slug, month)
  if (!page) notFound()

  const { suburb, snapshot } = page
  const label = monthLabel(snapshot.month)
  const citation = cityMonthCitation(snapshot)
  const intro = cityMonthIntro(suburb.name, snapshot)
  const faq = cityMonthFaq(suburb.name, snapshot)
  const path = cityMonthPath(slug, month)
  const otherMonths = marketSnapshots.filter((row) => row.month !== snapshot.month)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div style={{ backgroundColor: '#0A1628' }} className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#A0A0A0' }}>
            <Link href="/market" className="hover:text-white">Market</Link>
            {' · '}
            <Link href={`/market/${slug}`} className="hover:text-white">{suburb.displayName}</Link>
            {' · '}
            {label}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            {suburb.name} market context — {label}
          </h1>
          <p className="text-lg max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
            {intro}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-[#444] mb-8">
          {snapshot.sourceUrl ? (
            <a href={snapshot.sourceUrl} className="underline underline-offset-2 hover:text-black" target="_blank" rel="noopener noreferrer">
              {citation}
            </a>
          ) : (
            citation
          )}
          {snapshot.reportDate ? ` · report dated ${snapshot.reportDate}` : ''}
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {snapshotStatLines(snapshot).map((line) => (
            <li key={line} className="bg-[#F5F5F5] p-6 text-base font-semibold text-black">
              {line}
            </li>
          ))}
        </ul>

        {snapshot.takeaways.length > 0 && (
          <div className="mb-12 max-w-3xl">
            <h2 className="text-2xl font-black text-black tracking-tight mb-4">What the release said</h2>
            <ul className="space-y-3">
              {snapshot.takeaways.map((line) => (
                <li key={line} className="text-sm text-[#444] leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white border border-[#E8E8E8] p-8 mb-12 max-w-3xl">
          <h2 className="text-xl font-black text-black mb-3">{faq.q}</h2>
          <p className="text-sm text-[#444] leading-relaxed">{faq.a}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link
            href={`/market/${slug}`}
            className="inline-block text-sm font-bold px-6 py-3 tracking-wide text-center"
            style={{ backgroundColor: '#0A1628', color: '#FFFFFF' }}
          >
            {suburb.name} city market report →
          </Link>
          <Link
            href={`/blog/${marketUpdateSlug(snapshot.month)}`}
            className="inline-block border border-black text-black text-sm font-bold px-6 py-3 tracking-wide text-center hover:bg-black hover:text-white transition-colors"
          >
            Regional {label} update
          </Link>
          <TrackedTelLink
            href="tel:6155512727"
            className="inline-block text-sm font-bold px-6 py-3 tracking-wide text-center"
            style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
            data-cta="city-month-call"
          >
            615-551-2727
          </TrackedTelLink>
        </div>

        {otherMonths.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-black mb-4">Other {suburb.name} months</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {otherMonths.map((row) => (
                <li key={row.month}>
                  <Link href={cityMonthPath(slug, row.month)} className="text-sm text-black underline hover:no-underline">
                    {monthLabel(row.month)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
