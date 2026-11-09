// Client-side Turnstile token lifetime. Cloudflare tokens last 300 seconds.
// Refresh a bit before that, and wait longer on a phone before treating a
// missing token as absent. The widget in components/TurnstileWidget.tsx is
// the only caller.

export const TURNSTILE_TOKEN_TTL_MS = 300_000
export const TURNSTILE_REFRESH_AFTER_MS = 240_000
export const TURNSTILE_WAIT_MS = 4_000
export const TURNSTILE_WAIT_MOBILE_MS = 8_000

export function isSlowTurnstileClient(hints: {
  coarsePointer: boolean
  narrowViewport: boolean
  userAgent: string
}): boolean {
  if (hints.coarsePointer || hints.narrowViewport) return true
  return /Android|iPhone|iPad|iPod|Mobile/i.test(hints.userAgent || '')
}

export function turnstileWaitMs(slow: boolean): number {
  return slow ? TURNSTILE_WAIT_MOBILE_MS : TURNSTILE_WAIT_MS
}

/**
 * True when the submit should reset the widget and wait for a new token.
 * A blank token, an explicit expiry, an unknown issue time, or a token older
 * than TURNSTILE_REFRESH_AFTER_MS all count. A timestamped fresh token does not.
 */
export function turnstileTokenStale(input: {
  token: string
  issuedAt: number | null
  now: number
  expired: boolean
}): boolean {
  if (!input.token.trim()) return true
  if (input.expired) return true
  if (input.issuedAt == null) return true
  return input.now - input.issuedAt >= TURNSTILE_REFRESH_AFTER_MS
}

/**
 * Return the current token, or reset and poll until a fresh one appears.
 * `stale` is consulted after each wait so a token left over from before
 * `refresh` is not treated as the new one.
 */
export async function waitForTurnstileToken(options: {
  readToken: () => string
  stale: (token: string) => boolean
  refresh: () => void
  shouldRefresh: boolean
  waitMs: number
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}): Promise<string> {
  const now = options.now ?? Date.now
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))

  if (!options.shouldRefresh) {
    const ready = options.readToken()
    if (ready && !options.stale(ready)) return ready
  }

  options.refresh()
  const start = now()
  for (;;) {
    const token = options.readToken()
    if (token && !options.stale(token)) return token
    if (now() - start >= options.waitMs) return ''
    await sleep(50)
  }
}
