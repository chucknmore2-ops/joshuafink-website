import CountySellerListings from '@/components/CountySellerListings'
import { cityClosingProof } from '@/lib/closings'
import {
  recentBrentwoodSellerListings,
  brentwoodSellerListings,
  brentwoodSellerListingsSummary,
} from '@/lib/brentwood-seller-listings'

/** Brentwood traditional listings on the Brentwood cash-offer page. Williamson County. */
export default function BrentwoodSellerListings() {
  const rows = recentBrentwoodSellerListings()
  const sold = cityClosingProof('Brentwood')

  return (
    <CountySellerListings
      county="Williamson County"
      headingId="brentwood-listings-proof"
      sellHref="/sell/brentwood-tn"
      soldHref={sold.href}
      soldLabel={`See homes Josh has sold in ${sold.city} →`}
      callCta="cash-offer-brentwood-listings-call"
      rows={rows}
      summary={brentwoodSellerListingsSummary()}
      total={brentwoodSellerListings.length}
    />
  )
}
