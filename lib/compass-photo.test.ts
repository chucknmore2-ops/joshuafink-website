// Compass photo URL normalisation — Instagram 2026-09-09 hung on the raw
// 2048x1536.webp; 2026-09-16/17 hung on Compass's own 1200x900.jpg too.
// Instagram Graph image_url must be a JPEG on joshuafink.com.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  compassJpegFromPhotoId,
  compassJpegUrl,
  compassPhotoId,
  instagramImageUrl,
  isJpegBuffer,
  isSafeCompassPhotoId,
  normalizeCompassPhotoId,
} from './compass-photo.ts'
import { listings } from './listings.ts'

const LIVE =
  'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/2048x1536.webp'
const LIVE_ID = 'a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560'
const SOLD =
  'https://www.compass.com/m/d0d1beaa460ada67dc6d58c9743da4b6804dd9cd_img_0_7b1be/480x320.webp'
const SOLD_ID = 'd0d1beaa460ada67dc6d58c9743da4b6804dd9cd_img_0_7b1be'
const WWW =
  'https://www.compass.com/m/abc123/480x320.webp'

test('live 2048x1536.webp listing photos become 1200x900.jpg', () => {
  assert.equal(
    compassJpegUrl(LIVE),
    `https://www.compass.com/m/${LIVE_ID}/1200x900.jpg`,
  )
})

test('sold 480x320.webp photos (second Compass hash shape) also convert', () => {
  assert.equal(
    compassJpegUrl(SOLD),
    `https://www.compass.com/m/${SOLD_ID}/1200x900.jpg`,
  )
})

test('www and bare compass.com hosts both match', () => {
  assert.equal(compassJpegUrl(WWW), 'https://www.compass.com/m/abc123/1200x900.jpg')
})

test('non-Compass or already-jpeg URLs are left alone', () => {
  assert.equal(compassJpegUrl(undefined), undefined)
  assert.equal(compassJpegUrl(''), undefined)
  assert.equal(compassJpegUrl('https://www.joshuafink.com/hero/foo.webp'), undefined)
  assert.equal(
    compassJpegUrl('https://www.compass.com/m/abc123/1200x900.jpg'),
    undefined,
  )
})

test('compassPhotoId extracts live and sold hashes', () => {
  assert.equal(compassPhotoId(LIVE), LIVE_ID)
  assert.equal(compassPhotoId(SOLD), SOLD_ID)
  assert.equal(
    compassPhotoId(`https://www.compass.com/m/${LIVE_ID}/1200x900.jpg`),
    LIVE_ID,
  )
  assert.equal(compassPhotoId('https://www.joshuafink.com/blog/cover.jpg'), undefined)
})

test('isSafeCompassPhotoId rejects open-proxy shapes', () => {
  assert.equal(isSafeCompassPhotoId(LIVE_ID), true)
  assert.equal(isSafeCompassPhotoId(SOLD_ID), true)
  assert.equal(isSafeCompassPhotoId('../etc/passwd'), false)
  assert.equal(isSafeCompassPhotoId('abc/def'), false)
  assert.equal(isSafeCompassPhotoId('short'), false)
  assert.equal(isSafeCompassPhotoId('ok-id-ok'), true)
})

test('normalizeCompassPhotoId strips .jpg and rejects junk', () => {
  assert.equal(normalizeCompassPhotoId(`${LIVE_ID}.jpg`), LIVE_ID)
  assert.equal(normalizeCompassPhotoId(`${LIVE_ID}.JPEG`), LIVE_ID)
  assert.equal(normalizeCompassPhotoId('%2e%2e/secret'), undefined)
})

test('compassJpegFromPhotoId rebuilds the 1200x900 Compass JPEG', () => {
  assert.equal(
    compassJpegFromPhotoId(`${LIVE_ID}.jpg`),
    `https://www.compass.com/m/${LIVE_ID}/1200x900.jpg`,
  )
  assert.equal(compassJpegFromPhotoId('../nope'), undefined)
})

test('instagramImageUrl hosts Compass photos on joshuafink.com, not the Compass CDN', () => {
  assert.equal(
    instagramImageUrl(LIVE),
    `https://www.joshuafink.com/ig-photo/${LIVE_ID}.jpg`,
  )
  assert.equal(
    instagramImageUrl(SOLD),
    `https://www.joshuafink.com/ig-photo/${SOLD_ID}.jpg`,
  )
  const hosted = instagramImageUrl(LIVE)
  assert.equal(new URL(hosted).hostname, 'www.joshuafink.com')
  assert.equal(hosted.includes('compass.com'), false)
})

test('instagramImageUrl leaves site-hosted covers on joshuafink.com', () => {
  assert.equal(
    instagramImageUrl('https://www.joshuafink.com/blog/cover.jpg'),
    'https://www.joshuafink.com/blog/cover.jpg',
  )
  assert.equal(
    instagramImageUrl('/hero/foo.jpg'),
    'https://www.joshuafink.com/hero/foo.jpg',
  )
})

test('isJpegBuffer requires the SOI marker', () => {
  assert.equal(isJpegBuffer(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), true)
  assert.equal(isJpegBuffer(Uint8Array.from([0x52, 0x49, 0x46, 0x46])), false)
  assert.equal(isJpegBuffer(Uint8Array.from([0xff])), false)
})

test('every live listing photo becomes a joshuafink.com /ig-photo JPEG, never Compass', () => {
  const withPhotos = listings.filter((l) => l.imageUrl)
  assert.ok(withPhotos.length > 0)
  for (const l of withPhotos) {
    const url = instagramImageUrl(l.imageUrl!)
    assert.equal(new URL(url).hostname, 'www.joshuafink.com', l.address)
    assert.match(url, /\/ig-photo\/[A-Za-z0-9_-]+\.jpg$/)
    assert.equal(url.includes('compass.com'), false, l.address)
  }
})
