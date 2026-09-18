// Public /ig-photo cache — Meta's crawler must receive a real JPEG.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jpegResponseHeaders, loadIgPhotoJpeg } from './ig-photo.ts'

const LIVE_ID = 'a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560'
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, ...Array.from({ length: 120 }, () => 0)])

function mockFetch(impl: (url: string) => Response | Promise<Response>): typeof fetch {
  return (async (input: RequestInfo | URL) => impl(String(input))) as typeof fetch
}

test('loadIgPhotoJpeg fetches Compass 1200x900.jpg and accepts a JPEG body', async () => {
  let fetched = ''
  const loaded = await loadIgPhotoJpeg(
    `${LIVE_ID}.jpg`,
    mockFetch((url) => {
      fetched = url
      return new Response(JPEG, { headers: { 'Content-Type': 'image/jpeg' } })
    }),
  )
  assert.equal(fetched, `https://www.compass.com/m/${LIVE_ID}/1200x900.jpg`)
  assert.equal(loaded.ok, true)
  if (loaded.ok) {
    assert.equal(loaded.photoId, LIVE_ID)
    assert.equal(loaded.body[0], 0xff)
  }
})

test('loadIgPhotoJpeg 404s on path-traversal ids', async () => {
  const loaded = await loadIgPhotoJpeg('../secret', mockFetch(() => {
    throw new Error('must not fetch')
  }))
  assert.deepEqual(loaded, { ok: false, status: 404, error: 'not found' })
})

test('loadIgPhotoJpeg 502s when upstream is not JPEG', async () => {
  const loaded = await loadIgPhotoJpeg(
    LIVE_ID,
    mockFetch(() => new Response(Uint8Array.from([0x00, 0x01, 0x02, ...Array.from({ length: 120 }, () => 0)]))),
  )
  assert.equal(loaded.ok, false)
  if (!loaded.ok) {
    assert.equal(loaded.status, 502)
    assert.equal(loaded.error, 'not jpeg')
  }
})

test('loadIgPhotoJpeg 502s when Compass returns a non-200', async () => {
  const loaded = await loadIgPhotoJpeg(
    LIVE_ID,
    mockFetch(() => new Response('nope', { status: 403 })),
  )
  assert.equal(loaded.ok, false)
  if (!loaded.ok) assert.equal(loaded.error, 'upstream 403')
})

test('jpegResponseHeaders advertise image/jpeg without forwarding Compass cookies', () => {
  const headers = jpegResponseHeaders(214838)
  assert.equal(headers['Content-Type'], 'image/jpeg')
  assert.equal(headers['Content-Length'], '214838')
  assert.match(String(headers['Cache-Control']), /s-maxage=86400/)
  assert.equal('Set-Cookie' in headers, false)
})
