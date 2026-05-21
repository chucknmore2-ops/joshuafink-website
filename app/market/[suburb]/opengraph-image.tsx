import { ImageResponse } from 'next/og'
import { getSuburb, getAllSuburbSlugs } from '@/lib/suburbs'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'Middle Tennessee Real Estate Market Report — Joshua Fink, Compass'

export async function generateStaticParams() {
  return getAllSuburbSlugs().map((slug) => ({ suburb: slug }))
}

export default async function Image({ params }: { params: { suburb: string } }) {
  const suburb = getSuburb(params.suburb)
  const displayName = suburb?.displayName ?? 'Middle Tennessee'
  const county = suburb?.county ?? ''
  const median = suburb?.medianPrice ?? ''
  const dom = suburb?.avgDaysOnMarket
  const yoy = suburb?.yoyChange ?? ''

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
            {county || 'Middle TN'} · Market Report 2026
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

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 12,
            }}
          >
            Housing market in
          </div>
          <div
            style={{
              fontSize: displayName.length > 18 ? 88 : 108,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
            }}
          >
            {displayName}
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
            Honest numbers. No algorithm guessing.
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
            {median && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 36, fontWeight: 900 }}>{median}</span>
                <span
                  style={{
                    fontSize: 13,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)',
                    marginTop: 4,
                  }}
                >
                  Median Price
                </span>
              </div>
            )}
            {dom && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 36, fontWeight: 900 }}>{dom} days</span>
                <span
                  style={{
                    fontSize: 13,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)',
                    marginTop: 4,
                  }}
                >
                  Avg on Market
                </span>
              </div>
            )}
            {yoy && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#4ade80' }}>{yoy}</span>
                <span
                  style={{
                    fontSize: 13,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)',
                    marginTop: 4,
                  }}
                >
                  YoY Change
                </span>
              </div>
            )}
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
