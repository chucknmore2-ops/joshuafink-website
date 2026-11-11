// YouTube Data API resumable upload for a listing Short, plus videos.update
// to unlist a Short this channel already uploaded.
// A missing secret or a token without the upload scope is a reported skip,
// not a thrown error, so Instagram can still be queued.

import { readFile } from 'node:fs/promises'
import {
  redactListingVideoSecrets,
  youtubeScopeAllowsUpdate,
  youtubeScopeAllowsUpload,
  youtubeSetupMessage,
  youtubeUpdateScopeMessage,
  type YoutubeCredentials,
} from './listing-video'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
const UPLOAD_INIT =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status'
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'

export const YOUTUBE_LISTING_TAGS = ['home for sale', 'Compass', 'Joshua Fink']

export type YoutubeUploadResult =
  | { ok: true; videoId: string }
  | { ok: false; kind: 'scope' | 'auth' | 'upload'; error: string }

export type YoutubeUnlistResult =
  | { ok: true; videoId: string }
  | { ok: false; kind: 'scope' | 'auth' | 'update'; error: string }

interface TokenResponse {
  access_token?: string
  scope?: string
  error?: string
  error_description?: string
}

interface YoutubeStatus {
  privacyStatus?: string
  embeddable?: boolean
  license?: string
  publicStatsViewable?: boolean
  selfDeclaredMadeForKids?: boolean
}

type YoutubeAccess =
  | { ok: true; accessToken: string; scope: string }
  | { ok: false; kind: 'scope' | 'auth'; error: string }

function secretsOf(credentials: YoutubeCredentials): string[] {
  return [credentials.clientId, credentials.clientSecret, credentials.refreshToken]
}

async function getYoutubeAccess(opts: {
  credentials: YoutubeCredentials
  fetchImpl: typeof fetch
}): Promise<YoutubeAccess> {
  const fetchImpl = opts.fetchImpl
  const redact = (text: string) => redactListingVideoSecrets(text, secretsOf(opts.credentials))
  const tokenBody = new URLSearchParams({
    client_id: opts.credentials.clientId,
    client_secret: opts.credentials.clientSecret,
    refresh_token: opts.credentials.refreshToken,
    grant_type: 'refresh_token',
  })

  let tokenRes: Response
  try {
    tokenRes = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    })
  } catch (err) {
    return { ok: false, kind: 'auth', error: redact(`YouTube token request failed: ${(err as Error).message}`) }
  }

  const tokenRaw = await tokenRes.text()
  let tokenJson: TokenResponse = {}
  try {
    tokenJson = JSON.parse(tokenRaw) as TokenResponse
  } catch {
    tokenJson = {}
  }
  if (!tokenRes.ok || !tokenJson.access_token) {
    const detail = tokenJson.error_description || tokenJson.error || tokenRaw.slice(0, 200)
    return {
      ok: false,
      kind: 'auth',
      error: redact(`YouTube rejected the refresh token (${tokenJson.error || tokenRes.status}): ${detail}`),
    }
  }

  let scope = tokenJson.scope ?? ''
  if (!scope) {
    const infoRes = await fetchImpl(`${TOKENINFO_URL}?access_token=${encodeURIComponent(tokenJson.access_token)}`)
    const infoRaw = await infoRes.text()
    try {
      const info = JSON.parse(infoRaw) as { scope?: string }
      scope = info.scope ?? ''
    } catch {
      scope = ''
    }
  }
  return { ok: true, accessToken: tokenJson.access_token, scope }
}

export async function uploadYoutubeShort(opts: {
  credentials: YoutubeCredentials
  filePath: string
  title: string
  description: string
  tags?: readonly string[]
  fetchImpl?: typeof fetch
}): Promise<YoutubeUploadResult> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const redact = (text: string) => redactListingVideoSecrets(text, secretsOf(opts.credentials))
  const access = await getYoutubeAccess({ credentials: opts.credentials, fetchImpl })
  if (!access.ok) return access
  if (!youtubeScopeAllowsUpload(access.scope)) {
    return { ok: false, kind: 'scope', error: youtubeSetupMessage('scope') }
  }

  const bytes = new Uint8Array(await readFile(opts.filePath))
  const tags = opts.tags && opts.tags.length > 0 ? [...opts.tags] : [...YOUTUBE_LISTING_TAGS]
  let initRes: Response
  try {
    initRes = await fetchImpl(UPLOAD_INIT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(bytes.byteLength),
      },
      body: JSON.stringify({
        snippet: {
          title: opts.title,
          description: opts.description,
          categoryId: '22',
          tags,
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          embeddable: true,
        },
      }),
    })
  } catch (err) {
    return { ok: false, kind: 'upload', error: redact(`YouTube upload init failed: ${(err as Error).message}`) }
  }

  if (!initRes.ok) {
    const detail = await initRes.text().catch(() => '')
    return { ok: false, kind: 'upload', error: redact(`YouTube upload init HTTP ${initRes.status} ${detail}`) }
  }
  const location = initRes.headers.get('location')
  if (!location) {
    return { ok: false, kind: 'upload', error: 'YouTube upload init returned no Location header' }
  }

  let putRes: Response
  try {
    putRes = await fetchImpl(location, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${access.accessToken}`,
        'Content-Type': 'video/mp4',
      },
      body: bytes,
    })
  } catch (err) {
    return { ok: false, kind: 'upload', error: redact(`YouTube upload failed: ${(err as Error).message}`) }
  }
  const putRaw = await putRes.text()
  if (!putRes.ok) {
    return { ok: false, kind: 'upload', error: redact(`YouTube upload HTTP ${putRes.status} ${putRaw}`) }
  }
  let videoId = ''
  try {
    const parsed = JSON.parse(putRaw) as { id?: string }
    videoId = parsed.id?.trim() ?? ''
  } catch {
    videoId = ''
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return { ok: false, kind: 'upload', error: 'YouTube upload returned no video id' }
  }
  return { ok: true, videoId }
}

function updateBody(videoId: string, current: YoutubeStatus): string {
  const status: Record<string, unknown> = {
    privacyStatus: 'unlisted',
    embeddable: current.embeddable !== false,
    selfDeclaredMadeForKids: current.selfDeclaredMadeForKids === true,
  }
  if (current.license === 'youtube' || current.license === 'creativeCommon') status.license = current.license
  if (typeof current.publicStatsViewable === 'boolean') status.publicStatsViewable = current.publicStatsViewable
  return JSON.stringify({ id: videoId, status })
}

/**
 * Set an existing video's privacyStatus to unlisted.
 * youtube.upload is enough to upload and is not enough for videos.update.
 * A scope refusal is `kind: 'scope'` so the caller can keep the new upload.
 */
export async function unlistYoutubeVideo(opts: {
  credentials: YoutubeCredentials
  videoId: string
  fetchImpl?: typeof fetch
}): Promise<YoutubeUnlistResult> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const videoId = opts.videoId.trim()
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return { ok: false, kind: 'update', error: 'YouTube id must be 11 characters' }
  }
  const access = await getYoutubeAccess({ credentials: opts.credentials, fetchImpl })
  if (!access.ok) return access
  const redact = (text: string) =>
    redactListingVideoSecrets(text, [...secretsOf(opts.credentials), access.accessToken])
  if (!youtubeScopeAllowsUpdate(access.scope)) {
    return { ok: false, kind: 'scope', error: youtubeUpdateScopeMessage() }
  }

  const getUrl = `${VIDEOS_URL}?part=status&id=${encodeURIComponent(videoId)}`
  let current: YoutubeStatus = {}
  try {
    const getRes = await fetchImpl(getUrl, {
      headers: { Authorization: `Bearer ${access.accessToken}`, Accept: 'application/json' },
    })
    const getRaw = await getRes.text()
    if (getRes.status === 403) {
      return { ok: false, kind: 'scope', error: redact(`${youtubeUpdateScopeMessage()}\nYouTube HTTP 403 ${getRaw}`) }
    }
    if (!getRes.ok) {
      return { ok: false, kind: 'update', error: redact(`YouTube video lookup HTTP ${getRes.status} ${getRaw}`) }
    }
    const parsed = JSON.parse(getRaw) as { items?: Array<{ status?: YoutubeStatus }> }
    const item = parsed.items?.[0]
    if (!item) {
      return { ok: false, kind: 'update', error: `YouTube returned no video for ${videoId}` }
    }
    current = item.status ?? {}
  } catch (err) {
    return { ok: false, kind: 'update', error: redact(`YouTube video lookup failed: ${(err as Error).message}`) }
  }

  let putRes: Response
  try {
    putRes = await fetchImpl(`${VIDEOS_URL}?part=status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${access.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
      },
      body: updateBody(videoId, current),
    })
  } catch (err) {
    return { ok: false, kind: 'update', error: redact(`YouTube privacy update failed: ${(err as Error).message}`) }
  }
  const putRaw = await putRes.text()
  if (putRes.status === 403) {
    return { ok: false, kind: 'scope', error: redact(`${youtubeUpdateScopeMessage()}\nYouTube HTTP 403 ${putRaw}`) }
  }
  if (!putRes.ok) {
    return { ok: false, kind: 'update', error: redact(`YouTube privacy update HTTP ${putRes.status} ${putRaw}`) }
  }
  try {
    const parsed = JSON.parse(putRaw) as { status?: { privacyStatus?: string } }
    if (parsed.status?.privacyStatus !== 'unlisted') {
      return {
        ok: false,
        kind: 'update',
        error: `YouTube left privacyStatus as ${parsed.status?.privacyStatus || 'unknown'}`,
      }
    }
  } catch {
    return { ok: false, kind: 'update', error: 'YouTube privacy update returned no status' }
  }
  return { ok: true, videoId }
}
