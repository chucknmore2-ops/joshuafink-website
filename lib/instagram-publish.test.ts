// Instagram publish helpers: never send Compass CDN URLs to Graph, and always
// return enough JSON for Social Autopost to debug a 502.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  igFailureBody,
  igPublicHostOk,
  preflightPublicJpeg,
  redactSecrets,
} from './instagram-publish.ts'

test('igPublicHostOk only allows joshuafink.com over https', () => {
  assert.equal(
    igPublicHostOk('https://www.joshuafink.com/ig-photo/abc12345.jpg'),
    true,
  )
  assert.equal(igPublicHostOk('https://joshuafink.com/hero/x.jpg'), true)
  assert.equal(
    igPublicHostOk(
      'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/1200x900.jpg',
    ),
    false,
  )
  assert.equal(igPublicHostOk('http://www.joshuafink.com/ig-photo/abc12345.jpg'), false)
  assert.equal(igPublicHostOk('not a url'), false)
})

test('igFailureBody always includes slug, creationId, status_code, and attempts', () => {
  const body = igFailureBody({
    error: 'instagram container not ready',
    attempts: [
      {
        refKey: '1113-linn-cv-ct-gallatin',
        kind: 'listing',
        imageUrl: 'https://www.joshuafink.com/ig-photo/aaa11111.jpg',
        creationId: '1789001',
        statusCode: 'IN_PROGRESS',
        status: 'In Progress',
        error: 'instagram container not ready',
      },
      {
        refKey: '1901-new-bristol-ln-brentwood',
        kind: 'listing',
        imageUrl: 'https://www.joshuafink.com/ig-photo/bbb22222.jpg',
        creationId: '1789002',
        statusCode: 'IN_PROGRESS',
        error: 'instagram container not ready',
      },
    ],
    resume: false,
  })
  assert.equal(body.error, 'instagram container not ready')
  assert.equal(body.refKey, '1901-new-bristol-ln-brentwood')
  assert.equal(body.creationId, '1789002')
  assert.equal(body.statusCode, 'IN_PROGRESS')
  assert.equal(body.resume, false)
  assert.equal(Array.isArray(body.attempts), true)
  assert.equal((body.attempts as unknown[]).length, 2)
  const json = JSON.stringify(body)
  assert.equal(json.includes('access_token'), false)
})

test('redactSecrets strips tokens from Graph snippets', () => {
  const raw =
    'container 400 {"error":"OAuthException"} access_token=EAABsbCS123 Bearer EAABsbCS456 extra'
  const out = redactSecrets(raw)
  assert.equal(out.includes('EAABsbCS123'), false)
  assert.equal(out.includes('EAABsbCS456'), false)
  assert.match(out, /access_token=\[redacted\]/)
  assert.match(out, /Bearer \[redacted\]/)
})

test('preflightPublicJpeg refuses Compass CDN without fetching', async () => {
  const result = await preflightPublicJpeg(
    'https://www.compass.com/m/aaa/1200x900.jpg',
    async () => {
      throw new Error('must not fetch Compass')
    },
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.reason, /compass\.com/)
})

test('preflightPublicJpeg accepts a JPEG hosted on joshuafink.com', async () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, ...Array.from({ length: 200 }, () => 1)])
  const result = await preflightPublicJpeg(
    'https://www.joshuafink.com/ig-photo/abc12345.jpg',
    async () =>
      new Response(jpeg, { status: 200, headers: { 'Content-Type': 'image/jpeg' } }),
  )
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.bytes, jpeg.byteLength)
})

test('preflightPublicJpeg fails closed on a non-jpeg content-type', async () => {
  const result = await preflightPublicJpeg(
    'https://www.joshuafink.com/ig-photo/abc12345.jpg',
    async () =>
      new Response('<html>nope</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.reason, /content-type/)
})
