import { NextResponse } from 'next/server'
import { buildMonthlyFacebookPost } from '@/lib/monthly-facebook-post'
import { snapshotSkipReason } from '@/lib/market-snapshot'

export const dynamic = 'force-dynamic'

// Public copy for the Railway autoposter. The figures are already on the
// blog. No Facebook credential is returned or required.
export async function GET() {
  const post = buildMonthlyFacebookPost()
  if (!post) {
    return NextResponse.json({ post: null, reason: snapshotSkipReason() })
  }
  return NextResponse.json({ post })
}
