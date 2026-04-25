import { ImageResponse } from 'next/og'
import { reviewStats } from '@/lib/reviews'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = `Client Reviews — ${reviewStats.total} Five-Star Reviews | Joshua Fink, Compass Real Estate Nashville`

export default async function Image() {
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
            Verified Zillow Reviews
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
            joshuafink.com/reviews
          </div>
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
              fontSize: 56,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 12,
              letterSpacing: '0.04em',
            }}
          >
            ★ ★ ★ ★ ★
          </div>
          <div
            style={{
              fontSize: 124,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            {reviewStats.total}+ Five-Star Reviews
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.85)',
              fontStyle: 'italic',
              lineHeight: 1.25,
            }}
          >
            "Going above and beyond is what Josh does."
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          <div style={{ display: 'flex', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 38, fontWeight: 900 }}>
                {reviewStats.rating.toFixed(1)} / 5
              </span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 2,
                }}
              >
                Average Rating
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 38, fontWeight: 900 }}>Zillow</span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 2,
                }}
              >
                Verified Source
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.18em',
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
