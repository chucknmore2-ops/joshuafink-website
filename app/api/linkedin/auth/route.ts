import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!
  const scope = 'w_member_social r_liteprofile'
  const state = Math.random().toString(36).substring(2)

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('scope', scope)

  return NextResponse.redirect(authUrl.toString())
}
