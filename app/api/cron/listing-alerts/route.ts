import { NextResponse } from 'next/server'
import { listings, listingsSyncedAt } from '@/lib/listings'
import { listingDetailPath } from '@/lib/listing-detail'
import { sendEmail } from '@/lib/send-email'
import {
  detectListingEvents,
  digestsToSend,
  digestRefKey,
  renderListingAlertEmail,
  type AlertListing,
} from '@/lib/listing-alerts'
import {
  listActiveSubscribers,
  loadAlertState,
  logAlertSend,
  postedAlertRefs,
  saveAlertState,
} from '@/lib/listing-alert-store'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorize(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'listing-alerts cron not configured (missing CRON_SECRET)' }, { status: 500 })
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return null
}

function currentListings(): AlertListing[] {
  const out: AlertListing[] = []
  for (const listing of listings) {
    const path = listingDetailPath(listing)
    if (!path || !(listing.price > 0)) continue
    out.push({
      address: listing.address,
      city: listing.city,
      price: listing.price,
      status: listing.status,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      imageUrl: listing.photoUrls?.[0] || listing.imageUrl,
      path,
      compassUrl: listing.compassUrl,
    })
  }
  return out
}

export async function GET(request: Request) {
  const denied = authorize(request)
  if (denied) return denied

  const dryRun = new URL(request.url).searchParams.get('dry_run') === '1'
  const current = currentListings()
  const previous = await loadAlertState()
  if (!previous) {
    return NextResponse.json(
      { error: 'listing snapshot could not be read; no emails sent' },
      { status: 503 },
    )
  }

  const plan = detectListingEvents(previous, current)
  const snapshot = current.map((listing) => ({
    compassUrl: listing.compassUrl,
    price: listing.price,
    address: listing.address,
  }))

  if (plan.baseline) {
    if (dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, baseline: true, sent: 0, listings: current.length })
    }
    const saved = await saveAlertState(snapshot)
    if (!saved) return NextResponse.json({ error: 'baseline snapshot was not saved' }, { status: 503 })
    await logAlertSend({
      refKey: `baseline:${listingsSyncedAt}`,
      payloadKind: 'baseline',
      status: 'posted',
      messagePreview: `Baseline of ${current.length} listings. No emails.`,
    })
    return NextResponse.json({ ok: true, baseline: true, sent: 0, listings: current.length })
  }

  if (plan.events.length === 0) {
    if (!dryRun) {
      const saved = await saveAlertState(snapshot)
      if (!saved) return NextResponse.json({ error: 'snapshot was not saved' }, { status: 503 })
    }
    return NextResponse.json({ ok: true, dryRun, events: 0, sent: 0 })
  }

  const subscribers = await listActiveSubscribers()
  if (!subscribers) {
    return NextResponse.json({ error: 'subscribers could not be read; no emails sent' }, { status: 503 })
  }

  const refKeys = subscribers.map((sub) => digestRefKey(listingsSyncedAt, sub.email))
  const already = await postedAlertRefs(refKeys)
  if (!already) {
    return NextResponse.json({ error: 'post_log could not be read; no emails sent' }, { status: 503 })
  }

  const digests = digestsToSend(subscribers, plan.events, already, listingsSyncedAt)
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      events: plan.events.map((event) => ({ kind: event.kind, address: event.listing.address, refKey: event.refKey })),
      wouldSend: digests.map((digest) => ({ email: digest.email, homes: digest.events.length })),
      sent: 0,
    })
  }

  let sent = 0
  const failed: string[] = []
  for (const digest of digests) {
    const rendered = renderListingAlertEmail(digest)
    const result = await sendEmail({
      to: digest.email,
      fromName: 'Joshua Fink',
      replyTo: { email: 'joshua@joshuafink.com', name: 'Joshua Fink' },
      subject: rendered.subject,
      html: rendered.html,
      headers: rendered.headers,
    })
    const logged = await logAlertSend({
      refKey: digest.refKey,
      payloadKind: 'digest',
      status: result.ok ? 'posted' : 'failed',
      messagePreview: rendered.subject,
      link: `${'https://www.joshuafink.com'}${digest.events[0]?.listing.path || ''}`,
      errorMessage: result.ok ? undefined : result.detail,
    })
    if (result.ok && logged) sent += 1
    else failed.push(digest.email)
  }

  if (failed.length) {
    return NextResponse.json(
      { error: 'some listing alerts failed; snapshot not updated', sent, failed },
      { status: 500 },
    )
  }

  const saved = await saveAlertState(snapshot)
  if (!saved) {
    return NextResponse.json(
      { error: 'emails sent but snapshot was not saved; a retry will skip people already mailed', sent },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    syncedAt: listingsSyncedAt,
    events: plan.events.length,
    sent,
  })
}
