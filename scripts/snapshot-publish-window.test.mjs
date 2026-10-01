import { spawnSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'
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

test('the checked-in snapshot is outside the window on the run #9 clock', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/snapshot-publish-window.mjs', '2026-10-01T13:41:00Z'],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 2, result.stderr)
  assert.match(result.stdout, /month=2026-08 behind=2 max=1 publishable=no/)
})

test('monthly channel post_log classifier', () => {
  const result = spawnSync('python3', ['scripts/test_monthly_channels_posted.py'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
