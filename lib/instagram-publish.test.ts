// Instagram publish helpers: never send Compass CDN URLs to Graph, and always
// return enough JSON for Social Autopost to debug a 502.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  IG_WRONG_PAGE_HINT,
  igFailureBody,
  igPublicHostOk,
  igTokenLogFields,
  pickIgPage,
  preflightPublicJpeg,
  redactSecrets,
  resolveIgPublishToken,
} from './instagram-publish.ts'

test('igPublicHostOk only allows joshuafink.com over https', () => {
  assert.equal(
    igPublicHostOk('https://www.joshuafink.com/ig-photo/abc12345.jpg'),
    true,
  )
  assert.equal(igPublicHostOk('https://joshuafink.com/hero/x.jpg'), true)
  assert.equal(
    igPublicHostOk(
      'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/1200x900.jpg',
    ),
    false,
  )
  assert.equal(igPublicHostOk('http://www.joshuafink.com/ig-photo/abc12345.jpg'), false)
  assert.equal(igPublicHostOk('not a url'), false)
})

test('igFailureBody always includes slug, creationId, status_code, and attempts', () => {
  const body = igFailureBody({
    error: 'instagram container not ready',
    attempts: [
      {
        refKey: '1113-linn-cv-ct-gallatin',
        kind: 'listing',
        imageUrl: 'https://www.joshuafink.com/ig-photo/aaa11111.jpg',
        creationId: '1789001',
        statusCode: 'IN_PROGRESS',
        status: 'In Progress',
        error: 'instagram container not ready',
      },
      {
        refKey: '1901-new-bristol-ln-brentwood',
        kind: 'listing',
        imageUrl: 'https://www.joshuafink.com/ig-photo/bbb22222.jpg',
        creationId: '1789002',
        statusCode: 'IN_PROGRESS',
        error: 'instagram container not ready',
      },
    ],
    resume: false,
  })
  assert.equal(body.error, 'instagram container not ready')
  assert.equal(body.refKey, '1901-new-bristol-ln-brentwood')
  assert.equal(body.creationId, '1789002')
  assert.equal(body.statusCode, 'IN_PROGRESS')
  assert.equal(body.resume, false)
  assert.equal(Array.isArray(body.attempts), true)
  assert.equal((body.attempts as unknown[]).length, 2)
  const json = JSON.stringify(body)
  assert.equal(json.includes('access_token'), false)
})

test('redactSecrets strips tokens from Graph snippets', () => {
  const raw =
    'container 400 {"error":"OAuthException"} access_token=EAABsbCS123 Bearer EAABsbCS456 extra'
  const out = redactSecrets(raw)
  assert.equal(out.includes('EAABsbCS123'), false)
  assert.equal(out.includes('EAABsbCS456'), false)
  assert.match(out, /access_token=\[redacted\]/)
  assert.match(out, /Bearer \[redacted\]/)
})

test('preflightPublicJpeg refuses Compass CDN without fetching', async () => {
  const result = await preflightPublicJpeg(
    'https://www.compass.com/m/aaa/1200x900.jpg',
    async () => {
      throw new Error('must not fetch Compass')
    },
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.reason, /compass\.com/)
})

test('preflightPublicJpeg accepts a JPEG hosted on joshuafink.com', async () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, ...Array.from({ length: 200 }, () => 1)])
  const result = await preflightPublicJpeg(
    'https://www.joshuafink.com/ig-photo/abc12345.jpg',
    async () =>
      new Response(jpeg, { status: 200, headers: { 'Content-Type': 'image/jpeg' } }),
  )
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.bytes, jpeg.byteLength)
})

test('preflightPublicJpeg fails closed on a non-jpeg content-type', async () => {
  const result = await preflightPublicJpeg(
    'https://www.joshuafink.com/ig-photo/abc12345.jpg',
    async () =>
      new Response('<html>nope</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.reason, /content-type/)
})

const USER_TOKEN = 'EAA_USER_TOKEN_SECRET'
const PAGE_TOKEN_JFG = 'EAA_PAGE_TOKEN_JFG_SECRET'
const PAGE_TOKEN_OTHER = 'EAA_PAGE_TOKEN_OTHER_SECRET'
const IG_ID = '17841400000000000'
const WATER_FILTER_LAB = {
  id: '1083053098221721',
  name: 'The Water Filter Lab',
  access_token: PAGE_TOKEN_OTHER,
  instagram_business_account: { id: '999' },
}

function graphFetch(handler: (path: string, url: URL) => Response): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const href =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const url = new URL(href)
    return handler(url.pathname, url)
  }) as typeof fetch
}

function assertNoSecrets(text: string) {
  assert.equal(text.includes(USER_TOKEN), false)
  assert.equal(text.includes(PAGE_TOKEN_JFG), false)
  assert.equal(text.includes(PAGE_TOKEN_OTHER), false)
  assert.equal(text.includes('accessToken'), false)
  assert.equal(text.includes('access_token'), false)
}

test('pickIgPage prefers the page linked to IG_BUSINESS_ACCOUNT_ID', () => {
  const picked = pickIgPage(
    [
      {
        id: '1',
        name: 'Other',
        access_token: PAGE_TOKEN_OTHER,
        instagram_business_account: { id: '999' },
      },
      {
        id: '2',
        name: 'Not Joshua',
        access_token: PAGE_TOKEN_JFG,
        instagram_business_account: { id: IG_ID },
      },
    ],
    IG_ID,
  )
  assert.equal(picked.page?.id, '2')
  assert.match(picked.reason, /instagram_business_account/)
})

test('pickIgPage still picks Joshua Fink Group when it is after Water Filter Lab and IG matches', () => {
  const picked = pickIgPage(
    [
      WATER_FILTER_LAB,
      {
        id: 'cards',
        name: 'CardsWorthTrading',
        access_token: PAGE_TOKEN_OTHER,
        instagram_business_account: { id: '111' },
      },
      {
        id: 'page-jfg',
        name: 'Joshua Fink Group',
        access_token: PAGE_TOKEN_JFG,
        instagram_business_account: { id: IG_ID },
      },
    ],
    IG_ID,
  )
  assert.equal(picked.page?.id, 'page-jfg')
  assert.equal(picked.page?.name, 'Joshua Fink Group')
  assert.notEqual(picked.page?.id, WATER_FILTER_LAB.id)
})

test('pickIgPage does not select Water Filter Lab when no page matches IG_BUSINESS_ACCOUNT_ID', () => {
  const picked = pickIgPage(
    [
      WATER_FILTER_LAB,
      {
        id: 'cards',
        name: 'CardsWorthTrading',
        access_token: PAGE_TOKEN_OTHER,
        instagram_business_account: { id: '111' },
      },
      {
        id: 'paw',
        name: 'Paw Pulses',
        access_token: PAGE_TOKEN_OTHER,
      },
    ],
    IG_ID,
  )
  assert.equal(picked.page, undefined)
  assert.match(picked.reason, /refused wrong-brand fallback/)
  assert.match(picked.reason, /The Water Filter Lab/)
})

test('pickIgPage falls back to Joshua Fink Group by name when that page has no conflicting IG id', () => {
  const byName = pickIgPage(
    [
      { id: '1', name: 'Random', access_token: PAGE_TOKEN_OTHER },
      { id: '2', name: 'Joshua Fink Group', access_token: PAGE_TOKEN_JFG },
    ],
    IG_ID,
  )
  assert.equal(byName.page?.id, '2')
  assert.match(byName.reason, /page name/)
})

test('pickIgPage refuses preferredPageId when that Page is linked to a different IG account', () => {
  const picked = pickIgPage(
    [WATER_FILTER_LAB],
    IG_ID,
    'Joshua Fink Group',
    WATER_FILTER_LAB.id,
  )
  assert.equal(picked.page, undefined)
  assert.match(picked.reason, /refused wrong-brand fallback/)
})

test('resolveIgPublishToken swaps a User token for the linked Page token', async () => {
  const resolved = await resolveIgPublishToken({
    envToken: USER_TOKEN,
    igBusinessAccountId: IG_ID,
    fetchImpl: graphFetch((path) => {
      if (path.endsWith('/me/accounts')) {
        return Response.json({
          data: [
            {
              id: 'page-other',
              name: 'Other Biz',
              access_token: PAGE_TOKEN_OTHER,
              instagram_business_account: { id: '000' },
            },
            {
              id: 'page-jfg',
              name: 'Joshua Fink Group',
              access_token: PAGE_TOKEN_JFG,
              instagram_business_account: { id: IG_ID },
            },
          ],
        })
      }
      if (path.endsWith('/me')) {
        return Response.json({ id: 'user-1', name: 'Josh Fink' })
      }
      return Response.json({ error: 'unexpected' }, { status: 500 })
    }),
  })
  assert.equal(resolved.ok, true)
  assert.equal(resolved.tokenKind, 'user')
  assert.equal(resolved.swapped, true)
  assert.equal(resolved.pageId, 'page-jfg')
  assert.equal(resolved.pageName, 'Joshua Fink Group')
  assert.ok(resolved.ok)
  if (resolved.ok) assert.equal(resolved.accessToken, PAGE_TOKEN_JFG)
  assert.match(resolved.reason, /instagram_business_account/)
  const log = JSON.stringify(igTokenLogFields(resolved))
  assertNoSecrets(log)
})

test('resolveIgPublishToken falls back to the Joshua Fink Group page by name', async () => {
  const resolved = await resolveIgPublishToken({
    envToken: USER_TOKEN,
    igBusinessAccountId: IG_ID,
    fetchImpl: graphFetch((path) => {
      if (path.endsWith('/me/accounts')) {
        return Response.json({
          data: [
            {
              id: 'page-other',
              name: 'Other Biz',
              access_token: PAGE_TOKEN_OTHER,
              instagram_business_account: { id: '000' },
            },
            {
              id: 'page-jfg',
              name: 'Joshua Fink Group',
              access_token: PAGE_TOKEN_JFG,
            },
          ],
        })
      }
      if (path.endsWith('/me')) {
        return Response.json({ id: 'user-1', name: 'Josh Fink' })
      }
      return Response.json({ error: 'unexpected' }, { status: 500 })
    }),
  })
  assert.equal(resolved.ok, true)
  assert.equal(resolved.swapped, true)
  assert.equal(resolved.pageId, 'page-jfg')
  if (resolved.ok) assert.equal(resolved.accessToken, PAGE_TOKEN_JFG)
  assert.match(resolved.reason, /page name/)
})

test('resolveIgPublishToken does not swap to Water Filter Lab when IG id matches no page', async () => {
  const resolved = await resolveIgPublishToken({
    envToken: USER_TOKEN,
    igBusinessAccountId: IG_ID,
    fetchImpl: graphFetch((path) => {
      if (path.endsWith('/me/accounts')) {
        return Response.json({
          data: [
            WATER_FILTER_LAB,
            {
              id: 'cards',
              name: 'CardsWorthTrading',
              access_token: PAGE_TOKEN_OTHER,
              instagram_business_account: { id: '111' },
            },
            { id: 'paw', name: 'Paw Pulses', access_token: PAGE_TOKEN_OTHER },
          ],
        })
      }
      if (path.endsWith('/me')) {
        return Response.json({ id: 'user-1', name: 'Josh Fink' })
      }
      return Response.json({ error: 'unexpected' }, { status: 500 })
    }),
  })
  assert.equal(resolved.ok, false)
  assert.equal(resolved.swapped, false)
  assert.equal(resolved.tokenKind, 'user')
  assert.equal(resolved.pageName, null)
  assert.equal(resolved.pageId, null)
  assert.match(resolved.reason, /refused wrong-brand fallback/)
  if (!resolved.ok) {
    assert.match(resolved.hint, /FB_PAGE_ID/)
    assert.match(resolved.hint, /pages_show_list/)
    assert.equal(resolved.hint, IG_WRONG_PAGE_HINT)
  }
  const log = JSON.stringify(igTokenLogFields(resolved))
  assert.equal(JSON.parse(log).hint, IG_WRONG_PAGE_HINT)
  assertNoSecrets(log)
  assert.equal('accessToken' in resolved, false)
})

test('resolveIgPublishToken paginates /me/accounts so Joshua Fink Group is not missed', async () => {
  let accountCalls = 0
  const resolved = await resolveIgPublishToken({
    envToken: USER_TOKEN,
    igBusinessAccountId: IG_ID,
    fetchImpl: graphFetch((path, url) => {
      if (path.endsWith('/me/accounts')) {
        accountCalls += 1
        const after = url.searchParams.get('after')
        if (!after) {
          return Response.json({
            data: [WATER_FILTER_LAB],
            paging: {
              cursors: { after: 'page2cursor' },
              next: 'https://graph.facebook.com/v19.0/me/accounts?after=page2cursor',
            },
          })
        }
        assert.equal(after, 'page2cursor')
        return Response.json({
          data: [
            {
              id: 'page-jfg',
              name: 'Joshua Fink Group',
              access_token: PAGE_TOKEN_JFG,
              instagram_business_account: { id: IG_ID },
            },
          ],
        })
      }
      if (path.endsWith('/me')) {
        return Response.json({ id: 'user-1', name: 'Josh Fink' })
      }
      return Response.json({ error: 'unexpected' }, { status: 500 })
    }),
  })
  assert.ok(accountCalls >= 2)
  assert.equal(resolved.ok, true)
  assert.equal(resolved.swapped, true)
  assert.equal(resolved.pageId, 'page-jfg')
  assert.equal(resolved.pageName, 'Joshua Fink Group')
  if (resolved.ok) assert.equal(resolved.accessToken, PAGE_TOKEN_JFG)
  assert.match(resolved.reason, /instagram_business_account/)
})

test('resolveIgPublishToken keeps a Page token as-is', async () => {
  const resolved = await resolveIgPublishToken({
    envToken: PAGE_TOKEN_JFG,
    igBusinessAccountId: IG_ID,
    fetchImpl: graphFetch((path) => {
      if (path.endsWith('/me/accounts')) {
        return Response.json(
          {
            error: {
              message:
                '(#100) Tried accessing nonexisting field (accounts) on node type (Page)',
              type: 'OAuthException',
              code: 100,
            },
          },
          { status: 400 },
        )
      }
      if (path.endsWith('/me')) {
        return Response.json({ id: 'page-jfg', name: 'Joshua Fink Group' })
      }
      return Response.json({ error: 'unexpected' }, { status: 500 })
    }),
  })
  assert.equal(resolved.ok, true)
  assert.equal(resolved.tokenKind, 'page')
  assert.equal(resolved.swapped, false)
  assert.equal(resolved.pageId, 'page-jfg')
  if (resolved.ok) assert.equal(resolved.accessToken, PAGE_TOKEN_JFG)
  assert.match(resolved.reason, /already a Page token/)
})

test('resolveIgPublishToken falls back to env token when Graph is unreachable', async () => {
  const resolved = await resolveIgPublishToken({
    envToken: USER_TOKEN,
    igBusinessAccountId: IG_ID,
    fetchImpl: (async () => {
      throw new Error('network down')
    }) as typeof fetch,
  })
  assert.equal(resolved.ok, true)
  assert.equal(resolved.tokenKind, 'unknown')
  assert.equal(resolved.swapped, false)
  if (resolved.ok) assert.equal(resolved.accessToken, USER_TOKEN)
})

