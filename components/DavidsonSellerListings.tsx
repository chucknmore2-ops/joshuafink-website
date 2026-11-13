import CountySellerListings from '@/components/CountySellerListings'
import {
  recentDavidsonSellerListings,
  davidsonSellerListings,
  davidsonSellerListingsSummary,
} from '@/lib/davidson-seller-listings'

/** Davidson County traditional listings on the Nashville cash-offer page. */
export default function DavidsonSellerListings() {
  const rows = recentDavidsonSellerListings()

  return (
    <CountySellerListings
      county="Davidson County"
      headingId="davidson-listings-proof"
      sellHref="/sell/nashville-tn"
      callCta="cash-offer-nashville-listings-call"
      rows={rows}
      summary={davidsonSellerListingsSummary()}
      total={davidsonSellerListings.length}
    />
  )
}
