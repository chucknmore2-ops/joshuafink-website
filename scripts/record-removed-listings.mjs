/**
 * After fetch-images rewrites lib/listings.ts, record every home that left
 * active inventory so its old /listings/<slug> URL 308s instead of 404ing.
 *
 * Compares the file just written with HEAD. Does not commit. The daily
 * workflow stages lib/removed-listing-redirects.json with the listing files.
 * A listing that is active again is dropped from the map so the live page wins.
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  closingKeysFromRepo,
  listingsArrayFromSource,
  readRemovedListings,
  suburbSlugsFromRepo,
  updateRemovedListingMap,
  writeRemovedListings,
} from '../lib/removed-listing-redirects.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LISTINGS = 'lib/listings.ts'

function gitShow(spec) {
  try {
    return execSync(`git show ${spec}`, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch {
    return null
  }
}

export function recordRemovedListings() {
  const priorText = gitShow(`HEAD:${LISTINGS}`)
  if (priorText == null) {
    throw new Error(`Could not read HEAD:${LISTINGS}. Refusing to guess which listings were removed.`)
  }
  const currentPath = path.join(root, LISTINGS)
  const currentText = fs.readFileSync(currentPath, 'utf8')
  const prior = listingsArrayFromSource(priorText, 'listings')
  const current = listingsArrayFromSource(currentText, 'listings')
  const removed = readRemovedListings()
  const next = updateRemovedListingMap({
    prior,
    current,
    removed,
    closingKeys: closingKeysFromRepo(root),
    suburbSlugs: suburbSlugsFromRepo(root),
  })

  const beforeSlugs = new Set(removed.map((entry) => entry.slug))
  const afterSlugs = new Set(next.map((entry) => entry.slug))
  for (const entry of next) {
    if (!beforeSlugs.has(entry.slug)) {
      console.log(`[record-removed-listings] ${entry.slug} → ${entry.destination}`)
    }
  }
  for (const entry of removed) {
    if (entry && entry.slug && !afterSlugs.has(entry.slug)) {
      console.log(`[record-removed-listings] ${entry.slug} is back in inventory — redirect removed`)
    }
  }

  const nextText = JSON.stringify(next)
  const prevText = JSON.stringify(
    removed.map((entry) => ({
      slug: entry.slug,
      address: entry.address,
      city: entry.city,
      destination: entry.destination,
    })),
  )
  if (nextText === prevText) {
    console.log('[record-removed-listings] No removed-listing redirect changes.')
    return next
  }
  writeRemovedListings(next)
  console.log(`[record-removed-listings] Wrote ${next.length} redirect(s).`)
  return next
}

const isDirect = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirect) {
  recordRemovedListings()
}
