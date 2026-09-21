// Buffer client for Instagram autopost. Graph is not this path.
// Run: npm test

import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BUFFER_GRAPHQL_URL,
  bufferImagePostVariables,
  interpretBufferCreatePost,
  queueInstagramImagePost,
  redactBufferSecret,
} from './buffer-publish.ts'

const API_KEY = 'buf_test_key_secret'
const CHANNEL_ID = '6ab16f9dea19ca0bdea8681d'
const IMAGE = 'https://www.joshuafink.com/ig-photo/abc12345.jpg'

test('bufferImagePostVariables queues an automatic image post', () => {
  const variables = bufferImagePostVariables({
    channelId: CHANNEL_ID,
    text: 'Caption with "quotes" and #Nashville',
    imageUrl: IMAGE,
  })
  const input = variables.input
  assert.equal(input.schedulingType, 'automatic')
  assert.equal(input.mode, 'addToQueue')
  assert.equal(input.channelId, CHANNEL_ID)
  assert.equal(input.text, 'Caption with "quotes" and #Nashville')
  assert.deepEqual(input.assets, [{ image: { url: IMAGE } }])
  assert.deepEqual(input.metadata, {
    instagram: { type: 'post', shouldShareToFeed: true },
  })
  assert.equal('dueAt' in input, false)
  assert.equal(JSON.stringify(input).includes('shareNow'), false)
  assert.equal(JSON.stringify(input).includes('notification'), false)
  assert.equal(JSON.stringify(input).includes('"story"'), false)
  assert.equal(JSON.stringify(input).includes('"reel"'), false)
})

test('interpretBufferCreatePost accepts PostActionSuccess', () => {
  const result = interpretBufferCreatePost(
    200,
    JSON.stringify({
      data: {
        createPost: {
          __typename: 'PostActionSuccess',
          post: { id: 'post_123' },
        },
      },
    }),
    API_KEY,
  )
  assert.deepEqual(result, { ok: true, postId: 'post_123' })
})

test('interpretBufferCreatePost surfaces MutationError and does not succeed', () => {
  const result = interpretBufferCreatePost(
    200,
    JSON.stringify({
      data: {
        createPost: {
          __typename: 'InvalidInputError',
          message: `bad image ${API_KEY}`,
        },
      },
    }),
    API_KEY,
  )
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.match(result.error, /InvalidInputError/)
    assert.equal(result.error.includes(API_KEY), false)
    assert.match(result.error, /\[redacted\]/)
  }
})

test('interpretBufferCreatePost surfaces top-level GraphQL errors', () => {
  const result = interpretBufferCreatePost(
    200,
    JSON.stringify({
      errors: [{ message: 'Unauthorized' }],
      data: { createPost: null },
    }),
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, /Unauthorized/)
})

test('interpretBufferCreatePost reports HTTP failures', () => {
  const result = interpretBufferCreatePost(401, '{"message":"nope"}', API_KEY)
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, /HTTP 401/)
})

test('redactBufferSecret strips the key and bearer tokens', () => {
  const out = redactBufferSecret(`token ${API_KEY} Bearer ${API_KEY}`, API_KEY)
  assert.equal(out.includes(API_KEY), false)
  assert.match(out, /Bearer \[redacted\]/)
})

test('queueInstagramImagePost posts to Buffer and does not call Graph', async () => {
  let seenUrl = ''
  let seenAuth = ''
  let seenBody = ''
  const result = await queueInstagramImagePost(
    {
      apiKey: API_KEY,
      channelId: CHANNEL_ID,
      text: 'Hello from Joshua Fink Group',
      imageUrl: IMAGE,
    },
    async (input, init) => {
      seenUrl = String(input)
      seenAuth = new Headers(init?.headers).get('authorization') ?? ''
      seenBody = String(init?.body ?? '')
      return new Response(
        JSON.stringify({
          data: {
            createPost: {
              __typename: 'PostActionSuccess',
              post: { id: 'queued_1' },
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    },
  )
  assert.deepEqual(result, { ok: true, postId: 'queued_1' })
  assert.equal(seenUrl, BUFFER_GRAPHQL_URL)
  assert.equal(seenAuth, `Bearer ${API_KEY}`)
  assert.equal(seenUrl.includes('graph.facebook.com'), false)
  const parsed = JSON.parse(seenBody) as {
    query: string
    variables: {
      input: {
        schedulingType: string
        mode: string
        assets: unknown
        metadata: { instagram: { type: string; shouldShareToFeed: boolean } }
      }
    }
  }
  assert.match(parsed.query, /createPost/)
  assert.equal(parsed.variables.input.schedulingType, 'automatic')
  assert.equal(parsed.variables.input.mode, 'addToQueue')
  assert.deepEqual(parsed.variables.input.assets, [{ image: { url: IMAGE } }])
  assert.deepEqual(parsed.variables.input.metadata, {
    instagram: { type: 'post', shouldShareToFeed: true },
  })
  assert.equal(seenBody.includes(API_KEY), false)
  assert.equal(seenBody.includes('graph.facebook.com'), false)
})

test('queueInstagramImagePost refuses to run without credentials', async () => {
  const result = await queueInstagramImagePost(
    { apiKey: '  ', channelId: CHANNEL_ID, text: 'x', imageUrl: IMAGE },
    async () => {
      throw new Error('must not fetch')
    },
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, /BUFFER_API_KEY/)
})

test('instagram cron queues via Buffer and does not call Graph', () => {
  const src = readFileSync(
    new URL('../app/api/cron/instagram-post/route.ts', import.meta.url),
    'utf8',
  )
  assert.match(src, /queueInstagramImagePost/)
  assert.equal(src.includes('graph.facebook.com'), false)
  assert.equal(src.includes('media_publish'), false)
  assert.equal(src.includes('/media?'), false)
  assert.match(src, /channel: 'instagram'/)
})

test('social autopost workflow uses Buffer secrets and leaves Graph off', () => {
  const yml = readFileSync(
    new URL('../.github/workflows/social-autopost.yml', import.meta.url),
    'utf8',
  )
  assert.match(yml, /IG_AUTOPOST:\s*buffer/)
  assert.match(yml, /BUFFER_API_KEY:\s*\$\{\{\s*secrets\.BUFFER_API_KEY\s*\}\}/)
  assert.match(yml, /BUFFER_IG_CHANNEL_ID:\s*\$\{\{\s*secrets\.BUFFER_IG_CHANNEL_ID\s*\}\}/)
  assert.match(yml, /X-Buffer-Api-Key:/)
  assert.match(yml, /X-Buffer-Ig-Channel-Id:/)
  assert.equal(yml.includes('creationId'), false)
  assert.equal(yml.includes('graph.facebook.com'), false)
})
