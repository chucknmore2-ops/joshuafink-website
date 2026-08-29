import { NextRequest, NextResponse } from 'next/server'
import { classifyLead } from '@/lib/classify-lead'
import { sendEmail, activeEmailProvider, fetchWithTimeout } from '@/lib/send-email'

// ClickUp — one task per lead (replaced Slack after its account went
// inactive). Same pk_... personal token the weekly agent-briefing cron uses.
const CLICKUP_TOKEN = process.env.CLICKUP_API_TOKEN
// Defaults to the JFG agent-briefing list (workspace 90141200625); set
// CLICKUP_LEADS_LIST_ID in Vercel to route leads to a dedicated Leads list.
const CLICKUP_LIST_ID = process.env.CLICKUP_LEADS_LIST_ID || '901415978281'
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
// Healthcheck test mode — scripts/morning_healthcheck.py POSTs a tagged
// SYSTEM TEST lead daily carrying this secret (the same CRON_SECRET the
// /api/cron/* routes use) in an `x-healthcheck-secret` header. In that mode
// the response includes the per-channel delivery results and the Pushover
// goes out silently, so a channel dying pages the next morning instead of
// rotting in a console.warn nobody reads (how SendGrid sat dead from June).
const CRON_SECRET = process.env.CRON_SECRET || ''

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
// ClickUp notification — one task per lead
// ---------------------------------------------------------------------------

async function sendClickUp(lead: Record<string, string>, testMode = false): Promise<ChannelResult> {
  if (!CLICKUP_TOKEN) return skip('clickup')

  const typeEmoji: Record<string, string> = {
    buy: '🏠', sell: '💰', both: '🔄', invest: '📈', rent: '🏢', other: '💬',
    seller: '💰', buyer: '🏠', 'cash-offer': '💵',
  }
  const type = lead.subject || lead.lead_type || ''
  const emoji = typeEmoji[type] || '📬'
  const suburb = lead.suburb ? ` · ${lead.suburb}` : ''
  // Flagged leads are delivered like any other, just labelled. Treat the label
  // as "worth a second look", not "ignore this".
  const flag = lead.suspected_spam ? '⚠️ ' : ''

  const description = [
    lead.suspected_spam
      ? `⚠️ **Flagged \`${lead.suspected_spam}\`** — delivered anyway because this check has false-positived on real people before. Worth a look.`
      : null,
    `**Name:** ${lead.name || '—'}`,
    `**Phone:** ${lead.phone || '—'}`,
    `**Email:** ${lead.email || '—'}`,
    `**Type:** ${type || '—'}`,
    lead.property_address ? `**Property:** ${lead.property_address}` : null,
    lead.situation ? `**Situation:** ${lead.situation}` : null,
    lead.timeline ? `**Timeline:** ${lead.timeline}` : null,
    lead.body ? `**Message:**\n${lead.body}` : null,
  ].filter(Boolean).join('\n')

  try {
    // Like the agent-briefing route: markdown_content renders in the ClickUp
    // UI, plain description is the API-side fallback.
    const res = await fetchWithTimeout(`https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task`, {
      method: 'POST',
      headers: { Authorization: CLICKUP_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${flag}${emoji} New Lead — ${lead.name || 'Unknown'}${suburb}`,
        markdown_content: description,
        description,
        tags: ['website-lead'],
        notify_all: false,
      }),
    })

    if (!res.ok) {
      const snippet = await res.text().then((t) => t.slice(0, 200)).catch(() => '')
      console.error(`ClickUp notify failed: HTTP ${res.status} ${snippet}`)
      return { channel: 'clickup', configured: true, ok: false, detail: `HTTP ${res.status}` }
    }
    // Only a task id in the body proves the task actually landed.
    const data = await res.json().catch(() => null)
    if (!data || !data.id) {
      console.error('ClickUp notify failed: no task id in response')
      return { channel: 'clickup', configured: true, ok: false, detail: 'no task id in response' }
    }
    // The daily healthcheck test lead has proven the token + list are live by
    // this point — delete its task again (best-effort) so SYSTEM TEST tasks
    // don't pile up in the list the way a silent Pushover doesn't buzz.
    if (testMode) {
      await fetchWithTimeout(`https://api.clickup.com/api/v2/task/${data.id}`, {
        method: 'DELETE',
        headers: { Authorization: CLICKUP_TOKEN },
      }).catch(() => undefined)
    }
    return { channel: 'clickup', configured: true, ok: true }
  } catch (err) {
    console.error('ClickUp notify error:', err)
    return { channel: 'clickup', configured: true, ok: false, detail: String(err) }
  }
}

// ---------------------------------------------------------------------------
// HTML escaping for outbound email
// ---------------------------------------------------------------------------

/**
 * Escape a value for interpolation into an HTML email body.
 *
 * Every field below is attacker-controlled: anyone on the internet can POST to
 * this route. Without this, a visitor could put working markup into their name
 * or message and it would render inside the lead email Joshua reads — an email
 * he trusts precisely because it arrives from leads@joshuafink.com. A forged
 * "verify this lead" link, a tracking pixel, or markup that hides the real
 * phone number all become possible. Escaping the five HTML-significant
 * characters removes the whole class.
 */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------------------------------------------------------------------------
// Email: auto-reply to lead
// ---------------------------------------------------------------------------

async function sendAutoReply(lead: Record<string, string>): Promise<ChannelResult> {
  if (activeEmailProvider() === 'none') return skip('auto-reply')
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
    <p style="font-size: 18px; font-weight: bold; margin-top: 0;">Hi ${escapeHtml(firstName)},</p>
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
      <span style="color: #666; font-size: 13px;">Affiliate Broker · Compass Real Estate · ${escapeHtml(suburb)}</span>
    </p>
  </div>
  <div style="background: #F5F5F5; padding: 20px 40px; font-size: 12px; color: #999; border-top: 1px solid #E8E8E8;">
    <p style="margin: 0;">Joshua Fink Group · Compass Real Estate · 8119 Isabella Lane, Suite 105, Brentwood, TN 37027</p>
    <p style="margin: 4px 0 0;"><a href="https://www.joshuafink.com" style="color: #999;">joshuafink.com</a></p>
  </div>
</body>
</html>`

  const sent = await sendEmail({
    to: lead.email,
    toName: lead.name,
    fromName: 'Joshua Fink',
    replyTo: { email: TO_EMAIL, name: 'Joshua Fink' },
    subject: `Got your message, ${firstName} — Joshua Fink Group`,
    html,
  })
  if (!sent.ok) {
    console.error(`Auto-reply email failed via ${sent.provider}: ${sent.detail}`)
    return { channel: 'auto-reply', configured: true, ok: false, detail: sent.detail }
  }
  return { channel: 'auto-reply', configured: true, ok: true }
}

// ---------------------------------------------------------------------------
// Email: forward lead details to Joshua
// ---------------------------------------------------------------------------

async function forwardToJoshua(lead: Record<string, string>, testMode = false): Promise<ChannelResult> {
  if (activeEmailProvider() === 'none') return skip('joshua-email')

  const lines = Object.entries(lead)
    .filter(([k]) => !k.startsWith('_') && k !== 'website')
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666;font-size:13px;width:140px;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:6px 12px;font-size:13px;">${escapeHtml(v)}</td></tr>`)
    .join('')

  const sent = await sendEmail({
    to: TO_EMAIL,
    toName: 'Joshua Fink',
    fromName: 'joshuafink.com Lead',
    ...(lead.email ? { replyTo: { email: lead.email, name: lead.name } } : {}),
    // The daily test email still sends — the provider's 200 is the delivery
    // proof — but it must never share a subject with real leads, or Joshua
    // (or an inbox rule) learns to skim past "New Lead".
    subject: testMode
      ? '🩺 Daily lead-channel test — ignore'
      : `🏡 New Lead: ${lead.name || 'Unknown'} — ${lead.suburb || lead.subject || 'joshuafink.com'}`,
    html: `<table style="font-family:sans-serif;border-collapse:collapse;">${lines}</table>`,
  })
  if (!sent.ok) {
    console.error(`Lead email to Joshua failed via ${sent.provider}: ${sent.detail}`)
    return { channel: 'joshua-email', configured: true, ok: false, detail: sent.detail }
  }
  return { channel: 'joshua-email', configured: true, ok: true }

}

// ---------------------------------------------------------------------------
// Google Sheet lead log — free, no CRM subscription. Appends one row per lead
// via a Google Apps Script Web App. Works from Vercel with no auth/OAuth.
// No-ops safely until GOOGLE_SHEET_WEBHOOK_URL is set.
// ---------------------------------------------------------------------------

async function pushToSheet(
  lead: Record<string, string>,
  // When set, the Apps Script files this row into a separate "Blocked" tab
  // (with the reason in its own column) instead of the CRM tab.
  blockedReason?: string,
  // Daily healthcheck lead — tagged so the Apps Script files it into a
  // "System" tab (same mechanism as Blocked) instead of the real CRM tab.
  testMode = false,
): Promise<ChannelResult> {
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
    ...(blockedReason ? { blocked_reason: blockedReason } : {}),
    ...(testMode ? { system_test: 'true' } : {}),
    ...(SHEET_WEBHOOK_SECRET ? { secret: SHEET_WEBHOOK_SECRET } : {}),
  }

  try {
    const res = await fetchWithTimeout(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow', // Apps Script Web Apps 302 to a googleusercontent host
    })
    if (!res.ok) {
      console.error('Google Sheet: non-OK response', res.status)
      return { channel: 'sheet', configured: true, ok: false, detail: `HTTP ${res.status}` }
    }
    // The Apps Script answers HTTP 200 for every outcome —
    // its own failures arrive as {ok:false, error:...}, and a broken
    // deployment serves a 200 "Authorization required" HTML page. Only a
    // parseable {ok:true} body proves the row actually landed.
    const data = await res.json().catch(() => null)
    if (!data || data.ok !== true) {
      const detail = data
        ? String(data.error || 'script reported ok:false')
        : 'non-JSON response (broken deployment?)'
      console.error('Google Sheet: script did not confirm the row:', detail)
      return { channel: 'sheet', configured: true, ok: false, detail }
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

async function sendPushover(lead: Record<string, string>, silent = false): Promise<ChannelResult> {
  if (!PUSHOVER_TOKEN || !PUSHOVER_USER) {
    console.log('Pushover: skipping — PUSHOVER_TOKEN or PUSHOVER_USER not set')
    return skip('pushover')
  }

  const type = lead.subject || lead.lead_type || 'lead'
  const source = lead.source ? ` · ${lead.source}` : ''
  const message = [
    lead.suspected_spam ? `⚠️ flagged: ${lead.suspected_spam} — check it` : null,
    lead.phone ? `📞 ${lead.phone}` : null,
    lead.email ? `✉️ ${lead.email}` : null,
    lead.property_address ? `🏠 ${lead.property_address}` : null,
    lead.suburb ? `📍 ${lead.suburb}` : null,
    lead.body ? `“${lead.body.slice(0, 220)}”` : null,
  ].filter(Boolean).join('\n') || 'New lead from joshuafink.com'

  const params = new URLSearchParams({
    token: PUSHOVER_TOKEN,
    user: PUSHOVER_USER,
    title: `${lead.suspected_spam ? '⚠️ ' : '🏡 '}New Lead — ${lead.name || 'Unknown'} (${type})${source}`,
    message,
    // Silent (-2, no alert at all) for healthcheck test leads — the API call
    // still proves the channel works. High (1) for real leads — bypasses
    // quiet hours.
    priority: silent ? '-2' : '1',
    sound: silent ? 'none' : 'cashregister',
  })

  // Tap the notification to call the lead directly.
  const digits = (lead.phone || '').replace(/\D/g, '')
  if (digits) {
    params.set('url', `tel:${digits}`)
    params.set('url_title', `Call ${lead.name || 'lead'}`)
  }

  try {
    const res = await fetchWithTimeout('https://api.pushover.net/1/messages.json', {
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
// reached ClickUp, email, or the sheet.
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
    const res = await fetchWithTimeout('https://api.pushover.net/1/messages.json', {
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

// ---------------------------------------------------------------------------
// Flood protection
// ---------------------------------------------------------------------------

// A successful lead fires a priority-1 Pushover — the level that deliberately
// bypasses Joshua's quiet hours. Unauthenticated and unlimited, that is a
// loudspeaker anyone on the internet can hold down: a trivial curl loop makes
// the phone unusable and, far worse, buries real lead alerts in the noise.
//
// The threshold is set where no human can reach it. A person filling in a form
// carefully might submit two or three times in a minute after a typo; nobody
// submits twelve. So a legitimate lead is never turned away — this only catches
// automation, and it fails toward accepting rather than rejecting.
//
// Deliberately in-memory: serverless instances are per-region and recycle, so
// this is a speed bump rather than a wall, and a distributed flood would need
// Redis to stop properly. It costs nothing, adds no dependency, and removes the
// single-source case that is actually easy to pull off.
const FLOOD_MAX_PER_WINDOW = 12
const FLOOD_WINDOW_MS = 60_000
const submissionTimes = new Map<string, number[]>()

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/** Records this hit and reports whether the caller has now exceeded the window. */
function exceedsFloodLimit(ip: string, now: number = Date.now()): boolean {
  // Prune every caller, not just this one, so the map cannot grow without bound
  // across a long-lived instance. forEach rather than for-of: this tsconfig
  // targets below ES2015, so iterating a Map directly needs downlevelIteration.
  const stale: string[] = []
  submissionTimes.forEach((times, key) => {
    const live = times.filter((t: number) => now - t < FLOOD_WINDOW_MS)
    if (live.length === 0) stale.push(key)
    else submissionTimes.set(key, live)
  })
  stale.forEach((key) => submissionTimes.delete(key))
  const hits = submissionTimes.get(ip) ?? []
  hits.push(now)
  submissionTimes.set(ip, hits)
  return hits.length > FLOOD_MAX_PER_WINDOW
}

export async function POST(req: NextRequest) {
  // A lead reaches Joshua through ClickUp, the lead email, Pushover, or the
  // Google Sheet log. As long as at least ONE of those is configured we can
  // accept the submission; only fail closed when nothing is wired up.

  const ip = clientIp(req)
  if (exceedsFloodLimit(ip)) {
    console.warn(`Contact API: flood limit hit by ${ip} — rejecting without notifying`)
    return NextResponse.json(
      { error: 'Too many submissions — please call or text 615-551-2727 directly' },
      { status: 429 }
    )
  }

  const anyChannelConfigured =
    !!CLICKUP_TOKEN || activeEmailProvider() !== 'none' || (!!PUSHOVER_TOKEN && !!PUSHOVER_USER) || !!GOOGLE_SHEET_WEBHOOK_URL
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

    // ---------- Classify ----------
    const verdict = classifyLead(lead)

    if (verdict.kind === 'bot') {
      // Honeypot only. Log the WHOLE submission, not just the contact fields —
      // if this ever fires on a real person (browsers can autofill the hidden
      // field), the message text is the only way to identify and recover them.
      console.log(`BOT blocked (${verdict.reason}): ${JSON.stringify(lead)}`)
      // Durable copy in the sheet's "Blocked" tab, which Josh can skim for
      // humans — sheet only, so real bots never make noise on ClickUp/Pushover/
      // email. Awaited: Vercel freezes the function once the response is sent,
      // so a fire-and-forget write here could silently never happen.
      await pushToSheet(lead, verdict.reason)
      // Return success so bots don't retry.
      return NextResponse.json({ ok: true })
    }

    if (verdict.kind === 'invalid') {
      // A real person with a fixable mistake. Tell them, so they can correct it
      // — every form already renders `error`.
      console.log(`Lead rejected as invalid (${verdict.reason}): ${JSON.stringify(lead)}`)
      return NextResponse.json({ error: verdict.message }, { status: 400 })
    }

    if (verdict.kind === 'suspect') {
      // Deliver it anyway, tagged. This field flows automatically into the lead
      // email and the Google Sheet (both enumerate lead fields), and is called
      // out explicitly in ClickUp and Pushover below. It is deliberately NOT
      // shown to the visitor, and the auto-reply never enumerates fields.
      lead.suspected_spam = verdict.reason
      console.log(`Lead flagged as suspect (${verdict.reason}), delivering anyway: ${JSON.stringify(lead)}`)
    }

    // Healthcheck test mode — see CRON_SECRET above. A wrong or absent header
    // is simply a normal visitor lead; nothing leaks whether the secret matched.
    const isHealthcheck =
      CRON_SECRET !== '' && req.headers.get('x-healthcheck-secret') === CRON_SECRET

    // ---------- Fire all Joshua-facing channels in parallel ----------
    // Each of these resolves to a ChannelResult and never throws, so we can
    // inspect exactly what got through and react when nothing did.
    const [clickupRes, joshuaEmailRes, sheetRes, pushoverRes, autoReplyRes] = await Promise.all([
      sendClickUp(lead, isHealthcheck), // test-lead task is deleted after it proves delivery
      forwardToJoshua(lead, isHealthcheck), // still sends, but with an "ignore" subject, never "New Lead"
      pushToSheet(lead, undefined, isHealthcheck), // tagged → sheet's "System" tab, not the CRM tab
      sendPushover(lead, isHealthcheck), // silent — a test lead must not buzz the phone
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
      fetchWithTimeout(`${N8N_BASE}/${drip}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).then(() => undefined).catch(() => undefined)
    )

    if (isCashOffer) {
      bestEffort.push(
        fetchWithTimeout(`${CASH_OFFER_BASE}/cash-offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        }).then(() => undefined).catch(() => undefined)
      )
    }

    if (isBuyerLead) {
      bestEffort.push(
        fetchWithTimeout(`${BUYER_LEAD_WEBHOOK_BASE}/buyer-lead`, {
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
    const joshuaChannels = [clickupRes, joshuaEmailRes, sheetRes, pushoverRes]
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
      // A test lead must never fire the priority-2 siren — the healthcheck's
      // alert email is the paging path for it, and the 502 below still carries
      // the per-channel results.
      const rescued = isHealthcheck ? false : await sendEmergencyPushover(lead, failedChannels)

      if (!rescued) {
        // Truly nowhere for the lead to land. Tell the visitor so they can call
        // directly instead of walking away thinking the message was received.
        return NextResponse.json(
          {
            error:
              'We had trouble delivering your message. Please call or text Joshua directly at 615-551-2727.',
            ...(isHealthcheck ? { channels: joshuaChannels } : {}),
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

    return NextResponse.json(
      isHealthcheck ? { ok: true, channels: joshuaChannels } : { ok: true }
    )
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
