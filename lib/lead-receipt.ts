// Visitor-facing lead responses are always { ok: true, ref } for both an
// accepted lead and a quarantine. `ref` is 43 url-safe characters either way.
//
// The server mints HMAC-SHA256(pepper, nonce) only after the lead is accepted
// into a Joshua channel (sheet, email, Pushover, or the sheet queue). A
// quarantine gets a random ref of the same shape. The browser fires GA4 and
// Google Ads only when the ref matches the nonce it just sent.
//
// This pepper ships in the client bundle, and the repo is public, so it is
// not a secret. It is here so a bot cannot force a conversion by posting a
// flag, and so HTTP 200 alone is not a conversion. Forging a matching ref
// still requires this server to accept the lead. A client-supplied `ref` is
// ignored.

export const SUBMIT_NONCE_FIELD = '_submit_nonce'
export const LEAD_RECEIPT_FIELD = 'ref'

const NONCE_RE = /^[A-Za-z0-9_-]{16,64}$/
const RECEIPT_PEPPER = 'k7Qf3mN9pL2xR8vB4wH6cY1sT5uJ0aD.eG.lead-receipt.v1'

export function usableSubmitNonce(nonce: string): boolean {
  return NONCE_RE.test(nonce)
}

export function newSubmitNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return encodeBase64Url(bytes)
}

export async function acceptReceipt(nonce: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(RECEIPT_PEPPER),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`v1\n${nonce}`),
  )
  return encodeBase64Url(new Uint8Array(sig))
}

export function decoyReceipt(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return encodeBase64Url(bytes)
}

/** Matching receipt when the lead was accepted and the nonce is well-formed. */
export async function receiptForLead(nonce: string, accepted: boolean): Promise<string> {
  try {
    if (accepted && usableSubmitNonce(nonce)) return await acceptReceipt(nonce)
  } catch {
    // A Web Crypto failure must not turn a real lead into an error page.
    // No receipt means the browser will not count a conversion.
  }
  return decoyReceipt()
}

export async function leadReceiptMatches(nonce: string, body: unknown): Promise<boolean> {
  if (!usableSubmitNonce(nonce)) return false
  if (!body || typeof body !== 'object') return false
  const ref = (body as Record<string, unknown>)[LEAD_RECEIPT_FIELD]
  if (typeof ref !== 'string' || ref.length === 0) return false
  let expected = ''
  try {
    expected = await acceptReceipt(nonce)
  } catch {
    return false
  }
  return sameString(expected, ref)
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
