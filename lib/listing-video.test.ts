// Listing video copy, launch seed, YouTube scope, and ffmpeg filter graph.
// Run: npm test

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Listing } from './listings.ts'
import { bufferVideoPostVariables } from './buffer-publish.ts'
import { getTourVideoId, sanitizeTourVideoId, tourVideosFromRecord } from './listing-detail.ts'
import {
  LISTING_VIDEO_END_CARD,
  LISTING_VIDEO_SEED_ADDRESSES,
  YOUTUBE_UPLOAD_SCOPE,
  isListingVideoSeeded,
  isListingVideoStatus,
  listingPhotoIds,
  listingSpecLine,
  listingVideoCaption,
  listingVideoCopyProblem,
  listingVideoCustomCaption,
  listingVideoCustomDescription,
  listingVideoDescription,
  listingVideoFullyPosted,
  listingVideoOverlay,
  listingVideoPageUrl,
  listingVideoPublicUrl,
  listingVideoTimeline,
  listingVideoTitle,
  planAutomaticListingVideos,
  readYoutubeCredentials,
  requiredListingVideoChannels,
  youtubeScopeAllowsUpdate,
  youtubeScopeAllowsUpload,
  youtubeSetupMessage,
  youtubeUpdateScopeMessage,
} from './listing-video.ts'
import { clipFilterScript, kenBurnsFilter, renderListingVideo, resolveListingVideoFont, xfadeFilterScript } from './listing-video-render.ts'
import { unlistYoutubeVideo, uploadYoutubeShort, YOUTUBE_LISTING_TAGS } from './listing-video-youtube.ts'

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

function home(overrides: Partial<Listing> = {}): Listing {
  return {
    address: '4127 Edwards Ave',
    city: 'Nashville, TN 37216 | MLS #3319964',
    price: 409900,
    beds: 3,
    baths: 1,
    sqft: 1223,
    status: 'Active',
    compassUrl: 'https://www.compass.com/homedetails/4127-Edwards-Ave-Nashville-TN-37216/THUS9_pid/',
    imageUrl:
      'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/2048x1536.webp',
    ...overrides,
  }
}

test('launch seed is the eight homes on the site on 2026-10-06, including Paragon Mills', () => {
  assert.deepEqual([...LISTING_VIDEO_SEED_ADDRESSES], [
    '511 Wanda Dr',
    '4127 Edwards Ave',
    '1100 Gibson Dr',
    '3814 Plantation Dr',
    '261 Paragon Mills Rd',
    '316 7th Ave',
    '2037 Walnut Ln',
    '4874 Sparta Pike',
  ])
  assert.equal(isListingVideoSeeded('4127 Edwards Ave'), true)
  assert.equal(isListingVideoSeeded('261 Paragon Mills Rd'), true)
  assert.equal(isListingVideoSeeded('100 Brand New St'), false)
})

test('automatic plan keeps a new Active or Coming Soon home and skips the seed and under contract', () => {
  const fresh = home({
    address: '100 Brand New St',
    city: 'Franklin, TN 37064',
    compassUrl: 'https://www.compass.com/homedetails/100-Brand-New-St/NEW1_pid/',
  })
  const soon = home({
    address: '200 Soon Ln',
    status: 'Coming Soon',
    compassUrl: 'https://www.compass.com/homedetails/200-Soon-Ln/SOON_pid/',
  })
  const pending = home({
    address: '300 Pending Rd',
    status: 'Active Under Contract',
    compassUrl: 'https://www.compass.com/homedetails/300-Pending-Rd/PEND_pid/',
  })
  const plan = planAutomaticListingVideos([home(), fresh, soon, pending])
  assert.deepEqual(
    plan.map((listing) => listing.address),
    ['100 Brand New St', '200 Soon Ln'],
  )
  assert.equal(isListingVideoStatus('Active'), true)
  assert.equal(isListingVideoStatus('Coming Soon'), true)
  assert.equal(isListingVideoStatus('coming  soon'), true)
  assert.equal(isListingVideoStatus('Active Under Contract'), false)
  assert.equal(isListingVideoStatus('Pending'), false)
})

test('title, overlay, and description use the listing facts and a YouTube UTM link', () => {
  const listing = home()
  assert.equal(listingVideoTitle(listing), '4127 Edwards Ave, Nashville TN | Home for Sale')
  assert.deepEqual(listingVideoOverlay(listing), {
    address: '4127 Edwards Ave',
    city: 'Nashville, TN',
    specs: '3 beds · 1 bath · 1,223 sq ft',
    price: '$409,900',
  })
  const description = listingVideoDescription(listing)
  assert.match(description, /4127 Edwards Ave, Nashville, TN/)
  assert.match(description, /3 beds · 1 bath · 1,223 sq ft/)
  assert.match(description, /\$409,900/)
  assert.match(description, /utm_source=youtube/)
  assert.match(description, /utm_medium=social/)
  assert.match(description, /utm_campaign=listing-video/)
  assert.match(description, /https:\/\/www\.joshuafink\.com\/listings\/4127-edwards-ave-nashville/)
  assert.match(description, /#Shorts/)
  assert.equal(description.includes(LISTING_VIDEO_END_CARD), true)
  assert.equal(LISTING_VIDEO_END_CARD, 'Joshua Fink | Compass | joshuafink.com')
})

test('captions name Compass and do not invent a firm', () => {
  const caption = listingVideoCaption(home({ status: 'Coming Soon' }), 'instagram')
  assert.match(caption, /Coming soon/)
  assert.match(caption, /Joshua Fink \| Compass/)
  assert.match(caption, /#ComingSoon/)
  assert.match(caption, /utm_source=instagram/)
  const facebook = listingVideoCaption(home(), 'facebook')
  assert.match(facebook, /#JustListed/)
  assert.match(facebook, /utm_source=facebook/)
  const blob = `${caption}\n${facebook}\n${listingVideoDescription(home())}\n${LISTING_VIDEO_END_CARD}`
  assert.equal(/parks/i.test(blob), false)
})

test('missing price or specs are omitted instead of filled in', () => {
  const listing = home({ beds: undefined, baths: undefined, sqft: undefined, price: 0 })
  assert.equal(listingSpecLine(listing), '')
  assert.equal(listingVideoOverlay(listing).price, '')
  assert.equal(listingVideoDescription(listing).includes('$0'), false)
})

test('timeline stays inside 20–30 seconds for one to six photos', () => {
  for (let n = 1; n <= 6; n++) {
    const timeline = listingVideoTimeline(n)
    assert.ok(timeline.totalSec >= 20 && timeline.totalSec <= 30, `${n} photos → ${timeline.totalSec}s`)
    assert.equal(timeline.photoCount, n)
    if (n === 1) assert.equal(timeline.fadeFrames, 0)
  }
})

test('photo ids stay on Compass, hero first, capped at six', () => {
  const html = `
    <img src="https://www.compass.com/m/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/373x280.webp">
    <img src="https://www.compass.com/m/cccccccccccccccccccccccccccccccc/373x280.webp">
    <img src="https://evil.example/m/dddddddddddddddddddddddddddddddd/1x1.jpg">
    <img src="https://www.compass.com/m/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/1600x1200.jpg">
  `
  const ids = listingPhotoIds(
    html,
    'https://www.compass.com/m/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/2048x1536.webp',
    2,
  )
  assert.deepEqual(ids, [
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ])
})

test('YouTube setup names the secrets and the upload scope', () => {
  assert.deepEqual(readYoutubeCredentials({}), {
    ok: false,
    missing: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'],
  })
  const ready = readYoutubeCredentials({
    YOUTUBE_CLIENT_ID: 'id',
    YOUTUBE_CLIENT_SECRET: 'secret',
    YOUTUBE_REFRESH_TOKEN: 'refresh',
  })
  assert.equal(ready.ok, true)
  assert.equal(youtubeScopeAllowsUpload(`openid ${YOUTUBE_UPLOAD_SCOPE}`), true)
  assert.equal(youtubeScopeAllowsUpload('https://www.googleapis.com/auth/youtube'), true)
  assert.equal(youtubeScopeAllowsUpload('https://www.googleapis.com/auth/business.manage'), false)
  const missing = youtubeSetupMessage('missing')
  assert.match(missing, /YOUTUBE_CLIENT_ID/)
  assert.match(missing, /YOUTUBE_CLIENT_SECRET/)
  assert.match(missing, /YOUTUBE_REFRESH_TOKEN/)
  assert.match(missing, /youtube\.upload/)
  assert.match(youtubeSetupMessage('scope'), /YOUTUBE_REFRESH_TOKEN/)
})

test('upload is refused when the refresh token lacks the upload scope', async () => {
  const calls: string[] = []
  const result = await uploadYoutubeShort({
    credentials: { clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh' },
    filePath: path.join(repoRoot, 'package.json'),
    title: '4127 Edwards Ave, Nashville TN | Home for Sale',
    description: 'desc',
    fetchImpl: (async (url: string) => {
      calls.push(String(url))
      return new Response(JSON.stringify({ access_token: 'ya29.test', scope: 'https://www.googleapis.com/auth/business.manage' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch,
  })
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.kind, 'scope')
    assert.match(result.error, /youtube\.upload/)
  }
  assert.equal(calls.length, 1)
  assert.equal(calls[0].includes('oauth2.googleapis.com/token'), true)
})

test('Buffer video post is an automatic Reel and Facebook is optional', () => {
  const instagram = bufferVideoPostVariables({
    channelId: 'ig-channel',
    text: 'caption',
    videoUrl: listingVideoPublicUrl('4127-edwards-ave-nashville'),
    target: 'instagram',
  }).input
  assert.equal(instagram.schedulingType, 'automatic')
  assert.equal(instagram.mode, 'addToQueue')
  assert.deepEqual(instagram.metadata, { instagram: { type: 'reel', shouldShareToFeed: true } })
  assert.deepEqual(instagram.assets, [
    {
      video: {
        url: 'https://www.joshuafink.com/listing-videos/4127-edwards-ave-nashville.mp4',
        metadata: { thumbnailOffset: 2000 },
      },
    },
  ])
  const facebook = bufferVideoPostVariables({
    channelId: 'fb-channel',
    text: 'caption',
    videoUrl: 'https://www.joshuafink.com/listing-videos/x.mp4',
    target: 'facebook',
  }).input
  assert.deepEqual(facebook.metadata, { facebook: { type: 'reel' } })
  assert.deepEqual(requiredListingVideoChannels(undefined), ['youtube', 'instagram'])
  assert.deepEqual(requiredListingVideoChannels(' fb '), ['youtube', 'instagram', 'facebook'])
  assert.equal(listingVideoFullyPosted(new Set(['youtube', 'instagram']), ['youtube', 'instagram']), true)
  assert.equal(listingVideoFullyPosted(new Set(['instagram']), ['youtube', 'instagram']), false)
})

test('tour video file ignores anything that is not an 11-character YouTube id', () => {
  assert.equal(sanitizeTourVideoId('abcdefghijk'), 'abcdefghijk')
  assert.equal(sanitizeTourVideoId('short'), undefined)
  assert.equal(sanitizeTourVideoId('https://youtu.be/abcdefghijk'), undefined)
  assert.deepEqual(
    tourVideosFromRecord({ '4127-edwards-ave-nashville': 'abcdefghijk', '../etc': 'abcdefghijk', bad: 'nope' }),
    { '4127-edwards-ave-nashville': 'abcdefghijk' },
  )
  assert.equal(getTourVideoId('4127-edwards-ave-nashville'), undefined)
})

test('filter graph is a Ken Burns zoompan with the end card text kept out of the photo plate', () => {
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
  const filter = clipFilterScript({
    motion: 'zoom-in',
    frames: 90,
    fontFile: font,
    textFiles: { address: '/tmp/address.txt', city: '/tmp/city.txt', specs: '/tmp/specs.txt', price: '/tmp/price.txt' },
  })
  assert.match(filter, /zoompan=/)
  assert.match(filter, /1080x720/)
  assert.match(filter, /boxblur/)
  assert.equal(filter.includes('Parks'), false)
  assert.match(kenBurnsFilter('pan-left', 60), /zoompan=/)
  const xfade = xfadeFilterScript(3, 4, 0.5)
  assert.match(xfade, /xfade=transition=fade:duration=0.500:offset=3.500/)
  assert.match(xfade, /offset=7.000/)
  assert.match(xfade, /\[vout\]/)
})

test('workflow renders with ffmpeg, alerts on failure, and can target one address', () => {
  const workflow = readFileSync(path.join(repoRoot, '.github/workflows/listing-video.yml'), 'utf8')
  const sync = readFileSync(path.join(repoRoot, '.github/workflows/sync-listings.yml'), 'utf8')
  assert.match(workflow, /ffmpeg/)
  assert.match(workflow, /workflow_dispatch/)
  assert.match(workflow, /address:/)
  assert.match(workflow, /PUSHOVER_TOKEN/)
  assert.match(workflow, /BUFFER_FB_CHANNEL_ID/)
  assert.match(workflow, /YOUTUBE_REFRESH_TOKEN/)
  assert.match(workflow, /youtube\.upload/)
  assert.match(sync, /listing-video\.yml/)
  assert.equal(/parks/i.test(workflow), false)
  assert.match(workflow, /PAUSED/)
  assert.equal(/^\s*schedule:/m.test(workflow), false)
  assert.equal(/^\s*push:/m.test(workflow), false)
})

test('custom listing copy keeps the Short conventions and names the phone, license, and AI motion', () => {
  const listing = home({
    address: '201 Spartan Dr',
    city: 'Nashville, TN 37211 | MLS #3634243',
    price: 449900,
    beds: 4,
    baths: 2,
    sqft: 1477,
    compassUrl: 'https://www.compass.com/homedetails/201-Spartan-Dr-Nashville-TN-37211/SWBYM_pid/',
  })
  assert.equal(listingVideoTitle(listing), '201 Spartan Dr, Nashville TN | Home for Sale')
  const description = listingVideoCustomDescription(listing)
  const caption = listingVideoCustomCaption(listing, 'instagram')
  for (const text of [description, caption]) {
    assert.match(text, /Joshua Fink/)
    assert.match(text, /Compass/)
    assert.match(text, /615-551-2727/)
    assert.match(text, /TREC #351484/)
    assert.match(text, /AI-enhanced/)
    assert.match(text, /https:\/\/www\.joshuafink\.com\/listings\/201-spartan-dr-nashville/)
    assert.equal(listingVideoCopyProblem(text), null)
    assert.equal(text.includes('615-551-3399'), false)
    assert.equal(/parks/i.test(text), false)
    assert.equal(text.includes('Mixkit'), false)
    assert.equal(text.includes('Lily J'), false)
  }
  assert.match(description, /#Shorts/)
  assert.match(description, /utm_source=youtube/)
  assert.match(caption, /#JustListed/)
  assert.match(caption, /utm_source=instagram/)
  assert.deepEqual(YOUTUBE_LISTING_TAGS, ['home for sale', 'Compass', 'Joshua Fink'])
  assert.equal(youtubeScopeAllowsUpdate('https://www.googleapis.com/auth/youtube.upload'), false)
  assert.equal(youtubeScopeAllowsUpdate('https://www.googleapis.com/auth/youtube'), true)
  assert.equal(youtubeScopeAllowsUpdate('https://www.googleapis.com/auth/youtube.force-ssl'), true)
  assert.match(youtubeUpdateScopeMessage(), /videos\.update/)
  assert.match(youtubeUpdateScopeMessage(), /youtube\.upload/)
})

test('upload sends the listing tags and a public embeddable video', async () => {
  let initBody = ''
  const result = await uploadYoutubeShort({
    credentials: { clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh' },
    filePath: path.join(repoRoot, 'package.json'),
    title: '201 Spartan Dr, Nashville TN | Home for Sale',
    description: 'Motion in this video is AI-enhanced.',
    fetchImpl: (async (url: string, init?: RequestInit) => {
      const target = String(url)
      if (target.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({ access_token: 'ya29.test', scope: YOUTUBE_UPLOAD_SCOPE }), { status: 200 })
      }
      if (target.includes('/upload/youtube/')) {
        initBody = String(init?.body ?? '')
        return new Response('', { status: 200, headers: { Location: 'https://upload.example/session' } })
      }
      return new Response(JSON.stringify({ id: 'abcdefghijk' }), { status: 200 })
    }) as typeof fetch,
  })
  assert.equal(result.ok, true)
  const payload = JSON.parse(initBody) as {
    snippet: { tags: string[] }
    status: { privacyStatus: string; embeddable: boolean; selfDeclaredMadeForKids: boolean }
  }
  assert.deepEqual(payload.snippet.tags, ['home for sale', 'Compass', 'Joshua Fink'])
  assert.equal(payload.status.privacyStatus, 'public')
  assert.equal(payload.status.embeddable, true)
  assert.equal(payload.status.selfDeclaredMadeForKids, false)
})

test('unlist is skipped when the token can upload but cannot call videos.update', async () => {
  const calls: string[] = []
  const result = await unlistYoutubeVideo({
    credentials: { clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh' },
    videoId: '3XpZKdw8iDU',
    fetchImpl: (async (url: string) => {
      calls.push(String(url))
      return new Response(
        JSON.stringify({ access_token: 'ya29.test', scope: 'https://www.googleapis.com/auth/youtube.upload' }),
        { status: 200 },
      )
    }) as typeof fetch,
  })
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.kind, 'scope')
    assert.match(result.error, /privacyStatus/)
  }
  assert.equal(calls.length, 1)
  assert.equal(calls.some((url) => url.includes('/youtube/v3/videos')), false)
})

test('unlist sets privacyStatus to unlisted and keeps embeddable', async () => {
  let putBody = ''
  const result = await unlistYoutubeVideo({
    credentials: { clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh' },
    videoId: '3XpZKdw8iDU',
    fetchImpl: (async (url: string, init?: RequestInit) => {
      const target = String(url)
      if (target.includes('oauth2.googleapis.com/token')) {
        return new Response(
          JSON.stringify({ access_token: 'ya29.test', scope: 'https://www.googleapis.com/auth/youtube' }),
          { status: 200 },
        )
      }
      if ((init?.method ?? 'GET') === 'GET') {
        return new Response(
          JSON.stringify({
            items: [
              {
                status: {
                  privacyStatus: 'public',
                  embeddable: true,
                  license: 'youtube',
                  publicStatsViewable: true,
                  selfDeclaredMadeForKids: false,
                },
              },
            ],
          }),
          { status: 200 },
        )
      }
      putBody = String(init?.body ?? '')
      return new Response(JSON.stringify({ id: '3XpZKdw8iDU', status: { privacyStatus: 'unlisted' } }), { status: 200 })
    }) as typeof fetch,
  })
  assert.equal(result.ok, true)
  const body = JSON.parse(putBody) as {
    id: string
    status: { privacyStatus: string; embeddable: boolean; license: string }
  }
  assert.equal(body.id, '3XpZKdw8iDU')
  assert.equal(body.status.privacyStatus, 'unlisted')
  assert.equal(body.status.embeddable, true)
  assert.equal(body.status.license, 'youtube')
})

test('a 403 from videos.update is a scope skip, not a thrown upload failure', async () => {
  const result = await unlistYoutubeVideo({
    credentials: { clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh' },
    videoId: '3XpZKdw8iDU',
    fetchImpl: (async (url: string, init?: RequestInit) => {
      const target = String(url)
      if (target.includes('oauth2.googleapis.com/token')) {
        return new Response(
          JSON.stringify({ access_token: 'ya29.test', scope: 'https://www.googleapis.com/auth/youtube' }),
          { status: 200 },
        )
      }
      if ((init?.method ?? 'GET') === 'GET') {
        return new Response(JSON.stringify({ items: [{ status: { privacyStatus: 'public', embeddable: true } }] }), {
          status: 200,
        })
      }
      return new Response(JSON.stringify({ error: { code: 403, message: 'insufficientPermissions' } }), { status: 403 })
    }) as typeof fetch,
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.kind, 'scope')
})

test('listing page URL carries UTM tags', () => {
  const url = listingVideoPageUrl(home(), 'youtube')
  const parsed = new URL(url)
  assert.equal(parsed.hostname, 'www.joshuafink.com')
  assert.equal(parsed.searchParams.get('utm_source'), 'youtube')
  assert.equal(parsed.searchParams.get('utm_campaign'), 'listing-video')
})

function hasBinary(name: string): boolean {
  try {
    execFileSync(name, ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

test(
  'ffmpeg builds a short vertical file with silent audio',
  {
    skip:
      !hasBinary('ffmpeg') ||
      !hasBinary('ffprobe') ||
      !(() => {
        try {
          resolveListingVideoFont()
          return true
        } catch {
          return false
        }
      })(),
  },
  async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'listing-video-'))
  const photos = [path.join(dir, 'a.jpg'), path.join(dir, 'b.jpg')]
  execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=0x336699:s=1600x1066', '-frames:v', '1', photos[0]], {
    stdio: 'ignore',
  })
  execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=0x663333:s=1600x1066', '-frames:v', '1', photos[1]], {
    stdio: 'ignore',
  })
  const rendered = await renderListingVideo({
    photos,
    overlay: listingVideoOverlay(home()),
    outFile: path.join(dir, 'out.mp4'),
    workDir: path.join(dir, 'work'),
    photoVisibleSec: 2,
    endCardSec: 1,
    crossfadeSec: 0.4,
  })
  assert.equal(rendered.width, 1080)
  assert.equal(rendered.height, 1920)
  assert.equal(rendered.hasAudio, true)
  assert.ok(rendered.durationSec >= 2.5 && rendered.durationSec <= 4.5)
})
