// Shared SSL decision for pg Pools. Railway's public proxy (*.proxy.rlwy.net)
// needs TLS but its hostname does not contain "railway", so match by host:
// any non-local host gets TLS without CA verification (Railway uses a
// self-signed cert). localhost / 127.0.0.1 / ::1 stay plaintext for dev.
export function pgSsl(url: string): { rejectUnauthorized: false } | undefined {
  let host = ''
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return url.includes('railway') || url.includes('rlwy.net') ? { rejectUnauthorized: false } : undefined
  }
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') return undefined
  if (/sslmode=disable/i.test(url)) return undefined
  return { rejectUnauthorized: false }
}
