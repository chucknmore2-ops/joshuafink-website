// Compass listing photos are stored as WebP (`…/2048x1536.webp` on live
// inventory, `…/480x320.webp` on sold). Google Business rejects WebP, and
// Instagram's Graph API documents JPEG/PNG only. Feeding the raw WebP is
// what left Instagram containers IN_PROGRESS past the poll window on
// 2026-08-26 and 2026-09-09 (same creationId across all three GHA retries).
//
// Compass's CDN serves the same asset as JPEG when size+ext are swapped
// (verified 2026-08-13 against both URL hash shapes, re-checked 2026-09-09
// on a live 2048px listing: 1200x900.jpg returns image/jpeg ~215KB vs
// ~539KB WebP). 1200x900 stays above GBP's 720px minimum and inside IG's
// recommended 1080-wide feed size.

const COMPASS_WEBP =
  /^(https:\/\/(?:www\.)?compass\.com\/m\/[^/?#]+)\/\d+x\d+\.webp$/i

/** Convert a Compass WebP listing photo to a publicly-fetchable JPEG. */
export function compassJpegUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined
  const m = imageUrl.match(COMPASS_WEBP)
  return m ? `${m[1]}/1200x900.jpg` : undefined
}

/** Instagram always needs a URL — convert Compass WebP, otherwise pass through. */
export function instagramImageUrl(imageUrl: string): string {
  return compassJpegUrl(imageUrl) ?? imageUrl
}
