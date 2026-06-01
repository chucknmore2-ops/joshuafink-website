import type { Metadata } from 'next'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import CinematicHero from '@/components/CinematicHero'
import { heroSlides } from '@/lib/hero-slides'
import { listings as featuredListings } from '@/lib/listings'
import { buildListingItemList } from '@/lib/listing-schema'

export const metadata: Metadata = {
  title: 'Joshua Fink | Top Realtor in Middle Tennessee | Compass Real Estate',
  description:
    'Top-rated Compass agent serving Franklin, Brentwood, Spring Hill, Nashville, and all of Middle Tennessee. 17+ years, 100+ homes sold annually, 5★ rating from 218+ clients. Free valuation and off-market listing access.',
}

const stats = [
  { value: '17+', label: 'Years Experience' },
  { value: '100+', label: 'Homes Sold Annually' },
  { value: '★', label: 'Diamond & Titan Award Winner' },
]

export default function HomePage() {
  const featuredItemList = buildListingItemList(
    featuredListings,
    'Featured Homes — Joshua Fink, Compass Real Estate'
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featuredItemList) }}
      />
      {/* ── HERO ── cinematic, curated showcase deck (decoupled from active listings) */}
      <CinematicHero slides={heroSlides} />

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
              <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight">
                Featured <span className="font-display italic font-semibold">Homes</span>
              </h2>
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
                Find Out What Your<br />
                <span className="font-display italic font-semibold">Home Is Worth.</span>
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
            <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-6">
              Committed to <span className="font-display italic font-semibold">Closing Deals</span>
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed mb-8">
              With over 17 years of experience and 100+ homes sold annually, Joshua Fink is one of
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
            <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-4">
              Hyperlocal Insight Across{' '}
              <span className="font-display italic font-semibold">Middle Tennessee</span>
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
              <div
                key={slug}
                className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm"
              >
                <Link
                  href={`/buy/${slug}`}
                  className="block font-semibold text-black hover:underline"
                >
                  {label}
                </Link>
                <Link
                  href="/neighborhoods"
                  className="mt-1 block text-xs text-neutral-500 hover:text-black"
                >
                  Neighborhood guides →
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-neutral-200">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
              Featured Neighborhood Guides
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                ['westhaven-franklin-tn', 'Westhaven (Franklin)'],
                ['mckays-mill-franklin-tn', "McKay's Mill (Franklin)"],
                ['fieldstone-farms-franklin-tn', 'Fieldstone Farms (Franklin)'],
                ['berry-farms-franklin-tn', 'Berry Farms (Franklin)'],
                ['highlands-at-ladd-park-franklin-tn', 'The Highlands at Ladd Park (Franklin)'],
                ['governors-club-brentwood-tn', 'Governors Club (Brentwood)'],
                ['annandale-brentwood-tn', 'Annandale (Brentwood)'],
                ['raintree-forest-brentwood-tn', 'Raintree Forest (Brentwood)'],
                ['burberry-glen-nolensville-tn', 'Burberry Glen (Nolensville)'],
                ['bent-creek-nolensville-tn', 'Bent Creek (Nolensville)'],
                ['tollgate-village-thompsons-station-tn', "Tollgate Village (Thompson's Station)"],
              ].map(([slug, label]) => (
                <Link
                  key={slug}
                  href={`/neighborhoods/${slug}`}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white hover:border-black"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/neighborhoods"
                className="rounded-full border border-black bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-black"
              >
                All neighborhood guides →
              </Link>
            </div>
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
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Proven <span className="font-display italic font-semibold">Local Advantage</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: '17+ Years Experience',
                body: 'Since 2008, Joshua has navigated every market cycle Middle Tennessee has thrown at buyers and sellers—from the post-recession recovery through the 2021-2022 bidding war frenzy to today\'s normalized market. That experience means he knows when to push, when to wait, and how to structure offers that win without overpaying. Over 1,000+ transactions closed across Davidson, Williamson, Maury, Rutherford, and Sumner counties. Every deal teaches something, and Joshua has 17+ years of lessons working directly for your outcome.',
              },
              {
                title: '100+ Homes Sold Annually',
                body: 'Volume matters because it means Joshua is in the market every single day, not occasionally. He sees new inventory before it hits Zillow, knows which neighborhoods are heating up before broad reports confirm it, and has relationships with listing agents across Middle Tennessee that translate into better access and stronger negotiations for his clients. High volume also means a proven operating system: professional photography, strategic pricing, aggressive marketing distribution, disciplined follow-up, and consistent outcomes for both sellers and buyers.',
              },
              {
                title: 'Diamond & Titan Award Winner',
                body: 'These aren\'t participation trophies. The Diamond and Titan Awards recognize top-performing agents in the Compass network based on closed volume and client satisfaction. Fewer than 5% of agents earn these distinctions. For buyers and sellers, working with an award-winning agent means you\'re getting someone whose track record has been independently validated, not self-reported. Results matter when real money is on the line, and Joshua\'s production, consistency, and client outcomes place him among the strongest-performing agents in Tennessee.',
              },
              {
                title: 'Compass Technology Platform',
                body: 'Compass isn\'t just a brokerage, it\'s a technology company. Joshua\'s clients get access to Compass Coming Soon for pre-market listings before MLS exposure, Compass Concierge for fronted funds on strategic home improvements before selling, and AI-powered market analytics that surface pricing opportunities many agents miss. The Compass network spans 30,000+ agents nationwide, giving Joshua\'s listings visibility to qualified buyers relocating from major metros across the country. That blend of platform, reach, and execution creates a measurable edge.',
              },
              {
                title: "Children's Miracle Network Partner",
                body: 'Joshua donates a portion of every commission to the Children\'s Miracle Network, supporting Vanderbilt Children\'s Hospital right here in Nashville. Since partnering with CMN, he\'s helped fund critical pediatric care, medical equipment, and research that supports families throughout Middle Tennessee. This isn\'t a marketing gimmick or one-time campaign; it\'s an ongoing commitment built into how he does business. When you work with Joshua, your transaction does more than close a deal, it contributes directly to children\'s healthcare in your local community.',
              },
              {
                title: 'Free Same-Day Home Valuations',
                body: 'No algorithms. No Zestimate guesswork. Joshua pulls actual sold comps within roughly a half-mile of your address, then adjusts for condition, lot size, school zone, upgrades, and recent market shifts to deliver a defensible number you can make real decisions with—usually within a few hours. Whether you\'re considering selling next week or next year, understanding your home\'s true market value is the foundation for timing, pricing, and planning. It\'s free, same-day in most cases, and comes with zero obligation.',
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
