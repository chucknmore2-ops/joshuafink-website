// LinkedIn listing-event publish. Mocks fetch. Does not call LinkedIn.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publishLinkedInListingPost, redactLinkedInSecret } from './linkedin-publish.ts'

const TOKEN = 'li_test_token_secret'
const JPEG = new Uint8Array(120)
JPEG[0] = 0xff
JPEG[1] = 0xd8
JPEG[2] = 0xff

const input = {
  accessToken: TOKEN,
  authorUrn: 'urn:li:person:test',
  text: 'Just Listed — 261 Paragon Mills Rd, Nashville\n\nListed with Joshua Fink, Compass.\n\nhttps://www.joshuafink.com/listings/261-paragon-mills-rd-nashville?utm_source=linkedin&utm_medium=social&utm_campaign=listing&utm_content=just-listed',
  title: 'Just Listed in Nashville, TN — 261 Paragon Mills Rd',
  description: '3 bed · 1 bath · 1,014 sq ft · $349,700',
  articleUrl:
    'https://www.joshuafink.com/listings/261-paragon-mills-rd-nashville?utm_source=linkedin&utm_medium=social&utm_campaign=listing&utm_content=just-listed',
  imageUrl: 'https://www.joshuafink.com/ig-photo/4e0ad91dae272cb8.jpg',
}

test('publishLinkedInListingPost uploads a JPEG then creates an image share', async () => {
  const calls: string[] = []
  const result = await publishLinkedInListingPost(input, async (url, init) => {
    const target = String(url)
    calls.push(`${init?.method ?? 'GET'} ${target}`)
    assert.equal(target.includes('graph.facebook.com'), false)
    const auth = new Headers(init?.headers).get('authorization') ?? ''
    if (auth) assert.match(auth, new RegExp(TOKEN))
    if (target.includes('/ig-photo/')) {
      return new Response(JPEG, { status: 200, headers: { 'Content-Type': 'image/jpeg' } })
    }
    if (target.includes('registerUpload')) {
      return new Response(
        JSON.stringify({
          value: {
            asset: 'urn:li:digitalmediaAsset:photo1',
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://www.linkedin.com/dms-uploads/photo1',
              },
            },
          },
        }),
        { status: 200 },
      )
    }
    if (target.includes('dms-uploads')) {
      return new Response('', { status: 201 })
    }
    const body = JSON.parse(String(init?.body)) as {
      specificContent: {
        'com.linkedin.ugc.ShareContent': { shareMediaCategory: string; shareCommentary: { text: string } }
      }
    }
    assert.equal(body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory, 'IMAGE')
    assert.match(body.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text, /Listed with Joshua Fink, Compass/)
    assert.match(body.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text, /joshuafink\.com\/listings\//)
    assert.equal(String(init?.body).includes(TOKEN), false)
    return new Response(JSON.stringify({ id: 'urn:li:share:1' }), { status: 201 })
  })
  assert.deepEqual(result, { ok: true, postId: 'urn:li:share:1', via: 'image' })
  assert.equal(calls.some((call) => call.startsWith('PUT ')), true)
  assert.equal(calls.some((call) => call.includes('ugcPosts')), true)
})

test('publishLinkedInListingPost falls back to an article share when the upload fails', async () => {
  const result = await publishLinkedInListingPost(input, async (url, init) => {
    const target = String(url)
    if (target.includes('/ig-photo/')) return new Response('no', { status: 404 })
    const body = JSON.parse(String(init?.body)) as {
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareMediaCategory: string
          media: Array<{ originalUrl?: string }>
        }
      }
    }
    const share = body.specificContent['com.linkedin.ugc.ShareContent']
    assert.equal(share.shareMediaCategory, 'ARTICLE')
    assert.equal(share.media[0]?.originalUrl, input.articleUrl)
    return new Response(JSON.stringify({ id: 'urn:li:share:2' }), { status: 201 })
  })
  assert.deepEqual(result, { ok: true, postId: 'urn:li:share:2', via: 'article' })
})

test('publishLinkedInListingPost fails when the article share also fails, without leaking the token', async () => {
  const result = await publishLinkedInListingPost(input, async (url) => {
    if (String(url).includes('/ig-photo/')) return new Response('no', { status: 404 })
    return new Response(`denied ${TOKEN}`, { status: 401 })
  })
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.match(result.error, /401/)
    assert.equal(result.error.includes(TOKEN), false)
  }
})

test('redactLinkedInSecret strips the token', () => {
  assert.equal(redactLinkedInSecret(`Bearer ${TOKEN} and ${TOKEN}`, TOKEN).includes(TOKEN), false)
})
