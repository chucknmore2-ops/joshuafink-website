// LinkedIn publish for same-day listing events.
//
// Uses the same member token and ugcPosts endpoint as
// app/api/cron/linkedin-post. The photo is uploaded when LinkedIn accepts
// it. If the upload fails, the post still goes out as an article share of
// the joshuafink.com listing page (the path the weekly route already uses).
// JPEG bytes come from the hosted /ig-photo URL, never a Compass WebP.

const LINKEDIN_UGC = 'https://api.linkedin.com/v2/ugcPosts'
const LINKEDIN_REGISTER = 'https://api.linkedin.com/v2/assets?action=registerUpload'

export type LinkedInListingInput = {
  accessToken: string
  authorUrn: string
  text: string
  title: string
  description: string
  articleUrl: string
  imageUrl?: string
}

export type LinkedInPublishResult =
  | { ok: true; postId: string; via: 'image' | 'article' }
  | { ok: false; error: string }

type RegisterBody = {
  value?: {
    asset?: string
    uploadMechanism?: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'?: {
        uploadUrl?: string
        headers?: Record<string, string>
      }
    }
  }
}

export function redactLinkedInSecret(text: string, accessToken: string): string {
  let out = text
  if (accessToken) out = out.split(accessToken).join('[redacted]')
  return out
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/g, 'Bearer [redacted]')
    .slice(0, 500)
}

function articleBody(input: LinkedInListingInput): Record<string, unknown> {
  return {
    author: input.authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: input.text },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: input.articleUrl,
            title: { text: input.title },
            description: { text: input.description },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }
}

function imageBody(input: LinkedInListingInput, asset: string): Record<string, unknown> {
  return {
    author: input.authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: input.text },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            media: asset,
            title: { text: input.title },
            description: { text: input.description },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }
}

async function readError(res: Response, accessToken: string): Promise<string> {
  const raw = await res.text().catch(() => '')
  const snippet = redactLinkedInSecret(raw.slice(0, 180), accessToken).replace(/[^\w\s.:,\-]/g, '')
  return `linkedin HTTP ${res.status}${snippet ? ` ${snippet}` : ''}`
}

async function postUgc(
  input: LinkedInListingInput,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<LinkedInPublishResult> {
  let res: Response
  try {
    res = await fetchImpl(LINKEDIN_UGC, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    return {
      ok: false,
      error: redactLinkedInSecret(`linkedin network: ${(err as Error).message}`, input.accessToken),
    }
  }
  if (!res.ok) return { ok: false, error: await readError(res, input.accessToken) }
  const data = (await res.json().catch(() => ({}))) as { id?: string }
  if (!data.id) return { ok: false, error: 'linkedin ugcPosts returned no id' }
  const via = (body.specificContent as { 'com.linkedin.ugc.ShareContent': { shareMediaCategory: string } })[
    'com.linkedin.ugc.ShareContent'
  ].shareMediaCategory
  return { ok: true, postId: data.id, via: via === 'IMAGE' ? 'image' : 'article' }
}

function looksLikeJpeg(bytes: Uint8Array, contentType: string): boolean {
  const type = contentType.toLowerCase()
  if (type.includes('jpeg') || type.includes('jpg')) return bytes.byteLength >= 100
  return bytes.byteLength >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

async function uploadImage(
  input: LinkedInListingInput,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; asset: string } | { ok: false; error: string }> {
  if (!input.imageUrl) return { ok: false, error: 'listing photo missing' }
  let imageRes: Response
  try {
    imageRes = await fetchImpl(input.imageUrl, {
      headers: { Accept: 'image/jpeg' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    return {
      ok: false,
      error: redactLinkedInSecret(`photo fetch: ${(err as Error).message}`, input.accessToken),
    }
  }
  if (!imageRes.ok) return { ok: false, error: `photo HTTP ${imageRes.status}` }
  const bytes = new Uint8Array(await imageRes.arrayBuffer())
  const contentType = imageRes.headers.get('content-type') ?? ''
  if (!looksLikeJpeg(bytes, contentType)) {
    return { ok: false, error: `photo is not jpeg (${contentType || 'unknown'})` }
  }

  let registerRes: Response
  try {
    registerRes = await fetchImpl(LINKEDIN_REGISTER, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: input.authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    return {
      ok: false,
      error: redactLinkedInSecret(`registerUpload network: ${(err as Error).message}`, input.accessToken),
    }
  }
  if (!registerRes.ok) return { ok: false, error: await readError(registerRes, input.accessToken) }
  const registered = (await registerRes.json().catch(() => ({}))) as RegisterBody
  const upload = registered.value?.uploadMechanism?.[
    'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
  ]
  const asset = registered.value?.asset
  if (!upload?.uploadUrl || !asset) return { ok: false, error: 'registerUpload returned no upload url' }

  const headers = new Headers(upload.headers ?? {})
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'image/jpeg')
  let putRes: Response
  try {
    putRes = await fetchImpl(upload.uploadUrl, {
      method: 'PUT',
      headers,
      body: bytes,
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    return {
      ok: false,
      error: redactLinkedInSecret(`photo upload network: ${(err as Error).message}`, input.accessToken),
    }
  }
  if (!putRes.ok) return { ok: false, error: await readError(putRes, input.accessToken) }
  return { ok: true, asset }
}

export async function publishLinkedInListingPost(
  input: LinkedInListingInput,
  fetchImpl: typeof fetch = fetch,
): Promise<LinkedInPublishResult> {
  const accessToken = input.accessToken.trim()
  const authorUrn = input.authorUrn.trim()
  if (!accessToken || !authorUrn) {
    return { ok: false, error: 'LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN not set' }
  }
  const ready = { ...input, accessToken, authorUrn }

  if (ready.imageUrl) {
    const uploaded = await uploadImage(ready, fetchImpl)
    if (uploaded.ok) {
      const posted = await postUgc(ready, imageBody(ready, uploaded.asset), fetchImpl)
      if (posted.ok) return posted
    }
  }

  return postUgc(ready, articleBody(ready), fetchImpl)
}
