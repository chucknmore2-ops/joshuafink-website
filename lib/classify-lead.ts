// ---------------------------------------------------------------------------
// Lead classification for /api/contact.
//
// Extracted from the route so it can be unit-tested — this logic has silently
// discarded real leads four separate times, so it now has regression tests
// pinning the specific messages that were lost. See classify-lead.test.ts.
// ---------------------------------------------------------------------------

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'dispostable.com', 'maildrop.cc', 'trashmail.com', 'fakeinbox.com',
  'temp-mail.org', '10minutemail.com', 'getnada.com', 'emailondeck.com',
  'mohmal.com', 'mailnesia.com', 'tmail.ws', 'tmpmail.net', 'tmpmail.org',
  'bupmail.com', 'mailcatch.com', 'mintemail.com', 'tempr.email',
  'discard.email', 'mailnull.com', 'spamgourmet.com', 'jetable.org',
])

// Hosts a real buyer or seller pastes. A single link to one of these is not
// a spam signal — "is this still available?" plus a Zillow URL is the most
// common good lead this site gets.
const TRUSTED_LINK_HOSTS = [
  'zillow.com',
  'realtor.com',
  'redfin.com',
  'homes.com',
  'trulia.com',
  'compass.com',
  'joshuafink.com',
  'apartments.com',
  'movoto.com',
  'homesnap.com',
  'google.com',
  'goo.gl',
]

// A lead gets exactly one of five verdicts.
//
//   bot     → honeypot filled. Quarantine: sheet only, fake success.
//   spam    → high-confidence junk (submitted in under 3 seconds with a real
//             client timestamp, or several independent signals at once).
//             Same quarantine as bot: no email, no Pushover, no auto-reply.
//             The row still lands on the sheet's Blocked tab.
//   invalid → the human left out something we genuinely need. Visible 400 so
//             they can fix it and resubmit. NEVER a silent drop.
//   suspect → one weak signal, or a couple that don't add up. DELIVERED,
//             tagged suspected_spam so Joshua can judge. A false positive
//             costs a tag, not a lead.
//   clean   → delivered normally.
//
// One weak signal must not quarantine. A pasted listing link, a long surname,
// a disposable address with a real phone, or a message in another script
// without a scam phrase all still reach Joshua.
const QUARANTINE_SCORE = 5
const SUSPECT_SCORE = 2
const TOO_FAST_MS = 3000

const SIGNAL_POINTS: Record<string, number> = {
  non_latin: 3,
  spam_phrase: 3,
  spam_url: 2,
  url_in_field: 2,
  gibberish_body: 2,
  random_name: 2,
  disposable_email: 2,
  dotted_gmail_bot: 2,
  phone_repeated: 2,
  phone_sequential: 2,
  non_us_phone: 1,
  mixed_token: 1,
  rate_limit: 2,
  // Missing timestamp adds weight only alongside other signals. Alone it is
  // not even a tag: no-JS submits, the daily healthcheck, and a stale cached
  // page can all omit it.
  missing_form_time: 2,
}

const SIGNAL_ORDER = [
  'non_latin',
  'spam_phrase',
  'spam_url',
  'url_in_field',
  'gibberish_body',
  'random_name',
  'disposable_email',
  'dotted_gmail_bot',
  'phone_repeated',
  'phone_sequential',
  'non_us_phone',
  'mixed_token',
  'rate_limit',
  'missing_form_time',
]

// Cyrillic, CJK, Arabic, Hebrew, and other non-Latin scripts. Latin
// extensions (José, Nguyễn, Søren, Kjærgaard) are intentionally absent.
// Built with new RegExp so the `u` flag is not a regex literal: this
// tsconfig has no `target`, and tsc rejects the flag on a literal.
const NON_LATIN_SCRIPT = new RegExp(
  '[\\p{Script=Cyrillic}\\p{Script=Arabic}\\p{Script=Hebrew}\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}\\p{Script=Thai}\\p{Script=Devanagari}\\p{Script=Greek}]',
  'u',
)

// Specific scam templates, not bare words. "переводчик" (translator) and a
// cash-offer conversation must not match.
const SPAM_PHRASE = new RegExp(
  'перевод\\s+\\d|\\d\\s*руб|получить\\s+тут|\\b(?:bitcoin|cryptocurrency|usdt|viagra|cialis)\\b|\\b(?:guest\\s+posts?|backlinks?|seo\\s+services?)\\b|\\b(?:you(?:\'ve| have)\\s+won|claim\\s+your\\s+(?:prize|reward))\\b',
  'iu',
)

export type LeadVerdict =
  | { kind: 'clean' }
  | { kind: 'bot'; reason: string }
  | { kind: 'spam'; reason: string }
  | { kind: 'invalid'; reason: string; message: string }
  | { kind: 'suspect'; reason: string }

export type ClassifyOptions = {
  /** Clock for the too-fast check. Defaults to Date.now(). */
  now?: number
  /**
   * How many submissions this IP has made in the recent window, including
   * this one. The route supplies it. Omitted in unit tests unless a case
   * is about rate limiting. Five or more adds weight; it never quarantines
   * a normal lead by itself.
   */
  recentSubmissions?: number
}

export function classifyLead(
  lead: Record<string, string>,
  options: ClassifyOptions = {},
): LeadVerdict {
  // Honeypot filled → bot. A human never sees this field, so filling it is
  // unambiguous. This is a quarantine, not a delete: the route still writes
  // the row to the sheet.
  if (lead.website && lead.website.trim() !== '') {
    return { kind: 'bot', reason: 'honeypot' }
  }

  // ---- Validation: things the human can actually fix. Visible errors. ----
  //
  // These were previously punished as spam behind a fake success screen, which
  // is the worst possible handling: the visitor believes they've reached
  // Joshua, so they never call, and the typo is never corrected.
  // Checked before the too-fast rule so a person who hits send early with a
  // blank name still sees the error instead of a fake success.

  if ((lead.name || '').trim().length < 2) {
    return { kind: 'invalid', reason: 'name_too_short', message: 'Please enter your name.' }
  }

  const phone = (lead.phone || '').replace(/\D/g, '')
  if (phone.length > 0 && phone.length < 7) {
    return {
      kind: 'invalid',
      reason: 'phone_too_short',
      message: 'That phone number looks incomplete — please check it, or leave it blank if you prefer email.',
    }
  }

  // The 14 /cash-offer/[city] pages submit as `cash-offer-<city>`, and they are
  // the same form asking for the same address.
  const isCashOffer = lead.source === 'cash-offer' || (lead.source || '').startsWith('cash-offer-')
  if (isCashOffer && (lead.property_address || '').trim().length < 5) {
    return {
      kind: 'invalid',
      reason: 'address_too_short',
      message: 'Please enter the property address so Joshua can price it.',
    }
  }

  // Timing. The hidden `_loaded` value is stamped in a useEffect when the
  // form mounts in the browser (components/LeadFormGuards.tsx) — never during
  // render. A statically prerendered page therefore does not bake the build
  // clock into the HTML.
  //
  //   present and younger than 3s → quarantine (too_fast). Bots that execute
  //     the page JS and POST immediately trip this. A human who is merely
  //     fast still has the row on the Blocked tab.
  //   missing, garbage, or hours old → not an automatic drop. Direct API
  //     posts, no-JS submits, and the old "Date.now() at build time" bug all
  //     look like this. Missing adds weight only when something else already
  //     looks wrong.
  const now = options.now ?? Date.now()
  const timing = readTiming(lead._loaded, now)
  if (timing === 'too_fast') {
    return { kind: 'spam', reason: 'too_fast' }
  }

  const signals = new Set<string>()

  if (timing === 'missing') signals.add('missing_form_time')

  const textBlob = [lead.name, lead.body, lead.email, lead.property_address].filter(Boolean).join('\n')
  if (NON_LATIN_SCRIPT.test(textBlob)) signals.add('non_latin')
  if (SPAM_PHRASE.test(lead.body || '') || SPAM_PHRASE.test(lead.name || '')) signals.add('spam_phrase')

  if (hasUntrustedUrl(lead.body || '')) signals.add('spam_url')

  // A pasted listing link in the address field is normal seller behaviour.
  // Tag it; don't treat the link itself as a scam URL when the host is a
  // known listing site.
  if (/https?:\/\//i.test(lead.name || '') || /https?:\/\//i.test(lead.property_address || '')) {
    signals.add('url_in_field')
    if (hasUntrustedUrl(`${lead.name || ''} ${lead.property_address || ''}`)) signals.add('spam_url')
  }

  if (phone && /^(\d)\1{6,}$/.test(phone)) signals.add('phone_repeated')
  if (phone && (/^0?1234567890?$/.test(phone) || /^9876543210?$/.test(phone))) signals.add('phone_sequential')
  if (isNonUsPhone(phone)) signals.add('non_us_phone')

  if (lead.email) {
    const domain = lead.email.split('@')[1]?.toLowerCase()
    if (domain && DISPOSABLE_DOMAINS.has(domain)) signals.add('disposable_email')

    const localPart = lead.email.split('@')[0] || ''
    const dotCount = (localPart.match(/\./g) || []).length
    if ((domain || '') === 'gmail.com' && dotCount >= 4) signals.add('dotted_gmail_bot')
  }

  // Random-string name: no spaces, mixed upper/lower, no real vowel structure.
  // A leading capital is not a bot signal; capitals sprinkled through the
  // middle of the token ("xKJhsdfKJHsdf") are. Long single surnames
  // ("Konstantinopoulos") are not.
  const name = (lead.name || '').trim()
  if (name.length > 10 && !name.includes(' ')) {
    const hasDigits = /\d/.test(name)
    const internalCaps = (name.slice(1).match(/[A-Z]/g) || []).length
    if (hasDigits || internalCaps >= 3) signals.add('random_name')
  }

  if (hasGibberishBody(lead.body || '')) signals.add('gibberish_body')
  if (hasMixedToken(lead.body || '')) signals.add('mixed_token')

  if ((options.recentSubmissions ?? 0) >= 5) signals.add('rate_limit')

  const contentIds = SIGNAL_ORDER.filter((id) => signals.has(id) && id !== 'missing_form_time' && id !== 'rate_limit')
  const contentScore = contentIds.reduce((sum, id) => sum + SIGNAL_POINTS[id], 0)
  const rateScore = signals.has('rate_limit') ? SIGNAL_POINTS.rate_limit : 0
  // Missing time never supplies the points that cross into quarantine on its
  // own. A no-JS visitor writing in Russian still gets delivered.
  const quarantineScore = contentScore + rateScore

  const ordered = SIGNAL_ORDER.filter((id) => {
    if (!signals.has(id)) return false
    if (id === 'missing_form_time' && contentIds.length === 0 && !signals.has('rate_limit')) return false
    return true
  })

  if (quarantineScore >= QUARANTINE_SCORE) {
    return { kind: 'spam', reason: ordered.join('+') }
  }

  if (contentScore >= SUSPECT_SCORE || signals.has('rate_limit')) {
    const suspectIds = ordered.filter((id) => id !== 'missing_form_time' || contentIds.length > 0 || signals.has('rate_limit'))
    return { kind: 'suspect', reason: suspectIds.join('+') }
  }

  return { kind: 'clean' }
}

function readTiming(raw: string | undefined, now: number): 'too_fast' | 'missing' | 'ok' {
  const value = (raw || '').trim()
  if (!value) return 'missing'
  const started = Number(value)
  if (!Number.isFinite(started) || started <= 0) return 'missing'
  const elapsed = now - started
  // A minute of clock skew (browser ahead of the server) is not a bot.
  if (elapsed < 0) return elapsed > -60_000 ? 'ok' : 'missing'
  if (elapsed < TOO_FAST_MS) return 'too_fast'
  return 'ok'
}

function isNonUsPhone(digits: string): boolean {
  if (!digits) return false
  if (digits.length === 10) return false
  if (digits.length === 11 && digits.startsWith('1')) return false
  // Shorter than 7 is a fixable typo, already returned as invalid.
  if (digits.length < 7) return false
  return true
}

function urlsIn(text: string): URL[] {
  const found = text.match(/https?:\/\/[^\s<>"']+/gi) || []
  const urls: URL[] = []
  for (const raw of found) {
    try {
      urls.push(new URL(raw.replace(/[),.;]+$/g, '')))
    } catch {
      // Not a URL we can judge. Ignore it rather than scoring it.
    }
  }
  return urls
}

function isTrustedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '')
  return TRUSTED_LINK_HOSTS.some((trusted) => host === trusted || host.endsWith(`.${trusted}`))
}

function hasUntrustedUrl(text: string): boolean {
  return urlsIn(text).some((url) => !isTrustedHost(url.hostname))
}

function hasGibberishBody(body: string): boolean {
  const trimmed = body.trim()
  if (trimmed.length <= 10) return false
  // URLs and email addresses are one long token and are not gibberish.
  // A short message is not a spam signal — brevity is normal from a phone.
  const longestToken = trimmed
    .split(/\s+/)
    .filter((word) => !/^https?:\/\//i.test(word) && !/@/.test(word))
    .reduce((max, word) => Math.max(max, word.length), 0)
  return longestToken >= 25
}

function hasMixedToken(body: string): boolean {
  return body.split(/\s+/).some((word) => {
    if (/^https?:\/\//i.test(word) || word.includes('@')) return false
    const cleaned = word.replace(new RegExp('^[^\\p{L}\\p{N}]+|[^\\p{L}\\p{N}]+$', 'gu'), '')
    if (cleaned.length < 12) return false
    const letters = cleaned.match(new RegExp('\\p{L}', 'gu')) || []
    const digits = cleaned.match(new RegExp('\\p{N}', 'gu')) || []
    return letters.length >= 4 && digits.length >= 4
  })
}
