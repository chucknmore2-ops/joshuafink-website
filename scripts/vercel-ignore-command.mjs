/**
 * Vercel ignored-build step. Exit 0 to skip the deployment, exit 1 to build.
 *
 * Production deploys wipe the ISR cache. Skip them when the commit cannot
 * change the rendered site: docs, GitHub workflows, content-engine config,
 * scripts, or a Compass listing sync that only moved the sync clock.
 * Preview deployments still build.
 *
 * Safe default is exit 1. A crash or a missing git SHA builds.
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { listingSyncIsTimestampOnly } from './listings-file.mjs';

const SKIP_PREFIXES = [
  '.github/',
  'content_engine/',
  'content_engine_cash_offer/',
  'docs/',
  'scripts/',
];

const LISTING_FILES = new Set(['lib/listings.ts', 'lib/sold-listings.ts']);

export function isDeploySkippablePath(file) {
  if (file.endsWith('.md')) return true;
  return SKIP_PREFIXES.some((prefix) => file === prefix.slice(0, -1) || file.startsWith(prefix));
}

/**
 * @param {string[]} files
 * @param {(file: string, side: 'before' | 'after') => string | null} readFile
 * @returns {boolean} true when the production build can be skipped
 */
export function shouldSkipProductionBuild(files, readFile) {
  for (const file of files) {
    if (isDeploySkippablePath(file)) continue;
    if (LISTING_FILES.has(file)) {
      const before = readFile(file, 'before');
      const after = readFile(file, 'after');
      if (before == null || after == null) return false;
      if (!listingSyncIsTimestampOnly(before, after)) return false;
      continue;
    }
    return false;
  }
  return true;
}

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf8' });
}

function main() {
  if ((process.env.VERCEL_ENV || '') !== 'production') {
    console.log(`Building: VERCEL_ENV=${process.env.VERCEL_ENV || 'unset'} is not production.`);
    return 1;
  }

  const prev = process.env.VERCEL_GIT_PREVIOUS_SHA || '';
  const curr = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD';
  if (!prev || prev === curr) {
    console.log('Building: no previous production SHA to compare.');
    return 1;
  }

  try {
    git(`cat-file -e ${prev}^{commit}`);
  } catch {
    try {
      git(`fetch --no-tags --depth=50 origin ${prev}`);
    } catch {
      console.log(`Building: could not read previous SHA ${prev}.`);
      return 1;
    }
  }

  let files;
  try {
    files = git(`diff --name-only ${prev} ${curr}`)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (err) {
    console.log(`Building: git diff failed (${err instanceof Error ? err.message : err}).`);
    return 1;
  }

  const readFile = (file, side) => {
    const rev = side === 'before' ? prev : curr;
    try {
      return git(`show ${rev}:${file}`);
    } catch {
      return null;
    }
  };

  if (!shouldSkipProductionBuild(files, readFile)) {
    console.log(`Building: ${files.length} changed path(s) include site output.`);
    return 1;
  }

  console.log(`Skipping production build. Changed paths do not affect the site: ${files.join(', ') || '(none)'}`);
  return 0;
}

const isDirect = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  process.exit(main());
}
