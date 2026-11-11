// Buffer Free GraphQL client for the Instagram autopost.
//
// Live path: createPost with schedulingType automatic and mode addToQueue.
// Graph (graph.facebook.com media create / poll / publish) is not called
// from here. Buffer fetches the image URL when the queue item publishes, so
// the URL has to stay public (www.joshuafink.com/ig-photo/…).

export const BUFFER_GRAPHQL_URL = 'https://api.buffer.com'

export const BUFFER_CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess {
        post {
          id
          status
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`

export type BufferPostChannel = 'instagram' | 'facebook'

export type BufferImagePostInput = {
  apiKey: string
  channelId: string
  text: string
  imageUrl: string
  /** Defaults to Instagram so the weekly autopost stays on that metadata. */
  channel?: BufferPostChannel
}

export type BufferQueueResult =
  | { ok: true; postId: string; status?: string }
  | { ok: false; error: string }

type CreatePostPayload = {
  __typename?: string
  message?: string
  post?: { id?: string | null; status?: string | null } | null
}

type BufferGraphqlBody = {
  data?: { createPost?: CreatePostPayload | null } | null
  errors?: Array<{ message?: string }> | null
}

export function bufferImagePostVariables(
  input: Pick<BufferImagePostInput, 'channelId' | 'text' | 'imageUrl' | 'channel'>,
): { input: Record<string, unknown> } {
  // InstagramPostMetadataInput.type is required for Instagram. Facebook's
  // type is PostTypeFacebook (`post`, not reel or story). A link card is
  // mutually exclusive with an image asset, so the listing URL stays in
  // the caption. https://developers.buffer.com/types/FacebookPostMetadataInput.html
  const channel = input.channel ?? 'instagram'
  const metadata =
    channel === 'facebook'
      ? { facebook: { type: 'post' } }
      : { instagram: { type: 'post', shouldShareToFeed: true } }
  return {
    input: {
      text: input.text,
      channelId: input.channelId,
      schedulingType: 'automatic',
      mode: 'addToQueue',
      assets: [{ image: { url: input.imageUrl } }],
      metadata,
    },
  }
}

export function redactBufferSecret(text: string, apiKey: string): string {
  let out = text
  if (apiKey) out = out.split(apiKey).join('[redacted]')
  return out
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/g, 'Bearer [redacted]')
    .slice(0, 500)
}

function asBody(raw: string): BufferGraphqlBody | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as BufferGraphqlBody
  } catch {
    return null
  }
}

function graphqlErrorText(body: { errors?: Array<{ message?: string }> | null } | null): string {
  const messages = (body?.errors ?? [])
    .map((err) => (typeof err?.message === 'string' ? err.message.trim() : ''))
    .filter(Boolean)
  return messages.join('; ')
}

/**
 * Turn a Buffer HTTP response into a queue result. A post id is success only
 * when the payload is PostActionSuccess (or omits __typename but still
 * returns post.id). MutationError and GraphQL errors are failures.
 */
export function interpretBufferCreatePost(
  httpStatus: number,
  raw: string,
  apiKey = '',
): BufferQueueResult {
  const body = asBody(raw)
  const snippet = redactBufferSecret(raw, apiKey)
  const graphMessage = redactBufferSecret(graphqlErrorText(body), apiKey)
  const createPost = body?.data?.createPost ?? null
  const typename = createPost?.__typename ?? ''
  const message =
    typeof createPost?.message === 'string' ? createPost.message.trim() : ''
  const postId = createPost?.post?.id

  if (httpStatus < 200 || httpStatus >= 300) {
    const why = redactBufferSecret(message || graphMessage || snippet, apiKey)
    return { ok: false, error: `buffer HTTP ${httpStatus}${why ? ` ${why}` : ''}` }
  }

  if (typename === 'PostActionSuccess' || (!typename && typeof postId === 'string' && postId)) {
    if (typeof postId === 'string' && postId) {
      const status = createPost?.post?.status
      return typeof status === 'string' && status ? { ok: true, postId, status } : { ok: true, postId }
    }
    return { ok: false, error: 'buffer PostActionSuccess returned no post id' }
  }

  if (message || graphMessage) {
    const why = redactBufferSecret(message || graphMessage, apiKey)
    const label = typename || 'error'
    return { ok: false, error: `buffer ${label}: ${why}` }
  }

  return {
    ok: false,
    error: `buffer createPost returned no post id${typename ? ` (${typename})` : ''}`,
  }
}

export type BufferVideoTarget = 'instagram' | 'facebook'

export function bufferVideoPostVariables(input: {
  channelId: string
  text: string
  videoUrl: string
  target: BufferVideoTarget
}): { input: Record<string, unknown> } {
  // Instagram Reel: type reel. shouldShareToFeed is required on that input.
  // Facebook 9:16 video: type reel (post | reel | story).
  // https://developers.buffer.com/examples/create-video-post.html
  const metadata =
    input.target === 'instagram'
      ? { instagram: { type: 'reel', shouldShareToFeed: true } }
      : { facebook: { type: 'reel' } }
  return {
    input: {
      text: input.text,
      channelId: input.channelId,
      schedulingType: 'automatic',
      mode: 'addToQueue',
      assets: [
        {
          video: {
            url: input.videoUrl,
            metadata: { thumbnailOffset: 2000 },
          },
        },
      ],
      metadata,
    },
  }
}

export async function queueBufferVideoPost(
  input: {
    apiKey: string
    channelId: string
    text: string
    videoUrl: string
    target: BufferVideoTarget
    missingChannelError: string
  },
  fetchImpl: typeof fetch = fetch,
): Promise<BufferQueueResult> {
  const apiKey = input.apiKey.trim()
  const channelId = input.channelId.trim()
  if (!apiKey) return { ok: false, error: 'BUFFER_API_KEY not set' }
  if (!channelId) return { ok: false, error: input.missingChannelError }
  if (!input.text.trim()) return { ok: false, error: 'caption missing' }
  if (!input.videoUrl.trim()) return { ok: false, error: 'video url missing' }

  let res: Response
  try {
    res = await fetchImpl(BUFFER_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: BUFFER_CREATE_POST_MUTATION,
        variables: bufferVideoPostVariables({
          channelId,
          text: input.text,
          videoUrl: input.videoUrl,
          target: input.target,
        }),
      }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    return {
      ok: false,
      error: redactBufferSecret(`buffer network: ${(err as Error).message}`, apiKey),
    }
  }

  const raw = await res.text().catch(() => '')
  return interpretBufferCreatePost(res.status, raw, apiKey)
}

export async function queueBufferImagePost(
  input: BufferImagePostInput,
  fetchImpl: typeof fetch = fetch,
): Promise<BufferQueueResult> {
  const apiKey = input.apiKey.trim()
  const channelId = input.channelId.trim()
  const channel = input.channel ?? 'instagram'
  if (!apiKey) return { ok: false, error: 'BUFFER_API_KEY not set' }
  if (!channelId) {
    return {
      ok: false,
      error: channel === 'facebook' ? 'BUFFER_FB_CHANNEL_ID not set' : 'BUFFER_IG_CHANNEL_ID not set',
    }
  }
  if (!input.text.trim()) return { ok: false, error: 'caption missing' }
  if (!input.imageUrl.trim()) return { ok: false, error: 'image url missing' }

  let res: Response
  try {
    res = await fetchImpl(BUFFER_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: BUFFER_CREATE_POST_MUTATION,
        variables: bufferImagePostVariables({
          channelId,
          text: input.text,
          imageUrl: input.imageUrl,
          channel,
        }),
      }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    return {
      ok: false,
      error: redactBufferSecret(`buffer network: ${(err as Error).message}`, apiKey),
    }
  }

  const raw = await res.text().catch(() => '')
  return interpretBufferCreatePost(res.status, raw, apiKey)
}

export async function queueInstagramImagePost(
  input: BufferImagePostInput,
  fetchImpl: typeof fetch = fetch,
): Promise<BufferQueueResult> {
  return queueBufferImagePost({ ...input, channel: 'instagram' }, fetchImpl)
}

export const BUFFER_POST_QUERY = `
  query BufferPost($input: PostInput!) {
    post(input: $input) {
      id
      status
      sentAt
      allowedActions
    }
  }
`

export const BUFFER_DELETE_POST_MUTATION = `
  mutation DeleteBufferPost($input: DeletePostInput!) {
    deletePost(input: $input) {
      __typename
      ... on DeletePostSuccess {
        id
      }
      ... on MutationError {
        message
      }
    }
  }
`

export type BufferPostRecord = {
  id: string
  status: string
  sentAt: string | null
  allowedActions: string[]
}

export type BufferPostLookup =
  | { ok: true; post: BufferPostRecord }
  | { ok: false; error: string }

export type BufferRetireResult =
  | { ok: true; action: 'deleted'; postId: string; previousStatus: string }
  | { ok: true; action: 'already_published'; postId: string; previousStatus: string }
  | { ok: true; action: 'not_removable'; postId: string; previousStatus: string; reason: string }
  | { ok: false; error: string }

type BufferPostPayload = {
  id?: string
  status?: string
  sentAt?: string | null
  allowedActions?: string[] | null
}

type BufferDeletePayload = {
  __typename?: string
  id?: string
  message?: string
}

type BufferReadBody = {
  data?: { post?: BufferPostPayload | null; deletePost?: BufferDeletePayload | null } | null
  errors?: Array<{ message?: string }> | null
}

/** Queued posts can be deleted. A sent post stays on Instagram; Buffer will not remove it. */
export function planBufferRetire(post: Pick<BufferPostRecord, 'status' | 'sentAt' | 'allowedActions'>):
  | { action: 'delete' }
  | { action: 'already_published' }
  | { action: 'not_removable'; reason: string } {
  const status = post.status.trim().toLowerCase()
  if (status === 'sent') return { action: 'already_published' }
  if (status === 'sending') {
    return {
      action: 'not_removable',
      reason: 'Buffer is sending this post, so it cannot be deleted through Buffer.',
    }
  }
  const stillQueued = status === 'scheduled' || status === 'draft' || status === 'needs_approval' || status === 'error'
  if (post.sentAt && !stillQueued) return { action: 'already_published' }
  const actions = post.allowedActions.map((action) => action.toLowerCase())
  if (actions.length > 0 && !actions.includes('deletepost')) {
    return {
      action: 'not_removable',
      reason: `Buffer status is ${status} and deletePost is not an allowed action.`,
    }
  }
  return { action: 'delete' }
}

async function bufferGraphql(
  apiKey: string,
  query: string,
  variables: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; httpStatus: number; raw: string } | { ok: false; error: string }> {
  try {
    const res = await fetchImpl(BUFFER_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(30_000),
    })
    const raw = await res.text().catch(() => '')
    return { ok: true, httpStatus: res.status, raw }
  } catch (err) {
    return { ok: false, error: redactBufferSecret(`buffer network: ${(err as Error).message}`, apiKey) }
  }
}

function readBody(raw: string): BufferReadBody | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as BufferReadBody
  } catch {
    return null
  }
}

export function interpretBufferPost(httpStatus: number, raw: string, apiKey = ''): BufferPostLookup {
  const body = readBody(raw)
  const snippet = redactBufferSecret(raw, apiKey)
  const graphMessage = redactBufferSecret(graphqlErrorText(body), apiKey)
  if (httpStatus < 200 || httpStatus >= 300) {
    const why = graphMessage || snippet
    return { ok: false, error: `buffer HTTP ${httpStatus}${why ? ` ${why}` : ''}` }
  }
  const post = body?.data?.post
  const id = typeof post?.id === 'string' ? post.id.trim() : ''
  const status = typeof post?.status === 'string' ? post.status.trim() : ''
  if (!id || !status) {
    const why = graphMessage || snippet
    return { ok: false, error: why ? `buffer post: ${why}` : 'buffer post returned no id' }
  }
  const sentAt = typeof post?.sentAt === 'string' && post.sentAt.trim() ? post.sentAt : null
  const allowedActions = Array.isArray(post?.allowedActions)
    ? post.allowedActions.filter((action): action is string => typeof action === 'string')
    : []
  return { ok: true, post: { id, status, sentAt, allowedActions } }
}

export function interpretBufferDelete(httpStatus: number, raw: string, apiKey = ''): BufferQueueResult {
  const body = readBody(raw)
  const snippet = redactBufferSecret(raw, apiKey)
  const graphMessage = redactBufferSecret(graphqlErrorText(body), apiKey)
  const deleted = body?.data?.deletePost ?? null
  const typename = deleted?.__typename ?? ''
  const message = typeof deleted?.message === 'string' ? deleted.message.trim() : ''
  const postId = typeof deleted?.id === 'string' ? deleted.id.trim() : ''
  if (httpStatus < 200 || httpStatus >= 300) {
    const why = redactBufferSecret(message || graphMessage || snippet, apiKey)
    return { ok: false, error: `buffer HTTP ${httpStatus}${why ? ` ${why}` : ''}` }
  }
  if (typename === 'DeletePostSuccess' || (!typename && postId)) {
    if (postId) return { ok: true, postId }
    return { ok: false, error: 'buffer DeletePostSuccess returned no post id' }
  }
  if (message || graphMessage) {
    return { ok: false, error: `buffer ${typename || 'error'}: ${redactBufferSecret(message || graphMessage, apiKey)}` }
  }
  return { ok: false, error: `buffer deletePost returned no post id${typename ? ` (${typename})` : ''}` }
}

export async function fetchBufferPost(
  input: { apiKey: string; postId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<BufferPostLookup> {
  const apiKey = input.apiKey.trim()
  const postId = input.postId.trim()
  if (!apiKey) return { ok: false, error: 'BUFFER_API_KEY not set' }
  if (!postId) return { ok: false, error: 'buffer post id missing' }
  const result = await bufferGraphql(apiKey, BUFFER_POST_QUERY, { input: { id: postId } }, fetchImpl)
  if (!result.ok) return result
  return interpretBufferPost(result.httpStatus, result.raw, apiKey)
}

export async function retireQueuedBufferPost(
  input: { apiKey: string; postId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<BufferRetireResult> {
  const lookedUp = await fetchBufferPost(input, fetchImpl)
  if (!lookedUp.ok) return lookedUp
  const plan = planBufferRetire(lookedUp.post)
  if (plan.action === 'already_published') {
    return { ok: true, action: 'already_published', postId: lookedUp.post.id, previousStatus: lookedUp.post.status }
  }
  if (plan.action === 'not_removable') {
    return {
      ok: true,
      action: 'not_removable',
      postId: lookedUp.post.id,
      previousStatus: lookedUp.post.status,
      reason: plan.reason,
    }
  }
  const apiKey = input.apiKey.trim()
  const deleted = await bufferGraphql(
    apiKey,
    BUFFER_DELETE_POST_MUTATION,
    { input: { id: lookedUp.post.id } },
    fetchImpl,
  )
  if (!deleted.ok) return deleted
  const interpreted = interpretBufferDelete(deleted.httpStatus, deleted.raw, apiKey)
  if (!interpreted.ok) {
    if (/already (been )?sent|already published|has been published|status is sent/i.test(interpreted.error)) {
      return {
        ok: true,
        action: 'already_published',
        postId: lookedUp.post.id,
        previousStatus: lookedUp.post.status,
      }
    }
    return interpreted
  }
  return { ok: true, action: 'deleted', postId: interpreted.postId, previousStatus: lookedUp.post.status }
}
