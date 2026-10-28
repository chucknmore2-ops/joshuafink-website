import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gtagBootstrap, trackAdsConversion } from './ads.ts'

const GA = 'G-3TQJEZ5RSY'
const AW = 'AW-123456789'
const LEAD = 'leadLabel1'
const CALL = 'callLabel1'
const INLINE_HEAD =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());"

const FORMS = [
  'app/cash-offer/CashOfferForm.tsx',
  'components/SuburbLeadForm.tsx',
  'app/sell/SellForm.tsx',
  'app/contact/ContactForm.tsx',
]

function inline(...ids: string[]): string {
  return INLINE_HEAD + ids.map((id) => `gtag('config','${id}');`).join('')
}

function withGtag(): { calls: unknown[][]; restore: () => void } {
  const calls: unknown[][] = []
  const previous = globalThis.window
  globalThis.window = {
    gtag: (...args: unknown[]) => {
      calls.push(args)
    },
  } as unknown as Window & typeof globalThis
  return {
    calls,
    restore() {
      globalThis.window = previous
    },
  }
}

function withEnv(vars: Record<string, string | undefined>, run: () => void): void {
  const previous: Record<string, string | undefined> = {}
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key]
    const value = vars[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  try {
    run()
  } finally {
    for (const key of Object.keys(previous)) {
      const value = previous[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test('gtag loader is unchanged for GA4 alone and is not added twice with Ads', () => {
  assert.equal(gtagBootstrap(undefined, undefined), null)
  assert.equal(gtagBootstrap('', '   '), null)
  assert.equal(gtagBootstrap('not-a-ga-id', 'AW-XXXX'), null)
  assert.equal(gtagBootstrap("G-OK');alert(1)", "AW-1');alert(1)"), null)

  const gaOnly = gtagBootstrap(` ${GA} `, undefined)
  assert.deepEqual(gaOnly, {
    src: `https://www.googletagmanager.com/gtag/js?id=${GA}`,
    inline: inline(GA),
  })

  const both = gtagBootstrap(GA, AW)
  assert.ok(both)
  assert.equal(both.src, `https://www.googletagmanager.com/gtag/js?id=${GA}`)
  assert.equal(both.inline, inline(GA, AW))
  assert.equal(both.src.split('googletagmanager.com/gtag/js').length, 2)
  assert.equal(both.inline.includes('googletagmanager.com'), false)

  const adsOnly = gtagBootstrap('nope', ` ${AW} `)
  assert.deepEqual(adsOnly, {
    src: `https://www.googletagmanager.com/gtag/js?id=${AW}`,
    inline: inline(AW),
  })
})

test('the report-only CSP allows Google Ads conversion endpoints', () => {
  const config = readFileSync('next.config.mjs', 'utf8')
  for (const host of [
    'https://www.googleadservices.com',
    'https://googleads.g.doubleclick.net',
    'https://pagead2.googlesyndication.com',
    'https://ad.doubleclick.net',
    'https://www.google.com',
  ]) {
    assert.ok(config.includes(host), `CSP is missing ${host}`)
  }
})

test('layout renders one gtag.js loader and configs Ads only through that loader', () => {
  const layout = readFileSync('app/layout.tsx', 'utf8')
  const ads = readFileSync('lib/ads.ts', 'utf8')
  assert.match(layout, /gtagBootstrap\(process\.env\.NEXT_PUBLIC_GA_ID, process\.env\.NEXT_PUBLIC_GOOGLE_ADS_ID\)/)
  assert.equal(layout.includes('googletagmanager.com/gtag/js'), false)
  assert.equal(ads.split('googletagmanager.com/gtag/js').length, 2)
  assert.match(layout, /src=\{tags\.src\}/)
  assert.equal(layout.split('src={tags.src}').length, 2)
})

test('lead forms fire the Ads conversion only in the successful submit branch, after generate_lead', () => {
  for (const file of FORMS) {
    const src = readFileSync(file, 'utf8')
    const start = src.indexOf('if (res.ok)')
    const elseAt = src.indexOf('} else {', start)
    assert.ok(start !== -1 && elseAt !== -1, `${file} is missing the res.ok branch`)
    const success = src.slice(start, elseAt)
    const leadAt = success.indexOf("gtag('event', 'generate_lead'")
    const adsAt = success.indexOf('trackAdsConversion(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL)')
    assert.ok(leadAt !== -1, `${file} success path dropped generate_lead`)
    assert.ok(adsAt > leadAt, `${file} must call the Ads conversion after generate_lead`)
    assert.equal(src.split('trackAdsConversion(').length, 2, `${file} should call trackAdsConversion once`)
    const outside = src.slice(0, start) + src.slice(elseAt)
    assert.equal(outside.includes('trackAdsConversion('), false, `${file} tracks a conversion off the success path`)
    assert.equal(outside.includes('generate_lead'), false, `${file} tracks generate_lead off the success path`)
  }
})

test('click-to-call uses the call label and texts do not', () => {
  const src = readFileSync('components/TrackedTelLink.tsx', 'utf8')
  assert.match(src, /const eventName = href\.startsWith\('sms:'\) \? 'text_click' : 'call_click'/)
  assert.match(src, /if \(eventName === 'call_click'\) \{\s*trackAdsConversion\(process\.env\.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL\)/)
  assert.equal(src.split('trackAdsConversion(').length, 2)
})

test('nothing fires when the Google Ads env vars are unset', () => {
  const gtag = withGtag()
  try {
    withEnv(
      {
        NEXT_PUBLIC_GOOGLE_ADS_ID: undefined,
        NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: undefined,
        NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL: undefined,
      },
      () => {
        trackAdsConversion(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL)
        trackAdsConversion(process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL)
        trackAdsConversion(undefined)
        trackAdsConversion('')
        trackAdsConversion('leadLabel1')
      },
    )
    assert.deepEqual(gtag.calls, [])
  } finally {
    gtag.restore()
  }
})

test('a conversion is send_to, value, and currency — no contact fields', () => {
  const gtag = withGtag()
  try {
    withEnv(
      {
        NEXT_PUBLIC_GOOGLE_ADS_ID: AW,
        NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: ` ${LEAD} `,
        NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL: CALL,
      },
      () => {
        trackAdsConversion(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL)
        trackAdsConversion(process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL)
      },
    )
    assert.deepEqual(gtag.calls, [
      ['event', 'conversion', { send_to: `${AW}/${LEAD}`, value: 1, currency: 'USD' }],
      ['event', 'conversion', { send_to: `${AW}/${CALL}`, value: 1, currency: 'USD' }],
    ])
    const blob = JSON.stringify(gtag.calls)
    for (const pii of ['Jane Q Public', 'jane.q.public@example.com', '615-555-0199', '123 Secret Hollow Rd']) {
      assert.equal(blob.includes(pii), false)
    }
  } finally {
    gtag.restore()
  }
})

test('missing gtag, a bad id, or a label that is not a conversion token does not fire', () => {
  const previous = globalThis.window
  // @ts-expect-error clearing the jsdom/browser global for this case
  delete globalThis.window
  withEnv({ NEXT_PUBLIC_GOOGLE_ADS_ID: AW, NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: LEAD }, () => {
    assert.doesNotThrow(() => trackAdsConversion(LEAD))
  })
  globalThis.window = previous

  const gtag = withGtag()
  try {
    withEnv({ NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-XXXX', NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: LEAD }, () => {
      trackAdsConversion(LEAD)
    })
    withEnv({ NEXT_PUBLIC_GOOGLE_ADS_ID: AW }, () => {
      trackAdsConversion(undefined)
      trackAdsConversion('jane.q.public@example.com')
      trackAdsConversion("lead');alert(1)")
    })
    assert.deepEqual(gtag.calls, [])
  } finally {
    gtag.restore()
  }
})
