import {
  currentSnapshot,
  marketUpdateSlug,
  monthLabel,
  snapshotStatLines,
} from '@/lib/market-snapshot'
import { withUtm } from '@/lib/utm'

const SITE = 'https://www.joshuafink.com'

export interface MonthlyFacebookPost {
  month: string
  message: string
  link: string
}

/**
 * The Facebook copy for the current snapshot. Null when the newest month is
 * too old to publish. The Railway autoposter posts this text; it does not
 * compose its own.
 */
export function buildMonthlyFacebookPost(now: Date = new Date()): MonthlyFacebookPost | null {
  const s = currentSnapshot(now)
  if (!s) return null
  const label = monthLabel(s.month)
  const link = withUtm(`${SITE}/blog/${marketUpdateSlug(s.month)}`, {
    source: 'facebook',
    medium: 'auto',
    campaign: 'monthly-market-update',
    content: s.month,
  })
  const message =
    `📊 Middle Tennessee real estate market update — ${label}\n\n` +
    snapshotStatLines(s).map((line) => `• ${line}`).join('\n') +
    `\n\nSource: ${s.source}, ${label} nine-county report.\n\n` +
    `${s.takeaways[0] ?? ''}\n\n`.trimStart() +
    `Metro-wide medians are useful for direction, not for decisions — your street ` +
    `is what matters. Call or text Joshua Fink at 615-551-2727 for an honest read ` +
    `on your specific home, or read the full ${label} breakdown below.\n\n` +
    `#NashvilleRealEstate #MiddleTennessee #JoshuaFinkGroup #Compass`
  return { month: s.month, message, link }
}
