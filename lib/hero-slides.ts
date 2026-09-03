// Curated hero rotator deck — decoupled from active listings so we can
// feature only showcase-quality imagery (and include coming-soon properties)
// without tying the visual to an auto-synced address/price label that may
// misrepresent listing status.
//
// Photos are enhanced versions stored locally in public/hero/. Update this
// list manually when a featured property closes or a new one comes online.
//
// CTAs are resolved via resolveListingDetailSlug: an on-site /listings/{slug}
// page (active or sold) wins; otherwise the slide stays first-party (/listings)
// instead of leaking to compass.com. Sold addresses are never labelled Featured.

import { listingSlug, resolveListingDetailSlug } from './listing-detail'
import { soldListings } from './sold-listings'

export type HeroSlideStatus = 'Featured' | 'Coming Soon' | 'Just Listed' | 'Recently Sold'

export type HeroSlide = {
  imageUrl: string
  alt: string
  status: HeroSlideStatus
  cityShort: string
  href: string
  address: string
  city: string
}

type HeroSlideSource = Omit<HeroSlide, 'href' | 'status'> & {
  status: HeroSlideStatus
}

const soldListingSlugs: ReadonlySet<string> = new Set(
  soldListings.map((l) => listingSlug(l)),
)

/** First-party CTA: on-site detail page when it exists, else the listings hub. */
export function resolveHeroHref(
  slide: Pick<HeroSlideSource, 'address' | 'city'> & Partial<Pick<HeroSlideSource, 'status'>>,
): string {
  const slug = resolveListingDetailSlug(slide)
  return slug ? `/listings/${slug}` : '/listings'
}

/** Sold homes (present in sold-listings) are never labelled Featured. */
export function resolveHeroStatus(
  slide: Pick<HeroSlideSource, 'address' | 'city' | 'status'>,
): HeroSlideStatus {
  if (soldListingSlugs.has(listingSlug(slide))) {
    return 'Recently Sold'
  }
  return slide.status
}

export function resolveHeroSlide(source: HeroSlideSource): HeroSlide {
  return {
    ...source,
    status: resolveHeroStatus(source),
    href: resolveHeroHref(source),
  }
}

const heroSlideSources: HeroSlideSource[] = [
  {
    imageUrl: '/hero/9209-duncaster.webp',
    alt: 'Recently sold by Joshua Fink Group — 9209 Duncaster Court, Brentwood TN',
    status: 'Recently Sold',
    cityShort: 'Brentwood, TN',
    address: '9209 Duncaster Ct',
    city: 'Brentwood, TN 37027',
  },
  {
    // Sold 2026-08 at $1.8M. Kept in rotation at Joshua's request — the photo
    // is deck-quality — but relabelled: it is no longer coming soon, and the
    // old /contact?subject=…Coming+Soon link no longer describes anything.
    imageUrl: '/hero/1901-new-bristol.webp',
    alt: 'Recently sold by Joshua Fink Group — 1901 New Bristol Lane, Brentwood TN',
    status: 'Recently Sold',
    cityShort: 'Brentwood, TN',
    address: '1901 New Bristol Ln',
    city: 'Brentwood, TN 37027',
  },
  {
    imageUrl: '/hero/9560-dresden.webp',
    alt: 'Recently sold by Joshua Fink Group — 9560 Dresden Square, Brentwood TN',
    status: 'Recently Sold',
    cityShort: 'Brentwood, TN',
    address: '9560 Dresden Square',
    city: 'Brentwood, TN 37027',
  },
  // Luxury tier — Joshua's largest sales, so the wheel stays entirely $1M-plus.
  // (9293 Fordham Dr, $5.65M, is the biggest of all but Compass only ever
  // published an architect's rendering for it, not a photograph, so it is
  // deliberately not in the deck.)
  {
    imageUrl: '/hero/1523-tellcroft.webp',
    alt: 'Sold by Joshua Fink Group — 1523 TellCroft Drive, Brentwood TN',
    status: 'Recently Sold',
    cityShort: 'Brentwood, TN',
    address: '1523 TellCroft Dr',
    city: 'Brentwood, TN 37027',
  },
  {
    imageUrl: '/hero/9242-lehigh.webp',
    alt: 'Sold by Joshua Fink Group — 9242 Lehigh Drive, Brentwood TN',
    status: 'Recently Sold',
    cityShort: 'Brentwood, TN',
    address: '9242 Lehigh Dr',
    city: 'Brentwood, TN 37027',
  },
  {
    imageUrl: '/hero/9451-appleton.webp',
    alt: 'Sold by Joshua Fink Group — 9451 Appleton Court, Brentwood TN',
    status: 'Recently Sold',
    cityShort: 'Brentwood, TN',
    address: '9451 Appleton Ct',
    city: 'Brentwood, TN 37027',
  },
]

export const heroSlides: HeroSlide[] = heroSlideSources.map(resolveHeroSlide)
