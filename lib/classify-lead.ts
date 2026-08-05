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

// A lead gets exactly one of four verdicts. The distinction that matters is
// between "this is definitely a bot" and "this looks unusual to a regex" —
// those are not the same thing, and conflating them is what silently ate real
// leads three separate times (gibberish_body, random_name, too_fast).
//
//   bot     → only the honeypot. Silently accepted so bots don't retry.
//   invalid → the human left out something we genuinely need. Visible 400 so
//             they can fix it and resubmit. NEVER a silent drop.
//   suspect → a shape heuristic fired. DELIVERED anyway, tagged so Joshua can
//             judge it himself. A false positive now costs a tag, not a lead.
//   clean   → delivered normally.
//
// The rule to hold onto: a heuristic may annotate a lead, but only the honeypot
// may discard one.
export type LeadVerdict =
  | { kind: 'clean' }
  | { kind: 'bot'; reason: string }
  | { kind: 'invalid'; reason: string; message: string }
  | { kind: 'suspect'; reason: string }

export function classifyLead(lead: Record<string, string>): LeadVerdict {
  // Honeypot filled → bot. This is the only rule permitted to drop a lead: a
  // human never sees this field, so filling it is unambiguous.
  if (lead.website && lead.website.trim() !== '') {
    return { kind: 'bot', reason: 'honeypot' }
  }

  // NOTE: a "submitted in under 3 seconds" rule used to live here, keyed on a
  // hidden `_loaded` timestamp. It was removed — it caught no bots and silently
  // dropped real people.
  //
  // It was set on exactly one form (the cash-offer seller form, the highest
  // intent lead on the site) as `value={Date.now()}` evaluated during render.
  // That page is statically prerendered, so the served HTML carried the BUILD
  // time: on a first submit the delta was hours or days and the rule never
  // fired. Bots POSTing this endpoint directly omit `_loaded` entirely and were
  // skipped by the `loaded > 0` guard. Net bot protection: zero.
  //
  // Worse, the failure mode ran the other way. After a submit error the form
  // re-renders and stamps a FRESH timestamp into the DOM, so a seller who hit
  // send again within three seconds was classified as a bot and discarded
  // behind a fake success screen — at exactly the moment delivery had already
  // failed once.
  //
  // The honeypot below is the rule that actually works, so timing is not
  // needed. If timing is ever reintroduced, set the timestamp on mount in a
  // useEffect (never during render) and keep it off statically rendered pages.

  // ---- Validation: things the human can actually fix. Visible errors. ----
  //
  // These were previously punished as spam behind a fake success screen, which
  // is the worst possible handling: the visitor believes they've reached
  // Joshua, so they never call, and the typo is never corrected.

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

  if (lead.source === 'cash-offer' && (lead.property_address || '').trim().length < 5) {
    return {
      kind: 'invalid',
      reason: 'address_too_short',
      message: 'Please enter the property address so Joshua can price it.',
    }
  }

  // ---- Heuristics: suspicious shapes. Tagged, never dropped. ----

  // A pasted listing link in the address field is normal seller behaviour, not
  // a bot signal — this rule used to discard the highest-intent lead type.
  if (/https?:\/\//i.test(lead.name || '') || /https?:\/\//i.test(lead.property_address || '')) {
    return { kind: 'suspect', reason: 'url_in_field' }
  }

  if (/^(\d)\1{6,}$/.test(phone)) {
    return { kind: 'suspect', reason: 'phone_repeated' }
  }
  if (/^0?1234567890?$/.test(phone) || /^9876543210?$/.test(phone)) {
    return { kind: 'suspect', reason: 'phone_sequential' }
  }

  // A privacy-conscious person with a throwaway address may still have given a
  // real phone number, so this can no longer discard the whole submission.
  if (lead.email) {
    const domain = lead.email.split('@')[1]?.toLowerCase()
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      return { kind: 'suspect', reason: 'disposable_email' }
    }
  }

  // Random-string name: no spaces, mixed upper/lower, no real vowel structure
  // Real names have spaces (First Last) or are short single words
  const name = (lead.name || '').trim()
  if (name.length > 10 && !name.includes(' ')) {
    // Long single-token name with digits, or scattered internal capitals.
    //
    // The previous rule flagged any mixed-case single token over 14 chars,
    // which is just how a normally-capitalised long surname looks — a real
    // "Konstantinopoulos" was dropped behind a fake success screen. A leading
    // capital is not a bot signal; capitals sprinkled through the middle of
    // the token ("xKJhsdfKJHsdf") are.
    const hasDigits = /\d/.test(name)
    const internalCaps = (name.slice(1).match(/[A-Z]/g) || []).length
    if (hasDigits || internalCaps >= 3) {
      // Still imperfect — hyphenated surnames like "McDonald-McCarthy" trip the
      // internal-caps test — which is exactly why this now tags instead of drops.
      return { kind: 'suspect', reason: 'random_name' }
    }
  }

  // Heavily dotted gmail: bots use x.x.x.x@gmail.com pattern (4+ dots before @)
  if (lead.email) {
    const localPart = lead.email.split('@')[0] || ''
    const domain = lead.email.split('@')[1]?.toLowerCase() || ''
    const dotCount = (localPart.match(/\./g) || []).length
    if (domain === 'gmail.com' && dotCount >= 4) {
      // Gmail ignores dots, so j.o.h.n.smith@gmail.com is a real address style.
      return { kind: 'suspect', reason: 'dotted_gmail_bot' }
    }
  }

  // Random body: one long unbroken token, e.g. "asdkjhasdkjhasdkjhaskdjh".
  //
  // This used to key on word count (`length > 10 && wordCount < 3`), which
  // silently dropped the most common real inquiries this site receives —
  // "Still available?", "Interested!", "Showing tomorrow?" all match that
  // rule. Because a spam verdict returns `{ ok: true }` (so bots don't retry),
  // those visitors saw the success screen while the lead was discarded, which
  // converts at zero and is invisible in every delivery channel.
  //
  // A short message is not a spam signal — brevity is normal from a phone.
  // Genuine gibberish is characterised by an unbroken run of characters no
  // human types by hand, so key on the longest token instead of word count.
  //
  // Second correction (2026-08-05): keying on the longest token still discards
  // the single most common real inquiry shape — someone pasting the listing
  // they're asking about. "Is this still available? https://www.zillow.com/
  // homedetails/…" is one 60-character token and was being dropped outright.
  // URLs are now excluded from the measurement, and a hit only tags the lead.
  const body = (lead.body || '').trim()
  if (body.length > 10) {
    const longestToken = body
      .split(/\s+/)
      .filter((word) => !/^https?:\/\//i.test(word) && !/@/.test(word))
      .reduce((max, word) => Math.max(max, word.length), 0)
    if (longestToken >= 25) {
      return { kind: 'suspect', reason: 'gibberish_body' }
    }
  }

  return { kind: 'clean' }
}
