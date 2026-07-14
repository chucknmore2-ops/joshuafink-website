import { NextRequest, NextResponse } from 'next/server'

const SENDGRID_KEY = process.env.SENDGRID_API_KEY
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL = 'C0APH84LFG8' // #joshpersonal
const FROM_EMAIL = 'leads@joshuafink.com'
const TO_EMAIL = 'joshua@joshuafink.com'
const N8N_BASE = process.env.N8N_WEBHOOK_BASE || 'http://localhost:5678/webhook'
const CASH_OFFER_BASE = process.env.CASH_OFFER_WEBHOOK_BASE || 'http://localhost:5679/webhook'
const BUYER_LEAD_WEBHOOK_BASE = process.env.BUYER_LEAD_WEBHOOK_BASE || 'http://localhost:5680'
// Free lead tracker: a Google Apps Script Web App that appends each lead as a
// row in a Google Sheet. Set GOOGLE_SHEET_WEBHOOK_URL in Vercel to the /exec
// deployment URL. No-ops safely until then. (Replaces the retired Monday.com CRM.)
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || ''
// Optional shared secret — if set, it's sent with each row and the Apps Script
// can reject anything without it. Leave empty to skip.
const SHEET_WEBHOOK_SECRET = process.env.SHEET_WEBHOOK_SECRET || ''
// Pushover — instant phone alert on each new lead. No-ops until both are set.
const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN || ''
const PUSHOVER_USER = process.env.PUSHOVER_USER || ''

// ---------------------------------------------------------------------------
// Delivery tracking
// ---------------------------------------------------------------------------
// Every channel that could tell Joshua a lead came in returns one of these.
// `configured: false` means the channel's creds aren't set (an expected no-op,
// not a failure). `ok` is only meaningful when configured. Notifiers NEVER
// throw — a channel blowing up must not take down the others or the request.

type ChannelResult = {
  channel: string
  configured: boolean
  ok: boolean
  detail?: string
}

const skip = (channel: string): ChannelResult => ({ channel, configured: false, ok: false })

// ---------------------------------------------------------------------------
// Spam detection
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

function isSpam(lead: Record<string, string>): { spam: boolean; reason: string } {
  // Honeypot filled → bot
  if (lead.website && lead.website.trim() !== '') {
    return { spam: true, reason: 'honeypot' }
  }

  // Form submitted too fast (< 3 seconds)
  const loaded = parseInt(lead._loaded || '0', 10)
  if (loaded > 0 && Date.now() - loaded < 3000) {
    return { spam: true, reason: 'too_fast' }
  }

  // Phone: too short, all repeated, or sequential
  const phone = (lead.phone || '').replace(/\D/g, '')
  if (phone.length > 0 && phone.length < 7) {
    return { spam: true, reason: 'phone_too_short' }
  }
  if (/^(\d)\1{6,}$/.test(phone)) {
    return { spam: true, reason: 'phone_repeated' }
  }
  if (/^0?1234567890?$/.test(phone) || /^9876543210?$/.test(phone)) {
    return { spam: true, reason: 'phone_sequential' }
  }

  // Disposable email
  if (lead.email) {
    const domain = lead.email.split('@')[1]?.toLowerCase()
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      return { spam: true, reason: 'disposable_email' }
    }
  }

  // URLs in name or address fields
  if (/https?:\/\//i.test(lead.name || '') || /https?:\/\//i.test(lead.property_address || '')) {
    return { spam: true, reason: 'url_in_field' }
  }

  // Name too short
  if ((lead.name || '').trim().length < 2) {
    return { spam: true, reason: 'name_too_short' }
  }

  // Address too short (for cash-offer leads)
  if (lead.source === 'cash-offer' && (lead.property_address || '').trim().length < 5) {
    return { spam: true, reason: 'address_too_short' }
  }

  // Random-string name: no spaces, mixed upper/lower, no real vowel structure
  // Real names have spaces (First Last) or are short single words
  const name = (lead.name || '').trim()
  if (name.length > 10 && !name.includes(' ')) {
    // Long single-token name with mixed case + digits = likely bot
    const hasDigits = /\d/.test(name)
    const hasMixedCase = name !== name.toLowerCase() && name !== name.toUpperCase()
    if (hasDigits || (hasMixedCase && name.length > 14)) {
      return { spam: true, reason: 'random_name' }
    }
  }

  // Heavily dotted gmail: bots use x.x.x.x@gmail.com pattern (4+ dots before @)
  if (lead.email) {
    const localPart = lead.email.split('@')[0] || ''
    const domain = lead.email.split('@')[1]?.toLowerCase() || ''
    const dotCount = (localPart.match(/\./g) || []).length
    if (domain === 'gmail.com' && dotCount >= 4) {
      return { spam: true, reason: 'dotted_gmail_bot' }
    }
  }

  // Random body: no spaces or spaces < 2 (gibberish string)
  const body = (lead.body || '').trim()
  if (body.length > 10) {
    const wordCount = body.split(/\s+/).filter(Boolean).length
    if (wordCount < 3) {
      return { spam: true, reason: 'gibberish_body' }
    }
  }

  return { spam: false, reason: '' }
}

// ---------------------------------------------------------------------------
// Slack notification
// ---------------------------------------------------------------------------

async function sendSlack(lead: Record<string, string>): Promise<ChannelResult> {
  if (!SLACK_TOKEN) return skip('slack')

  const typeEmoji: Record<string, string> = {
    buy: '🏠', sell: '💰', both: '🔄', invest: '📈', rent: '🏢', other: '💬',
    seller: '💰', buyer: '🏠', 'cash-offer': '💵',
  }
  const emoji = typeEmoji[lead.subject || lead.lead_type || ''] || '📬'
  const suburb = lead.suburb ? ` · ${lead.suburb}` : ''

  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SLACK_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: SLACK_CHANNEL,
        text: `${emoji} New lead from joshuafink.com`,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `${emoji} New Lead — joshuafink.com${suburb}` },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Name:*\n${lead.name || '—'}` },
              { type: 'mrkdwn', text: `*Phone:*\n${lead.phone ? `<tel:${lead.phone.replace(/\D/g, '')}|${lead.phone}>` : '—'}` },
              { type: 'mrkdwn', text: `*Email:*\n${lead.email || '—'}` },
              { type: 'mrkdwn', text: `*Type:*\n${lead.subject || lead.lead_type || '—'}` },
              ...(lead.property_address ? [{ type: 'mrkdwn', text: `*Property:*\n${lead.property_address}` }] : []),
              ...(lead.situation ? [{ type: 'mrkdwn', text: `*Situation:*\n${lead.situation}` }] : []),
              ...(lead.timeline ? [{ type: 'mrkdwn', text: `*Timeline:*\n${lead.timeline}` }] : []),
            ],
          },
          ...(lead.body ? [{
            type: 'section',
            text: { type: 'mrkdwn', text: `*Message:*\n${lead.body}` },
          }] : []),
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: '📞 Call' }, url: `tel:${(lead.phone || '').replace(/\D/g, '')}`, style: 'primary' },
              ...(lead.email ? [{ type: 'button', text: { type: 'plain_text', text: '✉️ Email' }, url: `mailto:${lead.email}` }] : []),
            ],
          },
        ],
      }),
    })

    // Slack returns HTTP 200 even for logical failures — the real status is
    // in the JSON body's `ok` field (e.g. invalid_auth, channel_not_found).
    if (!res.ok) {
      console.error(`Slack notify failed: HTTP ${res.status}`)
      return { channel: 'slack', configured: true, ok: false, detail: `HTTP ${res.status}` }
    }
    const data = await res.json().catch(() => null)
    if (data && data.ok === false) {
      console.error(`Slack notify failed: ${data.error}`)
      return { channel: 'slack', configured: true, ok: false, detail: data.error }
    }
    return { channel: 'slack', configured: true, ok: true }
  } catch (err) {
    console.error('Slack notify error:', err)
    return { channel: 'slack', configured: true, ok: false, detail: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Email: auto-reply to lead
// ---------------------------------------------------------------------------

async function sendAutoReply(lead: Record<string, string>): Promise<ChannelResult> {
  if (!SENDGRID_KEY) return skip('auto-reply')
  if (!lead.email) return skip('auto-reply')

  const firstName = (lead.name || 'there').split(' ')[0]
  const suburb = lead.suburb || 'Middle Tennessee'

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #222;">
  <div style="background: #0A1628; padding: 32px 40px;">
    <h1 style="color: white; font-size: 24px; margin: 0; letter-spacing: -0.5px;">Joshua Fink Group</h1>
    <p style="color: #A0A0A0; margin: 4px 0 0; font-size: 13px;">Compass Real Estate · Middle Tennessee</p>
  </div>
  <div style="padding: 40px;">
    <p style="font-size: 18px; font-weight: bold; margin-top: 0;">Hi ${firstName},</p>
    <p style="line-height: 1.7; color: #444;">
      Thanks for reaching out — I got your message and I'll be in touch shortly with a personal response.
    </p>
    <p style="line-height: 1.7; color: #444;">
      In the meantime, if anything is time-sensitive, feel free to call or text me directly:
    </p>
    <div style="background: #F5F5F5; padding: 20px 24px; margin: 24px 0; border-left: 4px solid #C41E3A;">
      <p style="margin: 0; font-size: 22px; font-weight: bold;"><a href="tel:6155512727" style="color: #0A1628; text-decoration: none;">615-551-2727</a></p>
      <p style="margin: 4px 0 0; color: #666; font-size: 13px;">Call or text anytime</p>
    </div>
    <p style="line-height: 1.7; color: #444;">
      Talk soon,<br/>
      <strong>Joshua Fink</strong><br/>
      <span style="color: #666; font-size: 13px;">Affiliate Broker · Compass Real Estate · ${suburb}</span>
    </p>
  </div>
  <div style="background: #F5F5F5; padding: 20px 40px; font-size: 12px; color: #999; border-top: 1px solid #E8E8E8;">
    <p style="margin: 0;">Joshua Fink Group · Compass Real Estate · 8119 Isabella Lane, Suite 105, Brentwood, TN 37027</p>
    <p style="margin: 4px 0 0;"><a href="https://www.joshuafink.com" style="color: #999;">joshuafink.com</a></p>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SENDGRID_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: lead.email, name: lead.name }] }],
        from: { email: FROM_EMAIL, name: 'Joshua Fink' },
        reply_to: { email: TO_EMAIL, name: 'Joshua Fink' },
        subject: `Got your message, ${firstName} — Joshua Fink Group`,
        content: [{ type: 'text/html', value: html }],
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`Auto-reply email failed: HTTP ${res.status} ${detail.slice(0, 200)}`)
      return { channel: 'auto-reply', configured: true, ok: false, detail: `HTTP ${res.status}` }
    }
    return { channel: 'auto-reply', configured: true, ok: true }
  } catch (err) {
    console.error('Auto-reply email error:', err)
    return { channel: 'auto-reply', configured: true, ok: false, detail: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Email: forward lead details to Joshua
// ---------------------------------------------------------------------------

async function forwardToJoshua(lead: Record<string, string>): Promise<ChannelResult> {
  if (!SENDGRID_KEY) return skip('joshua-email')

  const lines = Object.entries(lead)
    .filter(([k]) => !k.startsWith('_') && k !== 'website')
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666;font-size:13px;width:140px;vertical-align:top;">${k}</td><td style="padding:6px 12px;font-size:13px;">${v}</td></tr>`)
    .join('')

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SENDGRID_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO_EMAIL, name: 'Joshua Fink' }] }],
        from: { email: FROM_EMAIL, name: 'joshuafink.com Lead' },
        ...(lead.email ? { reply_to: { email: lead.email, name: lead.name } } : {}),
        subject: `🏡 New Lead: ${lead.name || 'Unknown'} — ${lead.suburb || lead.subject || 'joshuafink.com'}`,
        content: [{
          type: 'text/html',
          value: `<table style="font-family:sans-serif;border-collapse:collapse;">${lines}</table>`,
        }],
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`Lead email to Joshua failed: HTTP ${res.status} ${detail.slice(0, 200)}`)
      return { channel: 'joshua-email', configured: true, ok: false, detail: `HTTP ${res.status}` }
    }
    return { channel: 'joshua-email', configured: true, ok: true }
  } catch (err) {
    console.error('Lead email to Joshua error:', err)
    return { channel: 'joshua-email', configured: true, ok: false, detail: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Google Sheet lead log — free, no CRM subscription. Appends one row per lead
// via a Google Apps Script Web App. Works from Vercel with no auth/OAuth.
// No-ops safely until GOOGLE_SHEET_WEBHOOK_URL is set.
// ---------------------------------------------------------------------------

async function pushToSheet(lead: Record<string, string>): Promise<ChannelResult> {
  if (!GOOGLE_SHEET_WEBHOOK_URL) {
    console.log('Google Sheet: skipping — GOOGLE_SHEET_WEBHOOK_URL not set')
    return skip('sheet')
  }

  // Drop internal fields (honeypot + timing) before logging.
  const clean = Object.fromEntries(
    Object.entries(lead).filter(([k]) => !k.startsWith('_') && k !== 'website')
  )

  const payload: Record<string, string> = {
    ...clean,
    // Normalize the lead type across the different forms into one column.
    lead_type: lead.subject || lead.lead_type || '',
    received_at: new Date().toISOString(),
    ...(SHEET_WEBHOOK_SECRET ? { secret: SHEET_WEBHOOK_SECRET } : {}),
  }

  try {
    const res = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow', // Apps Script Web Apps 302 to a googleusercontent host
    })
    if (!res.ok) {
      console.error('Google Sheet: non-OK response', res.status)
      return { channel: 'sheet', configured: true, ok: false, detail: `HTTP ${res.status}` }
    }
    console.log(`Google Sheet: logged lead for ${lead.name || 'Unknown'}`)
    return { channel: 'sheet', configured: true, ok: true }
  } catch (err) {
    console.error('Google Sheet push error:', err)
    return { channel: 'sheet', configured: true, ok: false, detail: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Pushover — instant phone push notification on each new lead.
// High priority (1) so it bypasses quiet hours. No-ops until creds are set.
// ---------------------------------------------------------------------------

async function sendPushover(lead: Record<string, string>): Promise<ChannelResult> {
  if (!PUSHOVER_TOKEN || !PUSHOVER_USER) {
    console.log('Pushover: skipping — PUSHOVER_TOKEN or PUSHOVER_USER not set')
    return skip('pushover')
  }

  const type = lead.subject || lead.lead_type || 'lead'
  const source = lead.source ? ` · ${lead.source}` : ''
  const message = [
    lead.phone ? `📞 ${lead.phone}` : null,
    lead.email ? `✉️ ${lead.email}` : null,
    lead.property_address ? `🏠 ${lead.property_address}` : null,
    lead.suburb ? `📍 ${lead.suburb}` : null,
    lead.body ? `“${lead.body.slice(0, 220)}”` : null,
  ].filter(Boolean).join('\n') || 'New lead from joshuafink.com'

  const params = new URLSearchParams({
    token: PUSHOVER_TOKEN,
    user: PUSHOVER_USER,
    title: `🏡 New Lead — ${lead.name || 'Unknown'} (${type})${source}`,
    message,
    priority: '1', // high priority — bypasses quiet hours
    sound: 'cashregister',
  })

  // Tap the notification to call the lead directly.
  const digits = (lead.phone || '').replace(/\D/g, '')
  if (digits) {
    params.set('url', `tel:${digits}`)
    params.set('url_title', `Call ${lead.name || 'lead'}`)
  }

  try {
    const res = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    if (!res.ok) {
      console.error('Pushover: non-OK response', res.status)
      return { channel: 'pushover', configured: true, ok: false, detail: `HTTP ${res.status}` }
    }
    return { channel: 'pushover', configured: true, ok: true }
  } catch (err) {
    console.error('Pushover push error:', err)
    return { channel: 'pushover', configured: true, ok: false, detail: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Emergency fallback — last-ditch Pushover alert fired ONLY when every normal
// Joshua-facing channel failed. Emergency priority (2) so it keeps re-alerting
// until Joshua acknowledges it on his phone. Carries the full lead contact info
// so the lead is recoverable straight from the notification, even if it never
// reached Slack, email, or the sheet.
// ---------------------------------------------------------------------------

async function sendEmergencyPushover(
  lead: Record<string, string>,
  failedChannels: string[],
): Promise<boolean> {
  if (!PUSHOVER_TOKEN || !PUSHOVER_USER) return false

  const message = [
    '⚠️ A LEAD DID NOT DELIVER. Contact them now:',
    lead.name ? `👤 ${lead.name}` : null,
    lead.phone ? `📞 ${lead.phone}` : null,
    lead.email ? `✉️ ${lead.email}` : null,
    lead.property_address ? `🏠 ${lead.property_address}` : null,
    lead.suburb ? `📍 ${lead.suburb}` : null,
    lead.body ? `“${lead.body.slice(0, 300)}”` : null,
    `(failed: ${failedChannels.join(', ') || 'all'})`,
  ].filter(Boolean).join('\n')

  const params = new URLSearchParams({
    token: PUSHOVER_TOKEN,
    user: PUSHOVER_USER,
    title: '🚨 LEAD DELIVERY FAILED — act now',
    message,
    priority: '2', // emergency — repeats until acknowledged
    retry: '60', // re-alert every 60s
    expire: '3600', // for up to 1 hour
    sound: 'siren',
  })
  const digits = (lead.phone || '').replace(/\D/g, '')
  if (digits) {
    params.set('url', `tel:${digits}`)
    params.set('url_title', `Call ${lead.name || 'lead'}`)
  }

  try {
    const res = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    if (!res.ok) {
      console.error('Emergency Pushover: non-OK response', res.status)
      return false
    }
    return true
  } catch (err) {
    console.error('Emergency Pushover error:', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // A lead reaches Joshua through Slack, the lead email, Pushover, or the
  // Google Sheet log. As long as at least ONE of those is configured we can
  // accept the submission; only fail closed when nothing is wired up.
  const anyChannelConfigured =
    !!SLACK_TOKEN || !!SENDGRID_KEY || (!!PUSHOVER_TOKEN && !!PUSHOVER_USER) || !!GOOGLE_SHEET_WEBHOOK_URL
  if (!anyChannelConfigured) {
    console.error('Contact API misconfigured: no lead-delivery channel is set')
    return NextResponse.json(
      { error: 'Configuration error — please call or text 615-551-2727 directly' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json().catch(() => null)
    const form = body || Object.fromEntries((await req.formData()).entries())
    const lead = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, String(v)])
    ) as Record<string, string>

    if (!lead.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!lead.email) {
      lead.email = ''
    }

    // ---------- Spam check ----------
    const spamCheck = isSpam(lead)
    if (spamCheck.spam) {
      console.log(`SPAM blocked: reason=${spamCheck.reason}, name=${lead.name}, phone=${lead.phone}, email=${lead.email}`)
      // Return success so bots don't retry, but silently drop
      return NextResponse.json({ ok: true })
    }

    // ---------- Fire all Joshua-facing channels in parallel ----------
    // Each of these resolves to a ChannelResult and never throws, so we can
    // inspect exactly what got through and react when nothing did.
    const [slackRes, joshuaEmailRes, sheetRes, pushoverRes, autoReplyRes] = await Promise.all([
      sendSlack(lead),
      forwardToJoshua(lead),
      pushToSheet(lead),
      sendPushover(lead),
      sendAutoReply(lead), // no-ops when no email; courtesy to the lead, not a Joshua channel
    ])

    // ---------- Best-effort local integrations (n8n / webhooks) ----------
    // These target localhost by default and usually aren't reachable from
    // Vercel; they're fire-and-forget and never count toward delivery.
    const leadType = (lead.subject || lead.lead_type || '').toLowerCase()
    const isCashOffer = lead.source === 'cash-offer' || ['sell', 'seller'].includes(leadType)
    const isBuyerLead = ['buy', 'both', 'invest', 'rent', 'other', 'buyer'].includes(leadType)
    const bestEffort: Promise<unknown>[] = []

    const isSeller = ['sell', 'seller'].includes(leadType)
    const drip = isSeller ? 'seller-lead' : 'buyer-lead'
    bestEffort.push(
      fetch(`${N8N_BASE}/${drip}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).then(() => undefined).catch(() => undefined)
    )

    if (isCashOffer) {
      bestEffort.push(
        fetch(`${CASH_OFFER_BASE}/cash-offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        }).then(() => undefined).catch(() => undefined)
      )
    }

    if (isBuyerLead) {
      bestEffort.push(
        fetch(`${BUYER_LEAD_WEBHOOK_BASE}/buyer-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: lead.name || '',
            phone: lead.phone || '',
            email: lead.email || '',
            subject: lead.subject || lead.lead_type || '',
            body: lead.body || '',
            source: lead.source || 'joshuafink.com',
          }),
        }).then(() => undefined).catch(() => undefined)
      )
    }

    await Promise.allSettled(bestEffort)

    // ---------- Delivery detection ----------
    // A lead "reached Joshua" if any Joshua-facing channel succeeded.
    const joshuaChannels = [slackRes, joshuaEmailRes, sheetRes, pushoverRes]
    const delivered = joshuaChannels.some((r) => r.configured && r.ok)
    const failedChannels = joshuaChannels
      .filter((r) => r.configured && !r.ok)
      .map((r) => `${r.channel}${r.detail ? `(${r.detail})` : ''}`)

    if (!delivered) {
      // Nothing got through. Log the full lead so it's recoverable from Vercel
      // logs, then fire the emergency Pushover as a last resort.
      console.error(
        'CRITICAL: lead not delivered to any Joshua channel',
        JSON.stringify({ lead, failedChannels })
      )
      const rescued = await sendEmergencyPushover(lead, failedChannels)

      if (!rescued) {
        // Truly nowhere for the lead to land. Tell the visitor so they can call
        // directly instead of walking away thinking the message was received.
        return NextResponse.json(
          {
            error:
              'We had trouble delivering your message. Please call or text Joshua directly at 615-551-2727.',
          },
          { status: 502 }
        )
      }
      // The emergency alert reached Joshua's phone — treat as delivered so the
      // visitor still sees the success screen (which also shows the number).
    } else if (failedChannels.length > 0) {
      // Partial failure — the lead is safe, but note which channels dropped it.
      console.warn(`Contact API: lead delivered with degraded channels: ${failedChannels.join(', ')}`)
    }

    // Auto-reply failure is a courtesy miss, not a lost lead — just log it.
    if (autoReplyRes.configured && !autoReplyRes.ok) {
      console.warn('Contact API: auto-reply to lead did not send')
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
