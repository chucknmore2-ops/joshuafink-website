// Finished-clip checks for the dispatch-only listing video workflow.
// Run: npm test

import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertPublicHttpsUrl, assertSha256Hex, mergeTourVideoFile, sha256File, sha256Matches } from './custom-listing-video.ts'

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const SPARTAN_SHA = '70cbe512b00274e995e4c303de2333457cd810ab0ee3ddfb575b01973d8b929f'

test('sha256 of a file matches the hex digest and rejects a mismatch', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'custom-listing-video-'))
  const file = path.join(dir, 'clip.bin')
  writeFileSync(file, 'spartan')
  const digest = createHash('sha256').update('spartan').digest('hex')
  assert.equal(digest, SPARTAN_SHA)
  assert.equal(await sha256File(file), SPARTAN_SHA)
  assert.equal(sha256Matches(SPARTAN_SHA, SPARTAN_SHA.toUpperCase()), true)
  assert.equal(sha256Matches(SPARTAN_SHA, 'ab'), false)
  assert.equal(assertSha256Hex(`  ${SPARTAN_SHA.toUpperCase()}  `), SPARTAN_SHA)
  assert.throws(() => assertSha256Hex('not-a-digest'), /64 hex/)
})

test('video url must be public https without credentials', () => {
  const url = assertPublicHttpsUrl(
    'https://v3b.fal.media/files/b/0ab2119d/afDNHSmkoYhIqFQAk7dXp_spartan-sample-hiphop.mp4',
  )
  assert.equal(url.protocol, 'https:')
  assert.throws(() => assertPublicHttpsUrl('http://example.com/a.mp4'), /https/)
  assert.throws(() => assertPublicHttpsUrl('https://user:secret@example.com/a.mp4'), /credentials/)
  assert.throws(() => assertPublicHttpsUrl('https://localhost/a.mp4'), /public/)
})

test('tour video file replaces one id and keeps the others', () => {
  const merged = mergeTourVideoFile(
    {
      '261-towes-ln-clarksville': 'j4rWKfHvT6A',
      '201-spartan-dr-nashville': '3XpZKdw8iDU',
      '261-paragon-mills-rd-nashville': 'ucNAFSqwtko',
    },
    '201-spartan-dr-nashville',
    'abcdefghijk',
  )
  assert.deepEqual(merged, {
    '201-spartan-dr-nashville': 'abcdefghijk',
    '261-paragon-mills-rd-nashville': 'ucNAFSqwtko',
    '261-towes-ln-clarksville': 'j4rWKfHvT6A',
  })
  assert.throws(() => mergeTourVideoFile({}, '../etc', 'abcdefghijk'), /not safe/)
  assert.throws(() => mergeTourVideoFile({}, '201-spartan-dr-nashville', 'short'), /11 characters/)
})

test('custom listing video workflow is dispatch-only and does not render or post Facebook', () => {
  const workflow = readFileSync(path.join(repoRoot, '.github/workflows/post-custom-listing-video.yml'), 'utf8')
  const script = readFileSync(path.join(repoRoot, 'scripts/post-custom-listing-video.ts'), 'utf8')
  const paused = readFileSync(path.join(repoRoot, '.github/workflows/listing-video.yml'), 'utf8')
  assert.match(workflow, /workflow_dispatch/)
  assert.match(workflow, /video_url:/)
  assert.match(workflow, /sha256:/)
  assert.match(workflow, /address:/)
  assert.match(workflow, /replace_youtube_id:/)
  assert.match(workflow, /replace_buffer_id:/)
  assert.match(workflow, /Facebook skipped: BUFFER_FB_CHANNEL_ID is not set/)
  assert.equal(/^\s*schedule:/m.test(workflow), false)
  assert.equal(/^\s*push:/m.test(workflow), false)
  assert.equal(workflow.includes('FB_PAGE_TOKEN'), false)
  assert.equal(workflow.includes('listing-video-render'), false)
  assert.equal(workflow.includes('ffmpeg'), false)
  assert.equal(/parks/i.test(workflow), false)
  assert.equal(workflow.includes('615-551-3399'), false)
  assert.equal(script.includes('listing-video-render'), false)
  assert.equal(script.includes('renderListingVideo'), false)
  assert.equal(script.includes('FB_PAGE_TOKEN'), false)
  assert.match(script, /uploadYoutubeShort/)
  assert.match(script, /queueBufferVideoPost/)
  assert.match(script, /unlistYoutubeVideo/)
  assert.match(script, /retireQueuedBufferPost/)
  assert.match(script, /target: 'instagram'/)
  assert.equal(script.includes("target: 'facebook'"), false)
  assert.match(paused, /PAUSED/)
  assert.equal(/^\s*schedule:/m.test(paused), false)
})
