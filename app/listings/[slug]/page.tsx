import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import { activeListingSlugs, getListingBySlug } from '@/lib/listing-detail'
import { buildListingSchema } from '@/lib/listing-schema'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'
import { getSuburb, getSuburbSlugForListing } from '@/lib/suburbs'
import { withUtm } from '@/lib/utm'

const SITE = 'https://www.joshuafink.com'

type Props = { params: Promise<{ slug: string }> }

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

// `city` can look like "Brentwood, TN 37027 | MLS #3245826" — drop the MLS
// suffix for display so headings and metadata stay clean.
function cityDisplay(city: string): string {
  return city.split('|')[0].trim()
}

function specString(listing: {
  beds?: number
  baths?: number
  sqft?: number
  acres?: number
}): string {
  return [
    listing.beds !== undefined ? `${listing.beds} bd` : null,
    listing.baths !== undefined ? `${listing.baths} ba` : null,
    listing.sqft !== undefined ? `${listing.sqft.toLocaleString()} sqft` : null,
    listing.acres !== undefined ? `${listing.acres} ac` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export async function generateStaticParams() {
  // Set already de-dupes, so every generated route is unique.
  return Array.from(activeListingSlugs).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const listing = getListingBySlug(slug)
  if (!listing) return {}

  const city = cityDisplay(listing.city)
  const specs = specString(listing)
  const url = `${SITE}/listings/${slug}`

  const title = `${listing.address}, ${city} — ${formatPrice(listing.price)}${
    specs ? ` · ${specs}` : ''
  }`
  const description = `${listing.address} in ${city} — ${formatPrice(listing.price)}${
    specs ? `, ${specs}` : ''
  }. ${listing.status} listing represented by Joshua Fink at Compass Real Estate. Request full details or a private showing.`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${listing.address}, ${city} — Joshua Fink · Compass`,
      description,
      url,
      siteName: 'Joshua Fink Group',
      type: 'website',
      ...(listing.imageUrl ? { images: [{ url: listing.imageUrl }] } : {}),
    },
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { slug } = await params
  const listing = getListingBySlug(slug)
  if (!listing) notFound()

  const city = cityDisplay(listing.city)
  const url = `${SITE}/listings/${slug}`
  const specs = specString(listing)

  const suburbSlug = getSuburbSlugForListing(listing.city)
  const suburbName = suburbSlug ? getSuburb(suburbSlug)?.name : undefined

  const listingLd = buildListingSchema(listing, url)
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Listings', href: '/listings' },
    { name: `${listing.address}, ${city}`, href: `/listings/${slug}` },
  ])

  // Secondary hand-off to Compass — tagged so the joshuafink.com → Compass
  // funnel is attributable, mirroring ListingCard's UTM convention.
  const compassHref = withUtm(listing.compassUrl, {
    source: 'joshuafink',
    medium: 'referral',
    campaign: 'listing-detail',
    content: slug,
  })

  // Seed the lead form's message with the property so Joshua sees intent
  // immediately and the buyer can edit before sending.
  const prefilledMessage = `I'm interested in ${listing.address}, ${city}. Please send me more details and let me know about a showing.`

  const detailRows: { label: string; value: string }[] = [
    { label: 'Price', value: formatPrice(listing.price) },
    ...(listing.beds !== undefined
      ? [{ label: 'Bedrooms', value: String(listing.beds) }]
      : []),
    ...(listing.baths !== undefined
      ? [{ label: 'Bathrooms', value: String(listing.baths) }]
      : []),
    ...(listing.sqft !== undefined
      ? [{ label: 'Square Feet', value: listing.sqft.toLocaleString() }]
      : []),
    ...(listing.acres !== undefined
      ? [{ label: 'Acres', value: String(listing.acres) }]
      : []),
    { label: 'Status', value: listing.status },
    { label: 'City', value: city },
  ]

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Breadcrumb / back link */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            <li>
              <Link href="/" className="hover:text-black underline-offset-4 hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">/</li>
            <li>
              <Link
                href="/listings"
                className="hover:text-black underline-offset-4 hover:underline"
              >
                Listings
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">/</li>
            <li className="font-semibold text-black">{listing.address}</li>
          </ol>
        </nav>

        {/* Listing image */}
        <div className="relative bg-neutral-100 aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-2xl flex items-center justify-center">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={`${listing.address}, ${city}`}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          ) : (
            <div className="text-center text-neutral-400 px-4">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-neutral-300"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 21V12h6v9"
                />
              </svg>
              <span className="text-xs tracking-wide">Photo available on Compass</span>
            </div>
          )}
          <span
            className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full tracking-wide ${
              listing.status === 'Active'
                ? 'bg-black text-white'
                : listing.status.startsWith('Open')
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {listing.status}
          </span>
        </div>

        {/* Header + two-column body */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
          {/* Left: property info */}
          <div className="lg:col-span-2">
            <p className="text-4xl font-black text-black tracking-tight">
              {formatPrice(listing.price)}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
              {listing.address}
            </h1>
            <p className="text-neutral-500 mt-1">{city}</p>

            {specs && (
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-600">
                {listing.beds !== undefined && (
                  <span>
                    <strong className="text-black font-semibold">{listing.beds}</strong> beds
                  </span>
                )}
                {listing.baths !== undefined && (
                  <span>
                    <strong className="text-black font-semibold">{listing.baths}</strong> baths
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
                    <strong className="text-black font-semibold">{listing.acres}</strong> acres
                  </span>
                )}
              </div>
            )}

            {listing.note && (
              <p className="mt-5 text-sm text-neutral-600 leading-relaxed">{listing.note}</p>
            )}

            {/* Details table */}
            <div className="mt-8">
              <h2 className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
                Property Details
              </h2>
              <dl className="divide-y divide-neutral-200 border-t border-neutral-200">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex justify-between py-3 text-sm">
                    <dt className="text-neutral-500">{row.label}</dt>
                    <dd className="font-semibold text-black text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Secondary hand-off — capture first, Compass second */}
            <div className="mt-8">
              <a
                href={compassHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-black text-black text-sm font-semibold px-6 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-black hover:text-white"
                data-cta="listing-detail-compass"
              >
                View on Compass ↗
              </a>
              <p className="mt-3 text-xs text-neutral-400">
                Full photo gallery and MLS documents are hosted on Compass with Joshua as your
                attributed agent.
              </p>
            </div>

            {suburbSlug && suburbName && (
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Link
                  href={`/buy/${suburbSlug}`}
                  className="text-black font-semibold underline-offset-4 hover:underline"
                >
                  Browse more {suburbName} homes →
                </Link>
                <Link
                  href={`/cash-offer/${suburbSlug}`}
                  className="text-neutral-500 underline-offset-4 hover:underline hover:text-black"
                >
                  Selling first? Get a cash offer →
                </Link>
              </div>
            )}
          </div>

          {/* Right: lead capture */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 border border-[#E8E8E8] rounded-2xl p-6 sm:p-8">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                Interested in this home?
              </p>
              <h2 className="text-2xl font-black text-black tracking-tight mb-2">
                Ask Joshua for details
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
                Get pricing history, disclosures, and a private showing for {listing.address}.
                Joshua responds same-day.
              </p>

              <SuburbLeadForm
                successTitle="Request Sent!"
                successMessage={
                  <>
                    Joshua will reach out same-day about {listing.address}. For anything urgent,
                    call{' '}
                    <a href="tel:6155512727" className="text-black font-semibold underline">
                      615-551-2727
                    </a>
                    .
                  </>
                }
                resetLabel="Send Another"
              >
                <input type="hidden" name="lead_type" value="buyer" />
                <input type="hidden" name="source" value="listing-detail" />
                {/* property_address is the field the contact webhook already
                    surfaces (Slack "Property" field + Monday item name). */}
                <input type="hidden" name="property_address" value={`${listing.address}, ${city}`} />
                {suburbName && <input type="hidden" name="suburb" value={suburbName} />}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Jane Smith"
                    autoComplete="name"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                  >
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    placeholder="615-555-0000"
                    autoComplete="tel"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="body"
                    className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    rows={3}
                    defaultValue={prefilledMessage}
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide rounded-full hover:bg-neutral-800 transition-colors"
                >
                  Send to Joshua →
                </button>

                <a
                  href={`sms:+16155512727?&body=${encodeURIComponent(
                    `Hi Joshua, I'm interested in ${listing.address}, ${city}`,
                  )}`}
                  className="w-full inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-4 tracking-wide rounded-full hover:bg-black hover:text-white transition-colors"
                  data-cta="listing-detail-sms"
                  aria-label={`Text Joshua about ${listing.address}`}
                >
                  Or text Joshua
                </a>

                <p className="text-xs text-[#A0A0A0]">
                  * Joshua responds same-day. No spam, no pressure.
                </p>
              </SuburbLeadForm>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
