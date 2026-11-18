import CountySellerListings from '@/components/CountySellerListings'
import { cityClosingProof } from '@/lib/closings'
import {
  recentDavidsonSellerListings,
  davidsonSellerListings,
  davidsonSellerListingsSummary,
} from '@/lib/davidson-seller-listings'

/**
 * Davidson County traditional listings on the Nashville cash-offer page.
 * The count is these seller-side listings (67 since 2021). The sold-page
 * link opens the Nashville rows in the Tennessee closing file, which is a
 * separate export and is not given a second total on this page.
 */
export default function DavidsonSellerListings() {
  const rows = recentDavidsonSellerListings()
  const sold = cityClosingProof('Nashville')

  return (
    <CountySellerListings
      county="Davidson County"
      headingId="davidson-listings-proof"
      sellHref="/sell/nashville-tn"
      soldHref={sold.href}
      soldLabel={`See the Nashville rows on the sold page →`}
      callCta="cash-offer-nashville-listings-call"
      rows={rows}
      summary={davidsonSellerListingsSummary()}
      total={davidsonSellerListings.length}
    />
  )
}
