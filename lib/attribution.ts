// Traffic-source attribution for lead forms.
//
// lib/utm.ts tags every auto-posted LinkedIn/GBP/Instagram link with utm_*
// params, but nothing read them back — so no lead could answer "which channel
// brought this visitor". On the first page view of a session this helper
// stashes the landing URL, its utm_source, and document.referrer in
// sessionStorage so they survive client-side navigation to whichever form the
// visitor eventually submits. /api/contact treats the lead as a generic field
// map, so the extra fields flow into the lead email and the CRM sheet without
// any server change.

const KEY = 'jf_attribution'

export type Attribution = {
  /** Channel that brought the visitor: utm_source, else referrer host, else "direct". */
  traffic_source: string
  /** Full URL of the first page viewed this session (keeps utm params visible in the CRM). */
  landing_page: string
  referrer: string
}

function derive(): Attribution {
  const utmSource = new URL(window.location.href).searchParams.get('utm_source')
  const referrer = document.referrer
  let referrerHost = ''
  try {
    referrerHost = new URL(referrer).hostname
  } catch {
    // empty or opaque referrer — treated as direct below
  }
  // A same-host referrer just means a hard reload mid-session, not a channel.
  const external = referrerHost && referrerHost !== window.location.hostname
  return {
    traffic_source: utmSource || (external ? referrerHost : 'direct'),
    landing_page: window.location.href,
    referrer,
  }
}

/**
 * Stash attribution on first page view. Later calls are no-ops, so the
 * original landing page wins over pages the visitor navigates to afterwards.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, JSON.stringify(derive()))
    }
  } catch {
    // sessionStorage unavailable (private mode) — getAttribution() falls back
  }
}

/**
 * Read the stashed attribution, falling back to a live read of the current
 * page when nothing was captured (e.g. sessionStorage unavailable).
 */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') {
    return { traffic_source: '', landing_page: '', referrer: '' }
  }
  try {
    const stored = sessionStorage.getItem(KEY)
    if (stored) return JSON.parse(stored) as Attribution
  } catch {
    // corrupt or unreadable — fall through to a live read
  }
  return derive()
}
