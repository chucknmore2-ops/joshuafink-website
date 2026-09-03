/**
 * Unit tests for Compass listing salvage helpers.
 * Run: node --test scripts/listings-file.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  normalizeCompassUrl,
  loadExistingListingsMap,
  isUnusableScrapedListing,
  salvagePriorListing,
  decideFetchImagesWrite,
} from './listings-file.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('normalizeCompassUrl strips trailing slash, query, and hash', () => {
  const a = normalizeCompassUrl('https://www.compass.com/homedetails/foo/?utm=1#x');
  const b = normalizeCompassUrl('https://www.compass.com/homedetails/foo/');
  const c = normalizeCompassUrl('https://www.compass.com/homedetails/foo');
  assert.equal(a, b);
  assert.equal(b, c);
  assert.equal(c, 'https://www.compass.com/homedetails/foo');
});

test('normalizeCompassUrl is case-insensitive on the host/path', () => {
  assert.equal(
    normalizeCompassUrl('https://WWW.Compass.com/HomeDetails/Foo/'),
    normalizeCompassUrl('https://www.compass.com/homedetails/foo'),
  );
});

test('normalizeCompassUrl returns empty for missing values', () => {
  assert.equal(normalizeCompassUrl(''), '');
  assert.equal(normalizeCompassUrl(null), '');
  assert.equal(normalizeCompassUrl(undefined), '');
});

test('isUnusableScrapedListing rejects blank address or zero/missing price', () => {
  assert.equal(isUnusableScrapedListing({ address: '', city: 'x', price: 100 }), true);
  assert.equal(isUnusableScrapedListing({ address: '   ', city: 'x', price: 100 }), true);
  assert.equal(isUnusableScrapedListing({ address: '1 Main', city: 'x', price: 0 }), true);
  assert.equal(isUnusableScrapedListing({ address: '1 Main', city: 'x', price: null }), true);
  assert.equal(isUnusableScrapedListing({ address: '1 Main', city: 'x' }), true);
  assert.equal(isUnusableScrapedListing({ address: '1 Main', city: 'x', price: 100 }), false);
});

test('loadExistingListingsMap reads generated listings.ts by normalized URL', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'listings-file-'));
  const file = path.join(dir, 'listings.ts');
  fs.writeFileSync(
    file,
    `// AUTO-GENERATED
export interface Listing {
  address: string;
  compassUrl: string;
}

export const listingsSyncedAt = "2026-09-01T00:00:00.000Z";

export const listings: Listing[] = [
  {
    address: "1 Main St",
    city: "Nashville, TN 37201",
    price: 100000,
    status: "Active",
    compassUrl: "https://www.compass.com/homedetails/1-main/?utm=old",
    lastVerified: listingsSyncedAt,
  },
];
`,
    'utf8',
  );

  const map = loadExistingListingsMap(file, 'listings');
  assert.equal(map.size, 1);
  const prior = salvagePriorListing(
    map,
    'https://www.compass.com/homedetails/1-main/',
  );
  assert.equal(prior.address, '1 Main St');
  assert.equal(prior.price, 100000);
  assert.equal(salvagePriorListing(map, 'https://www.compass.com/homedetails/other/'), null);
});

test('loadExistingListingsMap reads soldListings export', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sold-file-'));
  const file = path.join(dir, 'sold-listings.ts');
  fs.writeFileSync(
    file,
    `import type { Listing } from './listings';

export const soldListings: Listing[] = [
  {
    address: "9 Sold Ln",
    city: "Brentwood, TN 37027",
    price: 500000,
    status: "Sold",
    compassUrl: "https://www.compass.com/homedetails/9-sold/",
  },
];
`,
    'utf8',
  );

  const map = loadExistingListingsMap(file, 'soldListings');
  const prior = salvagePriorListing(map, 'https://www.compass.com/homedetails/9-sold');
  assert.equal(prior.address, '9 Sold Ln');
  assert.equal(prior.price, 500000);
});

test('loadExistingListingsMap parses the live lib/listings.ts fixture', () => {
  const live = path.join(__dirname, '..', 'lib', 'listings.ts');
  const map = loadExistingListingsMap(live, 'listings');
  assert.ok(map.size > 0, 'expected at least one live listing');
  for (const listing of map.values()) {
    assert.ok(listing.address, 'live listing missing address');
    assert.ok(listing.price > 0, 'live listing missing price');
    assert.ok(listing.compassUrl, 'live listing missing compassUrl');
  }
});

test('decideFetchImagesWrite fails loudly when any card is unresolved', () => {
  assert.deepEqual(
    decideFetchImagesWrite({ resolvedCount: 9, unresolvedCount: 1 }),
    { write: false, exitCode: 1, reason: 'unresolved-cards' },
  );
  assert.deepEqual(
    decideFetchImagesWrite({ resolvedCount: 0, unresolvedCount: 3 }),
    { write: false, exitCode: 1, reason: 'unresolved-cards' },
  );
});

test('decideFetchImagesWrite keeps the existing file on an empty scrape', () => {
  assert.deepEqual(
    decideFetchImagesWrite({ resolvedCount: 0, unresolvedCount: 0 }),
    { write: false, exitCode: 0, reason: 'empty-scrape' },
  );
});

test('decideFetchImagesWrite writes when every card resolved (scraped or salvaged)', () => {
  assert.deepEqual(
    decideFetchImagesWrite({ resolvedCount: 10, unresolvedCount: 0 }),
    { write: true, exitCode: 0, reason: 'ok' },
  );
});
