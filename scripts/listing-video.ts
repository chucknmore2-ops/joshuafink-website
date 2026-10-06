// Renders a vertical listing video and, on GitHub Actions, publishes it.
//
//   npx tsx scripts/listing-video.ts --sample --address "4127 Edwards Ave" --out /tmp/edwards.mp4
//   npx tsx scripts/listing-video.ts
//   ADDRESS="4127 Edwards Ave" npx tsx scripts/listing-video.ts
//
// Automatic runs skip the launch seed in lib/listing-video.ts. A manual
// address ignores that seed and still refuses to post a channel twice.

import { spawn } from 'node:child_process'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { listings, type Listing } from '../lib/listings'
import { soldListings } from '../lib/sold-listings'
import { isJpegBuffer } from '../lib/compass-photo'
import { sanitizeTourVideoId, tourVideosFromRecord } from '../lib/listing-detail'
import { findListingByAddress } from '../app/api/cron/gbp-post/just-listed'
import { queueBufferVideoPost } from '../lib/buffer-publish'
import {
  LISTING_VIDEO_JOB,
  LISTING_VIDEO_PER_RUN,
  LISTING_VIDEO_SEED_ADDRESSES,
  compassPhotoJpegCandidates,
  isListingVideoSeeded,
  listingPhotoIds,
  listingVideoCaption,
  listingVideoDescription,
  listingVideoFullyPosted,
  listingVideoOverlay,
  listingVideoPageUrl,
  listingVideoPublicUrl,
  listingVideoSlug,
  listingVideoTitle,
  planAutomaticListingVideos,
  readYoutubeCredentials,
  requiredListingVideoChannels,
  youtubeSetupMessage,
} from '../lib/listing-video'
import { renderListingVideo } from '../lib/listing-video-render'
import { uploadYoutubeShort } from '../lib/listing-video-youtube'
import {
  createListingVideoPool,
  logListingVideo,
  postedListingVideoChannels,
  seedListingVideoRow,
} from '../lib/listing-video-log'
import type { Pool } from 'pg'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
const SEED_CHANNELS = ['youtube', 'instagram', 'facebook'] as const

interface Cli {
  sample: boolean
  address: string
  out: string
}

function parseCli(argv: string[]): Cli {
  let sample = false
  let address = process.env.ADDRESS?.trim() ?? ''
  let out = ''
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--sample') sample = true
    else if (arg === '--address') address = argv[++i] ?? ''
    else if (arg === '--out') out = argv[++i] ?? ''
    else if (arg.startsWith('--address=')) address = arg.slice('--address='.length)
    else if (arg.startsWith('--out=')) out = arg.slice('--out='.length)
  }
  return { sample, address: address.trim(), out: out.trim() }
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
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(`${cmd} ${args[0] ?? ''} exited ${code}\n${stderr.slice(-800)}`))
    })
  })
}

async function alertFailure(message: string): Promise<void> {
  console.error(message)
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
        title: 'Listing video failed',
        message: message.slice(0, 1024),
        priority: '1',
      }),
    })
    if (!res.ok) console.warn(`Pushover alert failed with HTTP ${res.status}`)
    else await writeFile('/tmp/listing-video-alerted', '1')
  } catch (err) {
    console.warn(`Pushover alert failed: ${(err as Error).message}`)
  }
}

async function summary(line: string): Promise<void> {
  console.log(line)
  const file = process.env.GITHUB_STEP_SUMMARY
  if (file) await writeFile(file, `${line}\n`, { flag: 'a' })
}

async function downloadPhotos(listing: Listing, destDir: string): Promise<string[]> {
  await mkdir(destDir, { recursive: true })
  let html = ''
  try {
    const res = await fetch(listing.compassUrl, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(25_000),
    })
    if (res.ok) html = await res.text()
    else console.warn(`Compass page HTTP ${res.status} for ${listing.address}`)
  } catch (err) {
    console.warn(`Compass page fetch failed for ${listing.address}: ${(err as Error).message}`)
  }
  const ids = listingPhotoIds(html, listing.imageUrl)
  const files: string[] = []
  for (const id of ids) {
    const dest = path.join(destDir, `${files.length}.jpg`)
    let saved = false
    for (const url of compassPhotoJpegCandidates(id)) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Accept: 'image/jpeg' },
          signal: AbortSignal.timeout(25_000),
        })
        if (!res.ok) continue
        const bytes = new Uint8Array(await res.arrayBuffer())
        if (!isJpegBuffer(bytes) || bytes.byteLength < 8_000) continue
        await writeFile(dest, bytes)
        saved = true
        break
      } catch {
        continue
      }
    }
    if (saved) files.push(dest)
  }
  if (files.length === 0) {
    throw new Error(`No listing photos could be downloaded for ${listing.address}`)
  }
  console.log(`Downloaded ${files.length} photo(s) for ${listing.address}`)
  return files
}

function findAddress(address: string): Listing | null {
  return findListingByAddress(address, listings) ?? findListingByAddress(address, soldListings)
}

async function connectPool(): Promise<Pool | null> {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? ''
  if (!databaseUrl) return null
  const pool = createListingVideoPool(databaseUrl)
  try {
    await pool.query('SELECT 1')
    return pool
  } catch (err) {
    await pool.end().catch(() => undefined)
    throw new Error(`post_log could not be read: ${(err as Error).message}`)
  }
}

function configSkip(error: string): boolean {
  return /invalid_grant|unauthorized|deleted_client|invalid_client|upload scope|not configured/i.test(error)
}

interface Prepared {
  listing: Listing
  slug: string
  videoUrl: string
  youtubeId?: string
  youtubeError?: string
}

async function renderToPublic(listing: Listing, slug: string): Promise<string> {
  const dest = path.join(repoRoot, 'public', 'listing-videos', `${slug}.mp4`)
  const work = path.join('/tmp', 'listing-video', slug)
  const photos = await downloadPhotos(listing, path.join(work, 'photos'))
  const rendered = await renderListingVideo({
    photos,
    overlay: listingVideoOverlay(listing),
    outFile: path.join(work, 'listing.mp4'),
    workDir: work,
  })
  if (rendered.durationSec < 20 || rendered.durationSec > 30) {
    throw new Error(
      `Listing video for ${listing.address} is ${rendered.durationSec.toFixed(1)}s, expected 20–30s`,
    )
  }
  await mkdir(path.dirname(dest), { recursive: true })
  await copyFile(rendered.file, dest)
  console.log(
    `Rendered ${listing.address}: ${rendered.width}x${rendered.height} ${rendered.durationSec.toFixed(1)}s`,
  )
  return dest
}

async function publishYoutube(
  pool: Pool,
  listing: Listing,
  slug: string,
  mp4: string,
  already: boolean,
): Promise<{ videoId?: string; note: string; failed: boolean }> {
  if (already) return { note: 'YouTube already logged.', failed: false }
  const creds = readYoutubeCredentials(process.env)
  if (!creds.ok) {
    const note = youtubeSetupMessage('missing')
    await summary(`YouTube skipped for ${listing.address}. ${note}`)
    return { note, failed: false }
  }
  const uploaded = await uploadYoutubeShort({
    credentials: creds.credentials,
    filePath: mp4,
    title: listingVideoTitle(listing),
    description: listingVideoDescription(listing),
  })
  if (!uploaded.ok) {
    const config = uploaded.kind === 'scope' || configSkip(uploaded.error)
    if (config) {
      await summary(`YouTube skipped for ${listing.address}. ${uploaded.error}`)
      return { note: uploaded.error, failed: false }
    }
    await logListingVideo(pool, {
      channel: 'youtube',
      jobName: LISTING_VIDEO_JOB,
      refKey: slug,
      messagePreview: listingVideoTitle(listing),
      link: listingVideoPageUrl(listing, 'youtube'),
      status: 'failed',
      errorMessage: uploaded.error,
    })
    return { note: uploaded.error, failed: true }
  }
  await logListingVideo(pool, {
    channel: 'youtube',
    jobName: LISTING_VIDEO_JOB,
    refKey: slug,
    messagePreview: listingVideoTitle(listing),
    link: `https://www.youtube.com/shorts/${uploaded.videoId}`,
    externalPostId: uploaded.videoId,
    status: 'posted',
  })
  await summary(`YouTube Short ${uploaded.videoId} for ${listing.address}`)
  return { videoId: uploaded.videoId, note: 'uploaded', failed: false }
}

async function writeTourId(slug: string, videoId: string | undefined): Promise<void> {
  if (!videoId || !sanitizeTourVideoId(videoId)) return
  const jsonPath = path.join(repoRoot, 'lib', 'listing-tour-videos.json')
  const current = JSON.parse(await readFile(jsonPath, 'utf8')) as unknown
  const merged = tourVideosFromRecord({
    ...(current && typeof current === 'object' ? current : {}),
    [slug]: videoId,
  })
  const ordered = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)))
  await writeFile(jsonPath, `${JSON.stringify(ordered, null, 2)}\n`)
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
  if (!fallback) throw new Error('No GitHub token available to commit the listing video.')
  return fallback
}

async function commitPublicVideos(slugs: string[]): Promise<string | null> {
  const paths = [
    ...slugs.map((slug) => `public/listing-videos/${slug}.mp4`),
    'lib/listing-tour-videos.json',
  ]
  await run('git', ['add', '--', ...paths])
  const dirty = await run('git', ['diff', '--cached', '--name-only', '--', ...paths])
  if (!dirty.trim()) {
    console.log('Listing video files are already committed.')
    return null
  }
  if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('Listing video files changed, but this is not GitHub Actions, so nothing was pushed.')
  }
  const token = await githubToken()
  const ghEnv = { ...process.env, GH_TOKEN: token }
  await run('git', ['config', 'user.name', 'github-actions[bot]'])
  await run('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com'])
  const branch = `listing-video/${process.env.GITHUB_RUN_ID || Date.now()}`
  const message = `Add listing video ${slugs.join(', ')}`
  await run('git', ['checkout', '-b', branch])
  await run('git', ['commit', '-m', message, '--', ...paths])
  await run('git', ['push', 'origin', branch])
  const body = [
    'Automated listing video.',
    '',
    'Adds the MP4 Buffer needs at a stable joshuafink.com URL and, when YouTube accepted the upload, the video id for the listing page.',
    '',
    slugs.map((slug) => `- \`/listing-videos/${slug}.mp4\``).join('\n'),
  ].join('\n')
  const prUrl = await run(
    'gh',
    ['pr', 'create', '--base', 'main', '--head', branch, '--title', message, '--body', body],
    ghEnv,
  )
  console.log(`Opened ${prUrl}`)
  await run('gh', ['pr', 'merge', prUrl, '--squash', '--auto', '--delete-branch'], ghEnv)
  for (let i = 1; i <= 30; i++) {
    const state = await run('gh', ['pr', 'view', prUrl, '--json', 'state', '--jq', '.state'], ghEnv).catch(
      () => 'unknown',
    )
    console.log(`Video PR state: ${state} (check ${i})`)
    if (state === 'MERGED') return prUrl
    await new Promise((resolve) => setTimeout(resolve, 30_000))
  }
  throw new Error(`Listing video PR was not merged within 15 minutes: ${prUrl}`)
}

async function waitForVideo(url: string): Promise<void> {
  for (let i = 1; i <= 30; i++) {
    try {
      const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
      const type = res.headers.get('content-type') ?? ''
      const range = res.headers.get('content-range') ?? ''
      const total = Number(/\/(\d+)\s*$/.exec(range)?.[1] ?? res.headers.get('content-length') ?? 0)
      console.log(`Video URL attempt ${i}: HTTP ${res.status} ${type} bytes ${total}`)
      if ((res.status === 200 || res.status === 206) && (type.includes('video') || total > 100_000)) {
        return
      }
    } catch (err) {
      console.log(`Video URL attempt ${i}: ${(err as Error).message}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 30_000))
  }
  throw new Error(`Listing video was not reachable at ${url}`)
}

async function queueSocial(
  pool: Pool,
  listing: Listing,
  slug: string,
  posted: Set<string>,
): Promise<string[]> {
  const failures: string[] = []
  const apiKey = process.env.BUFFER_API_KEY?.trim() ?? ''
  const videoUrl = listingVideoPublicUrl(slug)
  const igChannel = process.env.BUFFER_IG_CHANNEL_ID?.trim() ?? ''
  const fbChannel = process.env.BUFFER_FB_CHANNEL_ID?.trim() ?? ''

  if (!posted.has('instagram')) {
    if (!apiKey || !igChannel) {
      failures.push('BUFFER_API_KEY or BUFFER_IG_CHANNEL_ID is not set.')
    } else {
      const queued = await queueBufferVideoPost({
        apiKey,
        channelId: igChannel,
        text: listingVideoCaption(listing, 'instagram'),
        videoUrl,
        target: 'instagram',
        missingChannelError: 'BUFFER_IG_CHANNEL_ID not set',
      })
      if (!queued.ok) {
        await logListingVideo(pool, {
          channel: 'instagram',
          jobName: LISTING_VIDEO_JOB,
          refKey: slug,
          messagePreview: listingVideoCaption(listing, 'instagram').slice(0, 180),
          link: listingVideoPageUrl(listing, 'instagram'),
          status: 'failed',
          errorMessage: queued.error,
        })
        failures.push(`Instagram: ${queued.error}`)
      } else {
        await logListingVideo(pool, {
          channel: 'instagram',
          jobName: LISTING_VIDEO_JOB,
          refKey: slug,
          messagePreview: listingVideoCaption(listing, 'instagram').slice(0, 180),
          link: listingVideoPageUrl(listing, 'instagram'),
          externalPostId: queued.postId,
          status: 'posted',
        })
        await summary(`Queued Instagram Reel for ${listing.address} (${queued.postId})`)
      }
    }
  }

  if (!fbChannel) {
    await summary(`Facebook skipped for ${listing.address}. BUFFER_FB_CHANNEL_ID is not set.`)
  } else if (!posted.has('facebook')) {
    if (!apiKey) {
      failures.push('BUFFER_API_KEY is not set, so Facebook was not queued.')
    } else {
      const queued = await queueBufferVideoPost({
        apiKey,
        channelId: fbChannel,
        text: listingVideoCaption(listing, 'facebook'),
        videoUrl,
        target: 'facebook',
        missingChannelError: 'BUFFER_FB_CHANNEL_ID not set',
      })
      if (!queued.ok) {
        await logListingVideo(pool, {
          channel: 'facebook',
          jobName: LISTING_VIDEO_JOB,
          refKey: slug,
          messagePreview: listingVideoCaption(listing, 'facebook').slice(0, 180),
          link: listingVideoPageUrl(listing, 'facebook'),
          status: 'failed',
          errorMessage: queued.error,
        })
        failures.push(`Facebook: ${queued.error}`)
      } else {
        await logListingVideo(pool, {
          channel: 'facebook',
          jobName: LISTING_VIDEO_JOB,
          refKey: slug,
          messagePreview: listingVideoCaption(listing, 'facebook').slice(0, 180),
          link: listingVideoPageUrl(listing, 'facebook'),
          externalPostId: queued.postId,
          status: 'posted',
        })
        await summary(`Queued Facebook Reel for ${listing.address} (${queued.postId})`)
      }
    }
  }
  return failures
}

async function seedCurrent(pool: Pool): Promise<void> {
  for (const listing of listings) {
    if (!isListingVideoSeeded(listing.address)) continue
    const refKey = listingVideoSlug(listing)
    for (const channel of SEED_CHANNELS) {
      await seedListingVideoRow(pool, channel, refKey)
    }
  }
  await summary(
    `Seeded ${LISTING_VIDEO_SEED_ADDRESSES.length} current listings in post_log so this launch does not publish them.`,
  )
}

async function publishListing(
  pool: Pool,
  listing: Listing,
  postedMap: Map<string, Set<string>>,
): Promise<Prepared> {
  const slug = listingVideoSlug(listing)
  const posted = postedMap.get(slug) ?? new Set<string>()
  const publicFile = path.join(repoRoot, 'public', 'listing-videos', `${slug}.mp4`)
  const mp4 = existsSync(publicFile) ? publicFile : await renderToPublic(listing, slug)
  if (mp4 === publicFile) console.log(`Using the committed video for ${listing.address}`)
  const youtube = await publishYoutube(pool, listing, slug, mp4, posted.has('youtube'))
  if (youtube.videoId) await writeTourId(slug, youtube.videoId)
  return {
    listing,
    slug,
    videoUrl: listingVideoPublicUrl(slug),
    youtubeId: youtube.videoId,
    youtubeError: youtube.failed ? youtube.note : undefined,
  }
}

async function main(): Promise<void> {
  const cli = parseCli(process.argv.slice(2))
  if (cli.sample) {
    if (!cli.address) throw new Error('--sample requires --address')
    const listing = findAddress(cli.address)
    if (!listing) throw new Error(`No listing matches "${cli.address}"`)
    const out = cli.out || path.join('/tmp', `${listingVideoSlug(listing)}.mp4`)
    const work = path.join('/tmp', 'listing-video-sample', listingVideoSlug(listing))
    const photos = await downloadPhotos(listing, path.join(work, 'photos'))
    const rendered = await renderListingVideo({
      photos,
      overlay: listingVideoOverlay(listing),
      outFile: out,
      workDir: work,
    })
    if (rendered.durationSec < 20 || rendered.durationSec > 30) {
      throw new Error(`Sample is ${rendered.durationSec.toFixed(1)}s, expected 20–30 seconds`)
    }
    console.log(`Sample written to ${rendered.file} (${rendered.durationSec.toFixed(1)}s)`)
    return
  }

  const manual = Boolean(cli.address)
  const facebookId = process.env.BUFFER_FB_CHANNEL_ID
  const required = requiredListingVideoChannels(facebookId)
  let pool: Pool | null = null
  try {
    pool = await connectPool()
  } catch (err) {
    if (manual || planAutomaticListingVideos(listings).length > 0) throw err
    console.warn((err as Error).message)
  }

  if (!manual && !pool && planAutomaticListingVideos(listings).length === 0) {
    await summary('No new Active or Coming Soon listings. Launch seed is in the repo. post_log was not updated.')
    const creds = readYoutubeCredentials(process.env)
    if (!creds.ok) await summary(youtubeSetupMessage('missing'))
    return
  }
  if (!pool) throw new Error('DATABASE_URL is not set. Refusing to publish without post_log.')

  try {
    if (!manual) {
      try {
        await seedCurrent(pool)
      } catch (err) {
        console.warn(`Could not write launch seed rows: ${(err as Error).message}`)
      }
    }

    const postedMap = await postedListingVideoChannels(pool)
    let todo: Listing[]
    if (manual) {
      const listing = findAddress(cli.address)
      if (!listing) throw new Error(`No listing matches "${cli.address}"`)
      const slug = listingVideoSlug(listing)
      if (listingVideoFullyPosted(postedMap.get(slug), required)) {
        await summary(`${listing.address} already has a listing video on the required channels. Not posting again.`)
        return
      }
      todo = [listing]
    } else {
      const creds = readYoutubeCredentials(process.env)
      todo = []
      for (const listing of planAutomaticListingVideos(listings)) {
        const slug = listingVideoSlug(listing)
        const posted = postedMap.get(slug) ?? new Set<string>()
        const needsYoutube = !posted.has('youtube')
        const needsIg = !posted.has('instagram')
        const needsFb = required.includes('facebook') && !posted.has('facebook')
        if (!needsYoutube && !needsIg && !needsFb) continue
        if (!needsIg && !needsFb && needsYoutube && !creds.ok) {
          await summary(
            `${listing.address} is already queued to social. YouTube is still not configured, so this run will not render again.`,
          )
          continue
        }
        todo.push(listing)
        if (todo.length >= LISTING_VIDEO_PER_RUN) break
      }
      if (todo.length === 0) {
        await summary('No new Active or Coming Soon listings to turn into a video.')
        if (!creds.ok) await summary(youtubeSetupMessage('missing'))
        return
      }
    }

    const prepared: Prepared[] = []
    for (const listing of todo) {
      prepared.push(await publishListing(pool, listing, postedMap))
    }
    await commitPublicVideos(prepared.map((item) => item.slug))
    const failures: string[] = []
    for (const item of prepared) {
      await waitForVideo(item.videoUrl)
      const posted = postedMap.get(item.slug) ?? new Set<string>()
      if (item.youtubeId) posted.add('youtube')
      failures.push(...(await queueSocial(pool, item.listing, item.slug, posted)))
    }
    for (const item of prepared) {
      if (item.youtubeError) failures.push(`YouTube: ${item.youtubeError}`)
    }
    if (failures.length) {
      throw new Error(failures.join('\n'))
    }
  } finally {
    await pool.end()
  }
}

main().catch(async (err) => {
  const message = err instanceof Error ? err.message : String(err)
  await alertFailure(message)
  process.exit(1)
})
