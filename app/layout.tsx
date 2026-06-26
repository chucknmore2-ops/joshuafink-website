import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileCallCTA from '@/components/MobileCallCTA'
import { reviews, reviewStats } from '@/lib/reviews'

// Self-host Google Fonts via next/font — eliminates the render-blocking
// CSS @import, preloads the required subsets, and exposes CSS variables
// (--font-inter, --font-display) consumed by tailwind.config.ts.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Joshua Fink | Affiliate Broker | Middle Tennessee | Compass Real Estate',
    template: '%s | Joshua Fink | Compass Real Estate',
  },
  description:
    'Top-rated Compass agent in Middle Tennessee — Franklin, Brentwood, Spring Hill, Nashville. 17+ years, 100+ homes sold annually, 5★ from 218+ clients. Diamond & Titan Award winner. Free valuation, off-market access.',
  metadataBase: new URL('https://www.joshuafink.com'),
  keywords: [
    'Joshua Fink',
    'Compass Real Estate',
    'Middle Tennessee realtor',
    'Nashville real estate agent',
    'Brentwood TN homes',
    'buy home Nashville',
    'sell home Nashville',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Joshua Fink | Compass Real Estate',
  },
  alternates: {
    canonical: '/',
    types: {
      // RSS autodiscovery — lets Feedly / NetNewsWire / LinkedIn RSS
      // feeders find /blog/rss.xml without a manual pointer.
      'application/rss+xml': '/blog/rss.xml',
      // JSON Feed v1.1 — modern alternative spec used by Feedbin, Reeder,
      // NetNewsWire. Same posts as RSS, JSON-native parse path.
      'application/feed+json': '/blog/feed.json',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Google Analytics — only renders when NEXT_PUBLIC_GA_ID matches the
            GA4 measurement ID pattern (G-XXXXXXXXXX). Hard-fails any malformed
            or hostile value before it reaches dangerouslySetInnerHTML. */}
        {(() => {
          const gaId = process.env.NEXT_PUBLIC_GA_ID
          if (!gaId || !/^G-[A-Z0-9]{4,20}$/.test(gaId)) return null
          return (
            <>
              <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
              <script
                dangerouslySetInnerHTML={{
                  __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
                }}
              />
            </>
          )
        })()}
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'RealEstateAgent',
                  '@id': 'https://www.joshuafink.com/#agent',
                  name: 'Joshua Fink Group',
                  description:
                    'Joshua Fink is a top-producing Affiliate Broker at Compass Real Estate serving Nashville, Brentwood, Franklin, and all of Middle Tennessee. 17+ years of experience, 100+ homes sold annually.',
                  url: 'https://www.joshuafink.com',
                  telephone: '+1-615-551-2727',
                  email: 'joshua@joshuafink.com',
                  image: 'https://www.joshuafink.com/headshot.webp',
                  logo: 'https://www.joshuafink.com/compass-logo-black.png',
                  // Compass office NAP (Joshua Fink Group). RealEstateAgent is a
                  // LocalBusiness subtype, so a complete street address here gives
                  // Google the full NAP for map-pack eligibility — must stay
                  // consistent with the Google Business Profile + Compass listing.
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: '8119 Isabella Lane, Suite 105',
                    addressLocality: 'Brentwood',
                    addressRegion: 'TN',
                    postalCode: '37027',
                    addressCountry: 'US',
                  },
                  // Approximate office coordinates (Maryland Farms / Cool Springs
                  // area of Brentwood) — verify against the exact pin if needed.
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 36.0234,
                    longitude: -86.7838,
                  },
                  hasMap:
                    'https://www.google.com/maps/search/?api=1&query=8119+Isabella+Lane+Suite+105+Brentwood+TN+37027',
                  areaServed: [
                    { '@type': 'City', name: 'Franklin, TN' },
                    { '@type': 'City', name: 'Brentwood, TN' },
                    { '@type': 'City', name: 'Spring Hill, TN' },
                    { '@type': 'City', name: 'Nolensville, TN' },
                    { '@type': 'City', name: "Thompson's Station, TN" },
                    { '@type': 'City', name: 'Nashville, TN' },
                    { '@type': 'City', name: 'Murfreesboro, TN' },
                    { '@type': 'City', name: 'Gallatin, TN' },
                    { '@type': 'City', name: 'Hendersonville, TN' },
                    { '@type': 'City', name: 'Columbia, TN' },
                    { '@type': 'City', name: 'Mount Juliet, TN' },
                    { '@type': 'City', name: 'Lebanon, TN' },
                    { '@type': 'City', name: 'Smyrna, TN' },
                    { '@type': 'City', name: 'La Vergne, TN' },
                  ],
                  employee: { '@id': 'https://www.joshuafink.com/#joshua-fink' },
                  parentOrganization: {
                    '@type': 'RealEstateAgent',
                    name: 'Compass Real Estate',
                    url: 'https://www.compass.com',
                  },
                  sameAs: [
                    'https://www.facebook.com/profile.php?id=100064076493905',
                    'https://www.instagram.com/joshuafinkgroup',
                    'https://www.linkedin.com/in/joshuafinkgroup/',
                    'https://x.com/JoshuaFinkGroup',
                    'https://www.compass.com/agents/joshua-fink/',
                    'https://www.zillow.com/profile/JoshuaFinkGroup',
                  ],
                  priceRange: '$300000-$2500000',
                  // AggregateRating sourced from Joshua's Zillow review profile
                  // (218 reviews, 5.0 average as of latest sync). The reviewCount
                  // includes off-site reviews collected on Zillow over 17+ years
                  // of practice. Update lib/reviews.ts → reviewStats when the
                  // Zillow total moves.
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: reviewStats.rating.toFixed(1),
                    reviewCount: reviewStats.total,
                    bestRating: '5',
                    worstRating: '1',
                  },
                  // Surface up to 10 verbatim reviews so Google can pull stars +
                  // review excerpts into the SERP knowledge panel. Full review
                  // text + author lives on /reviews; we only emit excerpts here
                  // to keep the JSON-LD payload reasonable.
                  review: reviews.map((r) => ({
                    '@type': 'Review',
                    reviewRating: {
                      '@type': 'Rating',
                      ratingValue: r.rating,
                      bestRating: 5,
                    },
                    author: { '@type': 'Person', name: r.reviewer },
                    datePublished: r.date,
                    reviewBody: r.text,
                    itemReviewed: { '@id': 'https://www.joshuafink.com/#agent' },
                  })),
                },
                {
                  '@type': 'Person',
                  '@id': 'https://www.joshuafink.com/#joshua-fink',
                  name: 'Joshua Fink',
                  jobTitle: 'Affiliate Broker',
                  worksFor: { '@id': 'https://www.joshuafink.com/#agent' },
                  url: 'https://www.joshuafink.com/about',
                  telephone: '+1-615-551-2727',
                  email: 'joshua@joshuafink.com',
                  image: 'https://www.joshuafink.com/headshot.webp',
                  hasCredential: [
                    {
                      '@type': 'EducationalOccupationalCredential',
                      name: 'Tennessee Real Estate Commission — Affiliate Broker License',
                      credentialCategory: 'license',
                      recognizedBy: {
                        '@type': 'GovernmentOrganization',
                        name: 'Tennessee Real Estate Commission',
                        url: 'https://www.tn.gov/commerce/regboards/trec.html',
                      },
                    },
                  ],
                  award: ['Compass Diamond Award', 'Compass Titan Award'],
                  knowsAbout: [
                    'Real Estate',
                    'Nashville Real Estate Market',
                    'Middle Tennessee Properties',
                    'Investment Properties',
                    'Fix and Flip',
                    'Home Buying',
                    'Home Selling',
                  ],
                  sameAs: [
                    'https://www.facebook.com/profile.php?id=100064076493905',
                    'https://www.instagram.com/joshuafinkgroup',
                    'https://www.linkedin.com/in/joshuafinkgroup/',
                    'https://x.com/JoshuaFinkGroup',
                    'https://www.compass.com/agents/joshua-fink/',
                    'https://www.zillow.com/profile/JoshuaFinkGroup',
                  ],
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.joshuafink.com/#website',
                  url: 'https://www.joshuafink.com',
                  name: 'Joshua Fink | Compass Real Estate',
                  description:
                    'Real estate in Middle Tennessee — listings, market insights, cash offers, and neighborhood guides.',
                  publisher: { '@id': 'https://www.joshuafink.com/#agent' },
                  inLanguage: 'en-US',
                },
              ],
            }),
          }}
        />
        {/* Meta Pixel: add real Pixel ID here when available */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:rounded-sm focus:shadow-lg focus:outline focus:outline-2 focus:outline-[#C41E3A]"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 pt-16 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileCallCTA />
      </body>
    </html>
  )
}
