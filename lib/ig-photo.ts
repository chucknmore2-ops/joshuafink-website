// Public Instagram image cache. Meta's Graph crawler GETs
// `https://www.joshuafink.com/ig-photo/{compassPhotoId}.jpg`; we fetch the
// Compass 1200x900 JPEG once and return a cookie-free `image/jpeg` body.
//
// Not under `/api/` — robots.txt Disallow: /api/ would hide it from
// FacebookBot / facebookexternalhit.

import {
  compassJpegFromPhotoId,
  isJpegBuffer,
  normalizeCompassPhotoId,
} from './compass-photo'

const MAX_BYTES = 8 * 1024 * 1024 // Instagram's documented image cap
const MIN_BYTES = 100

export type IgPhotoLoad =
  | { ok: true; body: Uint8Array; photoId: string }
  | { ok: false; status: number; error: string }

export async function loadIgPhotoJpeg(
  rawId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<IgPhotoLoad> {
  const photoId = normalizeCompassPhotoId(rawId)
  if (!photoId) return { ok: false, status: 404, error: 'not found' }
  const source = compassJpegFromPhotoId(photoId)
  if (!source) return { ok: false, status: 404, error: 'not found' }

  let res: Response
  try {
    res = await fetchImpl(source, {
      headers: {
        Accept: 'image/jpeg,image/*;q=0.8',
        'User-Agent': 'JoshuaFinkIgPhoto/1.0 (+https://www.joshuafink.com)',
      },
      redirect: 'follow',
    })
  } catch {
    return { ok: false, status: 502, error: 'upstream fetch failed' }
  }
  if (!res.ok) {
    return { ok: false, status: 502, error: `upstream ${res.status}` }
  }

  const body = new Uint8Array(await res.arrayBuffer())
  if (body.byteLength < MIN_BYTES || body.byteLength > MAX_BYTES) {
    return { ok: false, status: 502, error: 'unexpected size' }
  }
  if (!isJpegBuffer(body)) {
    return { ok: false, status: 502, error: 'not jpeg' }
  }
  return { ok: true, body, photoId }
}

export function jpegResponseHeaders(byteLength: number): Record<string, string> {
  return {
    'Content-Type': 'image/jpeg',
    'Content-Length': String(byteLength),
    'Cache-Control':
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
  }
}
