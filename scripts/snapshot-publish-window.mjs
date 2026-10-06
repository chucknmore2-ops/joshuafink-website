/**
 * Whether the newest checked-in snapshot is still inside the publish window.
 *
 *   node scripts/snapshot-publish-window.mjs
 *   node scripts/snapshot-publish-window.mjs 2026-10-01T13:41:00Z
 *
 * Prints `month=YYYY-MM behind=N max=N publishable=yes|no`.
 * Exit 0 when it may be posted. Exit 2 when it is too old to post.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function monthsBehind(month, now) {
  const [year, m] = month.split('-').map(Number)
  return (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - m)
}

export function isPublishable(month, now, maxMonthsBehind) {
  return monthsBehind(month, now) <= maxMonthsBehind
}

export function readNewestSnapshot(source) {
  const start = source.indexOf('export const marketSnapshots')
  if (start < 0) throw new Error('marketSnapshots not found')
  const slice = source.slice(start, start + 2500)
  const month = slice.match(/month:\s*'(\d{4}-\d{2})'/)
  const max = source.match(/export const MAX_MONTHS_BEHIND = (\d+)/)
  if (!month || !max) throw new Error('could not read month or MAX_MONTHS_BEHIND')
  return { month: month[1], maxMonthsBehind: Number(max[1]) }
}

function main() {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/market-snapshot.ts')
  const { month, maxMonthsBehind } = readNewestSnapshot(readFileSync(file, 'utf8'))
  const now = process.argv[2] ? new Date(process.argv[2]) : new Date()
  if (Number.isNaN(now.getTime())) {
    console.error('timestamp must be ISO-8601')
    process.exit(1)
  }
  const behind = monthsBehind(month, now)
  const publishable = isPublishable(month, now, maxMonthsBehind)
  process.stdout.write(
    `month=${month} behind=${behind} max=${maxMonthsBehind} publishable=${publishable ? 'yes' : 'no'}\n`,
  )
  process.exit(publishable ? 0 : 2)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main()
}
