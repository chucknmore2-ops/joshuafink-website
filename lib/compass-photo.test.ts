// Compass photo URL normalisation — Instagram 2026-09-09 Social Autopost
// hung on the raw 2048x1536.webp. GBP already swapped to 1200x900.jpg.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compassJpegUrl, instagramImageUrl } from './compass-photo.ts'

const LIVE =
  'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/2048x1536.webp'
const SOLD =
  'https://www.compass.com/m/d0d1beaa460ada67dc6d58c9743da4b6804dd9cd_img_0_7b1be/480x320.webp'
const WWW =
  'https://www.compass.com/m/abc123/480x320.webp'

test('live 2048x1536.webp listing photos become 1200x900.jpg', () => {
  assert.equal(
    compassJpegUrl(LIVE),
    'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/1200x900.jpg',
  )
})

test('sold 480x320.webp photos (second Compass hash shape) also convert', () => {
  assert.equal(
    compassJpegUrl(SOLD),
    'https://www.compass.com/m/d0d1beaa460ada67dc6d58c9743da4b6804dd9cd_img_0_7b1be/1200x900.jpg',
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

test('instagramImageUrl converts Compass WebP and passes other URLs through', () => {
  assert.equal(
    instagramImageUrl(LIVE),
    'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/1200x900.jpg',
  )
  assert.equal(
    instagramImageUrl('https://www.joshuafink.com/blog/cover.jpg'),
    'https://www.joshuafink.com/blog/cover.jpg',
  )
})
