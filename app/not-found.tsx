import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description:
    "The page you're looking for isn't here — but Joshua Fink can still help. Browse current listings, request a cash offer, or get in touch.",
  robots: { index: false, follow: false },
}

const destinations = [
  {
    href: '/listings',
    label: 'Active & Sold Listings',
    desc: 'Current homes for sale plus recently sold across Middle Tennessee.',
  },
  {
    href: '/blog',
    label: 'Market Insights',
    desc: 'Buyer + seller guides, neighborhood deep-dives, and Nashville market reports.',
  },
  {
    href: '/cash-offer',
    label: 'Cash Offer in 24 Hours',
    desc: 'Sell any condition home fast — no fees, no commissions, close in 7 days.',
  },
  {
    href: '/about',
    label: 'About Joshua',
    desc: '17+ years of experience, 100+ homes sold annually, Diamond & Titan Award winner.',
  },
  {
    href: '/contact',
    label: 'Contact',
    desc: 'Call 615-551-2727, email, or send a message — Joshua personally responds.',
  },
]

export default function NotFound() {
  return (
    <div className="bg-white">
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-3">
            404 · Not Found
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
            This listing is off-market.
          </h1>
          <p className="text-[#A0A0A0] text-lg max-w-2xl">
            The page you&apos;re looking for has moved or doesn&apos;t exist — but
            Joshua Fink can still help. Pick up where you left off below, or
            head back to the homepage.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-block bg-[#C41E3A] text-white text-sm font-bold px-6 py-3 tracking-wide hover:bg-[#A41830] transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/contact"
              className="inline-block border border-white text-white text-sm font-bold px-6 py-3 tracking-wide hover:bg-white hover:text-black transition-colors"
            >
              Contact Joshua
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
          Or try one of these
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <Link
              key={dest.href}
              href={dest.href}
              className="group block border border-[#E8E8E8] p-6 hover:border-black transition-colors"
            >
              <p className="text-base font-bold text-black mb-2 group-hover:text-[#C41E3A] transition-colors">
                {dest.label} →
              </p>
              <p className="text-sm text-[#666] leading-relaxed">{dest.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
