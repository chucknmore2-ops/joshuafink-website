import CountySellerListings from '@/components/CountySellerListings'
import {
  franklinSellerListings,
  franklinSellerListingsSummary,
  recentFranklinSellerListings,
} from '@/lib/franklin-seller-listings'

/**
 * Seller-side Franklin closings on /buy/franklin-tn.
 * Same catalog and section as the cash-offer proof. This page shows the
 * street, the city, the sold month, and days on market — no prices.
 */
export default function FranklinBuyerSales() {
  const rows = recentFranklinSellerListings()

  return (
    <CountySellerListings
      county="Franklin"
      heading="Joshua's recent Franklin sales"
      headingId="franklin-buyer-sales"
      sellHref="/sell/franklin-tn"
      cashOfferHref="/cash-offer/franklin-tn"
      callCta="buy-franklin-sales-call"
      showPrices={false}
      rows={rows}
      summary={franklinSellerListingsSummary()}
      total={franklinSellerListings.length}
    />
  )
}
