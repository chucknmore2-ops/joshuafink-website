import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LEAD_ATTRIBUTION_FIELDS } from './attribution.ts'
import {
  SHEET_APPENDED_COLUMNS,
  SHEET_BASE_COLUMNS,
  SHEET_BLOCKED_COLUMNS,
  SHEET_CRM_COLUMNS,
} from './sheet-lead-columns.ts'

function headersNamed(script: string, varName: string): string[] {
  const match = script.match(new RegExp(`var ${varName} = \\[([\\s\\S]*?)\\];`))
  assert.ok(match, `missing ${varName}`)
  const names: string[] = []
  const re = /'([^']+)'/g
  let found: RegExpExecArray | null
  while ((found = re.exec(match[1])) !== null) names.push(found[1])
  return names
}

test('the Apps Script keeps columns A–L and appends attribution after them', () => {
  const doc = readFileSync('docs/google-sheet-lead-log.md', 'utf8')
  const block = doc.match(/## Final Apps Script[\s\S]*?```javascript\n([\s\S]*?)```/)
  assert.ok(block, 'Final Apps Script code block')
  const script = block[1]

  assert.deepEqual(headersNamed(script, 'CRM_HEADERS'), [...SHEET_CRM_COLUMNS])
  assert.deepEqual(headersNamed(script, 'BLOCKED_HEADERS'), [...SHEET_BLOCKED_COLUMNS])
  assert.equal(SHEET_BASE_COLUMNS.length, 12)
  assert.deepEqual([...SHEET_CRM_COLUMNS].slice(0, 12), [...SHEET_BASE_COLUMNS])
  assert.deepEqual([...SHEET_CRM_COLUMNS].slice(12), [...SHEET_APPENDED_COLUMNS])

  for (const field of LEAD_ATTRIBUTION_FIELDS) {
    assert.equal(
      SHEET_CRM_COLUMNS.includes(field),
      true,
      `${field} is sent on the lead but missing from the sheet columns`,
    )
  }

  assert.match(script, /function ensureHeaders/)
  assert.match(script, /existing\.concat\(missing\)/)
  assert.equal(script.includes('deleteColumn'), false)
  assert.equal(script.includes('.clear('), false)
})
