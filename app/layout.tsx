import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Joshua Fink | Affiliate Broker | Middle Tennessee | Compass Real Estate',
    template: '%s | Joshua Fink | Compass Real Estate',
  },
  description:
    'Joshua Fink is a top-producing Affiliate Broker at Compass Real Estate in Middle Tennessee. 17+ years of experience, 100+ homes sold annually, Diamond & Titan Award winner.',
  metadataBase: new URL('https://joshuafink.com'),
  alternates: {
    canonical: '/',
  },
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
      <body className="min-h-screen flex flex-col font-inter">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'RealEstateAgent',
                  '@id': 'https://joshuafink.com/#agent',
                  name: 'Joshua Fink Group',
                  description:
                    'Joshua Fink is a top-producing Affiliate Broker at Compass Real Estate serving Nashville, Brentwood, Franklin, and all of Middle Tennessee. 17+ years of experience, 100+ homes sold annually.',
                  url: 'https://joshuafink.com',
                  telephone: '+1-615-551-2727',
                  email: 'joshua@joshuafink.com',
                  image: 'https://joshuafink.com/headshot.jpg',
                  logo: 'https://joshuafink.com/compass-logo-black.png',
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Nashville',
                    addressRegion: 'TN',
                    addressCountry: 'US',
                  },
                  areaServed: {
                    '@type': 'GeoCircle',
                    geoMidpoint: {
                      '@type': 'GeoCoordinates',
                      latitude: 36.1627,
                      longitude: -86.7816,
                    },
                    geoRadius: '48280',
                  },
                  employee: { '@id': 'https://joshuafink.com/#joshua-fink' },
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
                  priceRange: '$$',
                },
                {
                  '@type': 'Person',
                  '@id': 'https://joshuafink.com/#joshua-fink',
                  name: 'Joshua Fink',
                  jobTitle: 'Affiliate Broker',
                  worksFor: { '@id': 'https://joshuafink.com/#agent' },
                  url: 'https://joshuafink.com/about',
                  telephone: '+1-615-551-2727',
                  email: 'joshua@joshuafink.com',
                  image: 'https://joshuafink.com/headshot.jpg',
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
                  '@id': 'https://joshuafink.com/#website',
                  url: 'https://joshuafink.com',
                  name: 'Joshua Fink | Compass Real Estate',
                  description:
                    'Real estate in Middle Tennessee — listings, market insights, cash offers, and neighborhood guides.',
                  publisher: { '@id': 'https://joshuafink.com/#agent' },
                  inLanguage: 'en-US',
                },
              ],
            }),
          }}
        />
        {/* Meta Pixel: add real Pixel ID here when available */}
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
