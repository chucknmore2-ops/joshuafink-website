import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyListingSync } from './listing-sync-diff.mjs';

const clock = (day) =>
  `// AUTO-GENERATED — Last synced: 2026-10-${day}T00:00:00.000Z\nexport const listingsSyncedAt = "2026-10-${day}T00:00:00.000Z";\nprice: 100`;

test('a redirect-map change is meaningful even when listings only move the sync clock', () => {
  const listingsBefore = clock('16');
  const listingsAfter = clock('17');
  assert.equal(
    classifyListingSync([
      { file: 'lib/listings.ts', before: listingsBefore, after: listingsAfter },
      { file: 'lib/sold-listings.ts', before: 'sold\n', after: 'sold\n' },
      {
        file: 'lib/removed-listing-redirects.json',
        before: '{ "removed": [] }\n',
        after: '{ "removed": [] }\n',
      },
    ]),
    'timestamp-only',
  );
  assert.equal(
    classifyListingSync([
      { file: 'lib/listings.ts', before: listingsBefore, after: listingsAfter },
      { file: 'lib/sold-listings.ts', before: 'sold\n', after: 'sold\n' },
      {
        file: 'lib/removed-listing-redirects.json',
        before: '{ "removed": [] }\n',
        after: '{ "removed": [{ "slug": "1-main-st-nashville" }] }\n',
      },
    ]),
    'meaningful',
  );
});

test('a price change is meaningful and a missing file is meaningful', () => {
  assert.equal(
    classifyListingSync([
      { file: 'lib/listings.ts', before: 'price: 100', after: 'price: 110' },
    ]),
    'meaningful',
  );
  assert.equal(
    classifyListingSync([
      { file: 'lib/removed-listing-redirects.json', before: null, after: '{}\n' },
    ]),
    'meaningful',
  );
  assert.equal(
    classifyListingSync([
      { file: 'lib/listings.ts', before: 'same', after: 'same' },
      { file: 'lib/removed-listing-redirects.json', before: '[]\n', after: '[]\n' },
    ]),
    'timestamp-only',
  );
});
