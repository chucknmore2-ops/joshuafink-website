import type { Metadata } from 'next'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import { listings } from '@/lib/listings'
import { soldListings } from '@/lib/sold-listings'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'
import { buildListingItemList } from '@/lib/listing-schema'
import { getSuburb, getSuburbSlugForListing } from '@/lib/suburbs'
import { getNeighborhoodsByCitySlug } from '@/lib/neighborhoods'

const faqs = [
  {
    q: 'How often are these listings updated?',
    a: 'Active inventory is synced directly from Joshua’s Compass profile. Homes move quickly in Middle Tennessee, so if a listing you like is already pending or sold, contact Joshua — he often knows about comparable homes before they hit the public market.',
  },
  {
    q: 'Can I see homes that aren’t listed here?',
    a: 'Yes. Through Compass Private Exclusives and Coming Soon, Joshua has access to off-market and pre-market homes across Franklin, Brentwood, Nashville, and the surrounding suburbs that never appear on public sites. Reach out with your criteria and he’ll send matches directly.',
  },
  {
    q: 'How do I get notified when a matching home comes on the market?',
    a: 'Tell Joshua what you’re looking for — area, price range, beds, must-haves — and he’ll set up a tailored alert so you hear about new and off-market listings the moment they’re available, not days later.',
  },
  {
    q: 'What does “Recently Sold” show?',
    a: 'These are homes Joshua has closed across Middle Tennessee. They’re a snapshot of the price points, neighborhoods, and home styles he works in every day — useful comps if you’re trying to understand what your own home might be worth.',
  },
]

export const metadata: Metadata = {
  title: 'Listings — Active & Recently Sold',
  description:
    "Active listings and recently sold homes from Joshua Fink at Compass Real Estate — Nashville, Brentwood, Franklin, Spring Hill, Columbia, and across Middle Tennessee. See what's on the market and what's actually closing.",
}

export default function ListingsPage() {
  const activeCount = listings.filter(
    (l) => l.status === 'Active' || l.status.startsWith('Active') || l.status.startsWith('Open')
  ).length

  const soldTotal = soldListings.reduce((sum, l) => sum + l.price, 0)

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Listings', href: '/listings' },
  ])

  const activeItemList = buildListingItemList(listings, 'Active Listings — Joshua Fink, Compass')
  const soldItemList = buildListingItemList(soldListings, 'Recently Sold — Joshua Fink, Compass')

  // City links — distribute equity to /buy, /neighborhoods, and /cash-offer pages
  // for every market actually represented in inventory.
  const citySlugs = Array.from(
    new Set(
      [...listings, ...soldListings]
        .map((l) => getSuburbSlugForListing(l.city))
        .filter((s): s is string => !!s),
    ),
  )
  const cityLinks = citySlugs
    .flatMap((slug) => {
      const suburb = getSuburb(slug)
      if (!suburb) return []
      const guides = getNeighborhoodsByCitySlug(slug)
      return [{ slug, name: suburb.name, guide: guides[0] }]
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(activeItemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(soldItemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {/* Page header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Joshua Fink · Compass Real Estate
          </p>
          <h1 className="text-5xl font-black tracking-tight mb-4">Listings</h1>
          <p className="text-[#A0A0A0] text-lg">
            {activeCount} active {activeCount === 1 ? 'listing' : 'listings'} · {soldListings.length} recently sold across Middle Tennessee
          </p>
        </div>
      </div>

      {/* Explore by city — internal funnel from /listings into buyer, neighborhood, and cash-offer landing pages */}
      {cityLinks.length > 0 && (
        <div className="border-b border-neutral-200 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-4">
              Explore by city
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
              {cityLinks.map(({ slug, name, guide }) => (
                <li key={slug} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-bold text-black">{name}:</span>
                  <Link
                    href={`/buy/${slug}`}
                    className="text-black underline-offset-4 hover:underline"
                  >
                    Homes for sale
                  </Link>
                  {guide && (
                    <>
                      <span aria-hidden className="text-neutral-300">·</span>
                      <Link
                        href={`/neighborhoods/${guide.slug}`}
                        className="text-black underline-offset-4 hover:underline"
                      >
                        {guide.name} guide
                      </Link>
                    </>
                  )}
                  <span aria-hidden className="text-neutral-300">·</span>
                  <Link
                    href={`/cash-offer/${slug}`}
                    className="text-black underline-offset-4 hover:underline"
                  >
                    Cash offer
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Active Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-black text-black mb-8 tracking-tight">Active Listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.compassUrl} listing={listing} />
          ))}
        </div>

        {/* Inline lead capture */}
        <div className="mt-16 border border-[#E8E8E8] p-8 sm:p-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-black mb-3">
                Don&apos;t see what you&apos;re looking for?
              </h2>
              <p className="text-[#6B6B6B] max-w-lg mx-auto">
                New listings hit the market every day — including Compass Private Exclusives and
                Coming Soon homes that never appear publicly. Tell Joshua what you&apos;re after.
              </p>
            </div>

            <SuburbLeadForm
              successTitle="Request Sent!"
              successMessage={
                <>
                  Joshua will reach out same-day with matching homes. For anything urgent, call{' '}
                  <a href="tel:6155512727" className="text-black font-semibold underline">615-551-2727</a>.
                </>
              }
              resetLabel="Submit Another"
            >
              <input type="hidden" name="lead_type" value="buyer" />
              <input type="hidden" name="source" value="listings" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Full Name *</label>
                  <input type="text" id="name" name="name" required placeholder="Jane Smith"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Phone *</label>
                  <input type="tel" id="phone" name="phone" required placeholder="615-555-0000"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Email Address *</label>
                <input type="email" id="email" name="email" required placeholder="you@example.com"
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
              </div>

              <div>
                <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">What Are You Looking For? (optional)</label>
                <textarea id="body" name="body" rows={3}
                  placeholder="Area, price range, beds, must-haves — anything helps Joshua send the right matches."
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
              </div>

              <label htmlFor="notify_matches" className="flex items-start gap-3 text-sm text-black cursor-pointer">
                <input type="checkbox" id="notify_matches" name="notify_matches" value="yes" defaultChecked
                  className="mt-0.5 h-4 w-4 border-[#E8E8E8] text-black focus:ring-black" />
                <span>Notify me of matching homes as they hit the market (including off-market and Coming Soon).</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#222] transition-colors">
                  Send to Joshua →
                </button>
                <a
                  href="tel:6155512727"
                  className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-4 tracking-wide hover:bg-black hover:text-white transition-colors"
                >
                  Or Call 615-551-2727
                </a>
              </div>
            </SuburbLeadForm>
          </div>
        </div>

        {/* Recently Sold */}
        {soldListings.length > 0 && (
          <div className="mt-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-black tracking-tight">Recently Sold</h2>
                <p className="text-[#6B6B6B] mt-1">
                  ${(soldTotal / 1_000_000).toFixed(1)}M+ in closed transactions
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldListings.map((listing) => (
                <ListingCard key={listing.compassUrl + listing.price} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-20 max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Common Questions
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-8">
            Buying &amp; Browsing in Middle Tennessee
          </h2>
          <dl className="divide-y divide-neutral-200 border-t border-neutral-200">
            {faqs.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="text-lg font-bold text-black mb-2">{f.q}</dt>
                <dd className="text-sm text-neutral-600 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
