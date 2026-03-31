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
    'Joshua Fink is a top-producing Affiliate Broker at Compass Real Estate in Middle Tennessee. 13+ years of experience, 100+ homes sold annually, Diamond & Titan Award winner.',
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
      <body className="min-h-screen flex flex-col font-inter">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'RealEstateAgent',
              name: 'Joshua Fink Group',
              description:
                'Joshua Fink is a top-producing Affiliate Broker at Compass Real Estate serving Nashville, Brentwood, Franklin, and all of Middle Tennessee. 13+ years of experience, 100+ homes sold annually.',
              url: 'https://joshuafink.com',
              telephone: '+1-615-551-2727',
              email: 'joshua@joshuafink.com',
              image: 'https://joshuafink.com/headshot.jpg',
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
              parentOrganization: {
                '@type': 'RealEstateAgent',
                name: 'Compass Real Estate',
              },
              sameAs: [
                'https://www.facebook.com/profile.php?id=100064076493905',
                'https://www.instagram.com/joshuafinkgroup',
                'https://www.linkedin.com/in/joshuafinkgroup/',
                'https://x.com/JoshuaFinkGroup',
                'https://www.compass.com/agents/joshua-fink/',
              ],
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                  ],
                  opens: '00:00',
                  closes: '23:59',
                },
              ],
              priceRange: '$$',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Joshua Fink',
              jobTitle: 'Affiliate Broker',
              worksFor: {
                '@type': 'Organization',
                name: 'Compass Real Estate',
              },
              url: 'https://joshuafink.com',
              telephone: '+1-615-551-2727',
              email: 'joshua@joshuafink.com',
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
