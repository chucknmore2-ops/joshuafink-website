import { spawnSync } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'

function check(html, env) {
  return spawnSync(process.execPath, ['scripts/snapshot-page-ready.mjs'], {
    input: html,
    encoding: 'utf8',
    env: { ...process.env, MEDIAN: '', SUPPLY: '', YOY: '', ...env },
  })
}

const page = '<p>$515,725 (+2.1% year over year)</p><li>Months of supply: 5.8</li>'
const august = { MEDIAN: '515,725', SUPPLY: '5.8', YOY: '+2.1%' }

test('ready when median, yoy, and nearby supply are present', () => {
  const result = check(page, august)
  assert.equal(result.status, 0, result.stderr)
})

test('not ready when the median is missing', () => {
  const result = check(page.replace('$515,725', '$1'), august)
  assert.equal(result.status, 1)
})

test('supply must sit next to the months-of-supply label', () => {
  const html = '$515,725 +2.1% Months of supply:' + 'x'.repeat(80) + '5.8'
  const result = check(html, august)
  assert.equal(result.status, 1)
})

test('none skips an omitted figure', () => {
  const result = check('$515,725', { MEDIAN: '515,725', SUPPLY: 'none', YOY: 'none' })
  assert.equal(result.status, 0)
})

test('empty median is not a match', () => {
  const result = check('$515,725', { MEDIAN: '', SUPPLY: 'none', YOY: 'none' })
  assert.equal(result.status, 1)
})
