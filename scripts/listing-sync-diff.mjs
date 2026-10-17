/**
 * Prints "timestamp-only" when the staged listing files differ from HEAD
 * only by the Compass sync clock, and "meaningful" otherwise.
 * The daily sync workflow uses this to skip a no-op commit.
 */
import { execSync } from 'node:child_process';
import { listingSyncIsTimestampOnly } from './listings-file.mjs';

const FILES = ['lib/listings.ts', 'lib/sold-listings.ts'];

function show(rev, file) {
  try {
    return execSync(`git show ${rev}:${file}`, { encoding: 'utf8' });
  } catch {
    return null;
  }
}

let meaningful = false;
for (const file of FILES) {
  const before = show('HEAD', file);
  const after = show(':0', file);
  if (before == null || after == null) {
    meaningful = true;
    break;
  }
  if (before === after) continue;
  if (!listingSyncIsTimestampOnly(before, after)) {
    meaningful = true;
    break;
  }
}

process.stdout.write(meaningful ? 'meaningful\n' : 'timestamp-only\n');
