import { NextResponse } from 'next/server'
import { fetchWithTimeout, sendEmail } from '@/lib/send-email'
import {
  inviteIsDryRun,
  inviteRefKey,
  renderListingAlertInvite,
  selectInviteRecipients,
} from '@/lib/listing-alerts'
import {
  activeSubscriberEmails,
  ensureInviteToken,
  logAlertSend,
  postedAlertRefs,
} from '@/lib/listing-alert-store'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * One-time permission email to existing sheet leads.
 * Dry-run is the default. Sending requires ?dry_run=0 and does not run on a
 * schedule. This route does not send itself.
 */
function authorize(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'listing-alert invite not configured (missing CRON_SECRET)' }, { status: 500 })
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return null
}

async function sheetEmails(): Promise<{ emails: string[]; error?: string }> {
  const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL || ''
  const secret = process.env.SHEET_WEBHOOK_SECRET || ''
  if (!webhook) return { emails: [], error: 'GOOGLE_SHEET_WEBHOOK_URL is not set' }
  if (!secret) return { emails: [], error: 'SHEET_WEBHOOK_SECRET is not set. The Apps Script must use the same SECRET and be redeployed with doGet.' }
  let url: URL
  try {
    url = new URL(webhook)
  } catch {
    return { emails: [], error: 'GOOGLE_SHEET_WEBHOOK_URL is not a URL' }
  }
  url.searchParams.set('action', 'crm-emails')
  url.searchParams.set('secret', secret)
  try {
    const res = await fetchWithTimeout(url.toString(), { method: 'GET' })
    const data = await res.json().catch(() => null)
    if (!data || data.ok !== true || !Array.isArray(data.emails)) {
      return { emails: [], error: data?.error ? String(data.error) : `sheet returned HTTP ${res.status}` }
    }
    return { emails: data.emails.map((email: unknown) => String(email)) }
  } catch (err) {
    return { emails: [], error: err instanceof Error ? err.message : String(err) }
  }
}

export async function GET(request: Request) {
  const denied = authorize(request)
  if (denied) return denied

  const params = new URL(request.url).searchParams
  const dryRun = inviteIsDryRun(params)
  const sample = renderListingAlertInvite('preview')
  const sheet = await sheetEmails()
  const active = await activeSubscriberEmails()
  if (!dryRun && !active) {
    return NextResponse.json({ error: 'subscriber list could not be read; invite not sent', dryRun: false }, { status: 503 })
  }
  const recipients = selectInviteRecipients(sheet.emails, active ?? new Set())

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      sent: false,
      recipientCount: sheet.error ? 0 : recipients.length,
      sheetError: sheet.error || null,
      sampleSubject: sample.subject,
      sampleHtml: sample.html,
    })
  }

  const already = await postedAlertRefs(recipients.map(inviteRefKey))
  if (!already) {
    return NextResponse.json({ error: 'post_log could not be read; invite not sent' }, { status: 503 })
  }

  let sent = 0
  const failed: string[] = []
  const skipped: string[] = []
  for (const email of recipients) {
    const refKey = inviteRefKey(email)
    if (already.has(refKey)) {
      skipped.push(email)
      continue
    }
    const pending = await ensureInviteToken(email)
    if (!pending) {
      failed.push(email)
      continue
    }
    if ('skip' in pending) {
      skipped.push(email)
      continue
    }
    const message = renderListingAlertInvite(pending.token)
    const result = await sendEmail({
      to: email,
      fromName: 'Joshua Fink',
      replyTo: { email: 'joshua@joshuafink.com', name: 'Joshua Fink' },
      subject: message.subject,
      html: message.html,
      headers: message.headers,
    })
    const logged = await logAlertSend({
      refKey,
      payloadKind: 'invite',
      status: result.ok ? 'posted' : 'failed',
      messagePreview: message.subject,
      errorMessage: result.ok ? undefined : result.detail,
    })
    if (result.ok && logged) sent += 1
    else failed.push(email)
  }

  return NextResponse.json({
    ok: failed.length === 0,
    dryRun: false,
    sent,
    skipped: skipped.length,
    failed,
  }, { status: failed.length ? 500 : 200 })
}
