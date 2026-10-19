/**
 * Shared helpers for Compass sync scripts.
 * Load prior listings from the generated TS files and match them by
 * normalized Compass URL so a failed detail scrape can salvage known-good data
 * instead of silently dropping a live listing.
 */

import fs from 'fs';

/** Strip query/hash and trailing slashes so the same Compass home matches. */
export function normalizeCompassUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed);
    u.hash = '';
    u.search = '';
    const pathname = u.pathname.replace(/\/+$/, '');
    return `${u.origin}${pathname}`.toLowerCase();
  } catch {
    return trimmed.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
  }
}

/**
 * Parse `export const <exportName> = [ ... ];` from a generated listings TS
 * file into a Map keyed by normalizeCompassUrl(compassUrl).
 * Does not invent listings — returns only what is already on disk.
 */
export function loadExistingListingsMap(filePath, exportName = 'listings') {
  const map = new Map();
  if (!filePath || !fs.existsSync(filePath)) return map;
  const src = fs.readFileSync(filePath, 'utf8');
  const re = new RegExp(
    `export const ${exportName}(?:: [^=]+)? = (\\[[\\s\\S]*?\\n\\]);`,
  );
  const match = src.match(re);
  if (!match) return map;
  const arraySrc = match[1].replace(/\blistingsSyncedAt\b/g, 'undefined');
  let parsed;
  try {
    parsed = Function(`"use strict"; return (${arraySrc})`)();
  } catch {
    console.warn(`[listings-file] Could not parse ${exportName} from ${filePath}`);
    return map;
  }
  if (!Array.isArray(parsed)) return map;
  for (const listing of parsed) {
    if (!listing || typeof listing !== 'object') continue;
    const key = normalizeCompassUrl(listing.compassUrl);
    if (key) map.set(key, listing);
  }
  return map;
}

/** True when a freshly scraped listing is too incomplete to write. */
export function isUnusableScrapedListing(listing) {
  const address = typeof listing?.address === 'string' ? listing.address.trim() : '';
  const price = Number(listing?.price);
  return !address || !Number.isFinite(price) || price <= 0;
}

/** Prior known-good entry for this Compass URL, or null. Never invents data. */
export function salvagePriorListing(priorByUrl, compassUrl) {
  const key = normalizeCompassUrl(compassUrl);
  if (!key || !priorByUrl) return null;
  const prior = priorByUrl.get(key);
  if (!prior) return null;
  return { ...prior };
}

/**
 * Keep the first sync that saw this home. A new Compass URL gets this
 * sync's timestamp. Not a list date.
 */
export function firstSeenForListing(prior, syncTimestamp) {
  const seen = prior && typeof prior.firstSeen === 'string' ? prior.firstSeen.trim() : '';
  if (seen && !Number.isNaN(Date.parse(seen))) return seen;
  return syncTimestamp;
}

const LISTING_CONTENT_FIELDS = [
  'address',
  'city',
  'price',
  'beds',
  'baths',
  'sqft',
  'acres',
  'status',
  'note',
  'imageUrl',
  'openHouse',
];

/** Public fields that change the listing page. Ignores sync bookkeeping. */
function listingContentToken(listing) {
  if (!listing || typeof listing !== 'object') return '';
  const fields = LISTING_CONTENT_FIELDS.map((key) => {
    const value = listing[key];
    if (value === undefined || value === null || value === '') return '';
    return String(value);
  });
  const photos = Array.isArray(listing.photoUrls) ? listing.photoUrls : [];
  return JSON.stringify([...fields, photos]);
}

export function listingContentChanged(prior, listing) {
  if (!prior) return true;
  return listingContentToken(prior) !== listingContentToken(listing);
}

/**
 * When this listing's public fields last changed.
 * A new listing omits the field — firstSeen is that date.
 * An unchanged listing keeps a prior contentUpdated and does not inherit
 * the shared sync clock. A real field change is stamped with this sync.
 * Returns undefined when there is nothing new to write.
 */
export function contentUpdatedForListing(prior, listing, syncTimestamp) {
  if (!prior) return undefined;
  if (!listingContentChanged(prior, listing)) {
    const kept = typeof prior.contentUpdated === 'string' ? prior.contentUpdated.trim() : '';
    if (kept && !Number.isNaN(Date.parse(kept))) return kept;
    return undefined;
  }
  return syncTimestamp;
}

/**
 * Open-house line from a Compass card, or '' when the card doesn't say so.
 * Does not invent a date or time.
 */
export function openHouseFromCardText(cardText) {
  if (!cardText || typeof cardText !== 'string') return '';
  const line = cardText
    .split('\n')
    .map((s) => s.trim())
    .find((s) => /open\s*house/i.test(s));
  if (!line) return '';
  return line.replace(/\s+/g, ' ').trim();
}

/**
 * After the scrape loop: write only when every agent-page card resolved
 * (fresh scrape or salvage) and there is at least one listing.
 * Unresolved cards fail the job without writing so yesterday's file stays live.
 * Zero cards / nothing resolved keeps the existing file (exit 0).
 */
/**
 * True when two generated listing files differ only by the sync clock.
 * A daily Compass check that finds the same inventory should not commit,
 * because that commit is a production deploy and it also moves every
 * listing's lastVerified (they all reference listingsSyncedAt).
 */
export function stripListingTimestamp(source) {
  return String(source)
    .replace(/Last synced: .*/g, 'Last synced: TIMESTAMP')
    .replace(/listingsSyncedAt = "[^"]*"/g, 'listingsSyncedAt = "TIMESTAMP"');
}

export function listingSyncIsTimestampOnly(before, after) {
  return stripListingTimestamp(before) === stripListingTimestamp(after);
}

export function decideFetchImagesWrite({ resolvedCount, unresolvedCount }) {
  if (unresolvedCount > 0) {
    return { write: false, exitCode: 1, reason: 'unresolved-cards' };
  }
  if (resolvedCount === 0) {
    return { write: false, exitCode: 0, reason: 'empty-scrape' };
  }
  return { write: true, exitCode: 0, reason: 'ok' };
}

/** Safety cap mirrored in scripts/compass-gallery.mjs. */
const PHOTO_URL_CAP = 30;

/**
 * Render lib/listings.ts. photoUrls is optional and capped. lastVerified stays
 * a reference to listingsSyncedAt so every row shares the file's sync time.
 * contentUpdated is per listing and is omitted until that listing's public
 * fields actually change.
 */
export function renderActiveListingsFile(listings, timestamp, sourceUrl) {
  const listingsCode = listings.map((l) => {
    const parts = [];
    parts.push(`    address: ${JSON.stringify(l.address)}`);
    parts.push(`    city: ${JSON.stringify(l.city)}`);
    parts.push(`    price: ${l.price}`);
    if (l.beds) parts.push(`    beds: ${l.beds}`);
    if (l.baths) parts.push(`    baths: ${l.baths}`);
    if (l.sqft) parts.push(`    sqft: ${l.sqft}`);
    if (l.acres) parts.push(`    acres: ${l.acres}`);
    parts.push(`    status: ${JSON.stringify(l.status)}`);
    if (l.note) parts.push(`    note: ${JSON.stringify(l.note)}`);
    parts.push(`    compassUrl: ${JSON.stringify(l.compassUrl)}`);
    if (l.imageUrl) parts.push(`    imageUrl: ${JSON.stringify(l.imageUrl)}`);
    if (Array.isArray(l.photoUrls) && l.photoUrls.length) {
      const lines = l.photoUrls.slice(0, PHOTO_URL_CAP).map((url) => `      ${JSON.stringify(url)}`);
      parts.push(`    photoUrls: [\n${lines.join(',\n')},\n    ]`);
    }
    if (l.openHouse) parts.push(`    openHouse: ${JSON.stringify(l.openHouse)}`);
    if (l.firstSeen) parts.push(`    firstSeen: ${JSON.stringify(l.firstSeen)}`);
    if (l.contentUpdated) parts.push(`    contentUpdated: ${JSON.stringify(l.contentUpdated)}`);
    parts.push(`    lastVerified: listingsSyncedAt`);
    return `  {\n${parts.join(',\n')},\n  }`;
  }).join(',\n');

  return `// AUTO-GENERATED — Last synced: ${timestamp}
// Source: ${sourceUrl}
// Do not edit manually — run: node scripts/fetch-images.mjs

export interface Listing {
  address: string;
  city: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  acres?: number;
  status: string;
  note?: string;
  compassUrl: string;
  imageUrl?: string;
  // Compass photo gallery for this listing, largest first. Capped at 30.
  // Absent when the sync could only confirm the hero image (imageUrl).
  photoUrls?: string[];
  // ISO timestamp of the last Compass sync that confirmed this listing.
  // Used by /listings to flag the grid as 'Verifying…' if the file goes stale.
  lastVerified?: string;
  // ISO timestamp of the first Compass sync that included this listing.
  // Preserved across later syncs. Not a list date and not a market stat.
  firstSeen?: string;
  // ISO timestamp of the last sync that changed this listing's public fields.
  // Omitted until a change after firstSeen. Not the shared listingsSyncedAt clock.
  contentUpdated?: string;
  // Open-house line copied from the Compass card when one is shown.
  openHouse?: string;
}

// Mirrors the header timestamp so server components can compute sync staleness
// without parsing comments. Updated by scripts/fetch-images.mjs each sync.
export const listingsSyncedAt = ${JSON.stringify(timestamp)};

export const listings: Listing[] = [
${listingsCode}
];
`;
}
