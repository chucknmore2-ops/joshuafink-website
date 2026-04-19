import { NextResponse } from 'next/server'
import { blogPosts } from '@/lib/blog'
import { getAllSuburbSlugs } from '@/lib/suburbs'
import { listings } from '@/lib/listings'
import { reviews } from '@/lib/reviews'

export const dynamic = 'force-dynamic'

// /api/healthcheck — public, lightweight, side-effect-free.
//
// Designed for external uptime monitors (UptimeRobot, Better Uptime, etc.)
// to poll every 5 min. Returns 200 with a small JSON body summarizing
// site state + cron config. Never returns 5xx unless the function itself
// crashes (which is the only "is the site up?" signal that matters).
//
// What it asserts:
// - Site can render server-side (this route IS the assertion)
// - Critical content libraries load: blogPosts, suburbs, listings, reviews
//
// What it doesn't do:
// - Exfiltrate secrets — env values are reported as boolean "configured"
//   only, never echoed
// - Trigger any cron or external API call

const VERSION = '2026-04-19' // bump on major release; lets monitors detect deploys

function envConfigured(name: string): boolean {
  const v = process.env[name]
  return typeof v === 'string' && v.length > 0
}

export async function GET() {
  const data = {
    status: 'ok',
    version: VERSION,
    timestamp: new Date().toISOString(),
    site: {
      blogPosts: blogPosts.length,
      suburbs: getAllSuburbSlugs().length,
      listings: listings.length,
      reviews: reviews.length,
    },
    automations: {
      // Boolean flags only — never echo the env values themselves.
      cronSecretConfigured: envConfigured('CRON_SECRET'),
      gbpConfigured:
        envConfigured('GBP_CLIENT_ID') &&
        envConfigured('GBP_CLIENT_SECRET') &&
        envConfigured('GBP_REFRESH_TOKEN') &&
        envConfigured('GBP_ACCOUNT_ID') &&
        envConfigured('GBP_LOCATION_ID'),
      linkedinConfigured:
        envConfigured('LINKEDIN_ACCESS_TOKEN') && envConfigured('LINKEDIN_AUTHOR_URN'),
      gaConfigured: envConfigured('NEXT_PUBLIC_GA_ID'),
    },
    schedules: {
      indexnowDaily: '0 2 * * * UTC',
      gbpPostWeekly: '0 14 * * 2 UTC',
      linkedinPostWeekly: '0 14 * * 4 UTC',
    },
  }

  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
