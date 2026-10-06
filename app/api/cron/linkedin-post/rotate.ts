// Weekly LinkedIn slot selection.
//
// The old rotator used `isoWeekNumber() % 2` (even → blog, odd → listing).
// Two successful `linkedin-post` runs in the same ISO week therefore composed
// the same latest-blog caption — the 2026-09-07 briefing: two posts titled
// "Buying a House in Middle Tennessee Before the End of the Year…". Failures
// and manual retries also drifted parity because the calendar week does not
// know what actually published.
//
// Next slot is derived from the last *successful* weekly post_log row
// (payload_kind blog|listing). That metadata is already written by logPost
// in this route — no new table.

export type WeeklyLinkedInSlot = 'blog' | 'listing'

export interface LastWeeklyLinkedIn {
  kind: string
  refKey: string
}

export function nextLinkedInWeeklySlot(
  last: LastWeeklyLinkedIn | null,
  weekNumber: number,
): WeeklyLinkedInSlot {
  if (last?.kind === 'blog') return 'listing'
  if (last?.kind === 'listing') return 'blog'
  // Empty DB / first run / last row was an on-demand kind on this job.
  // Seed from the historical even=blog / odd=listing rule so a missing
  // DATABASE_URL does not pin every fire to the same type.
  return weekNumber % 2 === 0 ? 'blog' : 'listing'
}

export function pickWeeklyLinkedIn<T extends { kind: string; refKey: string }>(opts: {
  last: LastWeeklyLinkedIn | null
  weekNumber: number
  buildBlog: (excludeSlug?: string) => T | null
  buildListing: () => T | null
}): T | null {
  const slot = nextLinkedInWeeklySlot(opts.last, opts.weekNumber)
  if (slot === 'listing') {
    const listing = opts.buildListing()
    if (listing) return listing
    // Listing was due but none is available. Never re-fire the same blog
    // slug that just succeeded — that is the duplicate-caption failure.
    const exclude = opts.last?.kind === 'blog' ? opts.last.refKey : undefined
    return opts.buildBlog(exclude)
  }
  return opts.buildBlog() ?? opts.buildListing()
}
