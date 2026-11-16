/**
 * Prints "timestamp-only" when the staged listing files differ from HEAD
 * only by the Compass sync clock, and "meaningful" otherwise.
 * A change to lib/removed-listing-redirects.json is always meaningful:
 * that file is what turns a removed /listings/<slug> into a 308.
 * The daily sync workflow uses this to skip a no-op commit.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listingSyncIsTimestampOnly } from './listings-file.mjs';

export const LISTING_SYNC_FILES = [
  'lib/listings.ts',
  'lib/sold-listings.ts',
  'lib/removed-listing-redirects.json',
];

/**
 * @param {{ file: string, before: string | null, after: string | null }[]} entries
 * @returns {'meaningful' | 'timestamp-only'}
 */
export function classifyListingSync(entries) {
  for (const { file, before, after } of entries) {
    if (before == null || after == null) return 'meaningful';
    if (before === after) continue;
    if (file.endsWith('.json')) return 'meaningful';
    if (!listingSyncIsTimestampOnly(before, after)) return 'meaningful';
  }
  return 'timestamp-only';
}

function show(rev, file) {
  try {
    return execSync(`git show ${rev}:${file}`, { encoding: 'utf8' });
  } catch {
    return null;
  }
}

const isDirect = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  const entries = LISTING_SYNC_FILES.map((file) => ({
    file,
    before: show('HEAD', file),
    after: show(':0', file),
  }));
  process.stdout.write(`${classifyListingSync(entries)}\n`);
}
