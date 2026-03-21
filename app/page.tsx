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

            <p className="text-lg sm:text-xl text-[#E8E8E8] font-medium mb-10 tracking-wide">
              Affiliate Broker &nbsp;|&nbsp; Middle Tennessee
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/listings"
                className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#E8E8E8] transition-colors"
              >
                View My Listings
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border-2 border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors"
              >
                Contact Me
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#E8E8E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#D0D0D0]">
            {stats.map((stat) => (
              <div key={stat.label} className="py-8 px-6 text-center">
                <p className="text-4xl font-black text-black mb-1">{stat.value}</p>
                <p className="text-sm text-[#6B6B6B] font-medium tracking-wide">{stat.label}</p>
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
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
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

      {/* ── ABOUT TEASER ── */}
      <section className="bg-[#F5F5F5] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
              About Joshua
            </p>
            <h2 className="text-4xl font-black text-black tracking-tight mb-6">
              Committed to Closing Deals
            </h2>
            <p className="text-lg text-[#444] leading-relaxed mb-8">
              With over 13 years of experience and 100+ homes sold annually, Joshua Fink is one of
              Middle Tennessee&apos;s most trusted Affiliate Brokers. A Diamond &amp; Titan Award winner
              who puts every client&apos;s goals first — and donates a portion of every commission to the
              Children&apos;s Miracle Network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/about"
                className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#222] transition-colors"
              >
                Learn More About Joshua
              </Link>
              <a
                href="tel:6155512727"
                className="inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-4 tracking-wide hover:bg-black hover:text-white transition-colors"
              >
                Call 615-551-2727
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
