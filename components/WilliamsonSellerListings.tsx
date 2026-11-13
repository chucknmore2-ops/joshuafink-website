import CountySellerListings from '@/components/CountySellerListings'
import {
  recentWilliamsonSellerListings,
  williamsonSellerListings,
  williamsonSellerListingsSummary,
} from '@/lib/williamson-seller-listings'

/** Williamson County traditional listings on the Franklin cash-offer page. */
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
