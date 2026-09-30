import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMonthlyFacebookPost } from './monthly-facebook-post.ts'

test('September 30 still publishes the August 2026 snapshot', () => {
  const post = buildMonthlyFacebookPost(new Date('2026-09-30T18:00:00Z'))
  assert.ok(post)
  assert.equal(post.month, '2026-08')
  assert.match(post.message, /\$515,725/)
  assert.match(post.message, /\+2\.1%/)
  assert.match(post.link, /utm_source=facebook/)
  assert.match(post.link, /utm_content=2026-08/)
})

test('October 1 does not recycle August', () => {
  assert.equal(buildMonthlyFacebookPost(new Date('2026-10-01T00:00:00Z')), null)
})
