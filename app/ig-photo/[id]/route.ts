import { NextResponse } from 'next/server'
import { jpegResponseHeaders, loadIgPhotoJpeg } from '@/lib/ig-photo'

export const runtime = 'nodejs'
// Cache at the CDN after the first Compass fetch so Meta's crawler hits a
// static JPEG instead of waiting on CloudFront cookies / origin latency.
export const revalidate = 86400

type RouteCtx = { params: { id: string } }

export async function GET(_request: Request, { params }: RouteCtx) {
  const loaded = await loadIgPhotoJpeg(params.id)
  if (!loaded.ok) {
    return new NextResponse(loaded.error, {
      status: loaded.status,
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }
  return new NextResponse(Buffer.from(loaded.body), {
    status: 200,
    headers: jpegResponseHeaders(loaded.body.byteLength),
  })
}

export async function HEAD(request: Request, ctx: RouteCtx) {
  const res = await GET(request, ctx)
  return new NextResponse(null, { status: res.status, headers: res.headers })
}
