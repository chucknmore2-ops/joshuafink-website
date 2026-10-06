/**
 * Status-specific next step on a listing page.
 *
 * Active (and open house) → schedule a showing.
 * Coming Soon → get notified when it is live.
 * Under contract / pending → similar homes and listing alerts.
 * Sold stays a seller-style follow-up. The raw MLS label
 * "Active Under Contract" is shown as "Under Contract".
 */

export type ListingCtaKind = 'showing' | 'coming-soon' | 'under-contract' | 'sold'

export function listingCtaKind(status: string): ListingCtaKind {
  const s = (status || '').toLowerCase()
  if (s.includes('sold') || s.includes('closed')) return 'sold'
  if (s.includes('coming soon')) return 'coming-soon'
  if (s.includes('under contract') || s.includes('pending') || s.includes('contingent')) {
    return 'under-contract'
  }
  return 'showing'
}

export function listingStatusLabel(status: string): string {
  if (/active under contract/i.test(status)) return 'Under Contract'
  return status
}

export function listingStatusBadgeClass(status: string): string {
  const kind = listingCtaKind(status)
  if (kind === 'sold') return 'bg-red-600 text-white'
  if (kind === 'under-contract') return 'bg-amber-600 text-white'
  if (kind === 'showing' || kind === 'coming-soon' || /^open/i.test(status)) {
    return 'bg-black text-white'
  }
  return 'bg-neutral-100 text-neutral-600'
}
