import { NextResponse } from 'next/server'
import {
  LINKEDIN_STATE_COOKIE,
  LINKEDIN_STATE_COOKIE_PATH,
  LINKEDIN_STATE_MAX_AGE_S,
} from '@/lib/linkedin-oauth'

// Must be evaluated per request, not at build time.
//
// Without this, Next statically prerenders the route: `client_id`,
// `redirect_uri` and `state` are all frozen into the build output. Two
// consequences — changing LINKEDIN_CLIENT_ID or LINKEDIN_REDIRECT_URI in Vercel
// silently has NO effect until the next deploy (which matters every time the
// token is re-authorised), and every visitor is handed the identical `state`
// value, so it cannot function as a nonce even in principle.
export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!
  const scope = 'openid profile email w_member_social'
  // crypto, not Math.random(): this is a security nonce, not a sample.
  const state = crypto.randomUUID()

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('scope', scope)

  const res = NextResponse.redirect(authUrl.toString())
  // The callback only finishes a flow whose `state` matches this cookie, so a
  // callback link carrying someone else's code is rejected instead of handing
  // Josh a token for the wrong LinkedIn account to paste into Vercel.
  // SameSite=Lax, not Strict: LinkedIn's redirect back is a cross-site
  // top-level GET, and Strict would drop the cookie on exactly that request.
  res.cookies.set(LINKEDIN_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: LINKEDIN_STATE_COOKIE_PATH,
    maxAge: LINKEDIN_STATE_MAX_AGE_S,
  })
  return res
}
