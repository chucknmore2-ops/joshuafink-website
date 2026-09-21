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
/**
 * One comparison container with the env token (no Page swap) after the Page
 * token stays on Meta's generic processing status. Images that will finish
 * do so in a few seconds; this does not add another full 90s poll.
 */
export const IG_ENV_TOKEN_POLL_MS = 20_000
/** Original listing + this many alternates if Meta leaves a container stalled. */
export const IG_ALTERNATE_LISTINGS = 2
export const IG_PREFERRED_PAGE_NAME = 'Joshua Fink Group'
/** Fields the IG Container node documents. `status` is the human-readable reason. */
export const IG_CONTAINER_POLL_FIELDS = 'status_code,status'
/**
 * Asked once after the poll window. Meta returns (#100) when the field does
 * not exist; that error is kept as probeError and does not replace status_code.
 */
export const IG_CONTAINER_PROBE_FIELDS = 'status_code,status,status_code_ex'
const PUBLISH_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_read_engagement',
] as const
const BUSINESS_MANAGER_ADS_SCOPES = ['ads_management', 'ads_read'] as const

export type IgAttemptDebug = {
  refKey: string
  kind: 'blog' | 'listing'
  imageUrl: string
  creationId?: string
  statusCode?: string
  status?: string
  /** Present when Graph actually returns status_code_ex. */
  statusCodeEx?: string | null
  /** OAuth error from the status read itself (code / subcode / message). */
  graphError?: string | null
  /** Probe for status_code_ex failed or named a field Graph does not serve. */
  probeError?: string | null
  /** Kind of the token used for this container. Never the token. */
  tokenKind?: IgTokenKind
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
    statusCodeEx: last?.statusCodeEx ?? null,
    graphError: last?.graphError ?? null,
    probeError: last?.probeError ?? null,
    tokenKind: last?.tokenKind ?? null,
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

export type IgTokenKind = 'user' | 'page' | 'system_user' | 'unknown'

export type IgPublishToken = {
  /** Token for container create / poll / publish. Never log this. */
  accessToken: string
  /** Kind of accessToken (Page after a swap). */
  tokenKind: IgTokenKind
  /** Kind of IG_ACCESS_TOKEN before any swap. debug_token when it answers. */
  envTokenKind: IgTokenKind
  swapped: boolean
  pageId: string | null
  pageName: string | null
  reason: string
  /** Scope names from debug_token. Empty when Graph did not answer. */
  scopes: string[]
  missingScopes: string[]
  /**
   * Hypothesis: a Business Manager system user also needs ads_read or
   * ads_management. True only when debug_token says system_user and neither
   * scope is present.
   */
  missingBusinessManagerAdsScope: boolean
  /** Unix seconds; 0 means never expires. Null when debug_token did not say. */
  tokenExpiresAt: number | null
}

export type IgTokenInspection = {
  envTokenKind: IgTokenKind
  isValid: boolean | null
  expiresAt: number | null
  scopes: string[]
  missingScopes: string[]
  missingBusinessManagerAdsScope: boolean
}

export function emptyTokenInspection(): IgTokenInspection {
  return {
    envTokenKind: 'unknown',
    isValid: null,
    expiresAt: null,
    scopes: [],
    missingScopes: [],
    missingBusinessManagerAdsScope: false,
  }
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
  envTokenKind: IgTokenKind
  pageId: string | null
  pageName: string | null
  swapped: boolean
  reason: string
  scopes: string[]
  missingScopes: string[]
  missingBusinessManagerAdsScope: boolean
  tokenExpiresAt: number | null
} {
  return {
    tokenKind: resolved.tokenKind,
    envTokenKind: resolved.envTokenKind,
    pageId: resolved.pageId,
    pageName: resolved.pageName,
    swapped: resolved.swapped,
    reason: resolved.reason,
    scopes: resolved.scopes,
    missingScopes: resolved.missingScopes,
    missingBusinessManagerAdsScope: resolved.missingBusinessManagerAdsScope,
    tokenExpiresAt: resolved.tokenExpiresAt,
  }
}

function graphInit(init: RequestInit = {}): RequestInit {
  return { ...init, cache: 'no-store' }
}

export function summarizeGraphError(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const e = error as {
    message?: unknown
    code?: unknown
    error_subcode?: unknown
    error_user_msg?: unknown
  }
  const parts: string[] = []
  if (typeof e.message === 'string' && e.message.trim()) parts.push(e.message.trim())
  if (typeof e.error_user_msg === 'string' && e.error_user_msg.trim()) {
    parts.push(e.error_user_msg.trim())
  }
  if (typeof e.code === 'number') parts.push(`code ${e.code}`)
  if (typeof e.error_subcode === 'number') parts.push(`subcode ${e.error_subcode}`)
  if (parts.length === 0) return null
  return redactSecrets(parts.join(' | '))
}

function mapDebugTokenType(type: unknown): IgTokenKind {
  if (type === 'USER') return 'user'
  if (type === 'PAGE') return 'page'
  if (type === 'SYSTEM_USER') return 'system_user'
  return 'unknown'
}

function scopeList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const names = value.filter((s): s is string => typeof s === 'string' && s.length > 0)
  return Array.from(new Set(names)).sort()
}

/**
 * Classify IG_ACCESS_TOKEN without logging it. debug_token is what distinguishes
 * a System User from a User. A failed call leaves scopes empty; publishing
 * still proceeds with /me/accounts.
 */
export async function inspectIgAccessToken(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<IgTokenInspection> {
  const empty = emptyTokenInspection()
  try {
    const params = new URLSearchParams({
      input_token: token,
      access_token: token,
    })
    const res = await fetchImpl(`${GRAPH_API}/debug_token?${params.toString()}`, {
      ...graphInit(),
      signal: AbortSignal.timeout(15_000),
    })
    const json = (await res.json()) as {
      data?: {
        type?: unknown
        is_valid?: unknown
        expires_at?: unknown
        scopes?: unknown
        granular_scopes?: unknown
      }
      error?: unknown
    }
    if (!res.ok || !json.data) return empty
    const granular = Array.isArray(json.data.granular_scopes)
      ? json.data.granular_scopes
          .map((row) =>
            row && typeof row === 'object' && typeof (row as { scope?: unknown }).scope === 'string'
              ? (row as { scope: string }).scope
              : '',
          )
          .filter(Boolean)
      : []
    const scopes = scopeList([...(scopeList(json.data.scopes)), ...granular])
    const envTokenKind = mapDebugTokenType(json.data.type)
    const missingScopes = PUBLISH_SCOPES.filter((s) => !scopes.includes(s))
    const hasAds = BUSINESS_MANAGER_ADS_SCOPES.some((s) => scopes.includes(s))
    return {
      envTokenKind,
      isValid: typeof json.data.is_valid === 'boolean' ? json.data.is_valid : null,
      expiresAt: typeof json.data.expires_at === 'number' ? json.data.expires_at : null,
      scopes,
      missingScopes: [...missingScopes],
      missingBusinessManagerAdsScope: envTokenKind === 'system_user' && !hasAds,
    }
  } catch {
    return empty
  }
}

function applyInspection(
  token: Omit<
    IgPublishToken,
    | 'envTokenKind'
    | 'scopes'
    | 'missingScopes'
    | 'missingBusinessManagerAdsScope'
    | 'tokenExpiresAt'
  >,
  inspection: IgTokenInspection,
  envFallback: IgTokenKind,
): IgPublishToken {
  return {
    ...token,
    envTokenKind:
      inspection.envTokenKind !== 'unknown' ? inspection.envTokenKind : envFallback,
    scopes: inspection.scopes,
    missingScopes: inspection.missingScopes,
    missingBusinessManagerAdsScope: inspection.missingBusinessManagerAdsScope,
    tokenExpiresAt: inspection.expiresAt,
  }
}

/**
 * Content publishing on graph.facebook.com wants a Page token for the Page
 * linked to the IG business account. A long-lived User token is swapped for
 * that Page's access_token. A token that is already a Page token is used as-is.
 *
 * tokenKind is the token actually used to publish. After a swap that is
 * `page`, even when IG_ACCESS_TOKEN itself is a User or System User
 * (envTokenKind). Run 35628788322 logged tokenKind `user` with swapped true;
 * that label was the env token, not the Page token the calls used.
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
  const inspection = await inspectIgAccessToken(opts.envToken, fetchImpl)
  const finish = (
    token: Omit<
      IgPublishToken,
      | 'envTokenKind'
      | 'scopes'
      | 'missingScopes'
      | 'missingBusinessManagerAdsScope'
      | 'tokenExpiresAt'
    >,
    envFallback: IgTokenKind,
  ) => applyInspection(token, inspection, envFallback)

  const keepEnv = (
    tokenKind: IgTokenKind,
    reason: string,
    me?: { id?: string; name?: string } | null,
  ): IgPublishToken =>
    finish(
      {
        accessToken: opts.envToken,
        tokenKind,
        swapped: false,
        pageId: me?.id ?? null,
        pageName: me?.name ?? null,
        reason,
      },
      tokenKind,
    )

  let me: { id?: string; name?: string } | null = null
  try {
    const meRes = await fetchImpl(
      graphGet('me', opts.envToken, 'id,name'),
      graphInit({ signal: AbortSignal.timeout(15_000) }),
    )
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
      graphInit({ signal: AbortSignal.timeout(15_000) }),
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
      const swapped = page.access_token !== opts.envToken
      return finish(
        {
          accessToken: page.access_token,
          // The value we will send to Graph is the Page token, not the env token.
          tokenKind: 'page',
          swapped,
          pageId: page.id,
          pageName: page.name ?? null,
          reason: picked.reason,
        },
        'unknown',
      )
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

export type IgContainerStatus = {
  statusCode: string
  status: string
  statusCodeEx: string | null
  graphError: string | null
  probeError: string | null
}

export function parseContainerStatusBody(
  body: unknown,
  httpStatus: number,
): IgContainerStatus {
  const json =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const graphError = summarizeGraphError(json.error)
  const statusCode = typeof json.status_code === 'string' ? json.status_code : ''
  const status = typeof json.status === 'string' ? json.status : ''
  const statusCodeEx =
    typeof json.status_code_ex === 'string' ? json.status_code_ex : null
  const failed = httpStatus < 200 || httpStatus >= 300 || Boolean(graphError)
  return {
    statusCode,
    status,
    statusCodeEx,
    graphError: failed ? graphError ?? `HTTP ${httpStatus}` : null,
    probeError: null,
  }
}

/** Meta's generic processing line — not a download / aspect-ratio error. */
export function isGenericInProgress(statusCode?: string, status?: string): boolean {
  if ((statusCode || 'IN_PROGRESS') !== 'IN_PROGRESS') return false
  const text = (status ?? '').trim()
  if (!text) return true
  return /still being processed/i.test(text)
}

const TERMINAL_STATUS = new Set(['FINISHED', 'ERROR', 'EXPIRED', 'PUBLISHED'])

/**
 * After the Page-token container sits on the generic processing status, try
 * the env token once. Run 35628788322 already proved the swapped Page token
 * stalls; the env token (User vs System User) is the open half of that hypothesis.
 */
export function shouldCompareEnvToken(opts: {
  swapped: boolean
  alreadyCompared: boolean
  resuming: boolean
  statusCode?: string
  status?: string
}): boolean {
  return (
    opts.swapped &&
    !opts.alreadyCompared &&
    !opts.resuming &&
    isGenericInProgress(opts.statusCode, opts.status)
  )
}

export function igStallHint(opts: {
  generic: boolean
  comparedEnvToken: boolean
  missingScopes: string[]
  missingBusinessManagerAdsScope: boolean
}): string | undefined {
  if (opts.missingScopes.length > 0) {
    return (
      `IG_ACCESS_TOKEN is missing ${opts.missingScopes.join(', ')}. ` +
      'Re-issue it with those permissions, then redeploy. HANDOFF Runbook 4.'
    )
  }
  if (opts.missingBusinessManagerAdsScope) {
    return (
      'System user token has neither ads_read nor ads_management. Meta requires ' +
      'one of those when the Page role comes from Business Manager. HANDOFF Runbook 4.'
    )
  }
  if (!opts.generic) return undefined
  if (opts.comparedEnvToken) {
    return (
      'Page token and env token both left the container IN_PROGRESS with Meta\'s ' +
      'generic processing status. The image URL is a public JPEG; resumable upload ' +
      'is video-only and is not an image path. Next step is Advanced Access for ' +
      'instagram_content_publish. HANDOFF Runbook 4.'
    )
  }
  return (
    'Container stayed IN_PROGRESS with Meta\'s generic processing status, which is ' +
    'not a download error. HANDOFF Runbook 4.'
  )
}

async function readContainerStatus(
  creationId: string,
  accessToken: string,
  fields: string,
  fetchImpl: typeof fetch,
): Promise<IgContainerStatus> {
  const res = await fetchImpl(
    graphGet(creationId, accessToken, fields),
    graphInit({ signal: AbortSignal.timeout(15_000) }),
  )
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return parseContainerStatusBody(body, res.status)
}

/**
 * Poll status_code + status until a terminal code or the deadline, then one
 * probe that also asks for status_code_ex. An unknown-field error is stored
 * on probeError and does not wipe a status_code we already read.
 */
export async function pollIgContainer(opts: {
  creationId: string
  accessToken: string
  pollMs: number
  intervalMs?: number
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}): Promise<IgContainerStatus> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)))
  const interval = opts.intervalMs ?? IG_POLL_INTERVAL_MS
  const deadline = Date.now() + Math.max(0, opts.pollMs)
  let current: IgContainerStatus = {
    statusCode: 'IN_PROGRESS',
    status: '',
    statusCodeEx: null,
    graphError: null,
    probeError: null,
  }

  for (;;) {
    try {
      const read = await readContainerStatus(
        opts.creationId,
        opts.accessToken,
        IG_CONTAINER_POLL_FIELDS,
        fetchImpl,
      )
      if (read.graphError && !read.statusCode) {
        current = {
          ...read,
          statusCode: 'ERROR',
          status: read.status || read.graphError,
        }
        break
      }
      current = {
        statusCode: read.statusCode || 'IN_PROGRESS',
        status: read.status,
        statusCodeEx: read.statusCodeEx,
        graphError: read.graphError,
        probeError: null,
      }
    } catch (err) {
      current = {
        ...current,
        graphError: redactSecrets((err as Error).message || 'status read failed'),
      }
    }
    if (TERMINAL_STATUS.has(current.statusCode) || Date.now() >= deadline) break
    await sleep(interval)
  }

  if (!TERMINAL_STATUS.has(current.statusCode)) {
    try {
      const probe = await readContainerStatus(
        opts.creationId,
        opts.accessToken,
        IG_CONTAINER_PROBE_FIELDS,
        fetchImpl,
      )
      if (probe.graphError && !probe.statusCode) {
        current = { ...current, probeError: probe.graphError }
      } else {
        current = {
          statusCode: probe.statusCode || current.statusCode,
          status: probe.status || current.status,
          statusCodeEx: probe.statusCodeEx,
          graphError: probe.graphError ?? current.graphError,
          probeError: null,
        }
      }
    } catch (err) {
      current = {
        ...current,
        probeError: redactSecrets((err as Error).message || 'status probe failed'),
      }
    }
  }

  return current
}
