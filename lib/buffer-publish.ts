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
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`

export type BufferImagePostInput = {
  apiKey: string
  channelId: string
  text: string
  imageUrl: string
}

export type BufferQueueResult =
  | { ok: true; postId: string }
  | { ok: false; error: string }

type CreatePostPayload = {
  __typename?: string
  message?: string
  post?: { id?: string | null } | null
}

type BufferGraphqlBody = {
  data?: { createPost?: CreatePostPayload | null } | null
  errors?: Array<{ message?: string }> | null
}

export function bufferImagePostVariables(
  input: Pick<BufferImagePostInput, 'channelId' | 'text' | 'imageUrl'>,
): { input: Record<string, unknown> } {
  // InstagramPostMetadataInput.type (PostType!) is required. Feed photo is
  // `post`, not story or reel. shouldShareToFeed is Boolean! on that input.
  // https://developers.buffer.com/types/InstagramPostMetadataInput.html
  return {
    input: {
      text: input.text,
      channelId: input.channelId,
      schedulingType: 'automatic',
      mode: 'addToQueue',
      assets: [{ image: { url: input.imageUrl } }],
      metadata: {
        instagram: {
          type: 'post',
          shouldShareToFeed: true,
        },
      },
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

function graphqlErrorText(body: BufferGraphqlBody | null): string {
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
    if (typeof postId === 'string' && postId) return { ok: true, postId }
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

export async function queueInstagramImagePost(
  input: BufferImagePostInput,
  fetchImpl: typeof fetch = fetch,
): Promise<BufferQueueResult> {
  const apiKey = input.apiKey.trim()
  const channelId = input.channelId.trim()
  if (!apiKey) return { ok: false, error: 'BUFFER_API_KEY not set' }
  if (!channelId) return { ok: false, error: 'BUFFER_IG_CHANNEL_ID not set' }
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
