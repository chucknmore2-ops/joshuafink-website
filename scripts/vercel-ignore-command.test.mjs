import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDeploySkippablePath,
  main,
  shouldSkipNonProductionBuild,
  shouldSkipProductionBuild,
} from './vercel-ignore-command.mjs';

test('docs, workflows, and content-engine paths do not deploy', () => {
  assert.equal(isDeploySkippablePath('.github/workflows/sync-listings.yml'), true);
  assert.equal(isDeploySkippablePath('docs/offsite-authority-plan.md'), true);
  assert.equal(isDeploySkippablePath('README.md'), true);
  assert.equal(isDeploySkippablePath('content_engine/config.yaml'), true);
  assert.equal(isDeploySkippablePath('scripts/sync-all.sh'), true);
  assert.equal(isDeploySkippablePath('app/page.tsx'), false);
  assert.equal(isDeploySkippablePath('public/listing-videos/example.mp4'), false);
});

test('a timestamp-only listing sync skips production and a price change does not', () => {
  const files = {
    'lib/listings.ts': {
      before: '// AUTO-GENERATED — Last synced: 2026-10-16T00:00:00.000Z\nexport const listingsSyncedAt = "2026-10-16T00:00:00.000Z";\nprice: 100',
      after: '// AUTO-GENERATED — Last synced: 2026-10-17T00:00:00.000Z\nexport const listingsSyncedAt = "2026-10-17T00:00:00.000Z";\nprice: 100',
    },
    'lib/sold-listings.ts': {
      before: '// AUTO-GENERATED — Last synced: 2026-10-16T00:00:00.000Z\n',
      after: '// AUTO-GENERATED — Last synced: 2026-10-17T00:00:00.000Z\n',
    },
  };
  const read = (file, side) => files[file][side];
  assert.equal(
    shouldSkipProductionBuild(['lib/listings.ts', 'lib/sold-listings.ts', '.github/workflows/sync-listings.yml'], read),
    true,
  );
  files['lib/listings.ts'].after = files['lib/listings.ts'].after.replace('price: 100', 'price: 110');
  assert.equal(shouldSkipProductionBuild(['lib/listings.ts'], read), false);
});

test('any rendered site file still builds', () => {
  assert.equal(shouldSkipProductionBuild(['app/page.tsx'], () => ''), false);
  assert.equal(shouldSkipProductionBuild(['public/robots.txt'], () => ''), false);
  assert.equal(shouldSkipProductionBuild(['README.md', 'docs/notes.md'], () => ''), true);
});

test('sync-listings and listing-video refs skip only outside production', () => {
  for (const ref of ['sync-listings/2026-10-24', 'listing-video/261-towes-ln-clarksville']) {
    assert.equal(shouldSkipNonProductionBuild('preview', ref), true);
    assert.equal(shouldSkipNonProductionBuild('development', ref), true);
    assert.equal(shouldSkipNonProductionBuild(undefined, ref), true);
    assert.equal(shouldSkipNonProductionBuild('', ref), true);
    assert.equal(shouldSkipNonProductionBuild('production', ref), false);
  }

  for (const ref of [
    'main',
    'sync-listings',
    'listing-video',
    'feature/sync-listings/extra',
    'feature/listing-video/extra',
    'SYNC-LISTINGS/2026-10-24',
    '',
  ]) {
    assert.equal(shouldSkipNonProductionBuild('preview', ref), false);
    assert.equal(shouldSkipNonProductionBuild('production', ref), false);
  }
});

test('the ignore command exits 0 for those previews and still builds everything else', () => {
  const savedEnv = process.env.VERCEL_ENV;
  const savedRef = process.env.VERCEL_GIT_COMMIT_REF;
  const savedPrev = process.env.VERCEL_GIT_PREVIOUS_SHA;
  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_GIT_COMMIT_REF = 'sync-listings/2026-10-24';
    assert.equal(main(), 0);
    process.env.VERCEL_GIT_COMMIT_REF = 'listing-video/261-towes-ln-clarksville';
    assert.equal(main(), 0);

    process.env.VERCEL_ENV = 'development';
    assert.equal(main(), 0);
    delete process.env.VERCEL_ENV;
    assert.equal(main(), 0);

    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_GIT_COMMIT_REF = 'main';
    assert.equal(main(), 1);
    process.env.VERCEL_GIT_COMMIT_REF = 'cursor/some-feature';
    assert.equal(main(), 1);

    // Production never takes the branch-name shortcut, even when the ref matches.
    // With no previous SHA the existing production path still builds.
    delete process.env.VERCEL_GIT_PREVIOUS_SHA;
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_GIT_COMMIT_REF = 'sync-listings/2026-10-24';
    assert.equal(main(), 1);
    process.env.VERCEL_GIT_COMMIT_REF = 'listing-video/261-towes-ln-clarksville';
    assert.equal(main(), 1);
    process.env.VERCEL_GIT_COMMIT_REF = 'main';
    assert.equal(main(), 1);
  } finally {
    if (savedEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = savedEnv;
    if (savedRef === undefined) delete process.env.VERCEL_GIT_COMMIT_REF;
    else process.env.VERCEL_GIT_COMMIT_REF = savedRef;
    if (savedPrev === undefined) delete process.env.VERCEL_GIT_PREVIOUS_SHA;
    else process.env.VERCEL_GIT_PREVIOUS_SHA = savedPrev;
  }
});
