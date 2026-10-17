import type { Metadata } from 'next'
import { Suspense } from 'react'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileCallCTA from '@/components/MobileCallCTA'
import AttributionCapture from '@/components/AttributionCapture'
import { siteJsonLdGraph } from '@/lib/agent-profile'

// Self-hosted latin variable fonts. next/font/google fetches
// fonts.googleapis.com during `next build` and then assumes every file URL
// ends in .woff2 (`/\.(woff|woff2|eot|ttf|otf)$/.exec(url)[1]`). When Google
// returns a URL that does not, the loader throws
// `Cannot read properties of null (reading '1')` and the required build
// check fails — which is what blocked the Oct 2 and Oct 3 listing syncs.
// These files are the same latin subsets that request asked for (Inter
// wght 300–900, Playfair Display roman + italic wght 400–900), so
// --font-inter / --font-display and the public type stay the same, with
// no Google Fonts request at build time.
const inter = localFont({
  src: './fonts/inter-latin.woff2',
  weight: '300 900',
  style: 'normal',
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const playfair = localFont({
  src: [
    {
      path: './fonts/playfair-display-latin.woff2',
      weight: '400 900',
      style: 'normal',
    },
    {
      path: './fonts/playfair-display-latin-italic.woff2',
      weight: '400 900',
      style: 'italic',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

export const metadata: Metadata = {
  title: {
    default: 'Joshua Fink | Affiliate Broker | Middle Tennessee | Compass Real Estate',
    template: '%s | Joshua Fink | Compass Real Estate',
  },
  description:
    'Top-rated Compass agent in Middle Tennessee — Franklin, Brentwood, Spring Hill, Nashville. Licensed since 2008, 40+ homes a year in Middle Tennessee, 5★ from 218+ clients. Diamond & Titan Award winner. Free valuation, off-market access.',
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
  // X/Twitter Card. `card` + handles are all that's needed here: Next inherits
  // title/description from the metadata above and the image from each route's
  // opengraph-image.tsx, so every shared link renders a branded large-image card.
  twitter: {
    card: 'summary_large_image',
    site: '@JoshuaFinkGroup',
    creator: '@JoshuaFinkGroup',
  },
  alternates: {
    // NOTE: intentionally NO default `canonical` here. A root-level
    // canonical: '/' is inherited by every child page that doesn't set its
    // own, silently pointing them all at the homepage ("alternate page with
    // proper canonical tag" in Search Console → they never rank). Each page
    // sets its own self-referential canonical instead; the homepage sets its
    // canonical in app/page.tsx.
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLdGraph()) }}
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
        <Suspense fallback={null}>
          <AttributionCapture />
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
