import { NextRequest, NextResponse } from 'next/server'
import {
  LINKEDIN_STATE_COOKIE,
  LINKEDIN_STATE_COOKIE_PATH,
  statesMatch,
} from '@/lib/linkedin-oauth'

export const dynamic = 'force-dynamic'

// This response carries a live access token, so no cache (browser, proxy or
// CDN) may keep a copy.
const NO_STORE = { 'Cache-Control': 'no-store' }

function respond(body: unknown, status = 200) {
  const res = NextResponse.json(body, { status, headers: NO_STORE })
  // One-shot nonce: clear it whether the flow succeeded or not.
  res.cookies.set(LINKEDIN_STATE_COOKIE, '', { path: LINKEDIN_STATE_COOKIE_PATH, maxAge: 0 })
  return res
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return respond({ error: error || 'No code returned' }, 400)
  }

  // Only finish a flow this browser started at /api/linkedin/auth. Checked
  // before the code is exchanged, so a forged callback costs nothing.
  if (!statesMatch(request.cookies.get(LINKEDIN_STATE_COOKIE)?.value, searchParams.get('state'))) {
    return respond(
      { error: 'OAuth state mismatch or expired — start again at /api/linkedin/auth' },
      400,
    )
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!

  // Exchange code for access token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    return respond({ error: 'Failed to get access token', details: tokenData }, 500)
  }

  // Get the member's profile to get their URN
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profile = await profileRes.json()

  // The 08-21 re-auth never armed the cron's expiry guard because nobody
  // computed LINKEDIN_TOKEN_EXPIRES_AT_MS by hand. Hand over every value the
  // cron reads, ready to paste.
  const expiresIn = Number(tokenData.expires_in) || 0
  return respond({
    success: true,
    vercelEnv: {
      LINKEDIN_ACCESS_TOKEN: tokenData.access_token,
      LINKEDIN_TOKEN_EXPIRES_AT_MS: expiresIn ? String(Date.now() + expiresIn * 1000) : null,
      LINKEDIN_AUTHOR_URN: profile?.sub ? `urn:li:person:${profile.sub}` : null,
    },
    expires_in: tokenData.expires_in,
    profile,
    message:
      'Save each vercelEnv value in Vercel → Settings → Environment Variables with the Production ' +
      'environment ticked, then redeploy. The expiry value arms the LinkedIn cron\'s 7-day early warning.',
  })
}
