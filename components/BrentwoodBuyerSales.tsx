import CountySellerListings from '@/components/CountySellerListings'
import {
  brentwoodSellerListings,
  brentwoodSellerListingsSummary,
  recentBrentwoodSellerListings,
} from '@/lib/brentwood-seller-listings'

/**
 * Seller-side Brentwood closings on /buy/brentwood-tn.
 * Same catalog and section as the cash-offer proof. This page shows the
 * street, the city, the sold month, and days on market — no prices.
 */
export default function BrentwoodBuyerSales() {
  const rows = recentBrentwoodSellerListings()

  return (
    <CountySellerListings
      county="Williamson County"
      heading="Joshua's recent Brentwood sales"
      headingId="brentwood-buyer-sales"
      sellHref="/sell/brentwood-tn"
      cashOfferHref="/cash-offer/brentwood-tn"
      callCta="buy-brentwood-sales-call"
      showPrices={false}
      rows={rows}
      summary={brentwoodSellerListingsSummary()}
      total={brentwoodSellerListings.length}
    />
  )
}
