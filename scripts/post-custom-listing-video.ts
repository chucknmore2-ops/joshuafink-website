// Posts one finished listing MP4. Does not render.
//
//   VIDEO_URL=https://... VIDEO_SHA256=... ADDRESS="201 Spartan Dr" \
//     npx tsx scripts/post-custom-listing-video.ts
//
// Runs from .github/workflows/post-custom-listing-video.yml only.
// A second run uploads another YouTube Short. Do not re-dispatch after
// RESULT youtube_id= is printed.

import { spawn } from 'node:child_process'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { listings, type Listing } from '../lib/listings'
import { soldListings } from '../lib/sold-listings'
import { findListingByAddress } from '../app/api/cron/gbp-post/just-listed'
import {
  fetchBufferPost,
  queueBufferVideoPost,
  retireQueuedBufferPost,
} from '../lib/buffer-publish'
import {
  assertPublicHttpsUrl,
  assertSha256Hex,
  mergeTourVideoFile,
  sha256File,
  sha256Matches,
} from '../lib/custom-listing-video'
import {
  LISTING_VIDEO_JOB,
  listingVideoCopyProblem,
  listingVideoCustomCaption,
  listingVideoCustomDescription,
  listingVideoPageUrl,
  listingVideoSlug,
  listingVideoTitle,
  readYoutubeCredentials,
  redactListingVideoSecrets,
  youtubeSetupMessage,
} from '../lib/listing-video'
import { createListingVideoPool, pointListingVideoPost } from '../lib/listing-video-log'
import { unlistYoutubeVideo, uploadYoutubeShort, YOUTUBE_LISTING_TAGS } from '../lib/listing-video-youtube'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAX_BYTES = 64 * 1024 * 1024

function required(name: string): string {
  const value = process.env[name]?.trim() ?? ''
  if (!value) throw new Error(`${name} is not set`)
  return value
}

function optional(name: string): string {
  return process.env[name]?.trim() ?? ''
}

function redact(text: string): string {
  const secrets = [
    process.env.BUFFER_API_KEY,
    process.env.BUFFER_IG_CHANNEL_ID,
    process.env.BUFFER_FB_CHANNEL_ID,
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REFRESH_TOKEN,
    process.env.DATABASE_URL,
    process.env.SYNC_PAT,
    process.env.GITHUB_TOKEN,
    process.env.GH_TOKEN,
    process.env.PUSHOVER_TOKEN,
    process.env.PUSHOVER_USER,
  ].filter((value): value is string => Boolean(value && value.trim()))
  return redactListingVideoSecrets(text, secrets)
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 300)
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = process.env): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: repoRoot, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (err) => reject(new Error(redact(err.message))))
    child.on('close', (code) => {
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(redact(`${cmd} ${args[0] ?? ''} exited ${code}\n${stderr.slice(-800)}`)))
    })
  })
}

async function summary(line: string): Promise<void> {
  const safe = line
    .split('\n')
    .map((part) => redact(part))
    .join('\n')
  console.log(safe)
  const file = process.env.GITHUB_STEP_SUMMARY
  if (file) await writeFile(file, `${safe}\n`, { flag: 'a' })
}

async function alertFailure(message: string): Promise<void> {
  const safe = redact(message).slice(0, 1024)
  console.error(safe)
  const token = process.env.PUSHOVER_TOKEN?.trim() ?? ''
  const user = process.env.PUSHOVER_USER?.trim() ?? ''
  if (!token || !user) {
    console.warn('PUSHOVER_TOKEN or PUSHOVER_USER is not set. Phone alert skipped.')
    return
  }
  try {
    const res = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      body: new URLSearchParams({
        token,
        user,
        title: 'Custom listing video failed',
        message: safe,
        priority: '1',
      }),
    })
    if (!res.ok) console.warn(`Pushover alert failed with HTTP ${res.status}`)
    else await writeFile('/tmp/custom-listing-video-alerted', '1')
  } catch (err) {
    console.warn(`Pushover alert failed: ${redact((err as Error).message)}`)
  }
}

function findAddress(address: string): Listing | null {
  return findListingByAddress(address, listings) ?? findListingByAddress(address, soldListings)
}

async function downloadVideo(url: string, dest: string): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true })
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'joshuafink-listing-video', Accept: 'video/mp4,*/*' },
    signal: AbortSignal.timeout(180_000),
  })
  if (!res.ok || !res.body) throw new Error(`Video download HTTP ${res.status}`)
  const declared = Number(res.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    throw new Error(`Video is ${declared} bytes, over the ${MAX_BYTES} byte cap`)
  }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  let read = await reader.read()
  while (!read.done) {
    const value = read.value
    if (value) {
      total += value.byteLength
      if (total > MAX_BYTES) throw new Error(`Video download exceeded ${MAX_BYTES} bytes`)
      chunks.push(value)
    }
    read = await reader.read()
  }
  if (total < 100_000) throw new Error(`Video download is only ${total} bytes`)
  await writeFile(dest, Buffer.concat(chunks))
}

async function githubToken(): Promise<string> {
  const pat = process.env.SYNC_PAT?.trim() ?? ''
  const fallback = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || ''
  if (pat) {
    const res = await fetch('https://api.github.com/rate_limit', {
      headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github+json' },
    })
    if (res.ok) return pat
    console.warn(`SYNC_PAT was rejected (HTTP ${res.status}). Opening the video PR with GITHUB_TOKEN.`)
  }
  if (!fallback) throw new Error('No GitHub token available to commit the tour video id.')
  return fallback
}

async function commitTourVideo(slug: string, videoId: string, address: string): Promise<string | null> {
  const jsonPath = path.join(repoRoot, 'lib', 'listing-tour-videos.json')
  const current = JSON.parse(await readFile(jsonPath, 'utf8')) as unknown
  const merged = mergeTourVideoFile(current, slug, videoId)
  await writeFile(jsonPath, `${JSON.stringify(merged, null, 2)}\n`)
  const rel = 'lib/listing-tour-videos.json'
  await run('git', ['add', '--', rel])
  const dirty = await run('git', ['diff', '--cached', '--name-only', '--', rel])
  if (!dirty.trim()) {
    await summary('listing-tour-videos.json already has this YouTube id.')
    return null
  }
  const token = await githubToken()
  const ghEnv = { ...process.env, GH_TOKEN: token }
  await run('git', ['config', 'user.name', 'github-actions[bot]'])
  await run('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com'])
  const branch = `custom-listing-video/${process.env.GITHUB_RUN_ID || Date.now()}`
  const message = `Point ${address} tour video at ${videoId}`
  await run('git', ['checkout', '-b', branch])
  await run('git', ['commit', '-m', message, '--', rel])
  await run('git', ['push', 'origin', branch])
  const body = [
    `Hand-made listing video for ${address}.`,
    '',
    'Updates lib/listing-tour-videos.json so the listing page embeds the new YouTube Short.',
    'The MP4 is not in this PR. Instagram is queued from the public video URL.',
    '',
    'Merge once the build and Vercel checks are green.',
  ].join('\n')
  const created = await run(
    'gh',
    ['pr', 'create', '--base', 'main', '--head', branch, '--title', message, '--body', body],
    ghEnv,
  )
  const prUrl = created
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('https://'))
  if (!prUrl) throw new Error('gh pr create did not return a pull request URL')
  await summary(`Opened ${prUrl}`)
  return prUrl
}

async function main(): Promise<void> {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('This script only posts from the post-custom-listing-video workflow.')
  }

  const videoUrl = required('VIDEO_URL')
  const expectedSha = assertSha256Hex(required('VIDEO_SHA256'))
  const address = required('ADDRESS')
  const replaceYoutubeId = optional('REPLACE_YOUTUBE_ID')
  const replaceBufferId = optional('REPLACE_BUFFER_ID')
  assertPublicHttpsUrl(videoUrl)
  if (replaceYoutubeId && !/^[A-Za-z0-9_-]{11}$/.test(replaceYoutubeId)) {
    throw new Error('REPLACE_YOUTUBE_ID must be an 11-character YouTube id')
  }
  if (replaceBufferId && !/^[A-Za-z0-9_-]{8,80}$/.test(replaceBufferId)) {
    throw new Error('REPLACE_BUFFER_ID is not a Buffer post id')
  }

  const listing = findAddress(address)
  if (!listing) throw new Error(`No listing matches "${address}"`)
  const slug = listingVideoSlug(listing)
  await summary(`Listing ${listing.address} (${slug})`)

  const title = listingVideoTitle(listing)
  const description = listingVideoCustomDescription(listing)
  const caption = listingVideoCustomCaption(listing, 'instagram')
  for (const [label, text] of [
    ['title', title],
    ['description', description],
    ['caption', caption],
    ['tags', YOUTUBE_LISTING_TAGS.join(' ')],
  ] as const) {
    const problem = listingVideoCopyProblem(text)
    if (problem) throw new Error(`Refusing to post the ${label} because it contains ${problem}`)
  }
  if (title.length > 100) throw new Error(`YouTube title is ${title.length} characters`)
  if (description.length > 5000) throw new Error(`YouTube description is ${description.length} characters`)
  if (caption.length > 2200) throw new Error(`Instagram caption is ${caption.length} characters`)

  const facebookChannel = process.env.BUFFER_FB_CHANNEL_ID?.trim() ?? ''
  if (!facebookChannel) await summary('Facebook skipped: BUFFER_FB_CHANNEL_ID is not set.')
  else await summary('Facebook skipped. This workflow posts YouTube and Instagram only.')

  const dest = path.join('/tmp', 'custom-listing-video', `${slug}.mp4`)
  try {
    await downloadVideo(videoUrl, dest)
  } catch (err) {
    await unlink(dest).catch(() => undefined)
    throw err
  }
  const actualSha = await sha256File(dest)
  if (!sha256Matches(actualSha, expectedSha)) {
    await unlink(dest).catch(() => undefined)
    throw new Error(`SHA256 mismatch for the downloaded video. expected ${expectedSha} actual ${actualSha}`)
  }
  await summary(`SHA256 matched ${actualSha}`)

  const creds = readYoutubeCredentials(process.env)
  if (!creds.ok) throw new Error(youtubeSetupMessage('missing'))
  const uploaded = await uploadYoutubeShort({
    credentials: creds.credentials,
    filePath: dest,
    title,
    description,
    tags: YOUTUBE_LISTING_TAGS,
  })
  if (!uploaded.ok) throw new Error(`YouTube upload failed: ${uploaded.error}`)
  const youtubeId = uploaded.videoId
  const youtubeUrl = `https://www.youtube.com/shorts/${youtubeId}`
  await summary(`YouTube Short ${youtubeUrl}`)

  let oldYoutubeUnlisted: 'yes' | 'no' | 'skipped' = 'skipped'
  let oldYoutubeNote = 'no replace_youtube_id'
  if (replaceYoutubeId && replaceYoutubeId !== youtubeId) {
    const unlisted = await unlistYoutubeVideo({ credentials: creds.credentials, videoId: replaceYoutubeId })
    if (unlisted.ok) {
      oldYoutubeUnlisted = 'yes'
      oldYoutubeNote = 'privacyStatus is unlisted'
      await summary(`Old YouTube Short ${replaceYoutubeId} is unlisted.`)
    } else {
      oldYoutubeUnlisted = 'no'
      oldYoutubeNote = oneLine(unlisted.error)
      await summary(
        `Old YouTube Short ${replaceYoutubeId} was not unlisted (${unlisted.kind}). The new Short is still uploaded.`,
      )
      await summary(unlisted.error)
    }
  }

  const fatal: string[] = []
  const apiKey = process.env.BUFFER_API_KEY?.trim() ?? ''
  const igChannel = process.env.BUFFER_IG_CHANNEL_ID?.trim() ?? ''
  if (!apiKey || !igChannel) throw new Error('BUFFER_API_KEY or BUFFER_IG_CHANNEL_ID is not set.')

  let bufferId = ''
  let bufferStatus = ''
  const queued = await queueBufferVideoPost({
    apiKey,
    channelId: igChannel,
    text: caption,
    videoUrl,
    target: 'instagram',
    missingChannelError: 'BUFFER_IG_CHANNEL_ID not set',
  })
  if (!queued.ok) {
    fatal.push(`Instagram queue failed: ${queued.error}`)
    await summary(fatal[fatal.length - 1])
  } else {
    bufferId = queued.postId
    bufferStatus = queued.status ?? ''
    if (!bufferStatus) {
      const lookedUp = await fetchBufferPost({ apiKey, postId: bufferId })
      if (lookedUp.ok) bufferStatus = lookedUp.post.status
      else await summary(`Could not read the new Buffer post status. ${oneLine(lookedUp.error)}`)
    }
    if (!bufferStatus) bufferStatus = 'queued'
    await summary(`Instagram Reel ${bufferId} status ${bufferStatus}`)
  }

  let oldBufferAction = 'skipped'
  let oldBufferStatus = ''
  if (bufferId && replaceBufferId) {
    const retired = await retireQueuedBufferPost({ apiKey, postId: replaceBufferId })
    if (!retired.ok) {
      oldBufferAction = 'error'
      fatal.push(`Old Buffer post ${replaceBufferId} could not be retired: ${retired.error}`)
      await summary(fatal[fatal.length - 1])
    } else {
      oldBufferAction = retired.action
      oldBufferStatus = retired.previousStatus
      if (retired.action === 'deleted') {
        await summary(`Deleted queued Buffer post ${replaceBufferId} (was ${retired.previousStatus}).`)
      } else if (retired.action === 'already_published') {
        await summary(
          `Old Buffer post ${replaceBufferId} was already published (status ${retired.previousStatus}). Buffer cannot remove it from Instagram.`,
        )
      } else {
        await summary(`Old Buffer post ${replaceBufferId} was not deleted (${retired.previousStatus}). ${retired.reason}`)
      }
    }
  } else if (!bufferId && replaceBufferId) {
    oldBufferAction = 'left_in_place'
    await summary(`Left Buffer post ${replaceBufferId} in place because the new Reel was not queued.`)
  }

  try {
    const databaseUrl = process.env.DATABASE_URL?.trim() ?? ''
    if (!databaseUrl) throw new Error('DATABASE_URL is not set. Refusing to publish without post_log.')
    const pool = createListingVideoPool(databaseUrl)
    try {
      await pool.query('SELECT 1')
      await pointListingVideoPost(pool, {
        channel: 'youtube',
        jobName: LISTING_VIDEO_JOB,
        refKey: slug,
        messagePreview: replaceYoutubeId ? `${title} (replaces ${replaceYoutubeId})` : title,
        link: youtubeUrl,
        externalPostId: youtubeId,
        status: 'posted',
      })
      if (bufferId) {
        await pointListingVideoPost(pool, {
          channel: 'instagram',
          jobName: LISTING_VIDEO_JOB,
          refKey: slug,
          messagePreview: caption.slice(0, 180),
          link: listingVideoPageUrl(listing, 'instagram'),
          externalPostId: bufferId,
          status: 'posted',
        })
      }
      await summary(`post_log now points ${slug} at YouTube ${youtubeId}${bufferId ? ` and Buffer ${bufferId}` : ''}.`)
    } finally {
      await pool.end().catch(() => undefined)
    }
  } catch (err) {
    fatal.push(`post_log update failed: ${redact((err as Error).message)}`)
    await summary(fatal[fatal.length - 1])
  }

  let prUrl: string | null = null
  try {
    prUrl = await commitTourVideo(slug, youtubeId, listing.address)
  } catch (err) {
    fatal.push(`Tour video file was not committed: ${redact((err as Error).message)}`)
    await summary(fatal[fatal.length - 1])
  }

  const lines = [
    `RESULT youtube_id=${youtubeId}`,
    `RESULT youtube_url=${youtubeUrl}`,
    `RESULT buffer_id=${bufferId || '-'}`,
    `RESULT buffer_status=${bufferStatus || '-'}`,
    `RESULT old_youtube_unlisted=${oldYoutubeUnlisted}`,
    `RESULT old_youtube_note=${oneLine(oldYoutubeNote)}`,
    `RESULT old_buffer_action=${oldBufferAction}`,
    `RESULT old_buffer_status=${oldBufferStatus || '-'}`,
    `RESULT tour_pr=${prUrl ?? 'unchanged'}`,
    'RESULT facebook=skipped',
  ]
  await summary(lines.join('\n'))
  if (fatal.length) throw new Error(fatal.join('\n'))
}

main().catch(async (err) => {
  const message = err instanceof Error ? err.message : String(err)
  await alertFailure(message)
  process.exit(1)
})
