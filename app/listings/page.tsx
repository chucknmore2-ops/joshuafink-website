import type { Metadata } from 'next'
import ListingCard from '@/components/ListingCard'
import { listings } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'Current Listings',
  description:
    'Browse Joshua Fink\'s active listings in Nashville, Brentwood, Franklin, and across Middle Tennessee. Find your next home today.',
}

export default function ListingsPage() {
  const activeCount = listings.filter(
    (l) => l.status === 'Active' || l.status.startsWith('Active') || l.status.startsWith('Open')
  ).length

  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Joshua Fink · Compass Real Estate
          </p>
          <h1 className="text-5xl font-black tracking-tight mb-4">Current Listings</h1>
          <p className="text-[#A0A0A0] text-lg">
            {activeCount} active {activeCount === 1 ? 'listing' : 'listings'} across Middle Tennessee
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.address} listing={listing} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 border border-[#E8E8E8] p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-black text-black mb-3">
            Don&apos;t see what you&apos;re looking for?
          </h2>
          <p className="text-[#6B6B6B] mb-6 max-w-lg mx-auto">
            New listings hit the market every day. Contact Joshua to get notified the moment a home
            matching your criteria becomes available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#222] transition-colors"
            >
              Contact Joshua
            </a>
            <a
              href="tel:6155512727"
              className="inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-4 tracking-wide hover:bg-black hover:text-white transition-colors"
            >
              Call 615-551-2727
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
