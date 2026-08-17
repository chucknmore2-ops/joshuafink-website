/** @type {import('next').NextConfig} */

// Content-Security-Policy in Report-Only mode. Allows what the site
// actually loads today: self, Google Tag Manager / Analytics (only
// active when NEXT_PUBLIC_GA_ID is set), Compass image CDN. Inline
// scripts/styles permitted because GA bootstraps inline and the
// schema JSON-LD blocks are inlined via dangerouslySetInnerHTML
// (those are application/ld+json, not script execution, but kept
// in the policy for clarity).
//
// After 24–48h with no real violations in Vercel logs, swap the key
// from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`
// to enforce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.compass.com https://compass.com https://www.googletagmanager.com https://www.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ')

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.compass.com',
        pathname: '/m/**',
      },
      {
        protocol: 'https',
        hostname: 'compass.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // 1901 New Bristol Ln closed 2026-08 and dropped out of lib/listings.ts,
      // so its statically-generated detail page stopped existing. The URL was
      // live and linked from social posts, so send it to the listings hub
      // (where it now appears under Recently Sold) instead of a 404.
      {
        source: '/listings/1901-new-bristol-ln-brentwood',
        destination: '/listings',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      // The two blog feeds are linked from every page's <head>, list every
      // post, and — being XML/JSON, not HTML — physically cannot carry a
      // canonical tag. Google was therefore indexing them as unlabeled
      // duplicates of /blog ("Duplicate without user-selected canonical").
      // X-Robots-Tag is the only way to canonicalize a non-HTML response.
      // Feed readers and LinkedIn are unaffected; noindex only tells Google
      // not to list the feed URL itself.
      {
        source: '/blog/rss.xml',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
      },
      {
        source: '/blog/feed.json',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: csp,
          },
        ],
      },
    ]
  },
}

export default nextConfig
