import { ImageResponse } from 'next/og'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'

// Per-post Open Graph + Twitter image. Next.js auto-discovers this at
// /blog/{slug}/opengraph-image and wires the meta tags. Replaces the previous
// no-image OG card so LinkedIn / Facebook / X auto-shares (and Joshua's
// Thursday LinkedIn auto-poster) get a branded preview.

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'Joshua Fink | Compass Real Estate — Middle Tennessee'

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export default async function Image({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  const title = post?.title ?? 'Joshua Fink | Compass Real Estate'
  const category = post?.category
  const date = post?.date

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0A1628 0%, #000000 60%, #1a0a14 100%)',
          color: '#fff',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Top bar — brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 56,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: '#C41E3A',
            }}
          >
            Compass · Middle Tennessee
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            joshuafink.com
          </div>
        </div>

        {/* Category pill (if present) */}
        {category && (
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#C41E3A',
              border: '2px solid #C41E3A',
              padding: '8px 18px',
              borderRadius: 999,
              marginBottom: 28,
            }}
          >
            {category}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            fontSize: title.length > 80 ? 56 : title.length > 50 ? 68 : 78,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        {/* Footer — author + date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.01em' }}>
              Joshua Fink
            </div>
            <div
              style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 6,
                letterSpacing: '0.08em',
              }}
            >
              Affiliate Broker · 17+ years · 100+ homes/year
            </div>
          </div>
          {date && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {date}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  )
}
