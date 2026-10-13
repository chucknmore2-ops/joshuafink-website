/**
 * After a Compass sync, Pushover Josh when a previously active listing is
 * now sold. The body is a ready-to-text review ask. This script never texts
 * or emails the client, and it never creates a public Just Sold post.
 *
 * Previous rows come from git HEAD (the files on disk are already the new
 * sync). Missing Pushover secrets or a failed alert log a warning and exit 0
 * so the listing commit still happens.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  newlySoldFlips,
  SOLD_FLIP_PUSHOVER_TITLE,
  soldFlipPushoverMessage,
  type SoldFlipListing,
} from '../lib/sold-flip.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

type ListingsFile = {
  loadExistingListingsMap: (filePath: string, exportName?: string) => Map<string, SoldFlipListing>
}

async function loadMap(filePath: string, exportName: string): Promise<SoldFlipListing[]> {
  const mod = (await import(pathToFileURL(join(repoRoot, 'scripts/listings-file.mjs')).href)) as ListingsFile
  return Array.from(mod.loadExistingListingsMap(filePath, exportName).values())
}

function gitShow(spec: string): string | null {
  try {
    return execFileSync('git', ['show', spec], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null
  }
}

async function rowsFromGit(spec: string, exportName: string): Promise<SoldFlipListing[] | null> {
  const src = gitShow(spec)
  if (src == null) return null
  const dir = mkdtempSync(join(tmpdir(), 'sold-flip-'))
  const file = join(dir, `${exportName}.ts`)
  writeFileSync(file, src)
  return loadMap(file, exportName)
}

async function sendPushover(message: string): Promise<void> {
  const token = process.env.PUSHOVER_TOKEN?.trim() ?? ''
  const user = process.env.PUSHOVER_USER?.trim() ?? ''
  if (!token || !user) {
    console.warn('[notify-sold-flips] PUSHOVER_TOKEN or PUSHOVER_USER is not set. Phone alert skipped.')
    return
  }
  try {
    const res = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      body: new URLSearchParams({
        token,
        user,
        title: SOLD_FLIP_PUSHOVER_TITLE,
        message: message.slice(0, 1024),
        priority: '0',
      }),
    })
    if (!res.ok) {
      console.warn(`[notify-sold-flips] Pushover failed with HTTP ${res.status}`)
    }
  } catch (err) {
    console.warn(`[notify-sold-flips] Pushover failed: ${(err as Error).message}`)
  }
}

async function main(): Promise<void> {
  const previousActive = await rowsFromGit('HEAD:lib/listings.ts', 'listings')
  const previousSold = await rowsFromGit('HEAD:lib/sold-listings.ts', 'soldListings')
  if (!previousActive || !previousSold) {
    console.warn('[notify-sold-flips] Could not read the previous listing files from git. Alert skipped.')
    return
  }
  const nextActive = await loadMap(join(repoRoot, 'lib/listings.ts'), 'listings')
  const nextSold = await loadMap(join(repoRoot, 'lib/sold-listings.ts'), 'soldListings')
  const flips = newlySoldFlips(previousActive, nextActive, previousSold, nextSold)
  if (flips.length === 0) {
    console.log('[notify-sold-flips] No listings flipped to Sold.')
    return
  }
  console.log(`[notify-sold-flips] ${flips.length} listing(s) flipped to Sold. Nothing was sent to a client.`)
  for (const flip of flips) {
    await sendPushover(soldFlipPushoverMessage(flip))
  }
}

main().catch((err) => {
  console.warn(`[notify-sold-flips] ${(err as Error).message}`)
  process.exitCode = 0
})
