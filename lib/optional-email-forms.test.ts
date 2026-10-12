// Highest-intent inquiry forms accept a phone without an email.
// Listing-alert signup is the exception: that product is an email.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function emailInputs(src: string): string[] {
  return src.match(/<input\b[^>]*\btype="email"[^>]*>/g) || []
}

test('market and neighborhood inquiry emails are optional', () => {
  for (const file of ['app/market/[suburb]/page.tsx', 'app/neighborhoods/[slug]/page.tsx']) {
    const src = readFileSync(file, 'utf8')
    const inputs = emailInputs(src)
    assert.ok(inputs.length > 0, `${file} should have an email field`)
    for (const input of inputs) {
      assert.equal(/\brequired\b/.test(input), false, `${file} still requires email: ${input}`)
    }
    assert.match(src, /Email \(optional\)/)
    assert.match(src, /Phone or email — whichever you prefer\./)
  }
})

test('listing inquiries accept phone without email, and alerts still require one', () => {
  const sold = readFileSync('app/listings/[slug]/page.tsx', 'utf8')
  for (const input of emailInputs(sold)) {
    assert.equal(/\brequired\b/.test(input), false, `listing detail still requires email: ${input}`)
  }

  for (const file of ['components/ListingShowingForm.tsx', 'components/ComingSoonNotifyForm.tsx']) {
    const inputs = emailInputs(readFileSync(file, 'utf8'))
    assert.ok(inputs.length > 0, file)
    for (const input of inputs) {
      assert.equal(/\brequired\b/.test(input), false, `${file} still requires email: ${input}`)
    }
  }

  const alerts = emailInputs(readFileSync('components/ListingAlertsSignup.tsx', 'utf8'))
  assert.ok(alerts.some((input) => /\brequired\b/.test(input)), 'alert signup must keep a required email')
})

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (name.endsWith('.tsx') || name.endsWith('.ts')) out.push(path)
  }
  return out
}

test('every SMS link goes to 615-551-2727', () => {
  const files = [...walk('app'), ...walk('components')]
  const offenders: string[] = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    // Only real hrefs. Comments and startsWith('sms:') checks are not links.
    const links = src.match(/href=(?:\{`|["'])sms:[^"'`\s]*/g) || []
    for (const link of links) {
      const usesJoshua =
        link.includes('6155512727') ||
        (link.includes('${TEL}') && /const TEL = '6155512727'/.test(src))
      if (!usesJoshua) offenders.push(`${file}: ${link}`)
    }
  }
  assert.deepEqual(offenders, [])
})
