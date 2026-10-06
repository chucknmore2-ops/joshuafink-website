// First-touch and last-touch attribution for every lead form.
//
// Paid and organic visits land with utm_* / gclid / gbraid / wbraid / fbclid
// on the first URL, then the visitor clicks through to a form on another
// page. A session-only snapshot of utm_source was not enough: it died with
// the tab, and the sheet never received the individual parameters.
//
// captureAttribution() runs on each page view (components/AttributionCapture)
// and again from each form. The first marketing touch is stored for 90 days
// in localStorage and mirrored to a cookie. A later visit with its own
// campaign parameters updates last-touch only. getAttribution() returns both,
// plus the URL of the page the form was submitted from, as flat string fields
// the lead API already forwards.

const LS_KEY = 'jf_attr_v1'
const COOKIE = 'jf_attr'
const SESSION_FLAG = 'jf_attr_session'
const LEGACY_SESSION_KEY = 'jf_attribution'

export const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000
const ATTRIBUTION_TTL_SECONDS = 90 * 24 * 60 * 60
const PARAM_MAX = 256
const URL_MAX = 512
const COOKIE_MAX = 3800

export const ATTRIBUTION_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
] as const

export type AttributionParam = (typeof ATTRIBUTION_PARAMS)[number]

const TOUCH_KEYS = [...ATTRIBUTION_PARAMS, 'referrer', 'landing_page'] as const
type TouchKey = (typeof TOUCH_KEYS)[number]

export type Touch = Record<TouchKey, string>

export type StoredAttribution = {
  v: 1
  first_seen: number
  first: Touch
  last: Touch
}

/** Flat fields merged into every lead submission. Unprefixed = first touch. */
export const LEAD_ATTRIBUTION_FIELDS = [
  'traffic_source',
  'landing_page',
  'referrer',
  ...ATTRIBUTION_PARAMS,
  ...ATTRIBUTION_PARAMS.map((key) => `last_${key}` as const),
  'last_referrer',
  'last_landing_page',
  'page_url',
] as const

export type LeadAttributionField = (typeof LEAD_ATTRIBUTION_FIELDS)[number]
export type LeadAttribution = Record<LeadAttributionField, string>

function clip(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max)
}

export function emptyTouch(): Touch {
  return {
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    gclid: '',
    gbraid: '',
    wbraid: '',
    fbclid: '',
    referrer: '',
    landing_page: '',
  }
}

export function referrerHost(referrer: string): string {
  try {
    return new URL(referrer).hostname
  } catch {
    return ''
  }
}

/** A referrer from this site is navigation, not a channel. */
export function isExternalReferrer(referrer: string, currentHost: string): boolean {
  const host = referrerHost(referrer)
  if (!host) return false
  if (!currentHost) return true
  return host !== currentHost
}

export function touchFromUrl(href: string, referrer: string): Touch {
  const touch = emptyTouch()
  touch.referrer = clip(referrer || '', URL_MAX)
  touch.landing_page = clip(href || '', URL_MAX)
  try {
    const url = new URL(href)
    for (const key of ATTRIBUTION_PARAMS) {
      touch[key] = clip(url.searchParams.get(key) || '', PARAM_MAX)
    }
  } catch {
    // Relative or empty href — parameters stay blank.
  }
  return touch
}

export function hasMarketingParams(touch: Touch): boolean {
  return ATTRIBUTION_PARAMS.some((key) => touch[key] !== '')
}

/**
 * utm_source wins. Google and Meta click ids are channels even when the
 * landing URL omitted utm_source. Otherwise the external referrer host,
 * otherwise direct.
 */
export function deriveTrafficSource(
  touch: Pick<Touch, 'utm_source' | 'gclid' | 'gbraid' | 'wbraid' | 'fbclid' | 'referrer'>,
  currentHost = '',
): string {
  if (touch.utm_source) return touch.utm_source
  if (touch.gclid || touch.gbraid || touch.wbraid) return 'google'
  if (touch.fbclid) return 'facebook'
  if (isExternalReferrer(touch.referrer, currentHost)) return referrerHost(touch.referrer)
  return 'direct'
}

/**
 * First touch sticks until the 90-day window ends. Last touch moves when this
 * page itself carries campaign parameters, or when a new browser session
 * arrives from an external site. Ordinary in-site navigation does not.
 */
export function nextStored(
  previous: StoredAttribution | null,
  current: Touch,
  opts: { freshSession: boolean; now: number; host: string },
): StoredAttribution {
  if (!previous || opts.now - previous.first_seen > ATTRIBUTION_TTL_MS) {
    return { v: 1, first_seen: opts.now, first: current, last: current }
  }
  const updateLast =
    hasMarketingParams(current) ||
    (opts.freshSession && isExternalReferrer(current.referrer, opts.host))
  return {
    v: 1,
    first_seen: previous.first_seen,
    first: previous.first,
    last: updateLast ? current : previous.last,
  }
}

export function toLeadFields(stored: StoredAttribution, pageUrl: string, host: string): LeadAttribution {
  const out = blankLeadAttribution()
  out.traffic_source = deriveTrafficSource(stored.first, host)
  out.landing_page = stored.first.landing_page
  out.referrer = stored.first.referrer
  for (const key of ATTRIBUTION_PARAMS) {
    out[key] = stored.first[key]
    out[`last_${key}`] = stored.last[key]
  }
  out.last_referrer = stored.last.referrer
  out.last_landing_page = stored.last.landing_page
  out.page_url = clip(pageUrl || '', URL_MAX)
  return out
}

export function blankLeadAttribution(): LeadAttribution {
  const out = {} as LeadAttribution
  for (const key of LEAD_ATTRIBUTION_FIELDS) out[key] = ''
  return out
}

function hostFromUrl(value: string): string {
  try {
    return new URL(value).hostname
  } catch {
    return ''
  }
}

/**
 * Fill attribution the browser didn't send. A no-JS submit still has the
 * form page on the Referer header; campaign parameters on that URL are
 * copied only into fields that are empty, so a captured first touch is
 * never replaced. Last touch mirrors first touch when the client sent none.
 */
export function ensureLeadAttribution(lead: Record<string, string>, referer: string | null | undefined): void {
  const headerReferer = clip(referer || '', URL_MAX)
  if (!lead.page_url && headerReferer) lead.page_url = headerReferer

  const source = lead.page_url || headerReferer
  if (source) {
    try {
      const url = new URL(source)
      for (const key of ATTRIBUTION_PARAMS) {
        if (!lead[key]) {
          const value = url.searchParams.get(key)
          if (value) lead[key] = clip(value, PARAM_MAX)
        }
      }
    } catch {
      // page_url was not absolute
    }
  }

  if (!lead.landing_page && lead.page_url) lead.landing_page = lead.page_url

  const hasSignal = Boolean(
    lead.page_url || lead.landing_page || lead.referrer || ATTRIBUTION_PARAMS.some((key) => lead[key]),
  )
  if (!lead.traffic_source && hasSignal) {
    lead.traffic_source = deriveTrafficSource(
      {
        utm_source: lead.utm_source || '',
        gclid: lead.gclid || '',
        gbraid: lead.gbraid || '',
        wbraid: lead.wbraid || '',
        fbclid: lead.fbclid || '',
        referrer: lead.referrer || '',
      },
      hostFromUrl(lead.page_url || headerReferer),
    )
  }

  if (!lead.last_landing_page && lead.landing_page) {
    for (const key of ATTRIBUTION_PARAMS) {
      if (!lead[`last_${key}`] && lead[key]) lead[`last_${key}`] = lead[key]
    }
    if (!lead.last_referrer && lead.referrer) lead.last_referrer = lead.referrer
    lead.last_landing_page = lead.landing_page
  }
}

function getWindow(): Window | null {
  if (typeof globalThis.window === 'undefined' || !globalThis.window) return null
  return globalThis.window
}

export function readCookieValue(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    if (trimmed.slice(0, eq) !== name) continue
    const raw = trimmed.slice(eq + 1)
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

function asTouch(value: unknown): Touch | null {
  if (!value || typeof value !== 'object') return null
  const rec = value as Record<string, unknown>
  const touch = emptyTouch()
  for (const key of TOUCH_KEYS) {
    const v = rec[key]
    if (v != null && typeof v !== 'string') return null
    const max = key === 'referrer' || key === 'landing_page' ? URL_MAX : PARAM_MAX
    touch[key] = clip(typeof v === 'string' ? v : '', max)
  }
  return touch
}

function parseStored(raw: string): StoredAttribution | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    if (data.v !== 1) return null
    const first = asTouch(data.first)
    const last = asTouch(data.last)
    if (!first || !last || typeof data.first_seen !== 'number' || !Number.isFinite(data.first_seen)) {
      return null
    }
    return { v: 1, first_seen: data.first_seen, first, last }
  } catch {
    return null
  }
}

function touchFromLegacy(raw: unknown): Touch | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as Record<string, unknown>
  const landing = typeof rec.landing_page === 'string' ? rec.landing_page : ''
  const referrer = typeof rec.referrer === 'string' ? rec.referrer : ''
  const traffic = typeof rec.traffic_source === 'string' ? rec.traffic_source : ''
  if (!landing && !referrer && !traffic) return null
  const touch = touchFromUrl(landing, referrer)
  // The old record stored a channel name, not the individual parameters.
  // A dotted value is a referrer host; anything else was utm_source.
  if (!touch.utm_source && traffic && traffic !== 'direct' && !traffic.includes('.')) {
    touch.utm_source = clip(traffic, PARAM_MAX)
  }
  return touch
}

type StoredRead = StoredAttribution | 'expired' | 'miss'

function classifyRaw(raw: string | null, now: number): StoredRead {
  if (!raw) return 'miss'
  const parsed = parseStored(raw)
  if (!parsed) return 'miss'
  if (now - parsed.first_seen > ATTRIBUTION_TTL_MS) return 'expired'
  return parsed
}

function readStored(win: Window, now: number): StoredAttribution | null {
  let fromLs: string | null = null
  try {
    fromLs = win.localStorage.getItem(LS_KEY)
  } catch {
    fromLs = null
  }
  const ls = classifyRaw(fromLs, now)
  if (ls === 'expired') return null
  if (ls !== 'miss') return ls

  let fromCookie: string | null = null
  try {
    fromCookie = readCookieValue(win.document.cookie || '', COOKIE)
  } catch {
    fromCookie = null
  }
  const cookie = classifyRaw(fromCookie, now)
  if (cookie === 'expired') return null
  if (cookie !== 'miss') return cookie

  try {
    const legacyRaw = win.sessionStorage.getItem(LEGACY_SESSION_KEY)
    if (!legacyRaw) return null
    const touch = touchFromLegacy(JSON.parse(legacyRaw))
    if (!touch) return null
    return { v: 1, first_seen: now, first: touch, last: touch }
  } catch {
    return null
  }
}

function writeStored(win: Window, stored: StoredAttribution): void {
  const json = JSON.stringify(stored)
  try {
    win.localStorage.setItem(LS_KEY, json)
  } catch {
    // private mode — the cookie mirror below may still work
  }
  try {
    const encoded = encodeURIComponent(json)
    if (encoded.length <= COOKIE_MAX) {
      const secure = win.location.protocol === 'https:' ? '; Secure' : ''
      win.document.cookie = `${COOKIE}=${encoded}; Max-Age=${ATTRIBUTION_TTL_SECONDS}; Path=/; SameSite=Lax${secure}`
    }
  } catch {
    // cookie unavailable
  }
  try {
    win.sessionStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    // ignore
  }
}

/** Remember this page view. Safe to call on every navigation and on submit. */
export function captureAttribution(now: number = Date.now()): void {
  const win = getWindow()
  if (!win) return
  let fresh = true
  try {
    fresh = win.sessionStorage.getItem(SESSION_FLAG) !== '1'
  } catch {
    fresh = true
  }
  const current = touchFromUrl(win.location.href, win.document.referrer || '')
  const previous = readStored(win, now)
  writeStored(win, nextStored(previous, current, { freshSession: fresh, now, host: win.location.hostname }))
  try {
    win.sessionStorage.setItem(SESSION_FLAG, '1')
  } catch {
    // sessionStorage unavailable — last-touch may refresh on in-site loads
  }
}

/** Fields to spread onto a lead submission. Empty strings when not in a browser. */
export function getAttribution(): LeadAttribution {
  const win = getWindow()
  if (!win) return blankLeadAttribution()
  const now = Date.now()
  captureAttribution(now)
  const stored = readStored(win, now)
  const page = clip(win.location.href, URL_MAX)
  if (!stored) {
    const current = touchFromUrl(win.location.href, win.document.referrer || '')
    return toLeadFields({ v: 1, first_seen: now, first: current, last: current }, page, win.location.hostname)
  }
  return toLeadFields(stored, page, win.location.hostname)
}
