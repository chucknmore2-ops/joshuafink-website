import CountySellerListings from '@/components/CountySellerListings'
import {
  recentRutherfordSellerListings,
  rutherfordSellerListings,
  rutherfordSellerListingsSummary,
} from '@/lib/rutherford-seller-listings'

/** Rutherford County traditional listings on the Murfreesboro cash-offer page. */
export default function RutherfordSellerListings() {
  const rows = recentRutherfordSellerListings()

  return (
    <CountySellerListings
      county="Rutherford County"
      headingId="rutherford-listings-proof"
      sellHref="/sell/murfreesboro-tn"
      callCta="cash-offer-murfreesboro-listings-call"
      rows={rows}
      summary={rutherfordSellerListingsSummary()}
      total={rutherfordSellerListings.length}
    />
  )
}
