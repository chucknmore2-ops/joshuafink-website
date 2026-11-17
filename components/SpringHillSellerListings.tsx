import Link from 'next/link'
import CountySellerListings from '@/components/CountySellerListings'
import { cityClosingProof } from '@/lib/closings'
import {
  recentSpringHillSellerListings,
  springHillSellerListings,
  springHillSellerListingsSummary,
  springHillNearbyColumbiaNote,
} from '@/lib/spring-hill-seller-listings'

/**
 * Spring Hill traditional listings on the Spring Hill cash-offer page.
 * Four closings, not the Williamson County list. The note points at the
 * Columbia record instead of restating it here.
 */
export default function SpringHillSellerListings() {
  const rows = recentSpringHillSellerListings()
  const sold = cityClosingProof('Spring Hill')

  return (
    <CountySellerListings
      county="Spring Hill"
      headingId="spring-hill-listings-proof"
      sellHref="/sell/spring-hill-tn"
      soldHref={sold.href}
      soldLabel={`See homes Josh has sold in ${sold.city} →`}
      callCta="cash-offer-spring-hill-listings-call"
      rows={rows}
      summary={springHillSellerListingsSummary()}
      total={springHillSellerListings.length}
      note={
        <p>
          {springHillNearbyColumbiaNote()}{' '}
          <Link
            href="/cash-offer/columbia-tn"
            className="font-semibold text-black underline underline-offset-4"
          >
            See the Columbia cash offer
          </Link>
          .
        </p>
      }
    />
  )
}
