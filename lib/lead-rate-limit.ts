// Per-IP and per-email counters for /api/contact.
//
// In-memory on purpose. This site runs on Vercel Hobby: there is no Redis or
// KV store in the repo, and adding one would be a new service. A serverless
// instance has its own map and recycles, so this is a speed bump against a
// single source hammering one instance, the same shape as the older 12-per-
// minute flood cap. The phone and "test" rules in classify-lead.ts do not
// depend on this map; they are what stops a bot that rotates IPs and emails.
//
// The map lives here, not in the route, so the window math can be unit-tested
// without exporting helpers from app/api/contact/route.ts (Next only allows
// HTTP handlers and config to be exported from a route file).

const FLOOD_MAX_PER_WINDOW = 12
const FLOOD_WINDOW_MS = 60_000

/** Hits older than this are dropped. classifyLead quarantines at more than 3. */
export const RATE_WINDOW_MS = 10 * 60_000

const hitsByKey = new Map<string, number[]>()

function prune(now: number): void {
  // forEach rather than for-of: this tsconfig has no downlevelIteration, so
  // iterating a Map directly fails typecheck.
  const stale: string[] = []
  hitsByKey.forEach((times, key) => {
    const live = times.filter((t) => now - t < RATE_WINDOW_MS)
    if (live.length === 0) stale.push(key)
    else hitsByKey.set(key, live)
  })
  stale.forEach((key) => hitsByKey.delete(key))
}

function record(key: string, now: number): number[] {
  prune(now)
  const hits = hitsByKey.get(key) ?? []
  hits.push(now)
  hitsByKey.set(key, hits)
  return hits
}

/**
 * Records one hit from this IP. `flooded` is the hard cap (more than 12 in
 * 60 seconds) and the route answers that with a visible 429. `recent` is how
 * many hits this IP has in the last 10 minutes, including this one.
 */
export function recordIpSubmission(
  ip: string,
  now: number = Date.now(),
): { flooded: boolean; recent: number } {
  const hits = record(`ip:${ip}`, now)
  const inFloodWindow = hits.filter((t) => now - t < FLOOD_WINDOW_MS).length
  return { flooded: inFloodWindow > FLOOD_MAX_PER_WINDOW, recent: hits.length }
}

/**
 * Records one hit for this email over the same 10-minute window. Blank or
 * non-address values are ignored so every phone-only lead does not share a
 * bucket. Comparison is trimmed and lower-cased; nothing else is folded
 * (Gmail dots and plus-tags stay distinct, so two real people are not merged).
 * Returns how many hits this address has in the window, including this one,
 * or 0 when the value was not recorded.
 */
export function recordEmailSubmission(email: string, now: number = Date.now()): number {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized.includes('@')) return 0
  return record(`email:${normalized}`, now).length
}
