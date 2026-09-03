import Link from 'next/link'
import TrackedTelLink from '@/components/TrackedTelLink'
import type { Listing } from '@/lib/listings'
import { listingCityDisplay } from '@/lib/listing-address'
import { listingDetailPath } from '@/lib/listing-detail'
import { soldListingLocationNames } from '@/lib/sold-proof'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

function specBits(listing: Listing): string {
  return [
    listing.beds !== undefined ? `${listing.beds} bd` : null,
    listing.baths !== undefined ? `${listing.baths} ba` : null,
    listing.sqft !== undefined ? `${listing.sqft.toLocaleString()} sqft` : null,
    listing.acres !== undefined ? `${listing.acres} ac` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

interface Props {
  listings: Listing[]
  /** When set, copy is scoped to that city (e.g. Brentwood market report). */
  placeName?: string
}

/**
 * Honest sold-inventory proof block. Renders only facts on the records passed
 * in — count, locations, address-level details — and links each home to its
 * on-site page. Does not claim representation side, close date, or DOM.
 */
export default function SoldPropertyExperience({ listings, placeName }: Props) {
  if (listings.length === 0) return null

  const locations = soldListingLocationNames(listings)
  const scope = placeName ? ` in ${placeName}` : ''
  const locationLabel = locations.length ? locations.join(', ') : 'Middle Tennessee'

  return (
    <section aria-labelledby="sold-proof-heading">
      <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
        Joshua Fink Group · Compass sold inventory
      </p>
      <h2
        id="sold-proof-heading"
        className="text-3xl font-black text-black tracking-tight mb-4"
      >
        Sold-property records currently shown{scope}
      </h2>
      <p className="text-sm text-[#444] leading-relaxed max-w-3xl mb-4">
        {listings.length} sold-property {listings.length === 1 ? 'record is' : 'records are'}{' '}
        currently published on this site{scope}, synced from Joshua Fink&apos;s Compass
        profile. This is the inventory we can show first-party — not a complete
        career sales history, and not a market-wide statistic.
      </p>
      <p className="text-sm text-[#444] leading-relaxed max-w-3xl mb-8">
        Locations on these records: {locationLabel}. Closing dates, days on market,
        and which side of the transaction Joshua represented are not in the site
        data, so they are not listed here. Each address below links to the
        on-site record (price and property details only).
      </p>

      <ul className="divide-y divide-[#E8E8E8] border-t border-[#E8E8E8]">
        {listings.map((listing) => {
          const href = listingDetailPath(listing)
          const city = listingCityDisplay(listing.city)
          const specs = specBits(listing)
          return (
            <li key={listing.compassUrl} className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6">
                <div>
                  {href ? (
                    <Link
                      href={href}
                      className="text-base font-bold text-black underline-offset-4 hover:underline"
                    >
                      {listing.address}
                    </Link>
                  ) : (
                    <p className="text-base font-bold text-black">{listing.address}</p>
                  )}
                  <p className="text-sm text-[#6B6B6B] mt-0.5">
                    {city}
                    {specs ? ` · ${specs}` : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-black shrink-0">
                  {formatPrice(listing.price)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center">
        <Link
          href="/listings"
          className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-3.5 tracking-wide rounded-full hover:bg-neutral-800 transition-colors text-center"
        >
          See all sold records →
        </Link>
        <TrackedTelLink
          href="tel:6155512727"
          className="inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-3.5 tracking-wide rounded-full hover:bg-black hover:text-white transition-colors text-center"
          data-cta="sold-proof-call"
        >
          Call 615-551-2727
        </TrackedTelLink>
        <Link
          href="/contact"
          className="text-sm font-semibold text-black underline-offset-4 hover:underline"
        >
          Ask about a similar home or a valuation
        </Link>
      </div>
    </section>
  )
}
