import Link from 'next/link'
import CountySellerListings from '@/components/CountySellerListings'
import { cityClosingProof } from '@/lib/closings'
import {
  franklinBuyerSideNote,
  franklinSellerListings,
  franklinSellerListingsSummary,
  franklinWilliamsonSalesNote,
  recentFranklinSellerListings,
} from '@/lib/franklin-seller-listings'

/**
 * Franklin traditional listings on the Franklin cash-offer page.
 * Six closings since 2024, not the Brentwood or Spring Hill rows.
 */
export default function FranklinSellerListings() {
  const rows = recentFranklinSellerListings()
  const sold = cityClosingProof('Franklin')

  return (
    <CountySellerListings
      county="Franklin"
      headingId="franklin-listings-proof"
      sellHref="/sell/franklin-tn"
      soldHref={sold.href}
      soldLabel={`See homes Josh has sold in ${sold.city} →`}
      callCta="cash-offer-franklin-listings-call"
      rows={rows}
      summary={franklinSellerListingsSummary()}
      total={franklinSellerListings.length}
      note={
        <>
          <p>{franklinBuyerSideNote()}</p>
          <p className="mt-3">
            {franklinWilliamsonSalesNote()}{' '}
            <Link
              href="/cash-offer/brentwood-tn"
              className="font-semibold text-black underline underline-offset-4"
            >
              See the Brentwood sales
            </Link>
            {' and '}
            <Link
              href="/cash-offer/spring-hill-tn"
              className="font-semibold text-black underline underline-offset-4"
            >
              the Spring Hill sales
            </Link>
            .
          </p>
        </>
      }
    />
  )
}
