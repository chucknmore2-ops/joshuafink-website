/**
 * Print the query string the monthly social workflow appends so production
 * posts only after it is serving this commit's snapshot.
 *
 *   node scripts/snapshot-expect.mjs
 *   → expectMonth=<newest YYYY-MM>&expectMedian=<median>&...
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/market-snapshot.ts')
const source = readFileSync(file, 'utf8')
const start = source.indexOf('export const marketSnapshots')
if (start < 0) {
  console.error('marketSnapshots not found')
  process.exit(1)
}
const slice = source.slice(start, start + 2500)
const month = slice.match(/month:\s*'(\d{4}-\d{2})'/)
const median = slice.match(/medianSalePriceNum:\s*(\d+)/)
const closings = slice.match(/closedSales:\s*(\d+)/)
if (!month || !median || !closings) {
  console.error('could not read month, median, and closings from the newest snapshot')
  process.exit(1)
}
const supply = slice.match(/monthsOfInventory:\s*([\d.]+)/)
const yoy = slice.match(/medianYoyChange:\s*'([^']+)'/)
const params = new URLSearchParams()
params.set('expectMonth', month[1])
params.set('expectMedian', median[1])
params.set('expectClosings', closings[1])
params.set('expectSupply', supply ? supply[1] : 'none')
params.set('expectYoy', yoy ? yoy[1] : 'none')
const monthNames = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]
const [year, monthNum] = month[1].split('-')
const slug = `middle-tennessee-market-update-${monthNames[Number(monthNum) - 1]}-${year}`
process.stdout.write(`${params.toString()}\n${slug}\n`)
