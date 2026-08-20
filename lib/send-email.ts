// Outbound transactional email, provider-agnostic.
//
// Why this exists: the SendGrid account died quietly. A 2026-08-18 audit found
// `GET /v3/user/credits` returning `{"total":0,"remain":0,"is_hard_limit":true}`
// and ZERO emails sent since June — the key still authenticates, so nothing
// looked broken, but every send 401'd with "Maximum credits exceeded". The lead
// auto-reply and the new-lead email to Joshua had both been silently failing
// for months. (Leads themselves were never lost: Pushover and the Google Sheet
// carried them.)
//
// Resend's free tier is 3,000/month, which is far more than this site sends, so
// the swap costs nothing. Rather than hard-code the new provider and repeat the
// mistake, delivery goes through one function that picks whichever provider is
// configured.
//
// ORDER MATTERS: Resend wins when RESEND_API_KEY is present. That makes the
// cutover a single env var — add the key and mail starts flowing; remove it and
// it falls back. Nothing needs redeploying to switch, and until the key exists
// behaviour is exactly what it is today.
//
//   RESEND_API_KEY    preferred. Requires joshuafink.com verified in Resend.
//   SENDGRID_API_KEY  legacy fallback. Currently out of credits — see above.
//   EMAIL_FROM        defaults to leads@joshuafink.com (must be a verified
//                     sender on whichever provider is active).

export type EmailProvider = 'resend' | 'sendgrid' | 'none'

export interface OutboundEmail {
  to: string
  toName?: string
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

export const FROM_EMAIL = process.env.EMAIL_FROM || 'leads@joshuafink.com'

/** Which provider would handle a send right now. 'none' means email is off. */
export function activeEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.SENDGRID_API_KEY) return 'sendgrid'
  return 'none'
}

async function sendViaResend(msg: OutboundEmail): Promise<EmailResult> {
  const res = await fetch('https://api.resend.com/emails', {
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

async function sendViaSendgrid(msg: OutboundEmail): Promise<EmailResult> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to, ...(msg.toName ? { name: msg.toName } : {}) }] }],
      from: { email: FROM_EMAIL, name: msg.fromName },
      ...(msg.replyTo
        ? { reply_to: { email: msg.replyTo.email, ...(msg.replyTo.name ? { name: msg.replyTo.name } : {}) } }
        : {}),
      subject: msg.subject,
      content: [{ type: 'text/html', value: msg.html }],
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { provider: 'sendgrid', ok: false, detail: `HTTP ${res.status} ${detail.slice(0, 200)}` }
  }
  return { provider: 'sendgrid', ok: true }
}

/**
 * Send one transactional email. Never throws — callers treat email as one
 * delivery channel among several and must not fail a lead because mail is down.
 */
export async function sendEmail(msg: OutboundEmail): Promise<EmailResult> {
  const provider = activeEmailProvider()
  if (provider === 'none') {
    return { provider: 'none', ok: false, detail: 'no email provider configured' }
  }
  try {
    return provider === 'resend' ? await sendViaResend(msg) : await sendViaSendgrid(msg)
  } catch (err) {
    return { provider, ok: false, detail: String(err) }
  }
}
