import Image from 'next/image'
import Link from 'next/link'
import type { Listing } from '@/lib/listings'
import { getSuburb, getSuburbSlugForListing } from '@/lib/suburbs'
import { hasListingDetail, listingSlug } from '@/lib/listing-detail'
import { withUtm } from '@/lib/utm'

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 3).replace(/\.?0+$/, '')}M`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

function statusColor(status: string): string {
  if (status === 'Active') return 'bg-black text-white'
  if (status.startsWith('Open House')) return 'bg-neutral-900 text-white'
  if (status === 'Sold') return 'bg-red-600 text-white'
  return 'bg-neutral-100 text-neutral-600'
}

interface Props {
  listing: Listing
  featured?: boolean
}

export default function ListingCard({ listing }: Props) {
  const suburbSlug = getSuburbSlugForListing(listing.city)
  const suburbName = suburbSlug ? getSuburb(suburbSlug)?.name : undefined
  // Active listings have an on-site detail page; sold homes don't, so their card
  // keeps handing straight off to Compass.
  const detailHref = hasListingDetail(listing) ? `/listings/${listingSlug(listing)}` : null

  return (
    <article className="group border border-neutral-200 bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-200 ease-out hover:shadow-xl hover:-translate-y-1">
      {/* Listing image */}
      <div className="relative bg-neutral-100 aspect-[4/3] overflow-hidden flex items-center justify-center">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.address}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="text-center text-neutral-400 px-4">
            <svg
              className="w-10 h-10 mx-auto mb-2 text-neutral-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9.75L12 3l9 6.75V21H3V9.75z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21V12h6v9" />
            </svg>
            <span className="text-xs tracking-wide">View on Compass</span>
          </div>
        )}

        {/* Primary click target — cover the image with a link to the on-site
            detail page (active listings only). */}
        {detailHref && (
          <Link
            href={detailHref}
            className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
            aria-label={`View details for ${listing.address}`}
          />
        )}

        {/* Status badge */}
        <span
          className={`absolute top-3 left-3 z-20 text-xs font-semibold px-3 py-1 rounded-full tracking-wide ${statusColor(
            listing.status
          )}`}
        >
          {listing.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3">
          <p className="text-2xl font-black text-black tracking-tight">
            {formatPrice(listing.price)}
          </p>
          {detailHref ? (
            <Link
              href={detailHref}
              className="text-sm font-semibold text-black mt-1 block underline-offset-4 hover:underline"
            >
              {listing.address}
            </Link>
          ) : (
            <p className="text-sm font-semibold text-black mt-1">{listing.address}</p>
          )}
          <p className="text-xs text-neutral-500 mt-0.5">{listing.city}</p>
        </div>

        {listing.note ? (
          <p className="text-sm text-neutral-500 mb-4">{listing.note}</p>
        ) : (
          <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
            {listing.beds !== undefined && (
              <span>
                <strong className="text-black font-semibold">{listing.beds}</strong> bd
              </span>
            )}
            {listing.baths !== undefined && (
              <span>
                <strong className="text-black font-semibold">{listing.baths}</strong> ba
              </span>
            )}
            {listing.sqft !== undefined && (
              <span>
                <strong className="text-black font-semibold">
                  {listing.sqft.toLocaleString()}
                </strong>{' '}
                sqft
              </span>
            )}
            {listing.acres !== undefined && (
              <span>
                <strong className="text-black font-semibold">{listing.acres}</strong> ac
              </span>
            )}
          </div>
        )}

        {suburbSlug && suburbName && (
          <div className="mt-auto mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link
              href={`/buy/${suburbSlug}`}
              className="text-black font-semibold underline-offset-4 hover:underline"
            >
              Browse {suburbName} homes →
            </Link>
            <Link
              href={`/cash-offer/${suburbSlug}`}
              className="text-neutral-500 underline-offset-4 hover:underline hover:text-black"
            >
              Cash offer →
            </Link>
          </div>
        )}

        <div className={`${suburbSlug ? '' : 'mt-auto '}flex flex-col gap-2`}>
          {/* Active listings: keep the buyer on-site first. Sold homes have no
              detail page, so their primary CTA stays the tap-to-text. */}
          {detailHref ? (
            <Link
              href={detailHref}
              className="text-center text-sm font-semibold bg-black text-white py-2.5 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800"
              data-cta="listing-card-details"
            >
              View Details →
            </Link>
          ) : (
            <a
              href={`sms:+16155512727?body=${encodeURIComponent(
                `Hi Joshua — I'm interested in ${listing.address}. Can you tell me more?`
              )}`}
              className="text-center text-sm font-semibold bg-black text-white py-2.5 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800"
              data-cta="listing-card-ask"
              aria-label={`Text Joshua about ${listing.address}`}
            >
              Ask Joshua about this home
            </a>
          )}

          {detailHref && (
            <a
              href={`sms:+16155512727?body=${encodeURIComponent(
                `Hi Joshua — I'm interested in ${listing.address}. Can you tell me more?`
              )}`}
              className="text-center text-sm font-semibold border border-black text-black py-2.5 rounded-full tracking-wide transition-all duration-200 hover:bg-black hover:text-white"
              data-cta="listing-card-ask"
              aria-label={`Text Joshua about ${listing.address}`}
            >
              Ask Joshua about this home
            </a>
          )}

          <a
            href={withUtm(listing.compassUrl, {
              source: 'joshuafink',
              medium: 'referral',
              campaign: 'listing-card',
              content: listing.address.toLowerCase().replace(/[^\w]+/g, '-'),
            })}
            target="_blank"
            rel="noopener noreferrer"
            className={
              detailHref
                ? 'text-center text-xs font-semibold text-neutral-500 py-1 underline-offset-4 hover:text-black hover:underline'
                : 'text-center text-sm font-semibold border border-black text-black py-2.5 rounded-full tracking-wide transition-all duration-200 hover:bg-black hover:text-white'
            }
          >
            View on Compass ↗
          </a>
        </div>
      </div>
    </article>
  )
}
