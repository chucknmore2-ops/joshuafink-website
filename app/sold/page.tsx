import type { Metadata } from 'next'
import Link from 'next/link'
import SoldHashFilter from '@/components/SoldHashFilter'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'
import {
  SOLD_CANONICAL,
  SOLD_PATH,
  buildSoldClosingsSchema,
  closingCountLabel,
  closingDateSpan,
  closingGroups,
  closingSideCounts,
  closings,
  formatBaths,
  formatCloseMonthYear,
  formatSoldPrice,
  formatSqft,
  soldFilterCss,
  soldPageDescription,
} from '@/lib/closings'

// Static HTML. City filtering is a URL hash plus CSS, so the route is
// pre-rendered instead of running as a Function.
export const dynamic = 'force-static'

const description = soldPageDescription()

export const metadata: Metadata = {
  title: 'Recent Closings',
  description,
  alternates: { canonical: SOLD_CANONICAL },
  openGraph: {
    title: 'Recent Closings | Joshua Fink | Compass Real Estate',
    description,
    url: SOLD_CANONICAL,
    siteName: 'Joshua Fink | Compass Real Estate',
    type: 'website',
  },
}

export default function SoldPage() {
  const groups = closingGroups()
  const sides = closingSideCounts()
  const span = closingDateSpan()
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Recent Closings', href: SOLD_PATH },
  ])
  const schema = buildSoldClosingsSchema()

  return (
    <div className="sold-page bg-white">
      <style>{soldFilterCss(groups.map((group) => group.anchor))}</style>
      <SoldHashFilter anchors={groups.map((group) => group.anchor)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Joshua Fink · Compass Real Estate
          </p>
          <h1 className="text-5xl font-black tracking-tight mb-4">Recent Closings</h1>
          <p className="text-[#A0A0A0] text-lg max-w-3xl">
            {closings.length} closed sales in Tennessee, {formatCloseMonthYear(span.earliest)}{' '}
            through {formatCloseMonthYear(span.latest)}.
          </p>
          <p className="text-[#A0A0A0] text-sm mt-3">
            {sides['Represented buyer']} Represented buyer · {sides['Listed and sold']} Listed and sold
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
          By city
        </p>
        <h2 className="text-3xl font-black tracking-tight text-black mb-3">Closings by city</h2>
        <p className="text-[#444] max-w-3xl leading-relaxed mb-8">
          The number on each city is the count of closings in that city. Choose a city to show
          only those homes. All shows every city. Prices, beds, baths, and square footage are the
          closed MLS figures, and the close date is the month and year.
        </p>
        <nav aria-label="Filter closings by city" className="flex flex-wrap gap-2">
          <a
            href="#all"
            aria-label={`All, ${closingCountLabel(closings.length)}`}
            className="inline-flex items-center justify-between gap-3 border border-[#E8E8E8] px-4 py-2 text-sm font-semibold text-black hover:border-black"
          >
            <span>All</span>
            <span>{closings.length}</span>
          </a>
          {groups.map((group) => (
            <a
              key={group.anchor}
              href={`#${group.anchor}`}
              aria-label={`${group.city}, ${closingCountLabel(group.closings.length)}`}
              className="inline-flex items-center justify-between gap-3 border border-[#E8E8E8] px-4 py-2 text-sm font-semibold text-black hover:border-black"
            >
              <span>{group.city}</span>
              <span>{group.closings.length}</span>
            </a>
          ))}
        </nav>
      </div>

      <div id="all" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 scroll-mt-24 space-y-16">
        {groups.map((group) => (
          <section
            key={group.anchor}
            id={group.anchor}
            aria-labelledby={`${group.anchor}-heading`}
            className="city-section scroll-mt-24"
          >
            <h2 id={`${group.anchor}-heading`} className="text-3xl font-black tracking-tight text-black">
              {group.city}
            </h2>
            <p className="text-[#6B6B6B] mt-2 mb-8">{closingCountLabel(group.closings.length)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.closings.map((closing) => (
                <article
                  key={`${closing.address}-${closing.closeDate}-${closing.side}`}
                  className="border border-[#E8E8E8] p-6"
                >
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase">
                    {closing.side}
                  </p>
                  <h3 className="text-lg font-black text-black mt-2 leading-snug">{closing.address}</h3>
                  <p className="text-sm text-[#444] mt-1">
                    {closing.city}, {closing.state}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mt-5">Sold price</p>
                  <p className="text-2xl font-black text-black">{formatSoldPrice(closing.soldPrice)}</p>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    <time dateTime={closing.closeDate.slice(0, 7)}>
                      {formatCloseMonthYear(closing.closeDate)}
                    </time>
                  </p>
                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[#E8E8E8] pt-4">
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-[#A0A0A0]">Beds</dt>
                      <dd className="font-semibold text-black mt-1">{closing.beds}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-[#A0A0A0]">Baths</dt>
                      <dd className="font-semibold text-black mt-1">{formatBaths(closing.baths)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-[#A0A0A0]">Sqft</dt>
                      <dd className="font-semibold text-black mt-1">{formatSqft(closing.sqft)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
              Compass Real Estate
            </p>
            <h2 className="text-2xl font-black tracking-tight text-black">Talk with Joshua</h2>
          </div>
          <Link
            href="/contact"
            className="inline-block bg-black text-white text-sm font-bold px-6 py-3 tracking-wide hover:bg-[#222] transition-colors text-center"
          >
            Send a Message
          </Link>
        </div>
      </div>
    </div>
  )
}
