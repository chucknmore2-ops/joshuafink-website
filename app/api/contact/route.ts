import { NextRequest, NextResponse } from 'next/server'

const SENDGRID_KEY = process.env.SENDGRID_API_KEY
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL = 'C0APH84LFG8' // #joshpersonal
const FROM_EMAIL = 'leads@joshuafink.com'
const TO_EMAIL = 'joshua@joshuafink.com'
const N8N_BASE = process.env.N8N_WEBHOOK_BASE || 'http://localhost:5678/webhook'

async function sendSlack(lead: Record<string, string>) {
  const typeEmoji: Record<string, string> = {
    buy: '🏠', sell: '💰', both: '🔄', invest: '📈', rent: '🏢', other: '💬',
    seller: '💰', buyer: '🏠', 'cash-offer': '💵',
  }
  const emoji = typeEmoji[lead.subject || lead.lead_type || ''] || '📬'
  const suburb = lead.suburb ? ` · ${lead.suburb}` : ''

  await fetch('https://slack.com/api/chat.postMessage', {
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
            { type: 'button', text: { type: 'plain_text', text: '✉️ Email' }, url: `mailto:${lead.email}` },
          ],
        },
      ],
    }),
  })
}

async function sendAutoReply(lead: Record<string, string>) {
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
    <p style="margin: 0;">Joshua Fink Group · Compass Real Estate · 8119 Isabella Lane Ste 105, Brentwood TN 37027</p>
    <p style="margin: 4px 0 0;"><a href="https://joshuafink.com" style="color: #999;">joshuafink.com</a></p>
  </div>
</body>
</html>`

  await fetch('https://api.sendgrid.com/v3/mail/send', {
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
}

async function forwardToJoshua(lead: Record<string, string>) {
  const lines = Object.entries(lead)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666;font-size:13px;width:140px;vertical-align:top;">${k}</td><td style="padding:6px 12px;font-size:13px;">${v}</td></tr>`)
    .join('')

  await fetch('https://api.sendgrid.com/v3/mail/send', {
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
}

export async function POST(req: NextRequest) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SLACK_BOT_TOKEN) {
    console.error('Missing env vars: SENDGRID_API_KEY or SLACK_BOT_TOKEN')
    return NextResponse.json(
      { error: 'Configuration error — contact joshua@joshuafink.com directly' },
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
    // email is optional for cash-offer leads (phone-only submissions)
    if (!lead.email) {
      lead.email = ''
    }

    // Trigger drip sequence based on lead type
    const isSeller = ['sell', 'seller'].includes(lead.subject || lead.lead_type || '')
    const drip = isSeller ? 'seller-lead' : 'buyer-lead'
    const triggerDrip = fetch(`${N8N_BASE}/${drip}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    }).catch(() => null) // non-blocking, best-effort

    // Fire all in parallel (auto-reply only if we have an email)
    const tasks = [
      sendSlack(lead),
      forwardToJoshua(lead),
      triggerDrip,
    ]
    if (lead.email) tasks.push(sendAutoReply(lead))
    await Promise.allSettled(tasks)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
