import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Joshua Fink | Compass Real Estate — Links',
  description:
    'Joshua Fink — Compass Real Estate agent in Middle Tennessee. Get your free home value, browse listings, or connect directly.',
  robots: { index: false, follow: true },
}

const links = [
  {
    href: '/home-value',
    label: 'Get My Home Value',
    description: 'Find out what your home is worth today',
    comingSoon: true,
    primary: true,
  },
  {
    href: '/listings',
    label: 'Browse Active Listings',
    description: 'Search homes for sale across Middle Tennessee',
    comingSoon: false,
    primary: false,
  },
  {
    href: '/sell',
    label: 'Ready to Sell?',
    description: 'Free valuation · No obligation · Expert guidance',
    comingSoon: false,
    primary: false,
  },
  {
    href: '/cash-offer',
    label: 'Request a Cash Offer',
    description: 'Fast, fair cash offers. Close in as little as 7 days',
    comingSoon: false,
    primary: false,
  },
  {
    href: '/contact',
    label: 'Contact Joshua',
    description: 'Call, text, or email — he responds fast',
    comingSoon: false,
    primary: false,
  },
]

export default function LinksPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12" style={{ backgroundColor: '#0A1628' }}>
      <div className="w-full max-w-md">

        {/* Headshot */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white mb-4 shadow-xl">
            <Image
              src="/headshot.jpg"
              alt="Joshua Fink — Compass Real Estate"
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <h1 className="text-white text-xl font-black tracking-tight text-center">Joshua Fink</h1>
          <p className="text-sm mt-1 text-center" style={{ color: '#A0A0A0' }}>
            Affiliate Broker · Compass Real Estate
          </p>
          <p className="text-xs mt-1 text-center" style={{ color: '#A0A0A0' }}>
            Middle Tennessee · 13+ Years · 100+ Homes/Year
          </p>

          {/* Compass branding */}
          <div className="mt-4 flex items-center gap-2">
            <Image
              src="/compass-logo-white.png"
              alt="Compass Real Estate"
              width={100}
              height={28}
              className="object-contain opacity-80"
            />
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3 w-full">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative flex items-center justify-between w-full px-5 py-4 rounded-none border transition-all duration-200"
              style={
                link.primary
                  ? { backgroundColor: '#C41E3A', borderColor: '#C41E3A', color: '#FFFFFF' }
                  : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }
              }
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{link.label}</p>
                  {link.comingSoon && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: link.primary ? 'rgba(255,255,255,0.8)' : '#A0A0A0' }}>
                  {link.description}
                </p>
              </div>
              <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-8 pt-6 border-t flex flex-col items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <a href="tel:6155512727" className="text-sm font-semibold text-white hover:underline">
            📞 615-551-2727
          </a>
          <a href="mailto:joshua@joshuafink.com" className="text-xs hover:underline" style={{ color: '#A0A0A0' }}>
            joshua@joshuafink.com
          </a>
        </div>

      </div>
    </div>
  )
}
