import { spawnSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'
import { latestSnapshot, MAX_MONTHS_BEHIND } from '../lib/market-snapshot.ts'
import { isPublishable, monthsBehind } from './snapshot-publish-window.mjs'

test('August 2026 is publishable in September and not in October', () => {
  assert.equal(monthsBehind('2026-08', new Date('2026-09-30T23:00:00Z')), 1)
  assert.equal(isPublishable('2026-08', new Date('2026-09-30T23:00:00Z'), 1), true)
  assert.equal(monthsBehind('2026-08', new Date('2026-10-01T13:41:00Z')), 2)
  assert.equal(isPublishable('2026-08', new Date('2026-10-01T13:41:00Z'), 1), false)
})

test('September 2026 is publishable in early October', () => {
  assert.equal(monthsBehind('2026-09', new Date('2026-10-08T15:00:00Z')), 1)
  assert.equal(isPublishable('2026-09', new Date('2026-10-08T15:00:00Z'), 1), true)
})

test('the checked-in snapshot follows the publish window on the run #9 clock', () => {
  const latest = latestSnapshot()
  assert.ok(latest)
  const clock = new Date('2026-10-01T13:41:00Z')
  const behind = monthsBehind(latest.month, clock)
  const publishable = isPublishable(latest.month, clock, MAX_MONTHS_BEHIND)
  const result = spawnSync(
    process.execPath,
    ['scripts/snapshot-publish-window.mjs', clock.toISOString()],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, publishable ? 0 : 2, result.stderr)
  assert.equal(
    result.stdout.trim(),
    `month=${latest.month} behind=${behind} max=${MAX_MONTHS_BEHIND} publishable=${publishable ? 'yes' : 'no'}`,
  )
})

test('the checked-in snapshot exits 2 once it is outside the window', () => {
  const latest = latestSnapshot()
  assert.ok(latest)
  const [year, month] = latest.month.split('-').map(Number)
  const clock = new Date(Date.UTC(year, month - 1 + MAX_MONTHS_BEHIND + 1, 1, 13, 41, 0))
  const behind = monthsBehind(latest.month, clock)
  assert.equal(behind, MAX_MONTHS_BEHIND + 1)
  const result = spawnSync(
    process.execPath,
    ['scripts/snapshot-publish-window.mjs', clock.toISOString()],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 2, result.stderr)
  assert.equal(
    result.stdout.trim(),
    `month=${latest.month} behind=${behind} max=${MAX_MONTHS_BEHIND} publishable=no`,
  )
})

test('monthly channel post_log classifier', () => {
  const result = spawnSync('python3', ['scripts/test_monthly_channels_posted.py'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
