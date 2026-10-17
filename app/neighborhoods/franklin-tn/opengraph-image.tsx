import { ImageResponse } from 'next/og'
import { suburbs } from '@/lib/suburbs'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'Franklin, TN neighborhoods for families — Joshua Fink | Compass Real Estate'

export default function Image() {
  const median = suburbs['franklin-tn'].medianPrice

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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C41E3A' }}>
            Compass · Middle Tennessee
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
            joshuafink.com
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C41E3A', marginBottom: 24 }}>
          Franklin, TN
        </div>
        <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: 980 }}>
          Neighborhoods for families
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: 'rgba(255,255,255,0.78)', maxWidth: 900 }}>
          Schools, parks, commute, and a {median} citywide median
        </div>
      </div>
    ),
    { ...size },
  )
}
