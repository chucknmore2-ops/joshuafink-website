import CountySellerListings from '@/components/CountySellerListings'
import {
  recentWilliamsonSellerListings,
  williamsonSellerListings,
  williamsonSellerListingsSummary,
} from '@/lib/williamson-seller-listings'

/**
 * County-wide Williamson list. The Franklin, Brentwood, and Spring Hill
 * cash-offer pages each mount their own city section instead of this one.
 */
export default function WilliamsonSellerListings() {
  const rows = recentWilliamsonSellerListings()

  return (
    <CountySellerListings
      county="Williamson County"
      headingId="williamson-listings-proof"
      sellHref="/sell/franklin-tn"
      callCta="cash-offer-franklin-listings-call"
      rows={rows}
      summary={williamsonSellerListingsSummary()}
      total={williamsonSellerListings.length}
    />
  )
}
