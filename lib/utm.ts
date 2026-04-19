// UTM helper — appends source/medium/campaign params so traffic from
// auto-posters (LinkedIn cron, GBP cron) is attributable in GA4 once
// NEXT_PUBLIC_GA_ID is configured.
//
// Usage:
//   withUtm('https://joshuafink.com/blog/foo', { source: 'linkedin', medium: 'auto', campaign: 'blog-syndication' })
//   -> 'https://joshuafink.com/blog/foo?utm_source=linkedin&utm_medium=auto&utm_campaign=blog-syndication'
//
// Existing query params are preserved. Existing utm_* params are NOT
// overwritten — first-party tagging wins over the cron's defaults.

export type UtmSource = 'linkedin' | 'gbp' | 'facebook' | 'instagram' | 'x' | 'email' | 'rss'
export type UtmMedium = 'auto' | 'organic' | 'social' | 'cpc' | 'newsletter'

export interface UtmParams {
  source: UtmSource | string
  medium: UtmMedium | string
  campaign: string
  content?: string
  term?: string
}

export function withUtm(url: string, utm: UtmParams): string {
  // External URLs (e.g. compass.com listing pages) — return as-is. UTMs
  // would only confuse third-party analytics.
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url // not a valid URL — caller error, don't decorate
  }
  if (!/(^|\.)joshuafink\.com$/i.test(parsed.hostname)) {
    return url
  }

  const setIfMissing = (key: string, value: string | undefined) => {
    if (!value) return
    if (parsed.searchParams.has(key)) return // first-party tag wins
    parsed.searchParams.set(key, value)
  }

  setIfMissing('utm_source', utm.source)
  setIfMissing('utm_medium', utm.medium)
  setIfMissing('utm_campaign', utm.campaign)
  setIfMissing('utm_content', utm.content)
  setIfMissing('utm_term', utm.term)

  return parsed.toString()
}
