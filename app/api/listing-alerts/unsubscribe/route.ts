import { NextResponse } from 'next/server'
import { unsubscribeAlertToken } from '@/lib/listing-alert-store'

export const dynamic = 'force-dynamic'

function tokenFrom(request: Request): string {
  return new URL(request.url).searchParams.get('token')?.trim() || ''
}

export async function GET(request: Request) {
  const result = await unsubscribeAlertToken(tokenFrom(request))
  const dest = new URL('/alerts/unsubscribed', request.url)
  dest.searchParams.set('status', result)
  return NextResponse.redirect(dest)
}

/** RFC 8058 one-click. Mail clients POST List-Unsubscribe=One-Click. */
export async function POST(request: Request) {
  const token = tokenFrom(request)
  if (!token) return NextResponse.json({ ok: false }, { status: 400 })
  const result = await unsubscribeAlertToken(token)
  if (result === 'unavailable') return NextResponse.json({ ok: false }, { status: 503 })
  return NextResponse.json({ ok: true })
}
