// Outbound transactional email (Resend).
//
// Why this is its own module: the previous provider, SendGrid, died quietly. A
// 2026-08-18 audit found its account out of credits and ZERO emails sent since
// June — the key still authenticated, so nothing looked broken, but every send
// was rejected with "Maximum credits exceeded". The lead auto-reply and the
// new-lead email to Joshua had both been silently failing for months. (Leads
// themselves were never lost: Pushover and the Google Sheet carried them.)
// Resend replaced it on 2026-08-20; the SendGrid fallback was removed
// 2026-09-15.
//
// Resend's free tier is 3,000/month, far more than this site sends. Keeping
// delivery behind one function means a future provider swap touches one file.
//
//   RESEND_API_KEY    required for email. Unset → activeEmailProvider() is
//                     'none' and callers skip their email channel.
//   EMAIL_FROM        defaults to leads@send.joshuafink.com (must be on the
//                     domain verified in Resend — see FROM_EMAIL below).

export type EmailProvider = 'resend' | 'none'

export interface OutboundEmail {
  to: string
  subject: string
  html: string
  /** Display name shown on the From address; the address itself is EMAIL_FROM. */
  fromName: string
  replyTo?: { email: string; name?: string }
}

export interface EmailResult {
  provider: EmailProvider
  ok: boolean
  detail?: string
}

// Must be an address on a domain VERIFIED with the active provider, or the
// send is rejected outright. Resend is verified for the subdomain
// `send.joshuafink.com`, deliberately — the root domain's single SPF record
// belongs to Microsoft 365 (`include:spf.protection.outlook.com -all`) and
// editing it to bolt on a second sender risks Joshua's actual business email
// for the sake of a lead auto-reply. A subdomain gets its own SPF and DKIM and
// cannot collide with it.
//
// Nothing receives at this address: both callers set an explicit `reply_to`
// (the lead's auto-reply replies to joshua@joshuafink.com, and his new-lead
// notification replies straight to the lead), so conversations still land in
// the real Microsoft 365 inbox.
export const FROM_EMAIL = process.env.EMAIL_FROM || 'leads@send.joshuafink.com'

// Abort a provider call after a few seconds so one hung service degrades into
// a normal failed-channel result instead of stalling the whole submit until
// Vercel's hard cutoff (which would skip the emergency fallback and hand the
// visitor a raw failure). Modeled on probe() in cron/refresh-listings.
// Overridable so tests don't have to wait out the real timeout.
const FETCH_TIMEOUT_MS = Number(process.env.LEAD_CHANNEL_TIMEOUT_MS || '') || 6_000

/** fetch() that aborts after a timeout; a timed-out call throws Error('timeout'). */
export async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } catch (err) {
    if (ctrl.signal.aborted) throw new Error('timeout')
    throw err
  } finally {
    clearTimeout(t)
  }
}

/** Which provider would handle a send right now. 'none' means email is off. */
export function activeEmailProvider(): EmailProvider {
  return process.env.RESEND_API_KEY ? 'resend' : 'none'
}

async function sendViaResend(msg: OutboundEmail): Promise<EmailResult> {
  const res = await fetchWithTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${msg.fromName} <${FROM_EMAIL}>`,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      ...(msg.replyTo ? { reply_to: msg.replyTo.email } : {}),
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { provider: 'resend', ok: false, detail: `HTTP ${res.status} ${detail.slice(0, 200)}` }
  }
  return { provider: 'resend', ok: true }
}

/**
 * Send one transactional email. Never throws — callers treat email as one
 * delivery channel among several and must not fail a lead because mail is down.
 */
export async function sendEmail(msg: OutboundEmail): Promise<EmailResult> {
  if (activeEmailProvider() === 'none') {
    return { provider: 'none', ok: false, detail: 'no email provider configured' }
  }
  try {
    return await sendViaResend(msg)
  } catch (err) {
    return { provider: 'resend', ok: false, detail: String(err) }
  }
}
