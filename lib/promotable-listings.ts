// Which listings may be promoted on social, and which one to feature this run.
//
// Both the LinkedIn and Instagram crons used to do this inline and identically:
//
//   listings.find((x) => x.imageUrl && x.price && x.compassUrl)
//
// That has two defects, and because the line was duplicated, fixing one route
// would have left the other wrong:
//
//   1. NO STATUS FILTER. `Listing.status` is real data and currently carries
//      "Active Under Contract" on the FIRST entry of the array — so `.find()`
//      selected an unavailable home and both captions announced it as
//      "just listed". That is a false public claim on a licensed broker's
//      feed, published on a recurring schedule.
//   2. NO ROTATION. `.find()` returns the array head every time, so the same
//      property was recycled indefinitely while every other listing was never
//      featured at all.
//
// Keeping the rule in one module means both channels stay honest together.

import { listings, type Listing } from './listings.ts'

// Allow-list, not a deny-list, and matched exactly. Compass status strings
// drift ("Active Under Contract", "Pending", "Coming Soon"), and the failure
// modes are asymmetric: wrongly withholding a post costs nothing, wrongly
// advertising an unavailable home misleads buyers. So anything we do not
// positively recognise as available is excluded.
const PROMOTABLE_STATUSES = new Set(['active'])

/** Is this listing both complete enough to post and genuinely available? */
export function isPromotable(l: Listing): boolean {
  return Boolean(
    l.imageUrl &&
      l.price &&
      l.compassUrl &&
      PROMOTABLE_STATUSES.has(l.status.trim().toLowerCase()),
  )
}

/** Every listing safe to feature, in file order. */
export function promotableListings(source: readonly Listing[] = listings): Listing[] {
  return source.filter(isPromotable)
}

/**
 * Pick this run's listing by rotating deterministically on the calendar day.
 *
 * Deliberately stateless — no DB read, no "last posted" bookkeeping to drift
 * or fail. The day number advances every run, so consecutive posts feature
 * different homes and the pool is covered evenly.
 *
 * `channelOffset` keeps LinkedIn and Instagram off the same home when their
 * schedules happen to collide (they normally run Thu and Wed respectively).
 */
export function pickPromotable(
  channelOffset = 0,
  now: Date = new Date(),
  source: readonly Listing[] = listings,
): Listing | null {
  const pool = promotableListings(source)
  if (pool.length === 0) return null
  const epochDay = Math.floor(now.getTime() / 86_400_000)
  // `% pool.length` twice + length guards against a negative index for any
  // pre-1970 date a test might pass in.
  const idx = (((epochDay + channelOffset) % pool.length) + pool.length) % pool.length
  return pool[idx]
}

/**
 * Same rotation, for channels that post once a week (Instagram Wed, LinkedIn Thu).
 *
 * The daily rotator is wrong for them. A weekly job's day number advances by 7
 * between runs, so when the pool length divides 7 — and today there are exactly
 * 7 promotable homes — `(epochDay + offset) % 7` is identical every week and the
 * channel features the same house forever (which is how one Compass image kept
 * Instagram stuck in September).
 *
 * Rotating on the week instead advances exactly one home per run. Weeks start
 * Monday: epoch day 0 was a Thursday, so a naive `epochDay / 7` would split Wed
 * and Thu into different weeks and hand Instagram's Wednesday home straight to
 * LinkedIn the next day. Offset by 3 so the pair share a week and the channel
 * offset keeps them on different homes.
 */
export function pickWeeklyPromotable(
  channelOffset = 0,
  now: Date = new Date(),
  source: readonly Listing[] = listings,
): Listing | null {
  const pool = promotableListings(source)
  if (pool.length === 0) return null
  const epochDay = Math.floor(now.getTime() / 86_400_000)
  const week = Math.floor((epochDay + 3) / 7)
  const idx = (((week + channelOffset) % pool.length) + pool.length) % pool.length
  return pool[idx]
}

/**
 * The next home after `current`, wrapping at the end of the pool.
 *
 * Instagram uses this when Meta leaves a container IN_PROGRESS: one particular
 * photo can stall indefinitely (2026-09-16 burned every retry on the same
 * asset), and the next listing's photo is a fresh chance at the same slot.
 * Returns null when the pool has nothing else to offer.
 */
export function nextPromotable(
  current: Listing,
  source: readonly Listing[] = listings,
): Listing | null {
  const pool = promotableListings(source)
  if (pool.length < 2) return null
  const i = pool.findIndex(
    (l) => l.address === current.address && l.compassUrl === current.compassUrl,
  )
  if (i < 0) return pool[0] ?? null
  return pool[(i + 1) % pool.length] ?? null
}

function listingKey(l: Listing): string {
  return `${l.address}\n${l.compassUrl}`
}

/**
 * The next `count` promotable homes after `current`, wrapping, never repeating.
 *
 * Instagram tries more than one alternate when Meta stalls a container: one
 * extra home was not enough on 2026-09-17 (both Compass JPEGs stayed
 * IN_PROGRESS). Two alternates (three homes total) still fit inside the
 * 300s route budget with an 80s poll each.
 */
export function fallbackPromotables(
  current: Listing,
  count = 2,
  source: readonly Listing[] = listings,
): Listing[] {
  const out: Listing[] = []
  let cursor = current
  const seen = new Set([listingKey(current)])
  while (out.length < count) {
    const next = nextPromotable(cursor, source)
    if (!next || seen.has(listingKey(next))) break
    seen.add(listingKey(next))
    out.push(next)
    cursor = next
  }
  return out
}
