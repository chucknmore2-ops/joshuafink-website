// Checks and file helpers for a finished listing MP4.
// The paused Ken Burns renderer is not used here.

import { createHash, timingSafeEqual } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { sanitizeTourVideoId, tourVideosFromRecord } from './listing-detail'

export function assertPublicHttpsUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('video_url is not a URL')
  }
  if (url.protocol !== 'https:') throw new Error('video_url must be https')
  if (url.username || url.password) throw new Error('video_url must not include credentials')
  const host = url.hostname.toLowerCase()
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
    throw new Error('video_url must be a public https URL')
  }
  return url
}

export function assertSha256Hex(value: string): string {
  const hex = value.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(hex)) throw new Error('sha256 must be 64 hex characters')
  return hex
}

export function sha256Matches(actual: string, expected: string): boolean {
  const left = Buffer.from(actual.trim().toLowerCase(), 'utf8')
  const right = Buffer.from(expected.trim().toLowerCase(), 'utf8')
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  const stream = createReadStream(filePath)
  for await (const chunk of stream) hash.update(chunk as Buffer)
  return hash.digest('hex')
}

/** Replace one slug's YouTube id and keep every other valid entry, sorted. */
export function mergeTourVideoFile(current: unknown, slug: string, videoId: string): Record<string, string> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Listing slug is not safe to store: ${slug}`)
  }
  const clean = sanitizeTourVideoId(videoId)
  if (!clean) throw new Error('YouTube id must be 11 characters')
  const base =
    current && typeof current === 'object' && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {}
  base[slug] = clean
  const merged = tourVideosFromRecord(base)
  return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)))
}
