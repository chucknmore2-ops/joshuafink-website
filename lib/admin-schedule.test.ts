// Upcoming schedule includes Wednesday Instagram now that Buffer is the
// live path. Graph stays off. Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scheduledJobs, upcomingSchedule } from './admin-schedule.ts'

test('Instagram stays on the upcoming schedule via Buffer', () => {
  const ig = scheduledJobs.find((job) => job.channel === 'instagram')
  assert.ok(ig)
  assert.equal(ig.jobName, 'instagram-post')
  assert.equal(ig.paused, undefined)

  const upcoming = upcomingSchedule(new Date('2026-09-21T18:00:00Z'))
  assert.equal(
    upcoming.some((job) => job.channel === 'instagram'),
    true,
  )
  for (const channel of ['facebook', 'linkedin', 'gbp']) {
    assert.ok(
      upcoming.some((job) => job.channel === channel),
      `${channel} must keep running`,
    )
  }
})
