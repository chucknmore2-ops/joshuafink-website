import { NextResponse } from 'next/server'
import { backfillSheetLeads, SHEET_BACKFILL_BUDGET_MS } from '@/lib/sheet-lead-write'
import { currentSheetLeadStore } from '@/lib/sheet-lead-queue'

export const dynamic = 'force-dynamic'
// Same ceiling as listing-alerts. The write loop stops itself at
// SHEET_BACKFILL_BUDGET_MS so a slow sheet cannot run into the platform kill.
export const maxDuration = 60

// Vercel Hobby allows two cron jobs and both slots are already used
// (indexnow, listing-alerts). GitHub Actions calls this route hourly.
// Auth matches the other /api/cron/* routes: Authorization: Bearer CRON_SECRET.

function authorize(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'sheet backfill not configured (missing CRON_SECRET)' },
      { status: 500 },
    )
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return null
}

export async function GET(request: Request) {
  const denied = authorize(request)
  if (denied) return denied

  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || ''
  const secret = process.env.SHEET_WEBHOOK_SECRET || ''
  const store = currentSheetLeadStore()
  if (!webhookUrl || !store) {
    return NextResponse.json({
      ok: true,
      configured: false,
      webhookConfigured: Boolean(webhookUrl),
      queueConfigured: Boolean(store),
      written: 0,
      failed: 0,
      released: 0,
      stopped: false,
      remaining: null,
    })
  }

  try {
    const report = await backfillSheetLeads({
      webhookUrl,
      secret,
      store,
      budgetMs: SHEET_BACKFILL_BUDGET_MS,
    })
    return NextResponse.json({ ok: true, configured: true, ...report })
  } catch (err) {
    console.error(
      'sheet backfill failed:',
      err instanceof Error ? err.message.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://redacted') : 'error',
    )
    return NextResponse.json({ error: 'sheet backfill failed' }, { status: 500 })
  }
}
