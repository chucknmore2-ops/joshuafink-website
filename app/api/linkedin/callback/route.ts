import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.json({ error: error || 'No code returned' }, { status: 400 })
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
    return NextResponse.json({ error: 'Failed to get access token', details: tokenData }, { status: 500 })
  }

  // Get the member's profile to get their URN
  const profileRes = await fetch('https://api.linkedin.com/v2/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profile = await profileRes.json()

  // Return token + profile info to display
  return NextResponse.json({
    success: true,
    access_token: tokenData.access_token,
    expires_in: tokenData.expires_in,
    profile,
    message: 'Copy this access_token and save it as LINKEDIN_ACCESS_TOKEN in your Vercel env vars',
  })
}
