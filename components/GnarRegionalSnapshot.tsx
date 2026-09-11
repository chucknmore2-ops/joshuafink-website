import Link from 'next/link'
import {
  latestSnapshot,
  marketUpdateSlug,
  monthLabel,
  type MarketSnapshot,
} from '@/lib/market-snapshot'

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

function GnarStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white p-6 border border-[#E8E8E8]">
      <p className="text-3xl font-black text-black">{value}</p>
      <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">
        {label}
      </p>
    </div>
  )
}

function snapshotHref(s: MarketSnapshot): string {
  return s.sourceUrl ?? 'https://www.greaternashvillerealtors.org/monthly-home-sales-report'
}

/**
 * Nine-county Greater Nashville REALTORS® totals from lib/market-snapshot.ts.
 * Shown separately from Redfin citywide medians so the two sources cannot
 * be read as a city-only GNAR breakdown.
 */
export default function GnarRegionalSnapshot({ cityName }: { cityName: string }) {
  const s = latestSnapshot()
  if (!s) return null

  const label = monthLabel(s.month)
  const blogHref = `/blog/${marketUpdateSlug(s.month)}`

  return (
    <div className="border-b border-[#E8E8E8] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-3">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase">
            Middle Tennessee · {label} · nine-county GNAR
          </p>
          <p className="text-xs text-[#A0A0A0]">
            Source:{' '}
            <a
              href={snapshotHref(s)}
              className="underline underline-offset-2 hover:text-black"
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.source}
            </a>
            , monthly home sales chart
          </p>
        </div>
        <h2 className="text-2xl font-black text-black tracking-tight mb-2">
          Regional context for {cityName} buyers
        </h2>
        <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-3xl mb-8">
          Greater Nashville REALTORS® publishes nine-county totals (Davidson,
          Cheatham, Dickson, Maury, Robertson, Rutherford, Sumner, Williamson,
          and Wilson) — not a {cityName}-only breakdown. The city snapshot above
          is a separate Redfin citywide median. Use both as direction, then
          price the specific street.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <GnarStat value={formatCount(s.closedSales)} label="Total closings" />
          <GnarStat value={s.medianSalePrice} label="Residential median" />
          {s.condoMedianPrice && (
            <GnarStat value={s.condoMedianPrice} label="Condo median" />
          )}
          <GnarStat value={formatCount(s.activeListings)} label="Inventory" />
          {s.pendingSales != null && (
            <GnarStat value={formatCount(s.pendingSales)} label="Pendings" />
          )}
          <GnarStat value={String(s.avgDaysOnMarket)} label="Days on market" />
        </div>
        <p className="mt-6 text-sm text-[#6B6B6B]">
          Full {label} write-up:{' '}
          <Link href={blogHref} className="font-semibold text-black underline underline-offset-4 hover:no-underline">
            Middle Tennessee market update — {label}
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
