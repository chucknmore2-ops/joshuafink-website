import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDeploySkippablePath, shouldSkipProductionBuild } from './vercel-ignore-command.mjs';

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
