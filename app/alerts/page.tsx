import type { Metadata } from 'next'
import ListingAlertsSignup from '@/components/ListingAlertsSignup'
import TrackedTelLink from '@/components/TrackedTelLink'

export const metadata: Metadata = {
  title: 'New listing alerts',
  description:
    'Get an email from Joshua Fink at Compass when a Middle Tennessee listing is new or the price drops. The opt-in box starts unchecked.',
  alternates: { canonical: 'https://www.joshuafink.com/alerts' },
}

export default function AlertsPage() {
  return (
    <div className="bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">Compass</p>
        <h1 className="text-4xl font-black tracking-tight text-black">New listing alerts</h1>
        <p className="mt-4 text-[#444] leading-relaxed">
          Joshua Fink, affiliate broker at Compass, can email you when he lists a home or drops a price.
          City and price are optional. You are added only if you check the box.
        </p>
        <div className="mt-8 border border-[#E8E8E8] rounded-2xl p-6 sm:p-8">
          <ListingAlertsSignup
            source="alerts"
            heading="Email me about new listings"
            intro="Leave the city blank to hear about every new Compass listing Joshua has. Otherwise, say which city and price range you want."
          />
        </div>
        <p className="mt-8 text-sm text-[#666] leading-relaxed">
          Joshua Fink, Affiliate Broker, Compass<br />
          8119 Isabella Lane, Suite 105<br />
          Brentwood, TN 37027<br />
          <TrackedTelLink href="tel:6155512727" className="underline" data-cta="alerts-page-call">
            615-551-2727
          </TrackedTelLink>
          <br />
          TREC #351484
        </p>
      </div>
    </div>
  )
}
