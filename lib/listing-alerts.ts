/**
 * Opt-in new-listing and price-drop emails.
 *
 * People are added only when they check the listing-alert box. The daily
 * Compass sync compares today's lib/listings.ts with the last snapshot and
 * sends one digest per matching subscriber. Sends are deduped with post_log
 * ref keys so a second run the same sync does not mail twice.
 *
 * Resend's npm SDK is not a dependency of this site, and Broadcasts send one
 * body to a whole audience. City and price filters need a different email
 * per subscriber, so delivery uses the existing Resend transactional API
 * (lib/send-email.ts) plus a hosted one-click unsubscribe.
 */

export const ALERT_SITE = 'https://www.joshuafink.com'

export const COMPASS_MAILING_ADDRESS = {
  agent: 'Joshua Fink',
  role: 'Affiliate Broker',
  firm: 'Compass',
  street: '8119 Isabella Lane, Suite 105',
  cityLine: 'Brentwood, TN 37027',
  phone: '615-551-2727',
  license: 'TREC #351484',
} as const

const YES = new Set(['yes', 'on', 'true', '1'])

export interface AlertListing {
  address: string
  city: string
  price: number
  previousPrice?: number
  status: string
  beds?: number
  baths?: number
  sqft?: number
  imageUrl?: string
  /** On-site path, e.g. /listings/4127-edwards-ave-nashville */
  path: string
  compassUrl: string
}

export interface AlertEvent {
  kind: 'new' | 'price-drop'
  listing: AlertListing
  refKey: string
}

export interface SeenListing {
  compassUrl: string
  price: number
}

export interface AlertFilter {
  email: string
  city: string | null
  priceMin: number | null
  priceMax: number | null
  token: string
}

export interface AlertDigest {
  email: string
  token: string
  events: AlertEvent[]
  refKey: string
}

export function isPlausibleEmail(email: string | undefined | null): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim())
}

/** True only when the unchecked opt-in box was checked and an email is present. */
export function listingAlertOptIn(lead: Record<string, string>): boolean {
  const flag = (lead.alert_opt_in || '').trim().toLowerCase()
  if (!YES.has(flag)) return false
  return isPlausibleEmail(lead.email)
}

export function parseOptionalPrice(value: string | undefined): number | null {
  if (!value) return null
  const n = Number(String(value).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}

/** Copy price range into budget and city into suburb so the sheet columns fill in. */
export function applyAlertFields(lead: Record<string, string>): void {
  const min = parseOptionalPrice(lead.price_min)
  const max = parseOptionalPrice(lead.price_max)
  if (!(lead.budget || '').trim() && (min || max)) {
    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n)
    if (min && max) lead.budget = `${fmt(min)}–${fmt(max)}`
    else if (min) lead.budget = `${fmt(min)}+`
    else if (max) lead.budget = `Up to ${fmt(max)}`
  }
  if (!(lead.suburb || '').trim() && (lead.alert_city || '').trim()) {
    lead.suburb = lead.alert_city.trim()
  }
}

export function normalizeListingUrl(url: string): string {
  const trimmed = (url || '').trim()
  if (!trimmed) return ''
  try {
    const u = new URL(trimmed)
    u.hash = ''
    u.search = ''
    return `${u.origin}${u.pathname.replace(/\/+$/, '')}`.toLowerCase()
  } catch {
    return trimmed.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase()
  }
}

/** "Nashville" from "Nashville, TN 37216 | MLS #1" or "Lot 54, Brentwood, TN 37027". */
export function alertCityKey(city: string): string {
  const display = (city || '').split('|')[0]
  const match = display.match(/([A-Za-z][A-Za-z .']+),\s*[A-Z]{2}\b/)
  const name = (match ? match[1] : display).trim().toLowerCase()
  return name.replace(/\s+/g, ' ')
}

export function formatUsd(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export function cityLabel(city: string): string {
  return (city || '').split('|')[0].trim()
}

/**
 * New Compass URL → new listing. Lower price on a known URL → price drop.
 * An empty previous snapshot is a baseline: record it, send nothing.
 * Price increases and status-only changes are not emails.
 */
export function detectListingEvents(
  previous: readonly SeenListing[],
  current: readonly AlertListing[],
): { baseline: boolean; events: AlertEvent[] } {
  if (previous.length === 0) return { baseline: true, events: [] }
  const prev = new Map(previous.map((row) => [normalizeListingUrl(row.compassUrl), row]))
  const events: AlertEvent[] = []
  for (const listing of current) {
    if (!(listing.price > 0) || !listing.compassUrl) continue
    const key = normalizeListingUrl(listing.compassUrl)
    const before = prev.get(key)
    if (!before) {
      events.push({ kind: 'new', listing, refKey: `new:${key}` })
      continue
    }
    if (before.price > 0 && listing.price < before.price) {
      events.push({
        kind: 'price-drop',
        listing: { ...listing, previousPrice: before.price },
        refKey: `drop:${key}:${listing.price}`,
      })
    }
  }
  return { baseline: false, events }
}

export function subscriberMatches(filter: AlertFilter, listing: AlertListing): boolean {
  if (filter.city) {
    const want = alertCityKey(filter.city)
    const have = alertCityKey(listing.city)
    if (want && have && want !== have) return false
  }
  if (filter.priceMin != null && listing.price < filter.priceMin) return false
  if (filter.priceMax != null && listing.price > filter.priceMax) return false
  return true
}

export function digestRefKey(syncedAt: string, email: string): string {
  return `digest:${syncedAt}:${email.trim().toLowerCase()}`
}

export function digestsToSend(
  subscribers: readonly AlertFilter[],
  events: readonly AlertEvent[],
  alreadySent: ReadonlySet<string>,
  syncedAt: string,
): AlertDigest[] {
  const out: AlertDigest[] = []
  for (const sub of subscribers) {
    if (!isPlausibleEmail(sub.email) || !sub.token) continue
    const matched = events.filter((event) => subscriberMatches(sub, event.listing))
    if (matched.length === 0) continue
    const refKey = digestRefKey(syncedAt, sub.email)
    if (alreadySent.has(refKey)) continue
    out.push({
      email: sub.email.trim().toLowerCase(),
      token: sub.token,
      events: matched,
      refKey,
    })
  }
  return out
}

export function unsubscribeUrl(token: string, origin: string = ALERT_SITE): string {
  return `${origin.replace(/\/$/, '')}/api/listing-alerts/unsubscribe?token=${encodeURIComponent(token)}`
}

export function confirmUrl(token: string, origin: string = ALERT_SITE): string {
  return `${origin.replace(/\/$/, '')}/api/listing-alerts/confirm?token=${encodeURIComponent(token)}`
}

export function listUnsubscribeHeaders(url: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function specs(listing: AlertListing): string {
  return [
    listing.beds !== undefined ? `${listing.beds} bd` : '',
    listing.baths !== undefined ? `${listing.baths} ba` : '',
    listing.sqft !== undefined ? `${listing.sqft.toLocaleString('en-US')} sqft` : '',
  ].filter(Boolean).join(' · ')
}

export function digestSubject(events: readonly AlertEvent[]): string {
  if (events.length === 1) {
    const event = events[0]
    const place = cityLabel(event.listing.city).split(',')[0].trim()
    if (event.kind === 'price-drop') {
      return `Price drop: ${event.listing.address} — now ${formatUsd(event.listing.price)}`
    }
    const where = place ? `, ${place}` : ''
    return `New listing: ${event.listing.address}${where} — ${formatUsd(event.listing.price)}`
  }
  const drops = events.filter((event) => event.kind === 'price-drop').length
  const news = events.length - drops
  if (drops && news) return 'New listings and price drops from Joshua Fink'
  if (drops) return 'Price drops from Joshua Fink'
  return 'New listings from Joshua Fink'
}

function listingBlock(event: AlertEvent): string {
  const listing = event.listing
  const href = `${ALERT_SITE}${listing.path}?utm_source=listing-alert&utm_medium=email&utm_campaign=${event.kind}`
  const label = event.kind === 'price-drop' ? 'Price drop' : listing.status || 'New listing'
  const priceLine = event.kind === 'price-drop' && listing.previousPrice
    ? `${escapeHtml(formatUsd(listing.price))} <span style="color:#888;text-decoration:line-through;">${escapeHtml(formatUsd(listing.previousPrice))}</span>`
    : escapeHtml(formatUsd(listing.price))
  const photo = listing.imageUrl
    ? `<a href="${escapeHtml(href)}"><img src="${escapeHtml(listing.imageUrl)}" alt="${escapeHtml(listing.address)}" width="560" style="width:100%;max-width:560px;height:auto;border-radius:12px;display:block;" /></a>`
    : ''
  const spec = specs(listing)
  return `
    <div style="margin:0 0 28px;">
      ${photo}
      <p style="margin:14px 0 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#888;">${escapeHtml(label)}</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:bold;color:#111;">${priceLine}</p>
      <p style="margin:4px 0 0;font-size:16px;color:#222;">${escapeHtml(listing.address)}</p>
      <p style="margin:2px 0 0;font-size:14px;color:#666;">${escapeHtml(cityLabel(listing.city))}${spec ? ` · ${escapeHtml(spec)}` : ''}</p>
      <p style="margin:14px 0 0;"><a href="${escapeHtml(href)}" style="color:#111;font-weight:bold;">View this home</a></p>
    </div>`
}

export function canSpamFooter(unsubscribeHref: string): string {
  const office = COMPASS_MAILING_ADDRESS
  return `
  <div style="background:#f5f5f5;padding:20px 32px;font-size:12px;color:#666;border-top:1px solid #e8e8e8;line-height:1.6;">
    <p style="margin:0;">${escapeHtml(office.agent)}, ${escapeHtml(office.role)}</p>
    <p style="margin:0;">${escapeHtml(office.firm)} · ${escapeHtml(office.phone)} · ${escapeHtml(office.license)}</p>
    <p style="margin:0;">${escapeHtml(office.street)}</p>
    <p style="margin:0 0 12px;">${escapeHtml(office.cityLine)}</p>
    <p style="margin:0;"><a href="${escapeHtml(unsubscribeHref)}" style="color:#666;">Unsubscribe from listing alerts</a></p>
  </div>`
}

export function renderListingAlertEmail(digest: AlertDigest): {
  subject: string
  html: string
  headers: Record<string, string>
  unsubscribeHref: string
} {
  const unsubscribeHref = unsubscribeUrl(digest.token)
  const subject = digestSubject(digest.events)
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#222;">
  <div style="background:#0A1628;padding:28px 32px;">
    <p style="color:#fff;font-size:13px;letter-spacing:0.18em;margin:0;">COMPASS</p>
    <p style="color:#fff;font-size:22px;margin:8px 0 0;">Joshua Fink</p>
    <p style="color:#A0A0A0;margin:4px 0 0;font-size:13px;">Affiliate Broker · Middle Tennessee</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;line-height:1.6;margin-top:0;">Here are the Compass listings that match what you asked to hear about.</p>
    ${digest.events.map(listingBlock).join('')}
    <p style="font-size:14px;line-height:1.6;color:#444;">Questions about any of these? Call or text me at <a href="tel:6155512727" style="color:#111;">615-551-2727</a>.</p>
    <p style="font-size:14px;line-height:1.6;color:#444;">Joshua Fink<br/>Affiliate Broker, Compass</p>
  </div>
  ${canSpamFooter(unsubscribeHref)}
</body>
</html>`
  return {
    subject,
    html,
    headers: listUnsubscribeHeaders(unsubscribeHref),
    unsubscribeHref,
  }
}

export const INVITE_SUBJECT = 'Want new listing alerts?'

export function renderListingAlertInvite(token: string): {
  subject: string
  html: string
  headers: Record<string, string>
} {
  const yes = confirmUrl(token)
  const unsubscribeHref = unsubscribeUrl(token)
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#222;">
  <div style="background:#0A1628;padding:28px 32px;">
    <p style="color:#fff;font-size:13px;letter-spacing:0.18em;margin:0;">COMPASS</p>
    <p style="color:#fff;font-size:22px;margin:8px 0 0;">Joshua Fink</p>
    <p style="color:#A0A0A0;margin:4px 0 0;font-size:13px;">Affiliate Broker · Middle Tennessee</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:18px;font-weight:bold;margin-top:0;">Want new listing alerts?</p>
    <p style="font-size:16px;line-height:1.7;color:#333;">You wrote to me through joshuafink.com. I can email you when I list a home or drop a price. I will not add you unless you click yes.</p>
    <p style="margin:28px 0;"><a href="${escapeHtml(yes)}" style="background:#111;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;display:inline-block;">Yes, send me listing alerts</a></p>
    <p style="font-size:14px;line-height:1.6;color:#666;">If you do nothing, you will not get these emails. Call or text me anytime at <a href="tel:6155512727" style="color:#111;">615-551-2727</a>.</p>
  </div>
  ${canSpamFooter(unsubscribeHref)}
</body>
</html>`
  return {
    subject: INVITE_SUBJECT,
    html,
    headers: listUnsubscribeHeaders(unsubscribeHref),
  }
}

/** Invite sends only when dry_run is explicitly turned off. Default is dry-run. */
export function inviteIsDryRun(params: { get(name: string): string | null }): boolean {
  const value = (params.get('dry_run') ?? '1').trim().toLowerCase()
  return value !== '0' && value !== 'false' && value !== 'no'
}

export function selectInviteRecipients(
  emails: readonly string[],
  alreadyActive: ReadonlySet<string>,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of emails) {
    const email = raw.trim().toLowerCase()
    if (!isPlausibleEmail(email) || seen.has(email) || alreadyActive.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

export function inviteRefKey(email: string): string {
  return `invite:${email.trim().toLowerCase()}`
}
