import { spawnSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'

test('snapshot-expect prints the checked-in August 2026 figures', () => {
  const result = spawnSync(process.execPath, ['scripts/snapshot-expect.mjs'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  const [query, slug] = result.stdout.trim().split('\n')
  assert.equal(slug, 'middle-tennessee-market-update-august-2026')
  const params = new URLSearchParams(query)
  assert.equal(params.get('expectMonth'), '2026-08')
  assert.equal(params.get('expectMedian'), '515725')
  assert.equal(params.get('expectClosings'), '2928')
  assert.equal(params.get('expectSupply'), '5.8')
  assert.equal(params.get('expectYoy'), '+2.1%')
})
