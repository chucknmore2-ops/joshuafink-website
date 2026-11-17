import Link from 'next/link'
import CountySellerListings from '@/components/CountySellerListings'
import { cityClosingProof } from '@/lib/closings'
import {
  recentSmyrnaSellerListings,
  smyrnaRutherfordSalesNote,
  smyrnaSellerListings,
  smyrnaSellerListingsSummary,
} from '@/lib/smyrna-seller-listings'

/**
 * Smyrna and La Vergne traditional listings on the Smyrna cash-offer page.
 * Seven closings, not the Murfreesboro rows. The note points at the
 * Rutherford County record instead of restating it here.
 */
export default function SmyrnaSellerListings() {
  const rows = recentSmyrnaSellerListings()
  const sold = cityClosingProof('Smyrna')

  return (
    <CountySellerListings
      county="Smyrna and La Vergne"
      headingId="smyrna-listings-proof"
      sellHref="/sell/smyrna-tn"
      soldHref={sold.href}
      soldLabel={`See homes Josh has sold in ${sold.city} →`}
      callCta="cash-offer-smyrna-listings-call"
      rows={rows}
      summary={smyrnaSellerListingsSummary()}
      total={smyrnaSellerListings.length}
      note={
        <p>
          {smyrnaRutherfordSalesNote()}{' '}
          <Link
            href="/cash-offer/murfreesboro-tn"
            className="font-semibold text-black underline underline-offset-4"
          >
            See the Rutherford County sales
          </Link>
          .
        </p>
      }
    />
  )
}
