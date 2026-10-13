import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { marketHubFaqs } from './market-hub.ts'

const faqs = marketHubFaqs()
const blob = faqs.map((f) => `${f.q} ${f.a}`).join('\n')

test('market hub cites Redfin medians and does not call them RealTracs', () => {
  assert.match(blob, /Source: Redfin, as of October 5, 2026/)
  assert.match(blob, /median days on market/)
  assert.doesNotMatch(blob, /RealTracs/)
  assert.doesNotMatch(blob, /county assessor/)
  assert.doesNotMatch(blob, /generally appreciated/)
})

test('market hub names cities that are up and cities that are down', () => {
  const direction = faqs.find((f) => f.q.startsWith('Is the Middle Tennessee'))
  assert.ok(direction)
  const upAt = direction.a.indexOf('up year over year in ')
  const downAt = direction.a.indexOf('and down in ')
  assert.ok(upAt > 0 && downAt > upAt)
  const up = direction.a.slice(upAt, downAt)
  const down = direction.a.slice(downAt)
  assert.match(up, /Franklin/)
  assert.match(up, /Brentwood/)
  assert.match(down, /Spring Hill/)
  assert.match(down, /Nolensville/)
  assert.match(down, /Nashville/)
  assert.doesNotMatch(up, /Spring Hill/)
})

test('city market pages label days on market as a median and color negative YoY', () => {
  const hub = readFileSync('app/market/page.tsx', 'utf8')
  const city = readFileSync('app/market/[suburb]/page.tsx', 'utf8')
  const og = readFileSync('app/market/[suburb]/opengraph-image.tsx', 'utf8')
  assert.match(hub, /yoyColor\(s\.yoyChange\)/)
  assert.match(hub, /Median days on market/)
  assert.doesNotMatch(hub, /Avg \{/)
  assert.match(city, /Median Days on Market/)
  assert.match(city, /Median DOM/)
  assert.doesNotMatch(city, /Avg\. Days on Market/)
  assert.doesNotMatch(city, /avg days on market/)
  assert.match(og, /Median on Market/)
  assert.match(og, /fca5a5/)
})
