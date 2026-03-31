import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ListingCard from '@/components/ListingCard'
import { listings as featuredListings } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'Joshua Fink | Top Realtor in Middle Tennessee | Compass Real Estate',
  description:
    'Joshua Fink — Affiliate Broker at Compass Real Estate serving Nashville, Brentwood, Franklin and all of Middle Tennessee. 13+ years of experience, 100+ homes sold annually.',
}

const stats = [
  { value: '13+', label: 'Years Experience' },
  { value: '100+', label: 'Homes Sold Annually' },
  { value: '★', label: 'Diamond & Titan Award Winner' },
]

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative bg-black min-h-[92vh] flex items-center overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/60 z-10" />

        {/* Headshot — right side */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 z-0">
          <div className="w-full h-full relative">
            <Image
              src="/headshot.jpg"
              alt="Joshua Fink — Affiliate Broker, Compass Real Estate"
              fill
              className="object-cover object-top opacity-70 md:opacity-90"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent md:via-black/10" />
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-xl">
            <p className="text-white font-black text-base tracking-[0.3em] uppercase mb-6 opacity-80">
              COMPASS
            </p>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight mb-4">
              Joshua
              <br />
              Fink
            </h1>

            <p className="text-lg sm:text-xl text-neutral-200 font-medium mb-3 tracking-wide">
              Affiliate Broker &nbsp;|&nbsp; Compass Real Estate &nbsp;|&nbsp; Middle Tennessee
            </p>
            <p className="text-base text-neutral-400 mb-10 max-w-md leading-relaxed">
              Selling your home? Get a free, no-obligation market valuation — real comps, real numbers, same day.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                href="/sell"
                className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-7 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-100 hover:shadow-lg active:scale-[0.98]"
              >
                What&apos;s My Home Worth?
              </Link>
              <Link
                href="/cash-offer"
                className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white text-sm font-bold px-7 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-white hover:text-black active:scale-[0.98]"
              >
                Get a Cash Offer
              </Link>
              <Link
                href="/listings"
                className="inline-flex items-center justify-center border border-white/40 text-white/80 text-sm font-semibold px-7 py-3 rounded-full tracking-wide transition-all duration-200 hover:border-white hover:text-white active:scale-[0.98]"
              >
                View Listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-neutral-100 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
            {stats.map((stat) => (
              <div key={stat.label} className="py-8 px-6 text-center">
                <p className="text-4xl font-black text-black mb-1">{stat.value}</p>
                <p className="text-sm text-neutral-500 font-medium tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-2">
                Current Listings
              </p>
              <h2 className="text-4xl font-black text-black tracking-tight">Featured Homes</h2>
            </div>
            <Link
              href="/listings"
              className="hidden sm:inline-flex text-sm font-semibold text-black underline underline-offset-4 hover:no-underline"
            >
              View All Listings →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.address} listing={listing} featured />
            ))}
          </div>

          <div className="mt-8 sm:hidden text-center">
            <Link
              href="/listings"
              className="inline-flex text-sm font-semibold text-black underline underline-offset-4"
            >
              View All Listings →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SELL CTA ── */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
                Thinking About Selling?
              </p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
                Find Out What Your<br />Home Is Worth.
              </h2>
              <p className="text-neutral-400 text-base leading-relaxed max-w-lg">
                Get a free, no-obligation home valuation from Joshua. Real comps, real numbers —
                not an algorithm. Most sellers are surprised by what their home is worth in
                today&apos;s Middle Tennessee market.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 lg:justify-end">
              <Link
                href="/sell"
                className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-8 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-100 hover:shadow-lg active:scale-[0.98]"
              >
                Get My Free Valuation →
              </Link>
              <a
                href="tel:6155512727"
                className="inline-flex items-center justify-center border border-neutral-600 text-white text-sm font-bold px-8 py-4 rounded-full tracking-wide transition-all duration-200 hover:border-white hover:bg-white/10 active:scale-[0.98]"
              >
                Call 615-551-2727
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT TEASER ── */}
      <section className="bg-neutral-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
              About Joshua
            </p>
            <h2 className="text-4xl font-black text-black tracking-tight mb-6">
              Committed to Closing Deals
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed mb-8">
              With over 13 years of experience and 100+ homes sold annually, Joshua Fink is one of
              Middle Tennessee&apos;s most trusted Affiliate Brokers. A Diamond &amp; Titan Award winner
              who puts every client&apos;s goals first — and donates a portion of every commission to the
              Children&apos;s Miracle Network.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/about"
                className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-md active:scale-[0.98]"
              >
                Learn More About Joshua
              </Link>
              <a
                href="tel:6155512727"
                className="inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-black hover:text-white active:scale-[0.98]"
              >
                Call 615-551-2727
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEIGHBORHOODS ── */}
      <section className="bg-white py-20 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              Your Neighborhood Expert
            </p>
            <h2 className="text-4xl font-black text-black tracking-tight mb-4">
              Hyperlocal Insight Across Middle Tennessee
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Joshua combines on-the-ground neighborhood expertise with Compass market data to help
              buyers and sellers make smarter moves. Explore local guides for pricing trends,
              school zones, commute patterns, and where opportunity is strongest right now.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              ['franklin-tn', 'Franklin, TN'],
              ['brentwood-tn', 'Brentwood, TN'],
              ['spring-hill-tn', 'Spring Hill, TN'],
              ['nolensville-tn', 'Nolensville, TN'],
              ['thompsons-station-tn', "Thompson's Station, TN"],
              ['nashville-tn', 'Nashville, TN'],
              ['murfreesboro-tn', 'Murfreesboro, TN'],
              ['gallatin-tn', 'Gallatin, TN'],
              ['hendersonville-tn', 'Hendersonville, TN'],
              ['columbia-tn', 'Columbia, TN'],
              ['mount-juliet-tn', 'Mount Juliet, TN'],
              ['lebanon-tn', 'Lebanon, TN'],
              ['smyrna-tn', 'Smyrna, TN'],
              ['la-vergne-tn', 'La Vergne, TN'],
            ].map(([slug, label]) => (
              <Link
                key={slug}
                href={`/buy/${slug}`}
                className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-semibold text-black transition-all duration-200 hover:bg-black hover:text-white hover:border-black"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY JOSHUA ── */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
              Why Joshua Fink
            </p>
            <h2 className="text-4xl font-black tracking-tight">Proven Local Advantage</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: '13+ Years Experience',
                body: 'Joshua has navigated every market cycle in Middle Tennessee, from high-velocity seller markets to strategic buyer windows. That experience helps you make decisions with confidence from pricing through closing.',
              },
              {
                title: '100+ Homes Sold Annually',
                body: 'High volume means more real-time data and sharper negotiation instincts. Joshua sees what is actually working in today\'s market and applies it directly to your transaction.',
              },
              {
                title: 'Diamond & Titan Award Winner',
                body: 'These awards reflect consistent top-tier performance, not one good year. Clients trust Joshua for execution, communication, and results when stakes are highest.',
              },
              {
                title: 'Compass Technology Platform',
                body: 'From Compass Private Exclusives to data-driven pricing tools and modern marketing distribution, Joshua leverages best-in-class tech to position your home and attract qualified buyers faster.',
              },
              {
                title: "Children's Miracle Network Partner",
                body: 'A portion of every closing supports Children\'s Miracle Network. Your move creates meaningful local impact while you work with an agent who leads with service and integrity.',
              },
              {
                title: 'Free Same-Day Home Valuations',
                body: 'Get a no-obligation valuation based on recent comps and neighborhood-level trends. You get clear numbers quickly, so you can plan your next move without guesswork.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/15 bg-white/5 p-6">
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
