import { ImageResponse } from 'next/og'
import { getSchool, getAllSchoolSlugs, getSchoolSuburb } from '@/lib/schools'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'Homes Near Top Middle Tennessee Schools — Joshua Fink, Compass'

export async function generateStaticParams() {
  return getAllSchoolSlugs().map((school) => ({ school }))
}

export default async function Image({ params }: { params: { school: string } }) {
  const s = getSchool(params.school)
  const name = s?.name ?? 'Top Middle Tennessee Schools'
  const district = s?.district ?? ''
  const suburb = s ? getSchoolSuburb(s) : undefined
  const median = suburb?.medianPrice ?? ''

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
            {district || 'Middle TN'} · School Zone
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
            Homes for sale near
          </div>
          <div
            style={{
              fontSize: name.length > 24 ? 64 : 80,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.75)',
              fontStyle: 'italic',
              marginTop: 16,
            }}
          >
            School-zone-first home search. Zoning verified before every tour.
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
          <div>
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
                  Suburb Median
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
