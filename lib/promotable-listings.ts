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
