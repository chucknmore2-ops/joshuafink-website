import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else out.push(path)
  }
  return out
}

test('the site and its workflows do not post Facebook or read page tokens', () => {
  assert.equal(existsSync(join(root, 'app/api/cron/facebook-post/route.ts')), false)
  assert.equal(existsSync(join(root, 'app/api/market-update/facebook/route.ts')), true)

  const files = [
    ...walk(join(root, 'app')),
    ...walk(join(root, '.github/workflows')),
    join(root, 'vercel.json'),
  ]
  const banned = [
    'process.env.FB_PAGE_ID',
    'process.env.FB_PAGE_TOKEN',
    '/api/cron/facebook-post',
    'FB_PAGE_ID or FB_PAGE_TOKEN not set',
  ]
  for (const file of files) {
    if (!/\.(ts|tsx|js|mjs|yml|yaml|json)$/.test(file)) continue
    const text = readFileSync(file, 'utf8')
    for (const needle of banned) {
      assert.equal(text.includes(needle), false, `${file} contains ${needle}`)
    }
  }

  const workflow = readFileSync(
    join(root, '.github/workflows/monthly-market-update.yml'),
    'utf8',
  )
  assert.match(workflow, /linkedin-post/)
  assert.match(workflow, /gbp-post/)
  assert.match(workflow, /monthly-facebook-row\.py/)
  assert.doesNotMatch(workflow, /facebook-post/)
})

test('monthly facebook post_log classifier', () => {
  const result = spawnSync('python3', ['scripts/test_monthly_facebook_posted.py'], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
