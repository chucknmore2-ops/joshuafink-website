/**
 * Compass listing photo gallery extraction.
 *
 * Detail pages embed the listing's own photos on
 * window.__INITIAL_DATA__.props.listingRelation.listing.media.
 * The same HTML also includes other homes (newListingsInZip). Those must
 * not be mixed into this listing's gallery.
 *
 * Each photo is rewritten to the 2048px WebP the rest of the site already
 * uses. The set is capped so a large listing cannot bloat lib/listings.ts.
 */

export const GALLERY_CAP = 30;

const COMPASS_MEDIA =
  /https?:\/\/(?:www\.)?compass\.com\/m\/([A-Za-z0-9_-]{8,})\/[^/?#\s]+/i;

/** Canonical gallery URL, or '' when the value is not a Compass listing photo. */
export function normalizeGalleryUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const decoded = url.replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
  const match = decoded.match(COMPASS_MEDIA);
  if (!match) return '';
  return `https://www.compass.com/m/${match[1]}/2048x1536.webp`;
}

function pushUnique(urls, raw, cap) {
  const normalized = normalizeGalleryUrl(raw);
  if (!normalized || urls.includes(normalized) || urls.length >= cap) return;
  urls.push(normalized);
}

/**
 * @param {Array<{ originalUrl?: string, thumbnailUrl?: string, category?: number }> | string[] | null | undefined} media
 * @param {number} [cap]
 * @returns {string[]}
 */
export function galleryFromMedia(media, cap = GALLERY_CAP) {
  if (!Array.isArray(media) || cap <= 0) return [];
  const photos = media.filter((item) => {
    if (!item || typeof item === 'string') return true;
    return item.category === 0 || item.category === undefined || item.category === null;
  });
  const source = photos.length ? photos : media;
  const urls = [];
  for (const item of source) {
    const raw = typeof item === 'string' ? item : item?.originalUrl || item?.thumbnailUrl || '';
    pushUnique(urls, raw, cap);
    if (urls.length >= cap) break;
  }
  return urls;
}

/** Read only this listing's media array. Ignores nearby-home galleries. */
export function galleryFromInitialData(data, cap = GALLERY_CAP) {
  const media =
    data?.props?.listingRelation?.listing?.media ??
    data?.listingRelation?.listing?.media;
  return galleryFromMedia(media, cap);
}

/** Parse a saved detail-page HTML document. Returns [] if the blob is missing. */
export function galleryFromHtml(html, cap = GALLERY_CAP) {
  if (!html || typeof html !== 'string') return [];
  const match = html.match(/window\.__INITIAL_DATA__\s*=\s*(\{[\s\S]*?\})\s*;\s*<\/script>/);
  if (!match) return [];
  try {
    return galleryFromInitialData(JSON.parse(match[1]), cap);
  } catch {
    return [];
  }
}

function deduped(urls, cap) {
  const out = [];
  for (const url of urls) {
    pushUnique(out, url, cap);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Pick the gallery to store.
 * A detail scrape that comes back with 0–1 photos keeps a richer prior
 * gallery for the same Compass URL instead of wiping it. The hero image
 * stays first when it is part of the set.
 */
export function choosePhotoSet({ gallery, hero, prior, cap = GALLERY_CAP }) {
  const fresh = deduped(Array.isArray(gallery) ? gallery : [], cap);
  const priorUrls = deduped(Array.isArray(prior?.photoUrls) ? prior.photoUrls : [], cap);
  let urls = fresh.length <= 1 && priorUrls.length > fresh.length ? priorUrls : fresh;

  const heroNorm = normalizeGalleryUrl(hero);
  if (heroNorm) {
    const heroId = heroNorm.split('/m/')[1].split('/')[0];
    const idx = urls.findIndex((url) => url.includes(`/m/${heroId}/`));
    if (idx > 0) {
      const [first] = urls.splice(idx, 1);
      urls.unshift(first);
    } else if (idx === -1 && urls.length === 0) {
      urls = [heroNorm];
    }
  }

  const imageUrl = urls[0] || heroNorm || (typeof hero === 'string' ? hero : '') || '';
  return { imageUrl, photoUrls: urls.slice(0, cap) };
}
