// Cloudflare Turnstile check for /api/contact.
//
// Both keys have to be set or this is a no-op. A deploy that lands before
// the Vercel env vars exist must keep accepting leads. A siteverify network
// error, timeout, or Cloudflare-side failure also lets the lead through, so
// a Cloudflare outage cannot eat a real seller. A missing or rejected token
// is the only hard stop.
//
// Dummy keys (https://developers.cloudflare.com/turnstile/troubleshooting/testing/):
//   site 1x00000000000000000000AA  visible, always passes
//   site 2x00000000000000000000AB  visible, always fails
//   site 1x00000000000000000000BB  invisible, always passes
//   site 2x00000000000000000000BB  invisible, always fails
//   site 3x00000000000000000000FF  forces an interactive challenge
//   secret 1x0000000000000000000000000000000AA  always passes
//   secret 2x0000000000000000000000000000000AA  always fails
//   secret 3x0000000000000000000000000000000AA  token already spent
// Dummy secrets only accept the dummy token XXXX.DUMMY.TOKEN.XXXX.

export const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
export const TURNSTILE_FIELD = 'cf-turnstile-response'
export const TURNSTILE_DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'

export const TURNSTILE_TEST_SITEKEY_PASS = '1x00000000000000000000AA'
export const TURNSTILE_TEST_SITEKEY_FAIL = '2x00000000000000000000AB'
export const TURNSTILE_TEST_SITEKEY_INVISIBLE_PASS = '1x00000000000000000000BB'
export const TURNSTILE_TEST_SITEKEY_INVISIBLE_FAIL = '2x00000000000000000000BB'
export const TURNSTILE_TEST_SITEKEY_INTERACTIVE = '3x00000000000000000000FF'
export const TURNSTILE_TEST_SECRET_PASS = '1x0000000000000000000000000000000AA'
export const TURNSTILE_TEST_SECRET_FAIL = '2x0000000000000000000000000000000AA'
export const TURNSTILE_TEST_SECRET_SPENT = '3x0000000000000000000000000000000AA'

// Cloudflare's own problems, not the visitor's. Dropping the lead here would
// punish a real person for a bad secret or a Cloudflare 500.
const FAIL_OPEN_ERROR_CODES = new Set([
  'missing-input-secret',
  'invalid-input-secret',
  'bad-request',
  'internal-error',
])

const SITEVERIFY_TIMEOUT_MS = 4_000

export type TurnstileOutcome =
  | { ok: true; skipped: true }
  | { ok: true; skipped: false; failOpen: boolean }
  | { ok: false; reason: 'turnstile_failed' }

type TurnstileEnv = Record<string, string | undefined>

export function turnstileConfigured(env: TurnstileEnv = process.env): boolean {
  return turnstileKeys(env) !== null
}

function turnstileKeys(env: TurnstileEnv): { secret: string; siteKey: string } | null {
  const secret = (env.TURNSTILE_SECRET_KEY || '').trim()
  const siteKey = (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '').trim()
  if (!secret || !siteKey) return null
  return { secret, siteKey }
}

function failOpen(): TurnstileOutcome {
  return { ok: true, skipped: false, failOpen: true }
}

function errorCodes(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const codes = (body as { 'error-codes'?: unknown })['error-codes']
  if (!Array.isArray(codes)) return []
  return codes.filter((code): code is string => typeof code === 'string')
}

/**
 * Verify a Turnstile token. Never throws.
 *
 * Skips entirely when either env key is unset. A blank token while configured
 * is `turnstile_failed` and does not call siteverify. A siteverify timeout,
 * network error, non-2xx, or unreadable body fails open.
 */
export async function verifyTurnstile(options: {
  token: string | undefined
  remoteIp?: string
  env?: TurnstileEnv
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): Promise<TurnstileOutcome> {
  const env = options.env ?? process.env
  const keys = turnstileKeys(env)
  if (!keys) return { ok: true, skipped: true }

  const token = (options.token || '').trim()
  if (!token) return { ok: false, reason: 'turnstile_failed' }

  const timeoutMs = options.timeoutMs ?? SITEVERIFY_TIMEOUT_MS
  const fetchImpl = options.fetchImpl ?? fetch
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)

  const payload: Record<string, string> = {
    secret: keys.secret,
    response: token,
  }
  const remoteIp = (options.remoteIp || '').trim()
  if (remoteIp && remoteIp !== 'unknown') payload.remoteip = remoteIp

  try {
    const res = await fetchImpl(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    if (!res.ok) return failOpen()

    const body = await res.json().catch(() => null)
    if (!body || typeof body !== 'object') return failOpen()

    if ((body as { success?: unknown }).success === true) {
      return { ok: true, skipped: false, failOpen: false }
    }

    const codes = errorCodes(body)
    if (codes.length > 0 && codes.every((code) => FAIL_OPEN_ERROR_CODES.has(code))) {
      return failOpen()
    }
    return { ok: false, reason: 'turnstile_failed' }
  } catch {
    return failOpen()
  } finally {
    clearTimeout(timer)
  }
}
