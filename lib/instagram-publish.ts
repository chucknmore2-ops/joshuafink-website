// Helpers for the Instagram cron: debug JSON for GitHub Actions, host checks
// so Graph never receives a Compass CDN image_url, secret redaction, and
// resolving a User token to the Page token Meta's Facebook-Login publishing
// path actually wants.

export const GRAPH_API = 'https://graph.facebook.com/v19.0'
export const IG_SITE = 'https://www.joshuafink.com'
/** First listing attempt. Alternates stay at IG_ALTERNATE_POLL_MS so three
 *  cycles plus preflight still fit maxDuration 300. */
export const IG_POLL_MS = 90_000
export const IG_RESUME_POLL_MS = 90_000
export const IG_ALTERNATE_POLL_MS = 80_000
export const IG_POLL_INTERVAL_MS = 5_000
/** Original listing + this many alternates if Meta leaves a container stalled. */
export const IG_ALTERNATE_LISTINGS = 2
export const IG_PREFERRED_PAGE_NAME = 'Joshua Fink Group'

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

export type IgTokenKind = 'user' | 'page' | 'unknown'

export type IgPublishToken = {
  /** Token for container create / poll / publish. Never log this. */
  accessToken: string
  /**
   * Kind of `accessToken` — the token Graph calls actually use.
   * After a User/System User swap this is `page`, not the env token's kind.
   */
  tokenKind: IgTokenKind
  swapped: boolean
  pageId: string | null
  pageName: string | null
  reason: string
}

export type GraphPage = {
  id?: string
  name?: string
  access_token?: string
  instagram_business_account?: { id?: string } | null
}

function graphGet(path: string, token: string, fields: string): string {
  const params = new URLSearchParams({ access_token: token, fields })
  return `${GRAPH_API}/${path}?${params.toString()}`
}

function isPageNodeAccountsError(err: unknown): boolean {
  const text = typeof err === 'string' ? err : JSON.stringify(err ?? '')
  return /node type \(Page\)/i.test(text) || /nonexisting field \(accounts\)/i.test(text)
}

/** Page names that belong to the realtor brand — not Water Filter Lab / Paw Pulses. */
const JOSHUA_FINK_NAME = /Joshua\s*Fink/i
const JOSHUAFINK_NAME = /joshuafink/i

export function isJoshuaFinkPageName(name: string | undefined | null): boolean {
  if (!name) return false
  return JOSHUA_FINK_NAME.test(name) || JOSHUAFINK_NAME.test(name)
}

/** Log-safe page list: names + ids only, never access_token. */
export function describeIgPages(pages: GraphPage[]): string {
  if (pages.length === 0) return '(none)'
  return pages
    .map((p) => {
      const ig = p.instagram_business_account?.id
      return `${p.name ?? '(unnamed)'} (id=${p.id ?? '?'}${ig ? `, ig=${ig}` : ''})`
    })
    .join('; ')
}

export class IgPageResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IgPageResolutionError'
  }
}

export type PickIgPageResult =
  | { ok: true; page: GraphPage; reason: string }
  | { ok: false; error: string }

/**
 * Resolve which Page to swap a User token onto.
 *
 * Order: linked IG business account → Joshua Fink name → explicit FB_PAGE_ID.
 * Never silently returns "the first page on /me/accounts" when several brands
 * share the User (GHA 35606977924 posted as The Water Filter Lab).
 */
export function pickIgPage(
  pages: GraphPage[],
  igBusinessAccountId: string,
  preferredPageName: string = IG_PREFERRED_PAGE_NAME,
  preferredPageId?: string,
): PickIgPageResult {
  const wantedIg = igBusinessAccountId.trim()
  if (wantedIg) {
    const igMatches = pages.filter(
      (p) => p.instagram_business_account?.id === wantedIg,
    )
    if (igMatches.length === 1) {
      return {
        ok: true,
        page: igMatches[0],
        reason: 'matched instagram_business_account',
      }
    }
    if (igMatches.length > 1) {
      return {
        ok: false,
        error: `multiple Pages linked to Instagram account ${wantedIg}: ${describeIgPages(igMatches)}`,
      }
    }
  }

  const nameMatches = pages.filter((p) => isJoshuaFinkPageName(p.name))
  if (nameMatches.length === 1) {
    const page = nameMatches[0]
    const name = (page.name ?? '').trim().toLowerCase()
    const wanted = preferredPageName.trim().toLowerCase()
    return {
      ok: true,
      page,
      reason:
        name === wanted
          ? 'matched Joshua Fink Group page name'
          : 'matched Joshua Fink page name',
    }
  }
  if (nameMatches.length > 1) {
    const wanted = preferredPageName.trim().toLowerCase()
    const exact = nameMatches.filter(
      (p) => (p.name ?? '').trim().toLowerCase() === wanted,
    )
    if (exact.length === 1) {
      return {
        ok: true,
        page: exact[0],
        reason: 'matched Joshua Fink Group page name',
      }
    }
    return {
      ok: false,
      error: `multiple Joshua Fink Pages on /me/accounts: ${describeIgPages(nameMatches)}`,
    }
  }

  if (preferredPageId) {
    const idMatch = pages.find((p) => p.id === preferredPageId)
    if (idMatch) {
      return { ok: true, page: idMatch, reason: 'matched preferred page id' }
    }
  }

  return {
    ok: false,
    error:
      `could not resolve Joshua Fink Group Page from /me/accounts ` +
      `(no instagram_business_account matching ${wantedIg || '(empty)'}; ` +
      `no page name matching /Joshua\\s*Fink/i or /joshuafink/i). ` +
      `Pages: ${describeIgPages(pages)}. ` +
      `Set IG_BUSINESS_ACCOUNT_ID (or IG_USER_ID) to the linked IG account, ` +
      `or FB_PAGE_ID to the Joshua Fink Group Page.`,
  }
}

/** Safe subset for logs / JSON responses — never includes accessToken. */
export function igTokenLogFields(resolved: IgPublishToken): {
  tokenKind: IgTokenKind
  pageId: string | null
  pageName: string | null
  swapped: boolean
  reason: string
} {
  return {
    tokenKind: resolved.tokenKind,
    pageId: resolved.pageId,
    pageName: resolved.pageName,
    swapped: resolved.swapped,
    reason: resolved.reason,
  }
}

/**
 * Content publishing on graph.facebook.com wants a Page token for the Page
 * linked to the IG business account. Josh often stores a long-lived User
 * token from the Access Token Debugger (Type=User). Detect that and swap
 * in the matching Page `access_token` from GET /me/accounts.
 *
 * A token that is already a Page token is used as-is.
 *
 * `tokenKind` describes the token returned in `accessToken`. A successful
 * swap therefore reports `page` even though `IG_ACCESS_TOKEN` was a User
 * or System User token (`swapped: true` records that the env value changed).
 */
export async function resolveIgPublishToken(opts: {
  envToken: string
  igBusinessAccountId: string
  preferredPageName?: string
  preferredPageId?: string
  fetchImpl?: typeof fetch
}): Promise<IgPublishToken> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const preferredPageName = opts.preferredPageName ?? IG_PREFERRED_PAGE_NAME
  const keepEnv = (
    tokenKind: IgTokenKind,
    reason: string,
    me?: { id?: string; name?: string } | null,
  ): IgPublishToken => ({
    accessToken: opts.envToken,
    tokenKind,
    swapped: false,
    pageId: me?.id ?? null,
    pageName: me?.name ?? null,
    reason,
  })

  let me: { id?: string; name?: string } | null = null
  try {
    const meRes = await fetchImpl(graphGet('me', opts.envToken, 'id,name'), {
      signal: AbortSignal.timeout(15_000),
    })
    const meJson = (await meRes.json()) as {
      id?: string
      name?: string
      error?: unknown
    }
    if (meRes.ok && meJson.id) me = meJson
  } catch {
    // Classify from /me/accounts below; posting can still use the env token.
  }

  let pages: GraphPage[] | null = null
  let accountsError: unknown = null
  try {
    const accRes = await fetchImpl(
      graphGet(
        'me/accounts',
        opts.envToken,
        'id,name,access_token,instagram_business_account',
      ),
      { signal: AbortSignal.timeout(15_000) },
    )
    const accJson = (await accRes.json()) as {
      data?: GraphPage[]
      error?: unknown
    }
    if (accRes.ok && Array.isArray(accJson.data)) {
      pages = accJson.data
    } else {
      accountsError = accJson.error ?? accJson
    }
  } catch (err) {
    accountsError = err
  }

  if (pages && pages.length > 0) {
    const picked = pickIgPage(
      pages,
      opts.igBusinessAccountId,
      preferredPageName,
      opts.preferredPageId,
    )
    if (!picked.ok) {
      throw new IgPageResolutionError(picked.error)
    }
    const page = picked.page
    if (page.id && page.access_token) {
      return {
        accessToken: page.access_token,
        // /me/accounts `access_token` is a Page token. Do not label it
        // `user` just because the env value that discovered it was a User
        // or System User token — cron logs this field as the publish token.
        tokenKind: 'page',
        swapped: page.access_token !== opts.envToken,
        pageId: page.id,
        pageName: page.name ?? null,
        reason: picked.reason,
      }
    }
    return keepEnv('user', 'user token but no page access_token to swap', {
      id: page.id ?? me?.id,
      name: page.name ?? me?.name,
    })
  }

  if (accountsError && isPageNodeAccountsError(accountsError)) {
    return keepEnv('page', 'env token is already a Page token', me)
  }

  if (pages && pages.length === 0) {
    return keepEnv('user', 'user token with no pages on /me/accounts', me)
  }

  return keepEnv('unknown', 'could not classify token; using env token as-is', me)
}
