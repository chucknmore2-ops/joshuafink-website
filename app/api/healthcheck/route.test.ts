import { test } from 'node:test'
import assert from 'node:assert/strict'

test('healthcheck reports a sheet queue count and stays ok', async () => {
  const { GET } = await import('./route.ts')
  const res = await GET()
  assert.equal(res.status, 200)
  const json = await res.json()
  assert.equal(json.status, 'ok')
  assert.equal(typeof json.sheetQueue.configured, 'boolean')
  if (json.sheetQueue.queued === null) {
    assert.equal(json.sheetQueue.failed, null)
  } else {
    assert.equal(typeof json.sheetQueue.queued, 'number')
    assert.equal(typeof json.sheetQueue.failed, 'number')
    assert.ok(json.sheetQueue.queued >= 0)
    assert.ok(json.sheetQueue.failed >= 0)
  }
  assert.equal(JSON.stringify(json).includes('postgres://'), false)
  assert.equal(JSON.stringify(json).includes('CRON_SECRET'), false)
})
