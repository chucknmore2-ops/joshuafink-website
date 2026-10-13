import Link from 'next/link'
import {
  cityMonthCitation,
  cityMonthIntro,
  cityMonthPath,
  currentCityGnarSnapshot,
  isGnarMonthlyCity,
} from '@/lib/city-gnar-months'
import { marketSnapshots, monthLabel, snapshotStatLines } from '@/lib/market-snapshot'

/**
 * Current nine-county GNAR month on a Franklin, Brentwood, or Nashville
 * market report, plus a link to every month in the snapshot file.
 */
export default function CityGnarMonths({ slug, cityName }: { slug: string; cityName: string }) {
  if (!isGnarMonthlyCity(slug)) return null
  const snapshot = currentCityGnarSnapshot()
  if (!snapshot) return null
  const label = monthLabel(snapshot.month)

  return (
    <section aria-labelledby="gnar-months-heading" className="border-b border-[#E8E8E8] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
          Greater Nashville REALTORS® · {label}
        </p>
        <h2 id="gnar-months-heading" className="text-2xl font-black text-black tracking-tight mb-3">
          {cityName} and the {label} GNAR report
        </h2>
        <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-3xl mb-4">
          {cityMonthIntro(cityName, snapshot)}
        </p>
        <p className="text-xs text-[#A0A0A0] mb-6">
          {snapshot.sourceUrl ? (
            <a href={snapshot.sourceUrl} className="underline underline-offset-2 hover:text-black" target="_blank" rel="noopener noreferrer">
              {cityMonthCitation(snapshot)}
            </a>
          ) : (
            cityMonthCitation(snapshot)
          )}
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {snapshotStatLines(snapshot).map((line) => (
            <li key={line} className="text-sm text-black bg-[#F5F5F5] px-4 py-3">
              {line}
            </li>
          ))}
        </ul>
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
          Monthly pages
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {marketSnapshots.map((row) => (
            <li key={row.month}>
              <Link href={cityMonthPath(slug, row.month)} className="text-sm text-black underline hover:no-underline">
                {monthLabel(row.month)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
