import SuburbLeadForm from '@/components/SuburbLeadForm'
import TrackedTelLink from '@/components/TrackedTelLink'

type Props = {
  source: 'listing-alerts' | 'alerts'
  city?: string
  priceMin?: number
  priceMax?: number
  propertyAddress?: string
  heading?: string
  intro?: string
}

const inputClass =
  'w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors'

export default function ListingAlertsSignup({
  source,
  city = '',
  priceMin,
  priceMax,
  propertyAddress,
  heading = 'Get alerts for homes like this',
  intro = 'Email me when a Compass listing matches this city and price range, or when a price drops. The box starts unchecked.',
}: Props) {
  return (
    <div id="alerts">
      <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
        Listing alerts
      </p>
      <h2 className="text-2xl font-black text-black tracking-tight mb-2">{heading}</h2>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">{intro}</p>
      <SuburbLeadForm
        successTitle="You're on the list"
        successMessage={
          <>
            Joshua will email you when a matching Compass listing is new or the price drops.
            You can unsubscribe in one click. For anything urgent, call{' '}
            <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="alerts-success-call">
              615-551-2727
            </TrackedTelLink>
            .
          </>
        }
        resetLabel="Update my alert"
      >
        <input type="hidden" name="lead_type" value="buyer" />
        <input type="hidden" name="source" value={source} />
        {propertyAddress && <input type="hidden" name="property_address" value={propertyAddress} />}

        <div>
          <label htmlFor={`${source}-name`} className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            Name (optional)
          </label>
          <input id={`${source}-name`} name="name" type="text" autoComplete="name" placeholder="Jane Smith" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${source}-email`} className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            Email *
          </label>
          <input id={`${source}-email`} name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${source}-city`} className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            City (optional)
          </label>
          <input id={`${source}-city`} name="alert_city" type="text" defaultValue={city} placeholder="Nashville" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${source}-min`} className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
              Min price
            </label>
            <input id={`${source}-min`} name="price_min" type="number" min={0} step={1000} defaultValue={priceMin || undefined} inputMode="numeric" className={inputClass} />
          </div>
          <div>
            <label htmlFor={`${source}-max`} className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
              Max price
            </label>
            <input id={`${source}-max`} name="price_max" type="number" min={0} step={1000} defaultValue={priceMax || undefined} inputMode="numeric" className={inputClass} />
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm text-[#333] leading-relaxed">
          <input
            type="checkbox"
            name="alert_opt_in"
            value="yes"
            required
            className="mt-1"
          />
          <span>Email me when Joshua lists a home in this range or drops a price. Unsubscribe anytime.</span>
        </label>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide rounded-full hover:bg-neutral-800 transition-colors"
        >
          Get listing alerts →
        </button>
      </SuburbLeadForm>
    </div>
  )
}
