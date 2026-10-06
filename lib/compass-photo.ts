// Compass listing photos are stored as WebP (`…/2048x1536.webp` on live
// inventory, `…/480x320.webp` on sold). Google Business rejects WebP, and
// Instagram's Graph API documents JPEG only. Feeding the raw WebP is
// what left Instagram containers IN_PROGRESS past the poll window on
// 2026-08-26 and 2026-09-09 (same creationId across all three GHA retries).
//
// Compass's CDN serves the same asset as JPEG when size+ext are swapped
// (verified 2026-08-13 against both URL hash shapes, re-checked 2026-09-09
// on a live 2048px listing: 1200x900.jpg returns image/jpeg ~215KB vs
// ~539KB WebP). 1200x900 stays above GBP's 720px minimum and inside IG's
// recommended 1080-wide feed size.
//
// Instagram still stalled on those Compass JPEGs (2026-09-16 and 2026-09-17:
// Meta accepted the container, status_code stayed IN_PROGRESS past 110s, and
// a second home's Compass JPEG stalled the same way). Graph `image_url` is
// fetched by Meta's crawler, not by us. Compass's CloudFront response also
// sets deployment cookies and `Vary: Origin`, which is more than Instagram
// needs. `/ig-photo/{id}.jpg` fetches that JPEG once and serves a plain
// `Content-Type: image/jpeg` body from https://www.joshuafink.com.

const SITE = 'https://www.joshuafink.com'

const COMPASS_WEBP =
  /^(https:\/\/(?:www\.)?compass\.com\/m\/[^/?#]+)\/\d+x\d+\.webp$/i

const COMPASS_MEDIA =
  /^https:\/\/(?:www\.)?compass\.com\/m\/([^/?#]+)\/[^/?#]+$/i

/** Convert a Compass WebP listing photo to a publicly-fetchable JPEG. */
export function compassJpegUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined
  const m = imageUrl.match(COMPASS_WEBP)
  return m ? `${m[1]}/1200x900.jpg` : undefined
}

/** Compass CDN object id (`/m/{id}/…`). Undefined when the URL is not Compass. */
export function compassPhotoId(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined
  const m = imageUrl.match(COMPASS_MEDIA)
  return m?.[1]
}

/**
 * Compass photo ids are hex (live) or hex + `_img_…` (sold). Reject anything
 * that could turn `/ig-photo/{id}` into an open proxy.
 */
export function isSafeCompassPhotoId(id: string): boolean {
  if (
    !id ||
    id.includes('..') ||
    id.includes('/') ||
    id.includes('\\') ||
    id.includes('%')
  ) {
    return false
  }
  return /^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(id)
}

/** Strip an optional `.jpg` / `.jpeg` suffix, then validate. */
export function normalizeCompassPhotoId(raw: string): string | undefined {
  let id = raw
  try {
    id = decodeURIComponent(raw)
  } catch {
    return undefined
  }
  id = id.replace(/\.jpe?g$/i, '')
  return isSafeCompassPhotoId(id) ? id : undefined
}

/** Upstream Compass JPEG that `/ig-photo/{id}.jpg` should fetch. */
export function compassJpegFromPhotoId(id: string): string | undefined {
  const clean = normalizeCompassPhotoId(id)
  return clean ? `https://www.compass.com/m/${clean}/1200x900.jpg` : undefined
}

/**
 * URL Meta should fetch for Instagram. Compass photos are rewritten to
 * `https://www.joshuafink.com/ig-photo/{id}.jpg` (JPEG, cookies stripped).
 * Site-relative paths become absolute on joshuafink.com. Anything else is
 * passed through after the WebP→JPEG swap.
 */
export function instagramImageUrl(
  imageUrl: string,
  origin: string = SITE,
): string {
  const id = compassPhotoId(imageUrl)
  if (id && isSafeCompassPhotoId(id)) {
    return `${origin.replace(/\/$/, '')}/ig-photo/${id}.jpg`
  }
  if (imageUrl.startsWith('/')) {
    return `${origin.replace(/\/$/, '')}${imageUrl}`
  }
  return compassJpegUrl(imageUrl) ?? imageUrl
}

/** SOI marker — Instagram rejects non-JPEG even when Content-Type claims jpeg. */
export function isJpegBuffer(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}
