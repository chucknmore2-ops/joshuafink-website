import { ImageResponse } from 'next/og'
import { parsePairSlug, getAllPairSlugsForBuild } from '@/lib/compare'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'Middle Tennessee Suburb Comparison — Joshua Fink, Compass'

export async function generateStaticParams() {
  return getAllPairSlugsForBuild().map((pair) => ({ pair }))
}

export default async function Image({ params }: { params: { pair: string } }) {
  const p = parsePairSlug(params.pair)
  const aName = p?.a.name ?? 'Suburb A'
  const bName = p?.b.name ?? 'Suburb B'
  const aMedian = p?.a.medianPrice ?? ''
  const bMedian = p?.b.medianPrice ?? ''

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
            marginBottom: 36,
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
            Head-to-Head · Middle TN
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
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 48,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
            <span style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {aName}
            </span>
            {aMedian && (
              <span style={{ fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
                {aMedian}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              fontStyle: 'italic',
              color: '#C41E3A',
            }}
          >
            vs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
            <span style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {bName}
            </span>
            {bMedian && (
              <span style={{ fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
                {bMedian}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            Which suburb is right for you?
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
