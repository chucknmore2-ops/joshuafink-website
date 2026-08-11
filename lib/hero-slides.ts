// Curated hero rotator deck — decoupled from active listings so we can
// feature only showcase-quality imagery (and include coming-soon properties)
// without tying the visual to an auto-synced address/price label that may
// misrepresent listing status.
//
// Photos are enhanced versions stored locally in public/hero/. Update this
// list manually when a featured property closes or a new one comes online.

export type HeroSlide = {
  imageUrl: string
  alt: string
  status: 'Featured' | 'Coming Soon' | 'Just Listed' | 'Recently Sold'
  cityShort: string
  href: string
}

export const heroSlides: HeroSlide[] = [
  {
    imageUrl: '/hero/9209-duncaster.webp',
    alt: 'Featured Compass listing — 9209 Duncaster Court, Brentwood TN',
    status: 'Featured',
    cityShort: 'Brentwood, TN',
    href: 'https://www.compass.com/homedetails/9209-Duncaster-Ct-Brentwood-TN-37027/TLPVE_pid/',
  },
  {
    // Sold 2026-08 at $1.8M. Kept in rotation at Joshua's request — the photo
    // is deck-quality — but relabelled: it is no longer coming soon, and the
    // old /contact?subject=…Coming+Soon link no longer describes anything.
    imageUrl: '/hero/1901-new-bristol.webp',
    alt: 'Recently sold by Joshua Fink Group — 1901 New Bristol Lane, Brentwood TN',
    status: 'Recently Sold',
    cityShort: 'Brentwood, TN',
    href: 'https://www.compass.com/homedetails/1901-New-Bristol-Ln-Brentwood-TN-37027/2131329778923073185_lid/',
  },
  {
    imageUrl: '/hero/9560-dresden.webp',
    alt: 'Featured Compass listing — 9560 Dresden Square, Brentwood TN',
    status: 'Featured',
    cityShort: 'Brentwood, TN',
    href: 'https://www.compass.com/homedetails/9560-Dresden-Square-Brentwood-TN-37027/T863Z_pid/',
  },
  // Luxury tier — Joshua's largest sales, so the wheel stays entirely $1M-plus.
  // (9293 Fordham Dr, $5.65M, is the biggest of all but Compass only ever
  // published an architect's rendering for it, not a photograph, so it is
  // deliberately not in the deck.)
  {
    imageUrl: '/hero/1523-tellcroft.webp',
    alt: 'Sold by Joshua Fink Group — 1523 TellCroft Drive, Brentwood TN',
    status: 'Featured',
    cityShort: 'Brentwood, TN',
    href: 'https://www.compass.com/homedetails/1523-TellCroft-Dr-Brentwood-TN-37027/1866928982066828025_lid/',
  },
  {
    imageUrl: '/hero/9242-lehigh.webp',
    alt: 'Sold by Joshua Fink Group — 9242 Lehigh Drive, Brentwood TN',
    status: 'Featured',
    cityShort: 'Brentwood, TN',
    href: 'https://www.compass.com/homedetails/9242-Lehigh-Dr-Brentwood-TN-37027/1271758271710874905_lid/',
  },
  {
    imageUrl: '/hero/9451-appleton.webp',
    alt: 'Sold by Joshua Fink Group — 9451 Appleton Court, Brentwood TN',
    status: 'Featured',
    cityShort: 'Brentwood, TN',
    href: 'https://www.compass.com/homedetails/9451-Appleton-Ct-Brentwood-TN-37027/1586230701225457937_lid/',
  },
]
