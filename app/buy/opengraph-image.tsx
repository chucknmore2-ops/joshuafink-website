import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'Homes for Sale in Middle Tennessee — Buyer\'s Agent | Joshua Fink, Compass Real Estate'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #05101F 0%, #0A1628 45%, #000000 100%)',
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
            Middle Tennessee · For Buyers
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
            joshuafink.com/buy
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 12,
            }}
          >
            Homes for sale in
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
            }}
          >
            Middle Tennessee
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.75)',
              fontStyle: 'italic',
              marginTop: 16,
            }}
          >
            Local expert. Off-market access. Proven negotiator.
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
          <div style={{ display: 'flex', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 36, fontWeight: 900 }}>17+</span>
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 4,
                }}
              >
                Years Experience
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 36, fontWeight: 900 }}>100+</span>
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 4,
                }}
              >
                Homes / Year
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 36, fontWeight: 900 }}>$0</span>
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 4,
                }}
              >
                Cost to Buyers
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
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
