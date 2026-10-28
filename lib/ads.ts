// Google Ads conversion tracking. Everything here is a no-op until the
// NEXT_PUBLIC_GOOGLE_ADS_* env vars are set, so the site can ship before
// the Ads account exists. Payloads are send_to / value / currency only —
// never a name, email, phone, or address.

const GA_ID = /^G-[A-Z0-9]{4,20}$/
const ADS_ID = /^AW-\d{4,20}$/
// Google Ads conversion labels are a short token (letters, digits, _ and -).
const CONVERSION_LABEL = /^[A-Za-z0-9_-]{1,80}$/

type Gtag = (...args: unknown[]) => void

export type GtagBootstrap = {
  src: string
  inline: string
}

function clean(value: string | null | undefined): string {
  return (value || '').trim()
}

export function googleAnalyticsId(value: string | null | undefined): string | null {
  const id = clean(value)
  return GA_ID.test(id) ? id : null
}

export function googleAdsId(value: string | null | undefined): string | null {
  const id = clean(value)
  return ADS_ID.test(id) ? id : null
}

function conversionLabel(label: string | null | undefined): string | null {
  const cleanLabel = clean(label)
  return CONVERSION_LABEL.test(cleanLabel) ? cleanLabel : null
}

function readGtag(): Gtag | null {
  if (typeof globalThis.window === 'undefined' || !globalThis.window) return null
  const gtag = (globalThis.window as Window & { gtag?: Gtag }).gtag
  return typeof gtag === 'function' ? gtag : null
}

/**
 * One gtag.js loader and a config call per valid id. GA4 keeps the loader
 * URL it already had; an Ads id only adds `gtag('config', AW-…)`. A valid
 * Ads id with no GA4 id loads gtag.js once. Malformed values are dropped
 * before they can reach dangerouslySetInnerHTML.
 */
export function gtagBootstrap(
  gaId: string | null | undefined,
  adsId: string | null | undefined,
): GtagBootstrap | null {
  const ga = googleAnalyticsId(gaId)
  const ads = googleAdsId(adsId)
  if (!ga && !ads) return null
  const loaderId = ga ?? ads
  const configs = [
    ga ? `gtag('config','${ga}');` : '',
    ads ? `gtag('config','${ads}');` : '',
  ].join('')
  return {
    src: `https://www.googletagmanager.com/gtag/js?id=${loaderId}`,
    inline: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${configs}`,
  }
}

/**
 * `gtag('event', 'conversion', { send_to: 'AW-…/label', value: 1, currency: 'USD' })`.
 * No-op when the Ads id, the label, or gtag is missing.
 */
export function trackAdsConversion(label: string | null | undefined): void {
  const id = googleAdsId(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID)
  const sendLabel = conversionLabel(label)
  if (!id || !sendLabel) return
  const gtag = readGtag()
  if (!gtag) return
  gtag('event', 'conversion', {
    send_to: `${id}/${sendLabel}`,
    value: 1,
    currency: 'USD',
  })
}
