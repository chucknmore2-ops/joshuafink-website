import Link from 'next/link'
import TrackedTelLink from '@/components/TrackedTelLink'
import { formatCloseMonthYear, formatSoldPrice } from '@/lib/closings'
import type { CountySellerListing } from '@/lib/county-seller-listings'

function daysOnMarketLabel(days: number): string {
  return days === 1 ? '1 day on market' : `${days} days on market`
}

type Props = {
  county: string
  headingId: string
  sellHref: string
  callCta: string
  rows: readonly CountySellerListing[]
  summary: string
  total: number
}

/**
 * Traditional county listings only. Counts, prices, and days on market
 * come from the county catalog passed in — no cash-sale claims.
 */
export default function CountySellerListings({
  county,
  headingId,
  sellHref,
  callCta,
  rows,
  summary,
  total,
}: Props) {
  return (
    <section aria-labelledby={headingId} className="bg-white border-b border-neutral-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          Traditional listings · {county}
        </p>
        <h2 id={headingId} className="text-2xl sm:text-3xl font-black text-black tracking-tight">
          Homes I&apos;ve sold in {county}
        </h2>
        <p className="text-neutral-700 text-base leading-relaxed mt-4">{summary}</p>
        <p className="text-neutral-700 text-base leading-relaxed mt-3">
          These were traditional listings I sold, not cash purchases. Whether you want a{' '}
          <a href="#cash-offer-form" className="font-semibold text-black underline underline-offset-4">
            cash offer
          </a>{' '}
          or a{' '}
          <Link href={sellHref} className="font-semibold text-black underline underline-offset-4">
            full-market listing
          </Link>
          {', I know this market.'}
        </p>
        <p className="text-neutral-600 text-sm leading-relaxed mt-4">
          I&apos;m Joshua Fink, a licensed Tennessee Affiliate Broker with Compass Real Estate, licensed
          since 2008 (TREC #351484). Call or text{' '}
          <TrackedTelLink
            href="tel:6155512727"
            className="font-semibold text-black underline underline-offset-4"
            aria-label="Call Joshua at 615-551-2727"
            data-cta={callCta}
          >
            615-551-2727
          </TrackedTelLink>
          {'.'}
        </p>

        <h3 className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mt-8 mb-3">
          {`Most recent ${rows.length} of ${total}`}
        </h3>
        <div className="hidden sm:grid sm:grid-cols-[minmax(0,1.6fr)_9rem_7.5rem_9.5rem] sm:gap-4 text-xs font-semibold tracking-widest text-neutral-400 uppercase">
          <span>Street</span>
          <span>Sold</span>
          <span>Price</span>
          <span>Days on market</span>
        </div>
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {rows.map((row) => (
            <li
              key={`${row.street}-${row.city}-${row.closeDate}`}
              className="py-4 sm:grid sm:grid-cols-[minmax(0,1.6fr)_9rem_7.5rem_9.5rem] sm:items-baseline sm:gap-4"
            >
              <p className="text-sm font-black text-black">
                {row.street}, {row.city}
              </p>
              <p className="text-sm text-neutral-600 mt-1 sm:mt-0">
                <time dateTime={row.closeDate.slice(0, 7)}>{formatCloseMonthYear(row.closeDate)}</time>
              </p>
              <p className="text-sm text-neutral-600 mt-1 sm:mt-0">{formatSoldPrice(row.soldPrice)}</p>
              <p className="text-sm text-neutral-600 mt-1 sm:mt-0">{daysOnMarketLabel(row.daysOnMarket)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
