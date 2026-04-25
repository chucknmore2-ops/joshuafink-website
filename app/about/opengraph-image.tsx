import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'About Joshua Fink — Affiliate Broker at Compass Real Estate, Middle Tennessee'

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
            Meet Your Agent
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
            joshuafink.com/about
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
              fontSize: 124,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}
          >
            Joshua Fink
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.85)',
              fontStyle: 'italic',
              lineHeight: 1.2,
            }}
          >
            Affiliate Broker · Compass Real Estate · TREC #351484
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
              <span style={{ fontSize: 38, fontWeight: 900 }}>17+</span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 2,
                }}
              >
                Years Experience
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 38, fontWeight: 900 }}>100+</span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 2,
                }}
              >
                Homes / Year
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 38, fontWeight: 900 }}>3+</span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 2,
                }}
              >
                Major Awards
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
