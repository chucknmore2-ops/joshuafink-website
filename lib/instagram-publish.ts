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

/** Ops hint when /me/accounts has no Joshua Fink Group Page we can safely use. */
export const IG_WRONG_PAGE_HINT =
  'Set FB_PAGE_ID to the Joshua Fink Group Facebook Page id and confirm this User token\'s GET /me/accounts includes that Page with instagram_business_account matching IG_BUSINESS_ACCOUNT_ID (requires pages_show_list and pages_read_engagement). Do not publish with another brand Page such as The Water Filter Lab, CardsWorthTrading, or Paw Pulses.'

type IgPublishTokenBase = {
  tokenKind: IgTokenKind
  swapped: boolean
  pageId: string | null
  pageName: string | null
  reason: string
}

export type IgPublishToken =
  | (IgPublishTokenBase & {
      ok: true
      /** Token for container create / poll / publish. Never log this. */
      accessToken: string
    })
  | (IgPublishTokenBase & {
      ok: false
      hint: string
    })

export type GraphPage = {
  id?: string
  name?: string
  access_token?: string
  instagram_business_account?: { id?: string } | null
}

export type IgPagePick =
  | { page: GraphPage; reason: string }
  | { page: undefined; reason: string }

const ACCOUNTS_PAGE_LIMIT = 100
const ACCOUNTS_MAX_PAGES = 20

function graphGet(
  path: string,
  token: string,
  fields: string,
  extra: Record<string, string> = {},
): string {
  const params = new URLSearchParams({ fields, ...extra })
  params.set('access_token', token)
  return `${GRAPH_API}/${path}?${params.toString()}`
}

function isPageNodeAccountsError(err: unknown): boolean {
  const text = typeof err === 'string' ? err : JSON.stringify(err ?? '')
  return /node type \(Page\)/i.test(text) || /nonexisting field \(accounts\)/i.test(text)
}

function pageIgAccountId(page: GraphPage): string | undefined {
  const id = page.instagram_business_account?.id?.trim()
  return id || undefined
}

function igMatches(page: GraphPage, igBusinessAccountId: string): boolean {
  const wanted = igBusinessAccountId.trim()
  return Boolean(wanted) && pageIgAccountId(page) === wanted
}

/** True when the Page is linked to a *different* IG business account. */
function igConflicts(page: GraphPage, igBusinessAccountId: string): boolean {
  const wanted = igBusinessAccountId.trim()
  const got = pageIgAccountId(page)
  return Boolean(wanted && got && got !== wanted)
}

function pageNameMatches(
  page: GraphPage,
  preferredPageName: string,
  fuzzy = false,
): boolean {
  const name = (page.name ?? '').trim().toLowerCase()
  if (!name) return false
  if (fuzzy) return name.includes('joshua fink')
  return name === preferredPageName.trim().toLowerCase()
}

function pageReason(
  page: GraphPage,
  igBusinessAccountId: string,
  preferredPageName: string,
  preferredPageId?: string,
): string {
  if (igMatches(page, igBusinessAccountId)) {
    return 'matched instagram_business_account'
  }
  if (preferredPageId && page.id === preferredPageId) {
    return 'matched preferred page id'
  }
  if (pageNameMatches(page, preferredPageName)) {
    return 'matched Joshua Fink Group page name'
  }
  if (pageNameMatches(page, preferredPageName, true)) {
    return 'matched Joshua Fink page name'
  }
  return 'matched Facebook Page'
}

function summarizePages(pages: GraphPage[]): string {
  const bits = pages.slice(0, 8).map((p) => {
    const name = (p.name ?? '').trim() || p.id || 'unnamed'
    const ig = pageIgAccountId(p)
    return ig ? `${name} (ig ${ig})` : name
  })
  const extra = pages.length > 8 ? ` +${pages.length - 8} more` : ''
  return `${pages.length} page(s) [${bits.join('; ')}${extra}]`
}

/**
 * Choose the Facebook Page whose token we may swap in for IG publishing.
 *
 * Fail closed: never return a Page whose instagram_business_account.id is a
 * different brand than IG_BUSINESS_ACCOUNT_ID, and never fall through to
 * pages[0] / "first available page" (that picked The Water Filter Lab on
 * GHA 35606977924).
 */
export function pickIgPage(
  pages: GraphPage[],
  igBusinessAccountId: string,
  preferredPageName: string = IG_PREFERRED_PAGE_NAME,
  preferredPageId?: string,
): IgPagePick {
  const igId = igBusinessAccountId.trim()
  const refuse = (): IgPagePick => ({
    page: undefined,
    reason: igId
      ? `no Facebook Page linked to IG_BUSINESS_ACCOUNT_ID among ${summarizePages(pages)}; refused wrong-brand fallback`
      : `no matching Facebook Page among ${summarizePages(pages)}; refused first-available fallback`,
  })

  const igMatch = pages.find((p) => igMatches(p, igId))
  if (igMatch) {
    return {
      page: igMatch,
      reason: pageReason(igMatch, igId, preferredPageName, preferredPageId),
    }
  }

  if (preferredPageId) {
    const idMatch = pages.find((p) => p.id === preferredPageId)
    // Preferred id is allowed only when it matches the IG account, or the
    // Page has no IG id to conflict (Meta omitted instagram_business_account).
    if (idMatch && !igConflicts(idMatch, igId)) {
      return {
        page: idMatch,
        reason: pageReason(idMatch, igId, preferredPageName, preferredPageId),
      }
    }
  }

  // Name match is a last resort for "Joshua Fink Group" / "joshua fink".
  // When IG_BUSINESS_ACCOUNT_ID is set, skip any Page with a conflicting IG
  // id. A Page with no IG field is allowed (no conflict) so we can still
  // select Joshua Fink Group if Graph omitted the linked account.
  const exact = pages.find((p) => pageNameMatches(p, preferredPageName))
  if (exact && !igConflicts(exact, igId)) {
    return {
      page: exact,
      reason: pageReason(exact, igId, preferredPageName, preferredPageId),
    }
  }
  const fuzzy = pages.find((p) => pageNameMatches(p, preferredPageName, true))
  if (fuzzy && !igConflicts(fuzzy, igId)) {
    return {
      page: fuzzy,
      reason: pageReason(fuzzy, igId, preferredPageName, preferredPageId),
    }
  }

  return refuse()
}

/** Safe subset for logs / JSON responses — never includes accessToken. */
export function igTokenLogFields(resolved: IgPublishToken): {
  ok: boolean
  tokenKind: IgTokenKind
  pageId: string | null
  pageName: string | null
  swapped: boolean
  reason: string
  hint?: string
} {
  return {
    ok: resolved.ok,
    tokenKind: resolved.tokenKind,
    pageId: resolved.pageId,
    pageName: resolved.pageName,
    swapped: resolved.swapped,
    reason: resolved.reason,
    ...(!resolved.ok && resolved.hint ? { hint: resolved.hint } : {}),
  }
}

type AccountsPageJson = {
  data?: GraphPage[]
  error?: unknown
  paging?: { next?: string; cursors?: { after?: string } }
}

/**
 * Walk GET /me/accounts following paging.cursors.after (or paging.next) so a
 * later Joshua Fink Group Page is not missed because another brand is first.
 * Never logs the request URL — paging.next embeds the access token.
 */
async function fetchManagedPages(
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ pages: GraphPage[] | null; error: unknown }> {
  const pages: GraphPage[] = []
  let after: string | undefined
  let nextUrl: string | undefined

  for (let i = 0; i < ACCOUNTS_MAX_PAGES; i++) {
    const url =
      nextUrl ??
      graphGet(
        'me/accounts',
        token,
        'id,name,access_token,instagram_business_account',
        {
          limit: String(ACCOUNTS_PAGE_LIMIT),
          ...(after ? { after } : {}),
        },
      )

    let accRes: Response
    try {
      accRes = await fetchImpl(url, { signal: AbortSignal.timeout(15_000) })
    } catch (err) {
      if (pages.length > 0) return { pages, error: null }
      return { pages: null, error: err }
    }

    let accJson: AccountsPageJson
    try {
      accJson = (await accRes.json()) as AccountsPageJson
    } catch (err) {
      if (pages.length > 0) return { pages, error: null }
      return { pages: null, error: err }
    }

    if (!accRes.ok || !Array.isArray(accJson.data)) {
      if (pages.length > 0) return { pages, error: null }
      return { pages: null, error: accJson.error ?? accJson }
    }

    pages.push(...accJson.data)

    const cursorAfter = accJson.paging?.cursors?.after
    const pagingNext = typeof accJson.paging?.next === 'string' ? accJson.paging.next : ''
    if (accJson.data.length > 0 && cursorAfter) {
      after = cursorAfter
      nextUrl = undefined
      continue
    }
    if (accJson.data.length > 0 && pagingNext) {
      nextUrl = pagingNext
      after = undefined
      continue
    }
    break
  }

  return { pages, error: null }
}

function failResolve(
  tokenKind: IgTokenKind,
  reason: string,
  me?: { id?: string; name?: string } | null,
): Extract<IgPublishToken, { ok: false }> {
  return {
    ok: false,
    tokenKind,
    swapped: false,
    pageId: me?.id ?? null,
    pageName: me?.name ?? null,
    reason,
    hint: IG_WRONG_PAGE_HINT,
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
 * Fail closed when /me/accounts is a User token but none of the Pages are
 * Joshua Fink Group / IG_BUSINESS_ACCOUNT_ID — do not swap to another brand
 * (The Water Filter Lab, etc.) and do not keep posting with the User token.
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
  ): Extract<IgPublishToken, { ok: true }> => ({
    ok: true,
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
    // Classify from /me/accounts below; posting can still use the env token
    // only when we cannot tell this is a User token with the wrong Pages.
  }

  const { pages, error: accountsError } = await fetchManagedPages(
    opts.envToken,
    fetchImpl,
  )

  if (pages && pages.length > 0) {
    const picked = pickIgPage(
      pages,
      opts.igBusinessAccountId,
      preferredPageName,
      opts.preferredPageId,
    )
    if (!picked.page) {
      // Do not report another brand as pageId/pageName — that is what the
      // Water Filter Lab 502 looked like (GHA 35606977924).
      return failResolve('user', picked.reason)
    }
    const page = picked.page
    if (page.id && page.access_token) {
      return {
        ok: true,
        accessToken: page.access_token,
        tokenKind: 'user',
        swapped: page.access_token !== opts.envToken,
        pageId: page.id,
        pageName: page.name ?? null,
        reason: picked.reason,
      }
    }
    return failResolve(
      'user',
      `matched Facebook Page ${page.name ?? page.id ?? ''} but Graph returned no page access_token`,
      { id: page.id ?? me?.id, name: page.name ?? me?.name },
    )
  }

  if (accountsError && isPageNodeAccountsError(accountsError)) {
    return keepEnv('page', 'env token is already a Page token', me)
  }

  if (pages && pages.length === 0) {
    return failResolve('user', 'user token with no pages on /me/accounts', me)
  }

  return keepEnv('unknown', 'could not classify token; using env token as-is', me)
}
