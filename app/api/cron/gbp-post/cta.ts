// Google Business Profile LocalPost call-to-action + pre-flight checks.
//
// Official docs: CallToAction.url "should be left unset for Call CTA."
// Sending `url: "tel:…"` is rejected as HTTP 400 INVALID_ARGUMENT.
// LEARN_MORE / BOOK / ORDER / SHOP / SIGN_UP require an http(s) url.
// STANDARD summary max is 1500 characters; empty summary is also rejected.

export type CtaWithUrl = {
  actionType: 'LEARN_MORE' | 'ORDER' | 'BOOK' | 'SIGN_UP'
  url: string
}

export type CallCta = { actionType: 'CALL' }

export type CTA = CallCta | CtaWithUrl

export const CALL_CTA: CallCta = { actionType: 'CALL' }

export const GBP_SUMMARY_MAX = 1500

const CTA_WITH_URL = new Set(['LEARN_MORE', 'ORDER', 'BOOK', 'SIGN_UP', 'SHOP'])
const CTA_NO_URL = new Set(['CALL'])
const CTA_ALLOWED = new Set(['LEARN_MORE', 'ORDER', 'BOOK', 'SIGN_UP', 'SHOP', 'CALL'])

export function serializeCallToAction(
  cta: CTA,
): { actionType: CTA['actionType']; url?: string } {
  if (cta.actionType === 'CALL' || !('url' in cta) || !cta.url) {
    return { actionType: cta.actionType }
  }
  return { actionType: cta.actionType, url: cta.url }
}

export function gbpCreatePayload(post: {
  summary: string
  cta?: CTA
  photoUrl?: string
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    languageCode: 'en-US',
    summary: post.summary,
    topicType: 'STANDARD',
  }
  if (post.cta) payload.callToAction = serializeCallToAction(post.cta)
  if (post.photoUrl) {
    payload.media = [{ mediaFormat: 'PHOTO', sourceUrl: post.photoUrl }]
  }
  return payload
}

export function ctaLink(cta: CTA | undefined): string | null {
  return cta && 'url' in cta ? cta.url : null
}

export type GbpCtaInput = { actionType: string; url?: string }

export type GbpValidation =
  | { ok: true }
  | { ok: false; reason: string }

export function validateGbpLocalPost(post: {
  summary: string
  cta?: GbpCtaInput
  photoUrl?: string
}): GbpValidation {
  const summary = post.summary ?? ''
  if (!summary.trim()) {
    return { ok: false, reason: 'summary empty' }
  }
  if (summary.length > GBP_SUMMARY_MAX) {
    return {
      ok: false,
      reason: `summary too long (${summary.length} > ${GBP_SUMMARY_MAX})`,
    }
  }
  // Google auto-rejects a local post whose body repeats the listing phone.
  // Verified on this profile 2026-08-04 (see route.ts).
  if (/615[-.\s]?551[-.\s]?2727/.test(summary)) {
    return {
      ok: false,
      reason: 'summary contains the business phone (Google rejects it as spam)',
    }
  }
  // Raw http(s) URLs belong on the CTA button, not in summary — Google
  // returns a generic 400 INVALID_ARGUMENT when the body contains one.
  if (/https?:\/\//i.test(summary)) {
    return {
      ok: false,
      reason: 'summary contains a raw http(s) URL (put the link on the CTA)',
    }
  }

  const cta = post.cta
  if (cta) {
    if (!CTA_ALLOWED.has(cta.actionType)) {
      return { ok: false, reason: `bad actionType: ${cta.actionType}` }
    }

    const url = typeof cta.url === 'string' ? cta.url.trim() : ''

    if (CTA_NO_URL.has(cta.actionType) && url) {
      return {
        ok: false,
        reason: 'CALL CTA must not include a url (Google rejects tel: as INVALID_ARGUMENT)',
      }
    }

    if (CTA_WITH_URL.has(cta.actionType)) {
      if (!url) {
        return {
          ok: false,
          reason: `${cta.actionType} CTA requires an http(s) url`,
        }
      }
      const scheme = ctaUrlScheme(url)
      if (scheme !== 'http:' && scheme !== 'https:') {
        return {
          ok: false,
          reason: `CTA url must be http(s) if present (got ${scheme ?? 'unparseable'})`,
        }
      }
    }
  }

  if (post.photoUrl) {
    const photoScheme = ctaUrlScheme(post.photoUrl)
    if (photoScheme !== 'http:' && photoScheme !== 'https:') {
      return {
        ok: false,
        reason: `photoUrl must be http(s) (got ${photoScheme ?? 'unparseable'})`,
      }
    }
  }

  return { ok: true }
}

// Host + scheme only — never the path, query, or a tel: number.
export function describeCtaUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    // WHATWG parses `tel:615…` as a valid URL with an empty host, which
    // would stringify as `tel://` and still isn't a number — but we never
    // want the path/number in logs. Non-http schemes: protocol only.
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return `${u.protocol}//${u.hostname}`
    }
    return u.protocol
  } catch {
    if (/^tel:/i.test(url)) return 'tel:'
    if (/^mailto:/i.test(url)) return 'mailto:'
    return 'unparseable'
  }
}

export function safeGbpPayloadSummary(post: {
  summary: string
  cta?: GbpCtaInput
  photoUrl?: string
  kind?: string
}): Record<string, unknown> {
  return {
    kind: post.kind ?? null,
    summaryLength: post.summary?.length ?? 0,
    actionType: post.cta?.actionType ?? null,
    ctaUrl: describeCtaUrl(post.cta && 'url' in post.cta ? post.cta.url : null),
    hasPhoto: Boolean(post.photoUrl),
  }
}

function ctaUrlScheme(url: string): string | null {
  try {
    return new URL(url).protocol
  } catch {
    return null
  }
}
