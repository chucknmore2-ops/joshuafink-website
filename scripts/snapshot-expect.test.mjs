import { spawnSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'
import { latestSnapshot, marketUpdateSlug } from '../lib/market-snapshot.ts'

test('snapshot-expect prints the newest checked-in snapshot', () => {
  const latest = latestSnapshot()
  assert.ok(latest)
  const result = spawnSync(process.execPath, ['scripts/snapshot-expect.mjs'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  const [query, slug] = result.stdout.trim().split('\n')
  assert.equal(slug, marketUpdateSlug(latest.month))
  const params = new URLSearchParams(query)
  assert.equal(params.get('expectMonth'), latest.month)
  assert.equal(params.get('expectMedian'), String(latest.medianSalePriceNum))
  assert.equal(params.get('expectClosings'), String(latest.closedSales))
  assert.equal(
    params.get('expectSupply'),
    latest.monthsOfInventory == null ? 'none' : String(latest.monthsOfInventory),
  )
  assert.equal(params.get('expectYoy'), latest.medianYoyChange ?? 'none')
})
