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
    imageUrl: '/hero/1901-new-bristol.webp',
    alt: 'Coming-soon home — 1901 New Bristol, listed by Joshua Fink Group',
    status: 'Coming Soon',
    cityShort: 'Middle Tennessee',
    href: '/contact?subject=1901+New+Bristol+(Coming+Soon)',
  },
  {
    imageUrl: '/hero/9560-dresden.webp',
    alt: 'Featured Compass listing — 9560 Dresden Square, Brentwood TN',
    status: 'Featured',
    cityShort: 'Brentwood, TN',
    href: 'https://www.compass.com/homedetails/9560-Dresden-Square-Brentwood-TN-37027/T863Z_pid/',
  },
]
