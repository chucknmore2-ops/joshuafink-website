import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMonthlyFacebookPost } from './monthly-facebook-post.ts'
import { latestSnapshot, MAX_MONTHS_BEHIND } from './market-snapshot.ts'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Last instant the newest snapshot is still inside the publish window. */
function endOfPublishWindow(isoMonth: string): Date {
  const [year, month] = isoMonth.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1 + MAX_MONTHS_BEHIND + 1, 0, 23, 0, 0))
}

/** First instant the newest snapshot is too old to post. */
function firstDayOutsideWindow(isoMonth: string): Date {
  const [year, month] = isoMonth.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1 + MAX_MONTHS_BEHIND + 1, 1, 0, 0, 0))
}

test('the newest snapshot is still published on the last day of its window', () => {
  const latest = latestSnapshot()
  assert.ok(latest)
  const post = buildMonthlyFacebookPost(endOfPublishWindow(latest.month))
  assert.ok(post)
  assert.equal(post.month, latest.month)
  assert.match(post.message, new RegExp(escapeRegExp(latest.medianSalePrice)))
  if (latest.medianYoyChange) {
    assert.match(post.message, new RegExp(escapeRegExp(latest.medianYoyChange)))
  }
  assert.match(post.link, /utm_source=facebook/)
  assert.match(post.link, new RegExp(`utm_content=${latest.month}`))
})

test('the day after the window does not recycle the newest snapshot', () => {
  const latest = latestSnapshot()
  assert.ok(latest)
  assert.equal(buildMonthlyFacebookPost(firstDayOutsideWindow(latest.month)), null)
})

test('October 1 does not recycle August', () => {
  const post = buildMonthlyFacebookPost(new Date('2026-10-01T00:00:00Z'))
  assert.notEqual(post?.month, '2026-08')
})
