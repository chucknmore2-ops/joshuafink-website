import { timingSafeEqual } from 'node:crypto'

// Shared by /api/linkedin/auth (sets the nonce) and /api/linkedin/callback
// (checks it). Lives outside the route files because Next.js only allows
// handler/config exports from a route module.

export const LINKEDIN_STATE_COOKIE = 'li_oauth_state'
export const LINKEDIN_STATE_COOKIE_PATH = '/api/linkedin'
// Only has to survive the LinkedIn consent screen.
export const LINKEDIN_STATE_MAX_AGE_S = 600

/** Constant-time compare of the cookie nonce against the `state` LinkedIn echoed back. */
export function statesMatch(expected: string | undefined, received: string | null): boolean {
  if (!expected || !received) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && timingSafeEqual(a, b)
}
