import SuburbLeadForm from '@/components/SuburbLeadForm'
import PreferredTimesField from '@/components/PreferredTimesField'
import TrackedTelLink from '@/components/TrackedTelLink'

type Props = {
  address: string
  city: string
  propertyAddress: string
  suburb?: string
}

const inputClass =
  'w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors'

export default function ListingShowingForm({ address, city, propertyAddress, suburb }: Props) {
  return (
    <div id="showing">
      <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
        Schedule a showing
      </p>
      <h2 className="text-2xl font-black text-black tracking-tight mb-2">See this home</h2>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
        Tell Joshua when you can tour {address}. He responds same-day.
      </p>
      <SuburbLeadForm
        successTitle="Showing request sent"
        successMessage={
          <>
            Joshua will reach out same-day about {address}. For anything urgent, call{' '}
            <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="showing-success-call">
              615-551-2727
            </TrackedTelLink>
            .
          </>
        }
        resetLabel="Send another time"
      >
        <input type="hidden" name="lead_type" value="showing" />
        <input type="hidden" name="source" value="listing-showing" />
        <input type="hidden" name="property_address" value={propertyAddress} />
        {suburb && <input type="hidden" name="suburb" value={suburb} />}
        <input type="hidden" name="body" value={`Showing request for ${propertyAddress}.`} />

        <div>
          <label htmlFor="showing-name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            Full name *
          </label>
          <input id="showing-name" name="name" type="text" required autoComplete="name" placeholder="Jane Smith" className={inputClass} />
        </div>
        <div>
          <label htmlFor="showing-phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            Phone
          </label>
          <input id="showing-phone" name="phone" type="tel" autoComplete="tel" placeholder="615-555-0000" className={inputClass} />
        </div>
        <div>
          <label htmlFor="showing-email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
            Email
          </label>
          <input id="showing-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputClass} />
        </div>
        <PreferredTimesField />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide rounded-full hover:bg-neutral-800 transition-colors"
        >
          Schedule a showing →
        </button>
        <TrackedTelLink
          href={`sms:+16155512727?&body=${encodeURIComponent(`Hi Joshua, I'd like to see ${address}, ${city}`)}`}
          className="w-full inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-4 tracking-wide rounded-full hover:bg-black hover:text-white transition-colors"
          data-cta="listing-detail-sms"
          aria-label={`Text Joshua about ${address}`}
        >
          Or text Joshua
        </TrackedTelLink>
        <p className="text-xs text-[#A0A0A0]">Phone or email is enough. Joshua responds same-day.</p>
      </SuburbLeadForm>
    </div>
  )
}
