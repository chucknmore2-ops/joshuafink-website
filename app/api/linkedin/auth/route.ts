import { NextResponse } from 'next/server'

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

  // KNOWN GAP, deliberately left: app/api/linkedin/callback/route.ts never
  // reads `state` back, so this is not yet real CSRF protection — closing it
  // properly means persisting the nonce (a signed, short-lived cookie) and
  // rejecting a mismatch on return. That is a change to the live OAuth flow,
  // and this route is the one Josh must use to re-authorise before the token
  // expires 2026-08-25, so it is not something to rework days beforehand.
  // Revisit once the token is renewed and there is no deadline attached.
  return NextResponse.redirect(authUrl.toString())
}
