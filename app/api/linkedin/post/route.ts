import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN // e.g. urn:li:person:XXXXX

  if (!accessToken || !authorUrn) {
    return NextResponse.json(
      { error: 'LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN not configured' },
      { status: 500 }
    )
  }

  const { text, url, title, description } = await request.json()

  const postBody: Record<string, unknown> = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: url ? 'ARTICLE' : 'NONE',
        ...(url && {
          media: [
            {
              status: 'READY',
              originalUrl: url,
              title: { text: title || '' },
              description: { text: description || '' },
            },
          ],
        }),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: 'LinkedIn post failed', details: data }, { status: res.status })
  }

  return NextResponse.json({ success: true, postId: data.id })
}
