// Upcoming schedule must not promise a Wednesday Instagram post while
// autopost is paused. Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scheduledJobs, upcomingSchedule } from './admin-schedule.ts'

test('paused Instagram stays documented but off the upcoming schedule', () => {
  const ig = scheduledJobs.find((job) => job.channel === 'instagram')
  assert.ok(ig)
  assert.equal(ig.jobName, 'instagram-post')
  assert.equal(ig.paused, true)

  const upcoming = upcomingSchedule(new Date('2026-09-21T18:00:00Z'))
  assert.equal(
    upcoming.some((job) => job.channel === 'instagram'),
    false,
  )
  for (const channel of ['facebook', 'linkedin', 'gbp']) {
    assert.ok(
      upcoming.some((job) => job.channel === channel),
      `${channel} must keep running`,
    )
  }
})
