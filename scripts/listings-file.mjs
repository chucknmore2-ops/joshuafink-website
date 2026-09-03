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
    `export const ${exportName}(?:: [^=]+)? = (\\[[\\s\\S]*?\\n\\];)`,
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
 * After the scrape loop: write only when every agent-page card resolved
 * (fresh scrape or salvage) and there is at least one listing.
 * Unresolved cards fail the job without writing so yesterday's file stays live.
 * Zero cards / nothing resolved keeps the existing file (exit 0).
 */
export function decideFetchImagesWrite({ resolvedCount, unresolvedCount }) {
  if (unresolvedCount > 0) {
    return { write: false, exitCode: 1, reason: 'unresolved-cards' };
  }
  if (resolvedCount === 0) {
    return { write: false, exitCode: 0, reason: 'empty-scrape' };
  }
  return { write: true, exitCode: 0, reason: 'ok' };
}
