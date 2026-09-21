// Instagram publish helpers: never send Compass CDN URLs to Graph, and always
// return enough JSON for Social Autopost to debug a 502.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  IgPageResolutionError,
  describeIgPages,
  igFailureBody,
  igPublicHostOk,
  igTokenLogFields,
  isJoshuaFinkPageName,
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
const WATER_FILTER_PAGE_ID = '1083053098221721'

function graphFetch(handler: (path: string) => Response): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(url).pathname
    return handler(path)
  }) as typeof fetch
}

const WATER_FILTER_LAB = {
  id: WATER_FILTER_PAGE_ID,
  name: 'The Water Filter Lab',
  access_token: PAGE_TOKEN_OTHER,
  instagram_business_account: { id: '999' },
}
const PAW_PULSES = {
  id: 'paw-pulses',
  name: 'Paw Pulses',
  access_token: PAGE_TOKEN_OTHER,
}
const JOSHUA_FINK_GROUP = {
  id: 'page-jfg',
  name: 'Joshua Fink Group',
  access_token: PAGE_TOKEN_JFG,
}

test('isJoshuaFinkPageName accepts realtor variants and rejects other brands', () => {
  assert.equal(isJoshuaFinkPageName('Joshua Fink Group'), true)
  assert.equal(isJoshuaFinkPageName('Joshua  Fink'), true)
  assert.equal(isJoshuaFinkPageName('JoshuaFink Group'), true)
  assert.equal(isJoshuaFinkPageName('joshuafink.com'), true)
  assert.equal(isJoshuaFinkPageName('The Water Filter Lab'), false)
  assert.equal(isJoshuaFinkPageName('Paw Pulses'), false)
})

test('pickIgPage prefers the page linked to IG_BUSINESS_ACCOUNT_ID even when Water Filter Lab is first', () => {
  const picked = pickIgPage(
    [
      WATER_FILTER_LAB,
      {
        id: 'page-jfg',
        name: 'Some Other Label',
        access_token: PAGE_TOKEN_JFG,
        instagram_business_account: { id: IG_ID },
      },
    ],
    IG_ID,
  )
  assert.equal(picked.ok, true)
  if (picked.ok) {
    assert.equal(picked.page.id, 'page-jfg')
    assert.equal(picked.reason, 'matched instagram_business_account')
  }
})

test('pickIgPage prefers Joshua Fink Group by name over Water Filter Lab', () => {
  const picked = pickIgPage([WATER_FILTER_LAB, JOSHUA_FINK_GROUP], IG_ID)
  assert.equal(picked.ok, true)
  if (picked.ok) {
    assert.equal(picked.page.id, 'page-jfg')
    assert.equal(picked.page.name, 'Joshua Fink Group')
    assert.match(picked.reason, /Joshua Fink Group page name/)
  }
})

test('pickIgPage matches Joshua Fink name variants, not Water Filter Lab', () => {
  for (const name of [
    'Joshua Fink',
    'Joshua  Fink Group',
    'joshuafink.com',
    'JoshuaFink Group',
  ]) {
    const picked = pickIgPage(
      [WATER_FILTER_LAB, { id: 'page-jfg', name, access_token: PAGE_TOKEN_JFG }],
      IG_ID,
    )
    assert.equal(picked.ok, true, name)
    if (picked.ok) assert.equal(picked.page.id, 'page-jfg')
  }
})

test('pickIgPage refuses silent first-page fallback when only other brands exist', () => {
  const picked = pickIgPage([WATER_FILTER_LAB, PAW_PULSES], IG_ID)
  assert.equal(picked.ok, false)
  if (!picked.ok) {
    assert.match(picked.error, /The Water Filter Lab/)
    assert.match(picked.error, new RegExp(WATER_FILTER_PAGE_ID))
    assert.match(picked.error, /Paw Pulses/)
    assert.equal(picked.error.includes(PAGE_TOKEN_OTHER), false)
    assert.equal(picked.error.includes(USER_TOKEN), false)
  }
})

test('pickIgPage uses FB_PAGE_ID when name and IG account do not match', () => {
  const picked = pickIgPage(
    [
      WATER_FILTER_LAB,
      { id: 'page-jfg', name: 'Compass Brentwood', access_token: PAGE_TOKEN_JFG },
    ],
    IG_ID,
    'Joshua Fink Group',
    'page-jfg',
  )
  assert.equal(picked.ok, true)
  if (picked.ok) {
    assert.equal(picked.page.id, 'page-jfg')
    assert.equal(picked.reason, 'matched preferred page id')
  }
})

test('describeIgPages never includes access tokens', () => {
  const listed = describeIgPages([WATER_FILTER_LAB, JOSHUA_FINK_GROUP])
  assert.match(listed, /The Water Filter Lab/)
  assert.match(listed, /Joshua Fink Group/)
  assert.equal(listed.includes(PAGE_TOKEN_OTHER), false)
  assert.equal(listed.includes(PAGE_TOKEN_JFG), false)
  assert.equal(listed.toLowerCase().includes('access_token'), false)
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
  assert.equal(resolved.tokenKind, 'user')
  assert.equal(resolved.swapped, true)
  assert.equal(resolved.pageId, 'page-jfg')
  assert.equal(resolved.pageName, 'Joshua Fink Group')
  assert.equal(resolved.accessToken, PAGE_TOKEN_JFG)
  assert.match(resolved.reason, /instagram_business_account/)
  const log = JSON.stringify(igTokenLogFields(resolved))
  assert.equal(log.includes(USER_TOKEN), false)
  assert.equal(log.includes(PAGE_TOKEN_JFG), false)
  assert.equal(log.includes('accessToken'), false)
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
              id: WATER_FILTER_PAGE_ID,
              name: 'The Water Filter Lab',
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
  assert.equal(resolved.swapped, true)
  assert.equal(resolved.pageId, 'page-jfg')
  assert.equal(resolved.pageName, 'Joshua Fink Group')
  assert.equal(resolved.accessToken, PAGE_TOKEN_JFG)
  assert.match(resolved.reason, /page name/)
})

test('resolveIgPublishToken refuses Water Filter Lab as first-available-page', async () => {
  await assert.rejects(
    () =>
      resolveIgPublishToken({
        envToken: USER_TOKEN,
        igBusinessAccountId: IG_ID,
        fetchImpl: graphFetch((path) => {
          if (path.endsWith('/me/accounts')) {
            return Response.json({
              data: [
                {
                  id: WATER_FILTER_PAGE_ID,
                  name: 'The Water Filter Lab',
                  access_token: PAGE_TOKEN_OTHER,
                },
                {
                  id: 'paw-pulses',
                  name: 'Paw Pulses',
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
      }),
    (err: unknown) => {
      assert.equal(err instanceof IgPageResolutionError, true)
      const message = (err as Error).message
      assert.match(message, /The Water Filter Lab/)
      assert.match(message, new RegExp(WATER_FILTER_PAGE_ID))
      assert.match(message, /Paw Pulses/)
      assert.equal(message.includes(USER_TOKEN), false)
      assert.equal(message.includes(PAGE_TOKEN_OTHER), false)
      assert.equal(message.includes(PAGE_TOKEN_JFG), false)
      return true
    },
  )
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
  assert.equal(resolved.tokenKind, 'page')
  assert.equal(resolved.swapped, false)
  assert.equal(resolved.pageId, 'page-jfg')
  assert.equal(resolved.accessToken, PAGE_TOKEN_JFG)
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
  assert.equal(resolved.tokenKind, 'unknown')
  assert.equal(resolved.swapped, false)
  assert.equal(resolved.accessToken, USER_TOKEN)
})

