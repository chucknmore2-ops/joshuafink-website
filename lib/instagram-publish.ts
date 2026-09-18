// Helpers for the Instagram cron: debug JSON for GitHub Actions, host checks
// so Graph never receives a Compass CDN image_url, and secret redaction.

export const IG_SITE = 'https://www.joshuafink.com'
export const IG_POLL_MS = 80_000
export const IG_RESUME_POLL_MS = 80_000
export const IG_POLL_INTERVAL_MS = 5_000
/** Original listing + this many alternates if Meta leaves a container stalled. */
export const IG_ALTERNATE_LISTINGS = 2

export type IgAttemptDebug = {
  refKey: string
  kind: 'blog' | 'listing'
  imageUrl: string
  creationId?: string
  statusCode?: string
  status?: string
  error?: string
}

export function igPublicHostOk(
  imageUrl: string,
  site: string = IG_SITE,
): boolean {
  try {
    const u = new URL(imageUrl)
    const expected = new URL(site)
    if (u.protocol !== 'https:') return false
    return u.hostname === expected.hostname || u.hostname === 'joshuafink.com'
  } catch {
    return false
  }
}

export function redactSecrets(text: string): string {
  return text
    .replace(/access_token=[^&\s"']+/gi, 'access_token=[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/g, 'Bearer [redacted]')
    .slice(0, 240)
}

export function igFailureBody(opts: {
  error: string
  attempts: IgAttemptDebug[]
  hint?: string
  resume?: boolean
}): Record<string, unknown> {
  const last = opts.attempts[opts.attempts.length - 1]
  return {
    error: opts.error,
    refKey: last?.refKey ?? null,
    kind: last?.kind ?? null,
    creationId: last?.creationId ?? null,
    statusCode: last?.statusCode ?? null,
    status: last?.status ?? null,
    imageUrl: last?.imageUrl ?? null,
    attempts: opts.attempts,
    resume: Boolean(opts.resume),
    ...(opts.hint ? { hint: opts.hint } : {}),
  }
}

export type PublicJpegPreflight =
  | { ok: true; bytes: number; contentType: string }
  | { ok: false; reason: string }

/**
 * Confirm Meta will be pointed at a JPEG we host before creating a container.
 * Fetches the public URL (warms the Vercel cache for `/ig-photo/…`).
 */
export async function preflightPublicJpeg(
  imageUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicJpegPreflight> {
  if (!igPublicHostOk(imageUrl)) {
    let host = 'unparseable'
    try {
      host = new URL(imageUrl).hostname
    } catch {
      /* keep unparseable */
    }
    return { ok: false, reason: `image_url host ${host} is not joshuafink.com` }
  }
  try {
    const res = await fetchImpl(imageUrl, {
      headers: { Accept: 'image/jpeg,image/*;q=0.8' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      return { ok: false, reason: `image_url HTTP ${res.status}` }
    }
    const contentType = res.headers.get('content-type') ?? ''
    const body = new Uint8Array(await res.arrayBuffer())
    if (!contentType.toLowerCase().includes('jpeg') && !contentType.toLowerCase().includes('jpg')) {
      return {
        ok: false,
        reason: `image_url content-type ${contentType || 'missing'}`,
      }
    }
    if (body.byteLength < 100) {
      return { ok: false, reason: 'image_url too small' }
    }
    return { ok: true, bytes: body.byteLength, contentType }
  } catch (err) {
    return { ok: false, reason: `image_url fetch: ${(err as Error).message}` }
  }
}
