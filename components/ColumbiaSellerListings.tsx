import CountySellerListings from '@/components/CountySellerListings'
import { cityClosingProof } from '@/lib/closings'
import {
  recentColumbiaSellerListings,
  columbiaSellerListings,
  columbiaSellerListingsSummary,
} from '@/lib/columbia-seller-listings'

/** Columbia traditional listings on the Columbia cash-offer page. Maury County. */
export default function ColumbiaSellerListings() {
  const rows = recentColumbiaSellerListings()
  const sold = cityClosingProof('Columbia')

  return (
    <CountySellerListings
      county="Maury County"
      headingId="columbia-listings-proof"
      sellHref="/sell/columbia-tn"
      soldHref={sold.href}
      soldLabel={`See homes Josh has sold in ${sold.city} →`}
      callCta="cash-offer-columbia-listings-call"
      rows={rows}
      summary={columbiaSellerListingsSummary()}
      total={columbiaSellerListings.length}
    />
  )
}
