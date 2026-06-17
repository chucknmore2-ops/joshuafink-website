import { ImageResponse } from 'next/og'
import { getNeighborhood, getAllNeighborhoodSlugs } from '@/lib/neighborhoods'

// Per-neighborhood Open Graph + Twitter card. Next.js auto-discovers this at
// /neighborhoods/{slug}/opengraph-image and wires the meta tags, overriding the
// site-wide default in app/opengraph-image.tsx. Neighborhood guides are the
// pages most likely to be shared into Nextdoor, local Facebook groups, and
// LinkedIn — showing the actual neighborhood name + price band in the share
// card lifts click-through versus the generic brand card.

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'Neighborhood guide — Joshua Fink | Compass Real Estate'

export async function generateStaticParams() {
  return getAllNeighborhoodSlugs().map((slug) => ({ slug }))
}

export default function Image({ params }: { params: { slug: string } }) {
  const n = getNeighborhood(params.slug)
  const name = n?.name ?? 'Middle Tennessee'
  const sub = n ? `${n.city}, ${n.schemaState} · ${n.priceBand}` : 'Neighborhood guides across Middle Tennessee'

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
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 48,
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
          Neighborhood Guide
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: name.length > 18 ? 88 : 108,
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: '-0.03em',
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255,255,255,0.78)',
              marginTop: 22,
            }}
          >
            {sub}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: 28,
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
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            615-551-2727
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
