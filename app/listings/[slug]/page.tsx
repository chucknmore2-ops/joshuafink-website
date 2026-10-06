import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import TrustBadges from '@/components/TrustBadges'
import ReviewStrip from '@/components/ReviewStrip'
import TrackedTelLink from '@/components/TrackedTelLink'
import ListingCard from '@/components/ListingCard'
import ListingGallery from '@/components/ListingGallery'
import ListingShowingForm from '@/components/ListingShowingForm'
import ListingAlertsSignup from '@/components/ListingAlertsSignup'
import ComingSoonNotifyForm from '@/components/ComingSoonNotifyForm'
import {
  getListingBySlug,
  getTourVideoId,
  isSoldStatus,
  listingDetailSlugs,
} from '@/lib/listing-detail'
import { buildListingSchema } from '@/lib/listing-schema'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'
import { getSuburb, getSuburbSlugForListing } from '@/lib/suburbs'
import { withUtm } from '@/lib/utm'
import { compassJpegUrl } from '@/lib/compass-photo'
import { listings } from '@/lib/listings'
import { listingCityName, similarListings, suggestedPriceBand } from '@/lib/similar-listings'
import { listingCtaKind, listingStatusBadgeClass, listingStatusLabel } from '@/lib/listing-cta'

const SITE = 'https://www.joshuafink.com'

type Props = { params: Promise<{ slug: string }> }

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

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

function galleryPhotos(listing: { imageUrl?: string; photoUrls?: string[] }): string[] {
  const extra = (listing.photoUrls ?? []).filter(Boolean).slice(0, 30)
  if (extra.length) return extra
  return listing.imageUrl ? [listing.imageUrl] : []
}

export async function generateStaticParams() {
  return Array.from(listingDetailSlugs).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const listing = getListingBySlug(slug)
  if (!listing) return {}

  const city = cityDisplay(listing.city)
  const specs = specString(listing)
  const url = `${SITE}/listings/${slug}`
  const sold = isSoldStatus(listing.status)
  const photos = galleryPhotos(listing)

  const title = sold
    ? `${listing.address}, ${city} — Sold ${formatPrice(listing.price)}${specs ? ` · ${specs}` : ''}`
    : `${listing.address}, ${city} — ${formatPrice(listing.price)}${specs ? ` · ${specs}` : ''}`
  const description = sold
    ? `Sold-property record from Joshua Fink Group's Compass inventory: ${listing.address} in ${city} — ${formatPrice(listing.price)}${
        specs ? `, ${specs}` : ''
      }. Closing date, days on market, and representation side are not published on this page. Ask Joshua about similar homes or a valuation.`
    : `${listing.address} in ${city} — ${formatPrice(listing.price)}${
        specs ? `, ${specs}` : ''
      }. ${listingStatusLabel(listing.status)} listing represented by Joshua Fink at Compass Real Estate. Request full details or a private showing.`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: sold
        ? `${listing.address}, ${city} — Sold · Joshua Fink`
        : `${listing.address}, ${city} — Joshua Fink · Compass`,
      description,
      url,
      siteName: 'Joshua Fink Group',
      type: 'website',
      ...(photos[0]
        ? { images: [{ url: compassJpegUrl(photos[0]) ?? photos[0] }] }
        : {}),
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
  const sold = isSoldStatus(listing.status)
  const cta = listingCtaKind(listing.status)
  const photos = galleryPhotos(listing)
  const propertyAddress = `${listing.address}, ${city}`
  const cityName = listingCityName(listing.city)
  const band = suggestedPriceBand(listing.price)
  const similar = similarListings(listing, listings)

  const suburbSlug = getSuburbSlugForListing(listing.city)
  const suburbName = suburbSlug ? getSuburb(suburbSlug)?.name : undefined

  const tourVideoId = getTourVideoId(slug)
  const listingLd = buildListingSchema(listing, url, tourVideoId)
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Listings', href: '/listings' },
    ...(suburbSlug && suburbName
      ? [
          sold
            ? { name: `${suburbName} market`, href: `/market/${suburbSlug}` }
            : { name: `${suburbName} homes for sale`, href: `/buy/${suburbSlug}` },
        ]
      : []),
    { name: `${listing.address}, ${city}`, href: `/listings/${slug}` },
  ])

  const compassHref = withUtm(listing.compassUrl, {
    source: 'joshuafink',
    medium: 'referral',
    campaign: 'listing-detail',
    content: slug,
  })

  const prefilledMessage = sold
    ? `I'm looking for a home like ${listing.address}, ${city} (sold record). Please send similar homes or a valuation.`
    : `I'm interested in ${listing.address}, ${city}. Please send me more details and let me know about a showing.`

  const detailRows: { label: string; value: string }[] = [
    { label: sold ? 'Sold price' : 'Price', value: formatPrice(listing.price) },
    ...(listing.beds !== undefined ? [{ label: 'Bedrooms', value: String(listing.beds) }] : []),
    ...(listing.baths !== undefined ? [{ label: 'Bathrooms', value: String(listing.baths) }] : []),
    ...(listing.sqft !== undefined ? [{ label: 'Square Feet', value: listing.sqft.toLocaleString() }] : []),
    ...(listing.acres !== undefined ? [{ label: 'Acres', value: String(listing.acres) }] : []),
    { label: 'Status', value: listingStatusLabel(listing.status) },
    { label: 'City', value: city },
  ]

  const primaryHref = cta === 'coming-soon' ? '#notify' : cta === 'under-contract' ? '#similar' : cta === 'sold' ? '#lead' : '#showing'
  const primaryLabel = cta === 'coming-soon'
    ? "Get notified when it's live"
    : cta === 'under-contract'
      ? 'See similar homes'
      : cta === 'sold'
        ? 'Ask about similar homes'
        : 'Schedule a showing'

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            <li>
              <Link href="/" className="hover:text-black underline-offset-4 hover:underline">Home</Link>
            </li>
            <li aria-hidden className="text-neutral-300">/</li>
            <li>
              <Link href="/listings" className="hover:text-black underline-offset-4 hover:underline">Listings</Link>
            </li>
            <li aria-hidden className="text-neutral-300">/</li>
            {suburbSlug && suburbName && (
              <>
                <li>
                  <Link
                    href={sold ? `/market/${suburbSlug}` : `/buy/${suburbSlug}`}
                    className="hover:text-black underline-offset-4 hover:underline"
                  >
                    {sold ? `${suburbName} market` : `${suburbName} homes for sale`}
                  </Link>
                </li>
                <li aria-hidden className="text-neutral-300">/</li>
              </>
            )}
            <li className="font-semibold text-black">{listing.address}</li>
          </ol>
        </nav>

        <ListingGallery
          photos={photos}
          alt={`${listing.address}, ${city}`}
          statusLabel={listingStatusLabel(listing.status)}
          statusClassName={listingStatusBadgeClass(listing.status)}
        />

        {/* Listing Short. The id comes from lib/listing-tour-videos.json. */}
        {tourVideoId && (
          <div className="mt-6 mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-neutral-950">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${tourVideoId}`}
              title={`Listing video of ${listing.address}, ${city}`}
              className="h-full w-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        )}

        <div className="mt-6">
          <TrustBadges variant="light" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
          <div className="lg:col-span-2">
            <p className="text-4xl font-black text-black tracking-tight">{formatPrice(listing.price)}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">{listing.address}</h1>
            <p className="text-neutral-500 mt-1">{city}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={primaryHref}
                className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-6 py-3 rounded-full"
              >
                {primaryLabel}
              </a>
              {cta === 'under-contract' && (
                <a
                  href="#alerts"
                  className="inline-flex items-center justify-center border border-black text-black text-sm font-bold px-6 py-3 rounded-full"
                >
                  Get alerts for homes like this
                </a>
              )}
            </div>

            {specs && (
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-600">
                {listing.beds !== undefined && (
                  <span><strong className="text-black font-semibold">{listing.beds}</strong> beds</span>
                )}
                {listing.baths !== undefined && (
                  <span><strong className="text-black font-semibold">{listing.baths}</strong> baths</span>
                )}
                {listing.sqft !== undefined && (
                  <span>
                    <strong className="text-black font-semibold">{listing.sqft.toLocaleString()}</strong> sqft
                  </span>
                )}
                {listing.acres !== undefined && (
                  <span><strong className="text-black font-semibold">{listing.acres}</strong> acres</span>
                )}
              </div>
            )}

            {listing.note && <p className="mt-5 text-sm text-neutral-600 leading-relaxed">{listing.note}</p>}

            {sold && (
              <p className="mt-5 text-sm text-neutral-600 leading-relaxed">
                This page republishes a sold-property record from Joshua Fink Group&apos;s Compass inventory.
                The price and property details below are the fields stored on this site. Closing date, days
                on market, and which side of the transaction Joshua represented are not in the site data, so
                they are omitted. If you want a similar home or a valuation, use the form — Joshua answers
                at 615-551-2727.
              </p>
            )}

            {cta === 'under-contract' && (
              <p className="mt-5 text-sm text-neutral-600 leading-relaxed">
                This Compass listing is under contract. The homes below are other listings in the same city
                or a similar price, and you can get an email when a new one is listed.
              </p>
            )}

            <div className="mt-8">
              <h2 className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">Property Details</h2>
              <dl className="divide-y divide-neutral-200 border-t border-neutral-200">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex justify-between py-3 text-sm">
                    <dt className="text-neutral-500">{row.label}</dt>
                    <dd className="font-semibold text-black text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

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
                {sold
                  ? 'Compass is the source listing for this sold record. Closing date, days on market, and representation side are not in the site data and are not shown here.'
                  : 'MLS documents are hosted on Compass with Joshua as your attributed agent. Photos on this page are not behind a form.'}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {suburbSlug && suburbName && (
                <>
                  <Link href={`/buy/${suburbSlug}`} className="text-black font-semibold underline-offset-4 hover:underline">
                    Browse {suburbName} homes for sale →
                  </Link>
                  <Link href={`/market/${suburbSlug}`} className="text-black font-semibold underline-offset-4 hover:underline">
                    {suburbName} market report →
                  </Link>
                  <Link href={`/cash-offer/${suburbSlug}`} className="text-neutral-500 underline-offset-4 hover:underline hover:text-black">
                    Selling first? Get a cash offer →
                  </Link>
                </>
              )}
              <Link href="/neighborhoods" className="text-neutral-500 underline-offset-4 hover:underline hover:text-black">
                Neighborhood guides →
              </Link>
              <Link href="/listings" className="text-neutral-500 underline-offset-4 hover:underline hover:text-black">
                All listings →
              </Link>
              <Link href="/alerts" className="text-neutral-500 underline-offset-4 hover:underline hover:text-black">
                New listing alerts →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1 lg:order-last">
            <div id="lead" className="border border-[#E8E8E8] rounded-2xl p-6 sm:p-8 scroll-mt-24 space-y-10">
              {cta === 'showing' && (
                <ListingShowingForm
                  address={listing.address}
                  city={city}
                  propertyAddress={propertyAddress}
                  suburb={suburbName}
                />
              )}
              {cta === 'coming-soon' && (
                <ComingSoonNotifyForm
                  address={listing.address}
                  propertyAddress={propertyAddress}
                  suburb={suburbName}
                />
              )}
              {cta === 'under-contract' && (
                <div>
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">Under contract</p>
                  <h2 className="text-2xl font-black text-black tracking-tight mb-2">See similar homes</h2>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-4">
                    {listing.address} is under contract. Look at other Compass listings nearby, or get an email when one like it is listed.
                  </p>
                  <a href="#similar" className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-6 py-3 rounded-full">
                    See similar homes
                  </a>
                </div>
              )}
              {cta === 'sold' && (
                <div>
                  <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">This home has sold</p>
                  <h2 className="text-2xl font-black text-black tracking-tight mb-2">Ask about similar homes</h2>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
                    Looking for something like {listing.address}, or want a valuation on your address? Joshua responds same-day.
                  </p>
                  <SuburbLeadForm
                    successTitle="Request Sent!"
                    successMessage={
                      <>
                        Joshua will reach out same-day about homes like {listing.address}. For anything urgent, call{' '}
                        <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="listing-detail-success-call">
                          615-551-2727
                        </TrackedTelLink>
                        .
                      </>
                    }
                    resetLabel="Send Another"
                  >
                    <input type="hidden" name="lead_type" value="buyer" />
                    <input type="hidden" name="source" value="listing-detail-sold" />
                    <input type="hidden" name="property_address" value={propertyAddress} />
                    {suburbName && <input type="hidden" name="suburb" value={suburbName} />}
                    <div>
                      <label htmlFor="sold-name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Full Name *</label>
                      <input type="text" id="sold-name" name="name" required placeholder="Jane Smith" autoComplete="name" className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label htmlFor="sold-phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Phone (optional — fastest reply)</label>
                      <input type="tel" id="sold-phone" name="phone" placeholder="615-555-0000" autoComplete="tel" className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label htmlFor="sold-email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Email Address (optional)</label>
                      <input type="email" id="sold-email" name="email" placeholder="you@example.com" autoComplete="email" className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label htmlFor="sold-body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Message</label>
                      <textarea id="sold-body" name="body" rows={3} defaultValue={prefilledMessage} className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
                    </div>
                    <button type="submit" className="w-full inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide rounded-full hover:bg-neutral-800 transition-colors">
                      Send to Joshua →
                    </button>
                  </SuburbLeadForm>
                </div>
              )}

              {cta !== 'sold' && (
                <ListingAlertsSignup
                  source="listing-alerts"
                  city={cityName}
                  priceMin={band.min}
                  priceMax={band.max}
                  propertyAddress={propertyAddress}
                />
              )}
              {cta === 'sold' && (
                <ListingAlertsSignup
                  source="listing-alerts"
                  city={cityName}
                  priceMin={band.min}
                  priceMax={band.max}
                  propertyAddress={propertyAddress}
                  heading="Get alerts for homes like this"
                  intro="This home has sold. Leave your email if you want a note when Joshua lists something in a similar price or city."
                />
              )}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <section id="similar" className="mt-16 scroll-mt-24">
            <h2 className="text-2xl font-black text-black tracking-tight">Similar homes</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Other Compass listings in {cityName || 'the same city'} or a similar price.
              {suburbSlug && suburbName ? (
                <>
                  {' '}
                  <Link href={`/buy/${suburbSlug}`} className="text-black font-semibold underline-offset-4 hover:underline">
                    Browse {suburbName} homes
                  </Link>
                </>
              ) : null}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((home) => (
                <ListingCard key={home.compassUrl} listing={home} />
              ))}
            </div>
          </section>
        )}
      </div>

      <ReviewStrip variant="light" limit={3} />
    </div>
  )
}
