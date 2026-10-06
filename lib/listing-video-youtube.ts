// YouTube Data API resumable upload for a listing Short.
// A missing secret or a token without the upload scope is a reported skip,
// not a thrown error, so Instagram can still be queued.

import { readFile } from 'node:fs/promises'
import {
  redactListingVideoSecrets,
  youtubeScopeAllowsUpload,
  youtubeSetupMessage,
  type YoutubeCredentials,
} from './listing-video'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
const UPLOAD_INIT =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status'

export type YoutubeUploadResult =
  | { ok: true; videoId: string }
  | { ok: false; kind: 'scope' | 'auth' | 'upload'; error: string }

interface TokenResponse {
  access_token?: string
  scope?: string
  error?: string
  error_description?: string
}

function secretsOf(credentials: YoutubeCredentials): string[] {
  return [credentials.clientId, credentials.clientSecret, credentials.refreshToken]
}

export async function uploadYoutubeShort(opts: {
  credentials: YoutubeCredentials
  filePath: string
  title: string
  description: string
  fetchImpl?: typeof fetch
}): Promise<YoutubeUploadResult> {
  const fetchImpl = opts.fetchImpl ?? fetch
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
  if (!youtubeScopeAllowsUpload(scope)) {
    return { ok: false, kind: 'scope', error: youtubeSetupMessage('scope') }
  }

  const bytes = new Uint8Array(await readFile(opts.filePath))
  let initRes: Response
  try {
    initRes = await fetchImpl(UPLOAD_INIT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(bytes.byteLength),
      },
      body: JSON.stringify({
        snippet: {
          title: opts.title,
          description: opts.description,
          categoryId: '22',
          tags: ['home for sale', 'Compass', 'Joshua Fink'],
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
        Authorization: `Bearer ${tokenJson.access_token}`,
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
