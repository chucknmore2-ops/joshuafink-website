import { NextResponse } from 'next/server'
import { confirmAlertToken } from '@/lib/listing-alert-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim() || ''
  const result = await confirmAlertToken(token)
  const dest = new URL('/alerts/confirmed', request.url)
  dest.searchParams.set('status', result)
  return NextResponse.redirect(dest)
}
